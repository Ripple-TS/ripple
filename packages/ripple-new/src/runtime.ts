/**
 * ripple-new runtime — template-clone renderer with React-shape state model.
 *
 * Architecture: see /PLAN-TEMPLATE-RUNTIME.md.
 *
 * Block = mount/unmount boundary (Root / control-flow / dynamic / portal).
 * Scope = per-call-site hook bag inside a Block.
 * Hooks key by compile-time Symbol per call site (conditional-safe).
 * State: React-shape immutable values + setters that schedule the enclosing Block.
 * Updates: microtask-flushed queue with automatic batching.
 * Effects: three-phase pipeline (insertion sync → layout sync → passive post-paint).
 * Reconciliation: LIS-based keyed list inside forBlock (ported from Ripple's patchKeyedChildrenComplex).
 */

import {
	SUSPENSE_SCRIPT_ATTR,
	HYDRATION_START,
	HYDRATION_END,
	UNDEFINED_SENTINEL_KEY,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComponentBody<P = any, E = any> = (scope: Scope, props: P, extra: E) => void;
export type EffectFn = () => void | (() => void);
export type Cleanup = () => void;

export interface Scope {
	block: Block;
	parent: Scope | null;
	/**
	 * Hook slot map. Lazily allocated on the first hook call via `ensureHooks`.
	 * For-of item bodies that never call a hook (the common case in
	 * js-framework-benchmark-shaped lists) keep this as `null` for their
	 * lifetime — saving the Map allocation per Block on mass-mount paths.
	 * Reads use optional chaining (`scope.hooks?.get(slot)`) which returns
	 * `undefined` when null, identical to a Map.get miss.
	 */
	hooks: Map<symbol, any> | null;
	cleanups: Cleanup[];
	/**
	 * Per-call-site child scopes, stored as `[key, scope]` pairs in a flat array
	 * (NOT a Map): iteration is a plain indexed for-loop, and lookups are linear
	 * scans — faster than `Map.get` for the typical N ≤ 8 case (most components
	 * have a handful of static sub-component calls at most).
	 */
	children: ChildScope[];
	mounted: boolean;
	/**
	 * Slot objects owned by this scope (ifBlockSlot, forBlockSlot, etc.).
	 * Lazily allocated by registerSlot at the slot's first creation site;
	 * walked directly by unmountScope so teardown doesn't have to enumerate
	 * the entire hidden-class chain looking for `_xxx$N` slot keys.
	 * Null on scopes with no slots — the common case for leaf components.
	 */
	_slots: any[] | null;
	/**
	 * Per-scope context Provider map. Pre-initialised to null on both Scope
	 * and Block so the field's hidden-class position is stable across all
	 * instances — Provider stamping was previously a late `??=` add that
	 * fragmented the post-render shape tree of every Block under a Provider
	 * ancestor.
	 */
	$$ctxValues: Map<Context<any>, any> | null;
	// Bindings (b$0, b$1, ...) are stamped directly on the scope by compiled bodies.
	[key: string]: any;
}

interface ChildScope {
	// withScope uses Symbol per call-site; componentSlotLite uses a stable
	// string `_comp$N` (cheaper to mint at compile time, identity-equality
	// is identical to symbols for the linear-scan lookup).
	key: symbol | string;
	scope: Scope;
}

/**
 * Lazy allocator for the per-scope hook map. Returns the existing Map or
 * creates one on first use. Hook write sites should call this; hook read
 * sites use `scope.hooks?.get(slot)` directly (undefined return matches a
 * Map-miss).
 */
function ensureHooks(scope: Scope): Map<symbol, any> {
	return scope.hooks ?? (scope.hooks = new Map());
}

export type BlockKind = 'root' | 'control-flow' | 'dynamic' | 'portal';

export interface Block extends Scope {
	kind: BlockKind;
	parentBlock: Block | null;
	parentNode: Node;
	startMarker: Node | null;
	endMarker: Node | null;
	body: ComponentBody;
	props: any;
	extra: any;
	pending: boolean;
	disposed: boolean;
	/** Set on item Blocks: pointer to the enclosing for-block's slot. */
	forSlot: ForSlot | null;
	/** Item position within the enclosing for-block. 0 for non-item blocks. */
	itemIndex: number;
	/**
	 * Doubly-linked-list pointers for for-block item blocks. Maintained by
	 * reconcileKeyed so move/remove are O(1) pointer ops instead of array
	 * splice. The list head/tail live on ForSlot. Always present (null on
	 * non-item blocks) to keep Block monomorphic — V8 transitioning between
	 * hidden classes for the rare "is this an item?" case was measurably worse
	 * than carrying a couple of null pointers everywhere.
	 */
	prevSibling: Block | null;
	nextSibling: Block | null;
	/** Cached key for this item Block. null on non-item blocks. */
	key: any;
	/**
	 * Render priority for the next scheduled render: 'transition' (queued from
	 * inside startTransition — suspending shouldn't swap to fallback if prior
	 * UI is committed) or 'urgent' (default). Read & cleared when the render
	 * is dispatched.
	 */
	pendingMode: 'urgent' | 'transition' | null;
	/** The render mode in effect during the body's *current* execution. */
	currentRenderMode: 'urgent' | 'transition' | null;
	/**
	 * Set on a block inside a HIDDEN `<Activity>` subtree. While inactive, the
	 * block still renders (state + DOM are produced/updated) but its effects do
	 * NOT run (enqueueEffect skips when any ancestor is inactive); on reveal the
	 * flag is cleared and a re-render re-fires the effects.
	 */
	inactive: boolean;
}

interface EffectSlot {
	deps: any[] | undefined;
	cleanup: Cleanup | undefined;
	/** Discriminant so deactivateScope can find effect slots among state/memo/ref. */
	effect: true;
	/**
	 * True once a per-slot finalizer has been registered in scope.cleanups (on the
	 * slot's first body run, in drainPhase). The finalizer fires slot.cleanup
	 * exactly once at unmount; registering on first RUN (not slot creation) keeps
	 * scope.cleanups ordered by phase-execution order (insertion→layout→passive)
	 * so unmount tears down in the correct reverse order.
	 */
	finalized?: boolean;
}

interface PendingEffect {
	scope: Scope;
	slot: symbol;
	fn: EffectFn;
	/**
	 * The effect's deps array, spread as positional arguments to the body when it
	 * runs (`fn.apply(null, args)`). This is a deliberate superset of React: a
	 * body written as a pure function of its deps — `(a, b) => …` — captures
	 * nothing from the render scope, so the compiler can hoist it to module scope
	 * (one allocation, no stale-closure retention). Zero-arg React-style bodies
	 * still work (extra args are ignored). `undefined` for the no-deps form.
	 */
	args: any[] | undefined;
	/**
	 * Scope-tree depth captured at enqueue. Used by drainPhase to fire effects
	 * CHILD-FIRST (post-order) on mount/update — matching React's commit-phase
	 * walk. Without it, parent-first ordering breaks any parent layout-effect
	 * that reads refs/measurements established by child layout-effects (react-
	 * aria FocusScope, react-redux subscribers, react-spring measurements …).
	 */
	depth: number;
}

// ---------------------------------------------------------------------------
// Current-scope/block stacks
// ---------------------------------------------------------------------------

let CURRENT_SCOPE: Scope | null = null;
let CURRENT_BLOCK: Block | null = null;

export function getCurrentScope(): Scope {
	return CURRENT_SCOPE!;
}
export function getCurrentBlock(): Block {
	return CURRENT_BLOCK!;
}

// ---------------------------------------------------------------------------
// Scheduler — microtask-flushed queue with React-18-shaped automatic batching
// ---------------------------------------------------------------------------

const QUEUE: Block[] = [];
let scheduled = false;
let syncFlush = false; // flushSync sets this to drain the queue synchronously

// ---------------------------------------------------------------------------
// Transitions — React 18 priority lanes, simplified to two levels.
// ---------------------------------------------------------------------------

/** Depth of nested startTransition() calls currently on the call stack. */
let TRANSITION_DEPTH = 0;
/**
 * Number of async transition actions whose returned promise has not yet settled.
 * `TRANSITION_DEPTH` only covers the SYNCHRONOUS slice of a `startTransition`
 * callback; for an `async` action it is already 0 by the time the continuation
 * after the first `await` runs, so post-await setters would otherwise schedule
 * at urgent priority. Keeping this count elevated across the in-flight window
 * makes those setters transition-priority (React 19 Actions). Caveat: it's a
 * process-global window, so an unrelated urgent update fired while an async
 * action is pending is also tagged transition — perfect per-action scoping
 * would need AsyncContext, which isn't available in the browser target.
 */
let ASYNC_TRANSITION_COUNT = 0;
/**
 * Outstanding transition WORK count — incremented when startTransition fires,
 * decremented when its renders commit (and again for any tryBlock that holds
 * the transition pending while suspended). useTransition's isPending tracks
 * this via TRANSITION_LISTENERS.
 */
let TRANSITION_PENDING_COUNT = 0;
const TRANSITION_LISTENERS = new Set<() => void>();

function tickTransitionCount(delta: number): void {
	TRANSITION_PENDING_COUNT += delta;
	if (TRANSITION_PENDING_COUNT < 0) TRANSITION_PENDING_COUNT = 0;
	for (const fn of TRANSITION_LISTENERS) {
		try {
			fn();
		} catch (err) {
			console.error(err);
		}
	}
}

const INSERTION = 0,
	LAYOUT = 1,
	PASSIVE = 2;
type Phase = 0 | 1 | 2;

const effectQueues: [PendingEffect[], PendingEffect[], PendingEffect[]] = [[], [], []];
let passiveScheduled = false;

// Deferred ref attaches (React-19 timing parity). On mount the whole subtree is
// built and inserted before its DOM is connected to the document, so attaching a
// ref inline would hand a callback ref / measure a node that is NOT yet
// connected. Instead the compiler enqueues mount ref attaches here; they drain
// during commit, AFTER all renders/DOM insertion and BEFORE layout effects, so
// callback refs see a connected node and ref.current is populated by the time a
// layout effect runs — matching React's commit-phase ref attachment.
const refAttachQueue: { fn: () => void; depth: number; block: Block | null }[] = [];

// FragmentInstances that currently hold event listeners and/or observers. After
// each commit we re-apply their stored bindings to their CURRENT children, so a
// child that mounts into a fragment later picks up the listeners/observers added
// earlier — React's `commitNewChildToFragmentInstance` future-children contract.
// Empty for any app that doesn't use fragment-ref listeners (the common case),
// so the per-commit cost is a single `size` check.
const activeFragments = new Set<FragmentInstance>();

function reapplyFragmentBindings(): void {
	if (activeFragments.size === 0) return;
	for (const fi of activeFragments) fi._reapply();
}

// ─────────────────────────────────────────────────────────────────────────────
// React-parity act() environment flag.
//
// `IS_RIPPLE_ACT_ENVIRONMENT` is the opt-in dev signal that scheduler updates
// happening outside `act(...)` should be reported. Test setups flip it on once
// (mirrors React's IS_REACT_ACT_ENVIRONMENT). `actScopeDepth` counts how deep
// we are inside an active `act()` call; non-zero suppresses the warning.
// `syncFlush` (set by flushSync) also suppresses — code inside flushSync is by
// definition handling its own scheduling.
// ─────────────────────────────────────────────────────────────────────────────
let IS_RIPPLE_ACT_ENVIRONMENT = false;
let actScopeDepth = 0;

/**
 * Test-environment opt-in. When true, scheduleRender() calls that happen
 * outside a flushSync or an act() callback emit a console.error mirroring
 * React's "An update to X was not wrapped in act(...)" message. Default
 * false so production / non-test code never warns.
 */
export function setIsRippleActEnvironment(value: boolean): void {
	IS_RIPPLE_ACT_ENVIRONMENT = value;
}

export function scheduleRender(block: Block): void {
	if (block.disposed) return;
	// Test-env warning: a state update happened with no flushSync or act()
	// scope around it. The test will likely assert on stale DOM and fail
	// confusingly; surface the cause directly.
	if (IS_RIPPLE_ACT_ENVIRONMENT && actScopeDepth === 0 && !syncFlush) {
		// eslint-disable-next-line no-console
		console.error(
			'An update to a component was not wrapped in act(...).\n\n' +
				'When testing, code that causes state updates should be wrapped into act(...):\n\n' +
				'  act(() => {\n' +
				'    /* fire events that update state */\n' +
				'  });\n' +
				'  /* assert on the output */\n\n' +
				"This ensures you're testing the behavior the user would see in the browser.",
		);
	}
	// Capture the caller's priority — setters inside startTransition() see
	// TRANSITION_DEPTH > 0 and tag the render as 'transition'. An urgent setter
	// arriving for a block already queued at 'transition' upgrades it.
	const mode: 'urgent' | 'transition' =
		TRANSITION_DEPTH > 0 || ASYNC_TRANSITION_COUNT > 0 ? 'transition' : 'urgent';
	if (block.pending) {
		if (mode === 'urgent') block.pendingMode = 'urgent';
		return;
	}
	block.pending = true;
	block.pendingMode = mode;
	QUEUE.push(block);
	if (syncFlush) return;
	if (!scheduled) {
		scheduled = true;
		queueMicrotask(flush);
	}
}

function flush(): void {
	scheduled = false;
	let pendingError: { err: any } | null = null;
	while (QUEUE.length) {
		const block = QUEUE.shift()!;
		block.pending = false;
		if (!block.disposed) {
			try {
				renderBlock(block);
			} catch (err) {
				try {
					handleRenderError(block, err);
				} catch (unhandled) {
					// No tryBlock claimed this error. Don't let it abandon the
					// rest of the queue or skip commitEffects() — that would
					// strand unrelated roots batched into the same flush and
					// drop their already-rendered effects. Remember the first
					// such error and surface it once the flush fully drains.
					if (pendingError === null) pendingError = { err: unhandled };
				}
			}
		}
	}
	commitEffects();
	if (pendingError !== null) throw pendingError.err;
}

/**
 * React-DOM parity. Runs `fn` and synchronously drains any renders/effects it scheduled
 * before returning. Bypasses the microtask-batched flush — used by the benchmark
 * timing rig to measure operation wall-clock without microtask coalescing.
 */
export function flushSync<T>(fn: () => T): T {
	const prevSync = syncFlush;
	syncFlush = true;
	try {
		const result = fn();
		// Drain anything scheduled by fn.
		let pendingError: { err: any } | null = null;
		while (QUEUE.length) {
			const block = QUEUE.shift()!;
			block.pending = false;
			if (!block.disposed) {
				try {
					renderBlock(block);
				} catch (err) {
					try {
						handleRenderError(block, err);
					} catch (unhandled) {
						// See flush(): finish draining and commit effects before
						// surfacing an unhandled render error, so one failing root
						// can't strand the rest of this synchronous flush.
						if (pendingError === null) pendingError = { err: unhandled };
					}
				}
			}
		}
		commitEffectsSync();
		if (pendingError !== null) throw pendingError.err;
		return result;
	} finally {
		syncFlush = prevSync;
	}
}

// ---------------------------------------------------------------------------
// Effect commit pipeline (insertion → layout → passive)
// ---------------------------------------------------------------------------

/**
 * Compiler-emitted on a host element's ref MOUNT. Defers the attach until commit
 * (drainRefAttaches) so the node is connected when a callback ref fires and
 * ref.current is set before layout effects run. `depth` (block-tree depth) drives
 * child-before-parent ordering, matching effect ordering. Ref UPDATES stay inline
 * (the element is already connected by then).
 */
export function queueRefAttach(scope: Scope, fn: () => void): void {
	let depth = 0;
	let b: Block | null = scope.block.parentBlock;
	while (b !== null) {
		depth++;
		b = b.parentBlock;
	}
	refAttachQueue.push({ fn, depth, block: scope.block });
}

/** Drain queued mount ref attaches child-first (deepest depth → shallowest). */
function drainRefAttaches(): void {
	if (refAttachQueue.length === 0) return;
	const q = refAttachQueue.splice(0);
	// Descending depth = child-before-parent; stable sort keeps sibling order.
	q.sort((a, b) => b.depth - a.depth);
	for (const r of q) {
		// Skip attaches whose owning subtree was unmounted earlier in THIS flush
		// (e.g. a try boundary caught a mount-time throw and ran unmountBlock +
		// the ref-detach cleanup). Without this guard the deferred attach would
		// re-run on a torn-down node — firing a callback ref on a dead element and
		// resurrecting an object ref the cleanup just nulled.
		if (blockSubtreeDisposed(r.block)) continue;
		r.fn();
	}
}

/** True if `block` or any of its ancestors has been disposed (unmounted). */
function blockSubtreeDisposed(block: Block | null): boolean {
	let b: Block | null = block;
	while (b !== null) {
		if (b.disposed) return true;
		b = b.parentBlock;
	}
	return false;
}

function commitEffects(): void {
	drainPhase(INSERTION);
	drainRefAttaches();
	reapplyFragmentBindings();
	drainPhase(LAYOUT);
	if (effectQueues[PASSIVE].length && !passiveScheduled) {
		passiveScheduled = true;
		schedulePostPaint(() => {
			passiveScheduled = false;
			drainPhase(PASSIVE);
		});
	}
}

/**
 * Test/test-environment helper — synchronously drain any queued passive
 * (`useEffect`) bodies that would normally fire after paint. Idempotent.
 * Real apps should not call this; rely on the normal post-paint scheduler.
 */
export function drainPassiveEffects(): void {
	// Cancel any scheduler-side passive drain that hadn't fired yet — we're
	// about to drain inline.
	passiveScheduled = false;
	drainPhase(PASSIVE);
}

/** True if there's a queued render or any uncommitted effect. Used by `act`. */
function hasPendingWork(): boolean {
	return (
		QUEUE.length > 0 ||
		effectQueues[INSERTION].length > 0 ||
		effectQueues[LAYOUT].length > 0 ||
		effectQueues[PASSIVE].length > 0
	);
}

/**
 * React-parity `act(...)`. Wrap test code that triggers updates so all of
 * the scheduled work commits before the assertion phase runs. Always returns
 * a Promise — `await` is mandatory regardless of whether the callback itself
 * is sync or async. This matches the *async* model React tests use; the
 * promise resolves only after the scheduler is quiescent (renders +
 * INSERTION/LAYOUT/PASSIVE effects + microtask chains from `use(promise)`
 * and transition retries).
 *
 * While the act() scope is active, scheduleRender's "update outside act(...)"
 * dev warning is suppressed (see `IS_RIPPLE_ACT_ENVIRONMENT` and
 * `setIsRippleActEnvironment`).
 *
 * The double-loop (5 microtask ticks × up to 50 outer iterations) drains
 * cascades like `use(promise)` → status flip → retry → renderBlock that
 * wouldn't settle in a single tick.
 */
export async function act<T>(fn: () => T | Promise<T>): Promise<T> {
	actScopeDepth++;
	try {
		const result = await Promise.resolve(fn());
		for (let i = 0; i < 50; i++) {
			for (let j = 0; j < 5; j++) await Promise.resolve();
			drainPassiveEffects();
			if (!hasPendingWork()) return result;
		}
		throw new Error(
			'act(): scheduler did not stabilize after 50 iterations — likely an infinite render loop',
		);
	} finally {
		actScopeDepth--;
	}
}

function commitEffectsSync(): void {
	// Match React semantics: flushSync drains insertion + layout synchronously,
	// but passive effects (useEffect) still fire AFTER paint via the regular scheduler.
	drainPhase(INSERTION);
	drainRefAttaches();
	reapplyFragmentBindings();
	drainPhase(LAYOUT);
	if (effectQueues[PASSIVE].length > 0 && !passiveScheduled) {
		passiveScheduled = true;
		schedulePostPaint(() => {
			passiveScheduled = false;
			drainPhase(PASSIVE);
		});
	}
}

function drainPhase(phase: Phase): void {
	const q = effectQueues[phase];
	if (q.length === 0) return;
	// React parity: walk child-first (post-order). Each effect was tagged with
	// its scope-tree depth at enqueue. Sort descending so deeper scopes fire
	// before shallower ones; Array.sort is stable so sibling registration
	// order is preserved within a depth bucket.
	q.sort((a, b) => b.depth - a.depth);
	// Cleanups first (in registration order), then bodies. React's contract.
	// Skip entries whose subtree was hidden by <Activity> after they were queued
	// but before this drain: deactivateScope already fired their cleanups, and the
	// body must not run while hidden (it re-enqueues on reveal). See
	// inInactiveSubtree.
	for (let i = 0; i < q.length; i++) {
		const e = q[i];
		if (e.scope.block.disposed || inInactiveSubtree(e.scope.block)) continue;
		const slot = e.scope.hooks?.get(e.slot) as EffectSlot | undefined;
		if (slot && slot.cleanup) {
			try {
				slot.cleanup();
			} catch (err) {
				console.error(err);
			}
			slot.cleanup = undefined;
		}
	}
	for (let i = 0; i < q.length; i++) {
		const e = q[i];
		if (e.scope.block.disposed || inInactiveSubtree(e.scope.block)) continue;
		let cleanup: void | Cleanup;
		try {
			// Spread deps as positional args (see PendingEffect.args). A no-deps
			// effect has args === undefined, so the body is called with zero args.
			// eslint-disable-next-line prefer-spread
			cleanup = e.fn.apply(null, (e.args ?? []) as []);
		} catch (err) {
			// Route effect errors to the nearest enclosing tryBlock, if any.
			const handler = findTryHandler(e.scope.block);
			if (handler) handler(err);
			else console.error(err);
			continue;
		}
		const slot = e.scope.hooks?.get(e.slot) as EffectSlot | undefined;
		if (slot) {
			if (typeof cleanup === 'function') slot.cleanup = cleanup;
			// Register ONE stable finalizer per effect slot, on its FIRST run, in
			// phase-execution order. The finalizer fires the slot's CURRENT cleanup
			// once at unmount. Registering here (not on each drain) is what stops
			// the old double-fire bug: previously every returned cleanup was pushed
			// into scope.cleanups, so a dep-changed effect's stale cleanups replayed
			// at unmount. The slot owns its latest cleanup; the finalizer reads it.
			if (!slot.finalized) {
				slot.finalized = true;
				e.scope.cleanups.push(() => {
					const c = slot.cleanup;
					if (c) {
						slot.cleanup = undefined;
						c();
					}
				});
			}
		}
	}
	q.length = 0;
}

// `schedulePostPaint` — fires after the next paint (React's scheduler trick).
let _postPaintCbs: Array<() => void> = [];
let _channel: MessageChannel | null = null;
if (typeof MessageChannel !== 'undefined') {
	_channel = new MessageChannel();
	_channel.port1.onmessage = () => {
		const cbs = _postPaintCbs;
		_postPaintCbs = [];
		for (let i = 0; i < cbs.length; i++) cbs[i]();
	};
}
function schedulePostPaint(cb: () => void): void {
	_postPaintCbs.push(cb);
	if (_channel) {
		// rAF lands before paint; MessageChannel posts a macrotask after paint.
		requestAnimationFrame(() => _channel!.port2.postMessage(0));
	} else {
		requestAnimationFrame(() =>
			setTimeout(() => {
				const cbs = _postPaintCbs;
				_postPaintCbs = [];
				for (let i = 0; i < cbs.length; i++) cbs[i]();
			}, 0),
		);
	}
}

// ---------------------------------------------------------------------------
// Block + Scope creation
// ---------------------------------------------------------------------------

/**
 * Block class — concrete shape backing the `Block` interface. Allocated via
 * `new` so V8 derives the hidden class from this single constructor, instead
 * of synthesising it from an object-literal site (which V8 can also do but
 * with a less predictable optimisation profile when the literal has many
 * fields). Compiled bodies still stamp dynamic `b$N` / `_for$N` props on the
 * instance — V8 transitions all blocks through the same transition tree.
 *
 * All fields initialised in a single, fixed order. Item-only fields
 * (prev/next sibling, key, itemIndex) sit on every Block as null/0 so root
 * and dynamic blocks share the same shape with for-of item blocks.
 */
class BlockImpl {
	// Hot fields first (touched by every renderBlock / reconcile iteration).
	body: ComponentBody;
	props: any;
	extra: any;
	parentNode: Node;
	parentBlock: Block | null;
	startMarker: Node | null;
	endMarker: Node | null;
	itemIndex: number;
	// Scheduler / lifecycle.
	pending: boolean;
	disposed: boolean;
	mounted: boolean;
	pendingMode: 'urgent' | 'transition' | null;
	currentRenderMode: 'urgent' | 'transition' | null;
	inactive: boolean;
	// Hooks + cleanups (per-block state).
	hooks: Map<symbol, any> | null;
	cleanups: Cleanup[];
	children: ChildScope[];
	_slots: any[] | null;
	$$ctxValues: Map<Context<any>, any> | null;
	// Contexts this block READ during its last render, with the value seen.
	// Populated by useContextInternal; consulted by the memo bailout so a context
	// change forces a re-render even when props are shallow-equal (React parity).
	$$ctxReads: Map<Context<any>, any> | null;
	// __thenableIdx is reset every renderBlock so pre-init costs nothing.
	__thenableIdx: number;
	// For-block item bookkeeping.
	forSlot: ForSlot | null;
	prevSibling: Block | null;
	nextSibling: Block | null;
	key: any;
	// Scope contract: a Block is its own scope.
	parent: Scope | null;
	block: Block;
	// Metadata.
	kind: BlockKind;
	// Dynamic bindings (b$N, _for$N, etc.) are stamped on the instance by
	// compiled bodies. V8 sees them as transitions on the shared shape.
	[key: string]: any;

	constructor(
		kind: BlockKind,
		parentBlock: Block | null,
		parentNode: Node,
		startMarker: Node | null,
		endMarker: Node | null,
		body: ComponentBody,
		props: any,
		extra: any,
	) {
		this.body = body;
		this.props = props;
		this.extra = extra;
		this.parentNode = parentNode;
		this.parentBlock = parentBlock;
		this.startMarker = startMarker;
		this.endMarker = endMarker;
		this.itemIndex = 0;
		this.pending = false;
		this.disposed = false;
		this.mounted = false;
		this.pendingMode = null;
		this.currentRenderMode = null;
		this.inactive = false;
		this.hooks = null;
		this.cleanups = [];
		this.children = [];
		this._slots = null;
		this.$$ctxValues = null;
		this.$$ctxReads = null;
		this.__thenableIdx = 0;
		this.forSlot = null;
		this.prevSibling = null;
		this.nextSibling = null;
		this.key = null;
		this.parent = null;
		this.block = this as unknown as Block;
		this.kind = kind;
	}
}

/**
 * Plain (non-Block) child Scope. Allocated once per (parent, call-site)
 * pair and reused across re-renders. Class-not-literal so V8 hands every
 * such scope the same hidden class — paired with the BlockImpl shape, the
 * Scope-typed read sites (unmountScope, fireCleanupsOnly, hook lookups via
 * `scope.hooks`) see exactly two stable classes instead of class-vs-literal.
 *
 * Field order matches the prior object-literal at withScope so existing
 * code that walked the keys (now via the indexed `_slots` array — see
 * runtime.ts:583) sees identical structure.
 */
class ScopeImpl {
	block: Block;
	parent: Scope | null;
	hooks: Map<symbol, any> | null;
	cleanups: Cleanup[];
	children: ChildScope[];
	_slots: any[] | null;
	$$ctxValues: Map<Context<any>, any> | null;
	$$ctxReads: Map<Context<any>, any> | null;
	mounted: boolean;
	// Compiled bodies stamp bindings (b$0, b$1, ...) directly on the scope.
	[key: string]: any;

	constructor(parent: Scope, block: Block) {
		this.block = block;
		this.parent = parent;
		this.hooks = null;
		this.cleanups = [];
		this.children = [];
		this._slots = null;
		this.$$ctxValues = null;
		this.$$ctxReads = null;
		this.mounted = false;
	}
}

export function createBlock(
	kind: BlockKind,
	parentBlock: Block | null,
	parentNode: Node,
	startMarker: Node | null,
	endMarker: Node | null,
	body: ComponentBody,
	props: any,
	extra?: any,
): Block {
	return new BlockImpl(
		kind,
		parentBlock,
		parentNode,
		startMarker,
		endMarker,
		body,
		props,
		extra,
	) as unknown as Block;
}

export function renderBlock(block: Block): void {
	const prevScope = CURRENT_SCOPE;
	const prevBlock = CURRENT_BLOCK;
	CURRENT_SCOPE = block;
	CURRENT_BLOCK = block;
	// Reset the per-render `use(thenable)` call-order counter. Cached entries
	// in __thenables persist so that earlier use() calls return synchronously
	// on replay-after-resolve (matches React's thenableState[index] scheme).
	block.__thenableIdx = 0;
	// Clear last render's recorded context dependencies; this render repopulates
	// them (its own reads + descendant reads propagated up). Only memo blocks
	// ever hold a non-null map, so this is a no-op for the common case.
	if (block.$$ctxReads !== null) block.$$ctxReads.clear();
	// Capture the render priority. Explicit pendingMode (set by scheduleRender)
	// wins. Otherwise INHERIT from the outer block — re-entrant renders (try,
	// if, for, comp slots) called synchronously inside an outer body should
	// run at the outer body's priority so transitions propagate down naturally.
	block.currentRenderMode = block.pendingMode ?? prevBlock?.currentRenderMode ?? 'urgent';
	block.pendingMode = null;
	try {
		block.body(block, block.props, block.extra);
		if (!block.mounted) block.mounted = true;
	} finally {
		CURRENT_SCOPE = prevScope;
		CURRENT_BLOCK = prevBlock;
	}
}

/**
 * Open (or reuse) a per-call-site Scope inside the current Block, then run `body` in it.
 * The compiler emits this for every static-inline component call.
 */
export function withScope<P>(parent: Scope, key: symbol, body: ComponentBody<P>, props: P): void {
	const children = parent.children;
	let scope: Scope | undefined;
	// Linear scan — faster than Map.get for the typical small N. Most parents
	// have ≤ 4 sub-component call sites.
	for (let i = 0, n = children.length; i < n; i++) {
		if (children[i].key === key) {
			scope = children[i].scope;
			break;
		}
	}
	if (scope === undefined) {
		scope = new ScopeImpl(parent, parent.block);
		children.push({ key, scope });
	}
	const prevScope = CURRENT_SCOPE;
	CURRENT_SCOPE = scope;
	try {
		body(scope, props, undefined);
		if (!scope.mounted) scope.mounted = true;
	} finally {
		CURRENT_SCOPE = prevScope;
	}
}

/**
 * Lite component slot: allocates ONLY a per-call-site Scope — no Block, no
 * Comment markers, no CompSlot wrapper. Emitted by @tsrx/ripple-new at call
 * sites whose callee is a same-module FunctionDeclaration that:
 *   - calls no hooks (lexical free-identifier check)
 *   - has no `use(...)`, no @try, no `children` param
 *   - has no unknown free function calls (catches transitive hooks via helpers)
 * AND the call site itself has no `key=`, no spread props, no JSX children.
 *
 * The Scope shape matches ScopeImpl exactly, so V8 hands every lite scope the
 * same hidden class as the withScope branch and the cross-cutting Scope-typed
 * read sites (unmountScope, useContextInternal) stay clean.
 *
 * Recursion is safe: each call site allocates its OWN Scope (no aliasing of
 * slot-key namespace across recursion depths) — unlike Design (b) same-scope
 * dispatch, which would clobber `_if$N` etc. across nested recursive calls.
 */
/**
 * Minimal block-shaped object carrying the DOM insertion context for a lite
 * component body. The compiled body reads `__s.block.parentNode` and
 * `__s.block.endMarker` to position its cloned template; without these the
 * body would insert at the PARENT block's range (breaking nesting).
 *
 * Why not reuse BlockImpl: BlockImpl is 24 fields; lite components don't
 * need scheduling, suspense, key, or marker bookkeeping. Carrying just the
 * fields the body actually reads keeps the lite path lean. The two `block`
 * read sites in the body (`parentNode`, `endMarker`) plus the context-walk
 * Phase B read (`parentBlock`) are the only consumers.
 */
class LiteBlockImpl {
	parentNode: Node;
	endMarker: Node | null;
	parentBlock: Block | null;
	$$ctxValues: Map<Context<any>, any> | null;

	constructor(parentNode: Node, endMarker: Node | null, parentBlock: Block | null) {
		this.parentNode = parentNode;
		this.endMarker = endMarker;
		this.parentBlock = parentBlock;
		this.$$ctxValues = null;
	}
}

export function componentSlotLite<P>(
	parentScope: Scope,
	slotKey: string,
	host: Node,
	comp: ComponentBody<P>,
	props: P,
	anchor?: Node,
): void {
	let scope = parentScope[slotKey] as Scope | undefined;
	if (scope === undefined) {
		scope = new ScopeImpl(parentScope, parentScope.block);
		// Lite scope's `block` exposes the host/anchor as the body's DOM context
		// — so the compiled body's `__s.block.parentNode.insertBefore(_root,
		// __s.block.endMarker)` plants content INSIDE the owning element rather
		// than spilling out to the parent block's range. `parentBlock` keeps the
		// context-walk Phase B chain pointing at the real ancestor Block.
		let endMarker = anchor ?? null;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration: the server wrapped this hookless component's output in a
			// `<!--[-->…<!--]-->` range (anchor resolved to the `<!--[-->`). Point the
			// cursor at the content so the body's clone() adopts the server DOM, and
			// use `<!--]-->` as the insert anchor so the body's
			// `insertBefore(content, endMarker)` is a no-op (content already there).
			endMarker = matchingClose(anchor as Node);
			hydrateNode = (anchor as Node).nextSibling;
		}
		scope.block = new LiteBlockImpl(host, endMarker, parentScope.block) as unknown as Block;
		parentScope[slotKey] = scope;
		// Register on parent.children so unmountScope(parent) walks into us.
		parentScope.children.push({ key: slotKey, scope });
	} else {
		// Re-render: the parent's host/anchor are stable across renders so no
		// need to rebuild the LiteBlockImpl. Skip the allocation on warm path.
	}
	const prevScope = CURRENT_SCOPE;
	CURRENT_SCOPE = scope;
	try {
		comp(scope, props, undefined);
		if (!scope.mounted) scope.mounted = true;
	} finally {
		CURRENT_SCOPE = prevScope;
	}
}

export function unmountBlock(block: Block, detachDom: boolean = true): void {
	if (block.disposed) return;
	block.disposed = true;
	// Depth-first cleanup of all scopes reachable from this block.
	unmountScope(block, detachDom);
	if (!detachDom) return;
	// Remove DOM range.
	if (block.startMarker && block.endMarker) {
		const parent = block.startMarker.parentNode;
		if (parent) {
			let n: Node | null = block.startMarker;
			const stop = block.endMarker.nextSibling;
			while (n && n !== stop) {
				const next: Node | null = n.nextSibling;
				parent.removeChild(n);
				n = next;
			}
		}
	} else {
		// Root block — clear the whole container.
		while (block.parentNode.firstChild) {
			block.parentNode.removeChild(block.parentNode.firstChild);
		}
	}
}

/** Fire cleanups (depth-first child scopes first) without touching the DOM.
 *  Within each scope, cleanups fire in REVERSE-mount order — last useEffect
 *  declared has its cleanup run first. Matches React's per-fiber finalizer
 *  walk: later effects often depend on resources set up by earlier ones, so
 *  tearing them down in reverse avoids races against shared state.
 */
function fireCleanupsOnly(scope: Scope): void {
	const children = scope.children;
	for (let i = 0, n = children.length; i < n; i++) fireCleanupsOnly(children[i].scope);
	const c = scope.cleanups;
	for (let i = c.length - 1; i >= 0; i--) {
		try {
			c[i]();
		} catch (err) {
			console.error(err);
		}
	}
}

/**
 * Register a slot object as owned by `scope`. Called from each slot-creation
 * site in runtime.ts (portal, componentSlot, trySlot, ifBlock, switchBlock,
 * forBlock). The lazy `_slots` array lets `unmountScope` walk slots in O(slot)
 * instead of `for (key in scope)` enumerating the entire hidden-class chain
 * (~25-30 keys per Block at ~57k key visits in a 2047-component tree).
 *
 * Invariant: every slot whose teardown requires recursing into a child Block
 * MUST be registered here. The runtime currently has exactly six creation
 * sites; the @tsrx/ripple-new compiler never creates slot objects directly.
 */
function registerSlot(scope: Scope, slot: any): void {
	const slots = scope._slots;
	if (slots === null) scope._slots = [slot];
	else slots.push(slot);
}

function unmountScope(scope: Scope, detachDom: boolean = true): void {
	// Recurse into child scopes first.
	const children = scope.children;
	for (let i = 0, n = children.length; i < n; i++) unmountScope(children[i].scope, detachDom);
	// Walk slot-stashed child Blocks (ifBlock / forBlock / componentSlot / portal).
	const slots = scope._slots;
	if (slots !== null) {
		for (let i = 0, n = slots.length; i < n; i++) {
			const val = slots[i];
			// Read __kind ONCE per slot — the property access is megamorphic across
			// six slot shapes, so caching the local saves three repeat IC walks.
			const k = val.__kind;
			if (k === 'ifBlockSlot' || k === 'switchBlockSlot' || k === 'activityBlockSlot') {
				if (val.block) unmountBlock(val.block, detachDom);
			} else if (k === 'forBlockSlot') {
				const items = val.items as Map<any, Block>;
				const it = items.values();
				for (let r = it.next(); !r.done; r = it.next()) unmountBlock(r.value, detachDom);
				// An @empty branch (if any) hangs off the same slot.
				if (val.emptyBlock) unmountBlock(val.emptyBlock, detachDom);
			} else {
				// componentSlotSlot | portalSlotSlot | trySlotSlot
				// Portal DOM lives in a FOREIGN target — the root-level batched clear
				// never reaches it, so portals must always self-detach individually.
				const childDetach = k === 'portalSlotSlot' ? true : detachDom;
				if (val.block) unmountBlock(val.block, childDetach);
				// trySlotSlot keeps an off-screen `tryBlock` ALIVE across suspend/
				// resume so its hooks Map survives replay. When the surrounding
				// scope is being torn down (e.g. an @if branch unmounts mid-pending,
				// or the whole component unmounts while still suspended), mark the
				// tryBlock disposed AND clear pendingThenable. That makes the
				// promise's .then-retry callback short-circuit on the disposed check
				// at runtime.ts:1695, preventing late commits into a torn-down DOM
				// range. We mark via `disposed = true` rather than calling
				// unmountBlock because the tryBlock's DOM was already torn down by
				// its parent's unmount, and a second pass through unmountBlock
				// would re-walk the same scopes / double-fire cleanups.
				if (k === 'trySlotSlot') {
					if (val.tryBlock && val.tryBlock !== val.block) {
						val.tryBlock.disposed = true;
						val.pendingThenable = null;
					}
					// Cancel any in-flight transition-fallback timeout so the callback
					// can't fire after the slot's owning scope is gone.
					if (val.transitionTimeoutId !== null) {
						clearTimeout(val.transitionTimeoutId);
						val.transitionTimeoutId = null;
					}
				} else if (k === 'portalSlotSlot' && val.target) {
					unregisterDelegationTarget(val.target);
				}
			}
		}
	}
	// Fire cleanups in REVERSE-mount order to match React's per-fiber
	// finalizer walk — last useEffect declared has its cleanup run first.
	// React semantics: cleanups before bodies, last-in first-out within a
	// scope so later effects can rely on resources from earlier ones during
	// their own cleanup execution.
	const c = scope.cleanups;
	for (let i = c.length - 1; i >= 0; i--) {
		try {
			c[i]();
		} catch (err) {
			console.error(err);
		}
	}
}

// ---------------------------------------------------------------------------
// Hooks — keyed by compile-time Symbol per call site
//
// The `slot` argument is COMPILER-INJECTED. @tsrx/ripple-new appends a
// `Symbol.for(stableId)` to every hook call; the symbol is what gives the
// hook its per-call-site identity within a scope (and its cross-module
// identity for HMR state preservation). The public signature marks `slot`
// as OPTIONAL so authors writing `useState(0)` in their editor don't see a
// confusing "Expected 2 arguments, but got 1" diagnostic. At runtime the
// missingSlot guard throws if a hook is somehow called without the slot —
// almost always because the source was loaded outside the Vite plugin.
// ---------------------------------------------------------------------------

function missingSlot(name: string): never {
	throw new Error(
		`${name} was called without a slot symbol. The Ripple compiler injects ` +
			`per-call-site slot symbols; ensure your project loads this runtime ` +
			`through the Vite plugin (@tsrx/ripple-new/vite). To call hooks by hand, ` +
			`pass a stable symbol, e.g. useState(0, Symbol.for('my-stable-id')).`,
	);
}

interface StateSlot<T> {
	value: T;
	setter: (next: T | ((prev: T) => T)) => void;
}

export function useState<T>(
	initial: T | (() => T),
	slot?: symbol,
): [T, (next: T | ((prev: T) => T)) => void] {
	if (slot === undefined) missingSlot('useState');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as StateSlot<T> | undefined;
	if (s === undefined) {
		const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
		s = {
			value: initVal,
			setter: (next) => {
				const computed = typeof next === 'function' ? (next as (p: T) => T)(s!.value) : next;
				if (Object.is(computed, s!.value)) return;
				s!.value = computed;
				scheduleRender(block);
			},
		};
		ensureHooks(scope).set(slot, s);
	}
	return [s.value, s.setter];
}

export function useReducer<S, A, I = S>(
	reducer: (s: S, a: A) => S,
	initialArg: I,
	initOrSlot?: ((arg: I) => S) | symbol,
	slot?: symbol,
): [S, (action: A) => void] {
	// The compiler appends the hook slot symbol as the final argument. So the
	// React 2-arg form `useReducer(reducer, initialState)` arrives as
	// `(reducer, initialState, slot)` and the lazy 3-arg form
	// `useReducer(reducer, initialArg, init)` arrives as
	// `(reducer, initialArg, init, slot)`. Disambiguate by which trailing arg
	// is the symbol.
	let init: ((arg: I) => S) | undefined;
	if (typeof initOrSlot === 'symbol') {
		slot = initOrSlot;
	} else {
		init = initOrSlot;
	}
	if (slot === undefined) missingSlot('useReducer');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as
		| { value: S; dispatch: (a: A) => void; reducer: (s: S, a: A) => S }
		| undefined;
	if (s === undefined) {
		// React parity: the initial state is `initialArg` used AS-IS. Lazy
		// initialization happens ONLY when the third `init` argument is supplied
		// (`init(initialArg)`). A function passed as `initialArg` in the 2-arg form
		// is stored as the state value verbatim — it is NOT called.
		const initVal = init !== undefined ? init(initialArg) : (initialArg as unknown as S);
		s = {
			value: initVal,
			reducer,
			dispatch: (action) => {
				const next = s!.reducer(s!.value, action);
				if (Object.is(next, s!.value)) return;
				s!.value = next;
				scheduleRender(block);
			},
		};
		ensureHooks(scope).set(slot, s);
	} else {
		// Allow reducer reference to update across renders.
		s.reducer = reducer;
	}
	return [s.value, s.dispatch];
}

function depsChanged(prev: any[] | undefined, next: any[] | undefined): boolean {
	if (prev === undefined || next === undefined) return true;
	if (prev.length !== next.length) return true;
	for (let i = 0; i < prev.length; i++) {
		if (!Object.is(prev[i], next[i])) return true;
	}
	return false;
}

// True if `block` or any ancestor is in a hidden <Activity> subtree. Effects
// must not run inside such a subtree — neither freshly (enqueueEffect skips
// registration) NOR via an entry already sitting in a phase queue when the
// Activity hides between enqueue and drain (drainPhase skips execution). On
// reveal, deactivateScope has cleared each effect slot's deps, so the
// re-render re-enqueues and the effect finally fires.
function inInactiveSubtree(block: Block | null): boolean {
	for (let a = block; a !== null; a = a.parentBlock) {
		if (a.inactive) return true;
	}
	return false;
}

function enqueueEffect(slot: symbol, fn: EffectFn, deps: any[] | undefined, phase: Phase): void {
	const scope = CURRENT_SCOPE!;
	// Hidden <Activity> subtree: render (state + DOM) but DON'T run effects. Skip
	// BEFORE touching the slot so the effect is treated as fresh and re-fires when
	// the Activity becomes visible (deactivateScope also clears prior deps). Walk
	// ancestors so a visible inner block inside a hidden outer Activity is skipped
	// too. Effects are rare on the hot path, so this extra walk is cheap.
	if (inInactiveSubtree(scope.block)) return;
	const prev = scope.hooks?.get(slot) as EffectSlot | undefined;
	if (prev && !depsChanged(prev.deps, deps)) return;
	if (!prev) {
		ensureHooks(scope).set(slot, { deps, cleanup: undefined, effect: true });
		// Mark any enclosing for-block items so batch-clear knows to walk cleanups.
		let b: Block | null = scope.block;
		while (b) {
			if (b.forSlot) b.forSlot.hasCleanups = true;
			b = b.parentBlock;
		}
	} else {
		prev.deps = deps;
	}
	// Compute Block-tree depth for child-first drain. We walk parentBlock (not
	// scope.parent) because a full componentSlot Block sets scope.parent = null
	// by design — only LiteBlockImpl scopes carry a scope.parent. parentBlock
	// is the universal upward link that mirrors React's fiber tree the same way
	// for hookful components, @if branches, and lite components alike. Walks
	// once per enqueue; typical depths < 20 and effects are rare on the hot path.
	let depth = 0;
	let b: Block | null = scope.block.parentBlock;
	while (b !== null) {
		depth++;
		b = b.parentBlock;
	}
	effectQueues[phase].push({ scope, slot, fn, args: deps, depth });
}

// ABI: the compiler appends the hook slot as the LAST argument. When the user
// omits deps (`useEffect(fn)`), the call arrives as `useEffect(fn, slot)` — the
// symbol lands in the deps position and the real slot param is undefined. Detect
// the trailing symbol and reinterpret so optional-deps forms work. A returned
// undefined deps means "run on every commit" (React parity for omitted deps).
function resolveEffectArgs(
	name: string,
	deps: any[] | symbol | undefined,
	slot: symbol | undefined,
): [any[] | undefined, symbol] {
	if (slot === undefined && typeof deps === 'symbol') {
		slot = deps;
		deps = undefined;
	}
	if (slot === undefined) missingSlot(name);
	return [deps as any[] | undefined, slot];
}

export function useEffect(fn: EffectFn, deps?: any[], slot?: symbol): void {
	const [d, s] = resolveEffectArgs('useEffect', deps, slot);
	enqueueEffect(s, fn, d, PASSIVE);
}
export function useLayoutEffect(fn: EffectFn, deps?: any[], slot?: symbol): void {
	const [d, s] = resolveEffectArgs('useLayoutEffect', deps, slot);
	enqueueEffect(s, fn, d, LAYOUT);
}
export function useInsertionEffect(fn: EffectFn, deps?: any[], slot?: symbol): void {
	const [d, s] = resolveEffectArgs('useInsertionEffect', deps, slot);
	enqueueEffect(s, fn, d, INSERTION);
}

export function useMemo<T>(compute: (...deps: any[]) => T, deps?: any[], slot?: symbol): T {
	// ABI: the compiler appends the hook slot as the LAST argument. When the user
	// omits deps (`useMemo(fn)`), that call arrives as `useMemo(fn, slot)` — the
	// symbol lands in the deps position. Reinterpret so optional-deps forms work.
	if (slot === undefined && typeof deps === 'symbol') {
		slot = deps as unknown as symbol;
		deps = undefined;
	}
	if (slot === undefined) missingSlot('useMemo');
	const scope = CURRENT_SCOPE!;
	const prev = scope.hooks?.get(slot) as { deps: any[] | undefined; value: T } | undefined;
	// deps === undefined → recompute every render (React parity for omitted deps).
	if (prev && deps !== undefined && !depsChanged(prev.deps, deps)) return prev.value;
	// Spread deps as positional args (superset of React — see PendingEffect.args):
	// a factory written as a pure function of its deps is hoistable. Zero-arg
	// React-style factories ignore the extra args.
	// eslint-disable-next-line prefer-spread
	const value = compute.apply(null, (deps ?? []) as []);
	ensureHooks(scope).set(slot, { deps, value });
	return value;
}

export function useCallback<F extends (...args: any[]) => any>(
	fn: F,
	deps?: any[],
	slot?: symbol,
): F {
	// Trailing-symbol ABI (see resolveEffectArgs): `useCallback(fn)` arrives as
	// `useCallback(fn, slot)`. useMemo reinterprets the same way, so forward both
	// args verbatim and let it sort out the omitted-deps case. Guard here (rather
	// than letting useMemo throw) so the diagnostic names useCallback, not useMemo.
	if (slot === undefined && typeof deps !== 'symbol') missingSlot('useCallback');
	return useMemo(() => fn, deps as any[] | undefined, slot);
}

export function useRef<T>(initial: T, slot?: symbol): { current: T } {
	if (slot === undefined) missingSlot('useRef');
	const scope = CURRENT_SCOPE!;
	let s = scope.hooks?.get(slot) as { current: T } | undefined;
	if (s === undefined) {
		s = { current: initial };
		ensureHooks(scope).set(slot, s);
	}
	return s;
}

/**
 * React's `useImperativeHandle(ref, factory, deps)` — exposes an imperative
 * API to a parent via the ref. Scheduled as a layout-phase effect so the
 * `ref.current` is populated before paint and before any layout effects in
 * ancestors that depend on the API. Cleared to null on unmount.
 */
export function useImperativeHandle<T>(
	ref: { current: T | null } | ((value: T | null) => void) | null | undefined,
	factory: () => T,
	deps?: any[],
	slot?: symbol,
): void {
	const [resolvedDeps, resolvedSlot] = resolveEffectArgs('useImperativeHandle', deps, slot);
	deps = resolvedDeps;
	slot = resolvedSlot;
	const setRef = (value: T | null): void => {
		if (typeof ref === 'function') (ref as any)(value);
		else if (ref != null) (ref as { current: T | null }).current = value;
	};
	enqueueEffect(
		slot,
		() => {
			setRef(factory());
			return () => setRef(null);
		},
		deps,
		LAYOUT,
	);
}

/**
 * React 19 `useEffectEvent` — returns a stable function whose body always
 * reflects the latest version of `fn`. Use inside `useEffect` deps to escape
 * the "must re-create the effect just because a closure-captured value changed"
 * trap. The returned function has the same identity across renders; calling it
 * invokes the most-recent `fn` (i.e., it always sees fresh closure values).
 */
/**
 * React 18+ `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`.
 *
 * Mirrors React's contract: subscribe is called on mount with an
 * `onStoreChange` callback; the returned function unsubscribes on unmount
 * (and on subscribe identity change). `getSnapshot()` is called on every
 * render to return the current snapshot. When the store calls
 * `onStoreChange`, the component re-renders and `getSnapshot()` runs again.
 *
 * `getServerSnapshot` is accepted for API compatibility but not used —
 * ripple-new has no SSR pipeline today; if/when one lands, this argument
 * is where to plug in the server-side snapshot.
 *
 * Built on top of useState + useEffect. The user's `slot` is the call
 * site's compiler-injected symbol; two derived sub-slots
 * (`<slot>:uses:tick` and `<slot>:uses:effect`) host the internal hooks
 * so the two sub-hooks have stable, distinct identities within the call.
 */
export function useSyncExternalStore<T>(
	subscribe: (onStoreChange: () => void) => () => void,
	getSnapshot: () => T,
	...rest: any[]
): T {
	// React-19 shape: `useSyncExternalStore(subscribe, getSnapshot,
	// getServerSnapshot?)`. The compiler appends the hook-slot Symbol as the
	// LAST argument, so we detect the user-vs-compiler args by counting from
	// the end. One trailing Symbol → user passed no getServerSnapshot; one
	// trailing Symbol preceded by another arg → user passed getServerSnapshot.
	const slot = rest[rest.length - 1] as symbol | undefined;
	if (slot === undefined || typeof slot !== 'symbol') missingSlot('useSyncExternalStore');
	const getServerSnapshot = rest.length >= 2 ? (rest[0] as () => T) : undefined;
	const desc = slot.description ?? '';
	const tickSlot = Symbol.for(desc + ':uses:tick');
	const instSlot = Symbol.for(desc + ':uses:inst');
	const layoutSlot = Symbol.for(desc + ':uses:layout');
	const effectSlot = Symbol.for(desc + ':uses:effect');

	// Fresh read on every render — guards against tearing between commits. DURING
	// HYDRATION the first read must use getServerSnapshot (if provided) so it
	// matches the server-rendered value — the layout effect below then re-checks
	// getSnapshot() and forces an update if the client value differs (React's
	// hydrate-then-sync behavior). `hydrating` constant-folds out for non-SSR
	// builds (see the hydration DCE contract).
	const value = hydrating && getServerSnapshot !== undefined ? getServerSnapshot() : getSnapshot();

	// `inst` mirrors React's mutable cell: the last-committed snapshot plus the
	// getSnapshot used to produce it. checkIfSnapshotChanged compares the current
	// store value against it with Object.is — this is the dedup that stops a
	// store notification from re-rendering when the snapshot is referentially
	// unchanged.
	const inst = useRef<{ value: T; getSnapshot: () => T }>({ value, getSnapshot }, instSlot) as {
		current: { value: T; getSnapshot: () => T };
	};

	// forceUpdate: a tick bump. setTick uses Object.is internally, so always
	// increment (never compare against a stale tick) to guarantee a re-render.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [, setTick] = useState(0, tickSlot);
	const forceUpdate = (): void => setTick((t: number) => t + 1);

	const checkIfSnapshotChanged = (): boolean => {
		try {
			return !Object.is(inst.current.value, inst.current.getSnapshot());
		} catch {
			// A throwing getSnapshot means the store likely mutated — re-render so
			// the render-phase read surfaces the error (React's behavior).
			return true;
		}
	};

	// Layout-phase value sync: record the snapshot read during render, then catch
	// any store mutation that happened between render and commit (re-render if so).
	// Deps include `value`/`getSnapshot` so the synced cell tracks each render.
	useLayoutEffect(
		() => {
			inst.current.value = value;
			inst.current.getSnapshot = getSnapshot;
			if (checkIfSnapshotChanged()) forceUpdate();
		},
		[subscribe, value, getSnapshot],
		layoutSlot,
	);

	// Subscribe in the passive phase (React parity). Immediately re-check after
	// subscribing: the store may have changed in the window between the render
	// read and the subscription taking effect, which would otherwise be missed.
	useEffect(
		() => {
			if (checkIfSnapshotChanged()) forceUpdate();
			const handleStoreChange = (): void => {
				if (checkIfSnapshotChanged()) forceUpdate();
			};
			return subscribe(handleStoreChange);
		},
		[subscribe],
		effectSlot,
	);

	return value;
}

export function useEffectEvent<F extends (...args: any[]) => any>(fn: F, slot?: symbol): F {
	if (slot === undefined) missingSlot('useEffectEvent');
	const scope = CURRENT_SCOPE!;
	let s = scope.hooks?.get(slot) as { current: F; stable: F } | undefined;
	if (s === undefined) {
		const stable = ((...args: any[]) => s!.current.apply(null, args)) as F;
		s = { current: fn, stable };
		ensureHooks(scope).set(slot, s);
	} else {
		s.current = fn;
	}
	return s.stable;
}

// ---------------------------------------------------------------------------
// Context — createContext + use() (React 19 shape, no useContext)
// ---------------------------------------------------------------------------

const CONTEXT_TAG = Symbol.for('ripple-new.context');

export interface Context<T> {
	$$kind: typeof CONTEXT_TAG;
	defaultValue: T;
	Provider: ComponentBody<{ value: T; children?: any }>;
	/**
	 * Monotonic version bumped whenever a Provider for this context commits a
	 * changed value. Consumers record the version they read at; the memo bailout
	 * (componentSlot) compares it so a context change forces a re-render through
	 * the push-cascade even when props are shallow-equal. See useContextInternal.
	 */
	$$version: number;
}

/**
 * Create a Context. Providers push the value into a Block-scoped slot; `use(ctx)`
 * walks the Block parent chain to find the nearest Provider for that context.
 */
export function createContext<T>(defaultValue: T): Context<T> {
	const ctx = { $$kind: CONTEXT_TAG, defaultValue, $$version: 0 } as Context<T>;
	// A Provider is a built-in component that stamps the value on its Block
	// and renders its `children` body inside its scope.
	ctx.Provider = function ProviderBody(scope, props) {
		// Stash on the scope (not block) so siblings of the Provider don't see it.
		// $$ctxValues is pre-initialised to null on every Scope/Block so this
		// assignment is a hidden-class-stable update (not a late stamp).
		if (scope.$$ctxValues === null) scope.$$ctxValues = new Map();
		// Bump the context version when an EXISTING value actually changes. This
		// runs before children() below, so the memo bailout downstream already
		// sees the new version when the cascade reaches it. First-set is NOT a
		// change: adding a Provider always creates a fresh scope for its
		// descendants, so a memoized consumer can't carry pre-Provider state — it's
		// always freshly mounted within the Provider's scope and reads the value
		// directly (no memo bailout to invalidate). (Bumping on first-set would
		// over-invalidate every memo'd consumer of this context elsewhere.)
		if (scope.$$ctxValues.has(ctx) && !Object.is(scope.$$ctxValues.get(ctx), props.value)) {
			ctx.$$version++;
		}
		scope.$$ctxValues.set(ctx, props.value);
		// Children is the compiled render-body for the JSX between the Provider tags.
		if (typeof props.children === 'function') {
			props.children(scope);
		}
	};
	return ctx;
}

/**
 * React 19's `use()` — accepts either a Context<T> or a thenable (Promise<T>).
 *
 * - `use(context)`: walks the Block tree from CURRENT_BLOCK upward to find a
 *   Provider's value (or the default).
 * - `use(thenable)`: if fulfilled, returns the value; if rejected, rethrows
 *   the reason (caught by the nearest tryBlock's catch); if pending, throws
 *   an internal SuspenseException (caught by the nearest tryBlock and routed
 *   to its `pending` body).
 *
 * The thenable mutates in place to gain `.status` / `.value` / `.reason`
 * fields the second time it's seen — matches React's `trackUsedThenable`.
 * Per-block `thenableState[]` keyed by call index lets the body replay
 * synchronously after the promise resolves.
 */
export function use<T>(usable: Context<T> | PromiseLike<T> | TrackedThenable<T>): T {
	if (usable && (usable as any).$$kind === CONTEXT_TAG) {
		return useContextInternal(usable as Context<T>);
	}
	if (usable == null || typeof (usable as any).then !== 'function') {
		throw new Error('use(): argument is not a Context nor a thenable');
	}
	return useThenable(usable as TrackedThenable<T>);
}

/**
 * React's `useContext(Context)` — reads the nearest Provider's value (or the
 * context default). A thin alias for the context branch of `use()`: context
 * reads carry no per-call-site state, so there is no hook slot and the compiler
 * needs no rewrite. Provided for React familiarity; `use(Context)` is the
 * React-19 idiom and remains the primary form.
 */
export function useContext<T>(context: Context<T>): T {
	return useContextInternal(context);
}

function useContextInternal<T>(context: Context<T>): T {
	// Record the context dependency on every enclosing memo() block, with the
	// version read. The push-cascade re-renders a Provider's subtree top-down;
	// a memo bailout would otherwise sever that cascade and strand consumers
	// (the memo'd component itself, its lite descendants, AND deeper consumers)
	// with a stale value. Stamping memo ancestors lets the bailout detect the
	// version change and decline to skip. Only memo blocks are stamped, so this
	// costs nothing for the common no-memo tree.
	for (let b: Block | null = CURRENT_BLOCK; b !== null; b = b.parentBlock) {
		if ((b.body as any)?.__memo === true) {
			(b.$$ctxReads ??= new Map()).set(context, context.$$version);
		}
	}
	let s: Scope | null = CURRENT_SCOPE;
	while (s !== null) {
		const m = s.$$ctxValues;
		if (m !== null && m.has(context)) return m.get(context) as T;
		s = s.parent;
	}
	let b: Block | null = CURRENT_BLOCK ? CURRENT_BLOCK.parentBlock : null;
	while (b !== null) {
		const m = b.$$ctxValues;
		if (m !== null && m.has(context)) return m.get(context) as T;
		b = b.parentBlock;
	}
	return context.defaultValue;
}

// ---------------------------------------------------------------------------
// Suspense — use(thenable) and the SuspenseException sentinel.
// ---------------------------------------------------------------------------

interface TrackedThenable<T = any> extends PromiseLike<T> {
	status?: 'pending' | 'fulfilled' | 'rejected';
	value?: T;
	reason?: any;
}

/**
 * Sentinel thrown by `use(pendingThenable)`. Intentionally NOT an Error so
 * userland try/catch is unlikely to swallow it — only our `tryBlock` knows
 * to look for it via `isSuspenseException`. Carries the thenable so the
 * boundary can attach a `then` listener and schedule a retry.
 */
class SuspenseException {
	readonly __isSuspense = true;
	constructor(public readonly thenable: TrackedThenable<any>) {}
}

function isSuspenseException(x: any): x is SuspenseException {
	return x !== null && typeof x === 'object' && (x as any).__isSuspense === true;
}

function useThenable<T>(thenable: TrackedThenable<T>): T {
	const block = CURRENT_BLOCK!;
	const state: TrackedThenable<any>[] = ((block as any).__thenables ??= []);
	const idx = block.__thenableIdx;
	block.__thenableIdx = idx + 1;

	// Hydration seeding (SSR Phase 4): the server already resolved this use() and
	// serialized the value. Adopt the next seeded value (use() calls hydrate in
	// the same render order the server produced them in) and mark the thenable
	// fulfilled, so this render and every later one return synchronously — no
	// re-suspend, no client re-fetch. Folds out for client-only builds.
	if (hydrating && hydrationSeeds !== null && hydrationSeedCursor < hydrationSeeds.length) {
		const value = hydrationSeeds[hydrationSeedCursor++] as T;
		thenable.status = 'fulfilled';
		thenable.value = value;
		state[idx] = thenable;
		return value;
	}

	const stored = state[idx];
	// Replay path: same promise as last attempt — fast lookup of the cached entry.
	if (stored === thenable) {
		if (thenable.status === 'fulfilled') return thenable.value as T;
		if (thenable.status === 'rejected') throw thenable.reason;
		// Still pending — re-throw without re-tagging (already wired up).
		throw new SuspenseException(thenable);
	}

	// New thenable at this slot — tag status if untracked, attach listeners.
	state[idx] = thenable;
	if (thenable.status === 'fulfilled') return thenable.value as T;
	if (thenable.status === 'rejected') throw thenable.reason;
	if (thenable.status !== 'pending') {
		thenable.status = 'pending';
		thenable.then(
			(v) => {
				thenable.status = 'fulfilled';
				thenable.value = v;
			},
			(e) => {
				thenable.status = 'rejected';
				thenable.reason = e;
			},
		);
	}
	throw new SuspenseException(thenable);
}

// Monotonic counter — produces stable cross-render IDs.
let _idCounter = 0;
export function useId(slot?: symbol): string {
	if (slot === undefined) missingSlot('useId');
	const scope = CURRENT_SCOPE!;
	let s = scope.hooks?.get(slot) as { id: string } | undefined;
	if (s === undefined) {
		s = { id: ':in-' + (_idCounter++).toString(36) + ':' };
		ensureHooks(scope).set(slot, s);
	}
	return s.id;
}

// ---------------------------------------------------------------------------
// Templates: parse-once HTML → clone-per-instance
// ---------------------------------------------------------------------------

// Namespace flag: 0 = HTML, 1 = SVG, 2 = MathML. The compiler picks the
// constant; we never look at namespaceURI at runtime.
export function template(html: string, ns: number = 0, frag: number = 0): Element {
	const t = document.createElement('template');
	if (ns === 0) {
		t.innerHTML = html;
		return t.content.firstChild as Element;
	}
	// Wrap in <svg>/<math> so the HTML5 parser places descendants in the right
	// foreign-content namespace (Svelte/Ripple's trick — also works around
	// happy-dom which doesn't enter MathML foreign-content mode from a bare
	// <math> root). For multi-root templates (frag=1) return the wrapper itself
	// so the caller can drain its children.
	const wrap = ns === 1 ? 'svg' : 'math';
	t.innerHTML = `<${wrap}>${html}</${wrap}>`;
	const wrapEl = t.content.firstChild as Element;
	return frag ? wrapEl : (wrapEl.firstChild as Element);
}

// ---------------------------------------------------------------------------
// Hydration (SSR Phase 2). When `hydrating`, the compiled mount path ADOPTS the
// server-rendered DOM instead of cloning a fresh template: `clone()` returns the
// adopted server root, and `htext()` adopts the existing server text node rather
// than creating one. Element/attribute/event/ref bindings are unchanged — their
// template paths (`_root.firstChild.nextSibling…`) already align with the server
// DOM, because text lives INSIDE elements and so doesn't shift element siblings.
//
// Dead-code-elimination contract (mirrors Ripple/Svelte): `hydrating` is set
// `true` ONLY inside the `hydrate()` entry. An app that never imports `hydrate`
// lets the bundler tree-shake it, after which `hydrating` is provably always
// `false`, so it constant-folds and EVERY `if (hydrating)` branch below (in the
// hot-path clone/htext) is dropped — client-only builds pay zero hydration cost.
// Do NOT assign `hydrating = true` anywhere except `hydrate()`, or this breaks.
// ---------------------------------------------------------------------------
let hydrating = false;
// The HYDRATION CURSOR (ported from Ripple's `hydrate_node`). While hydrating,
// this points at the server-rendered node the next adopt operation should claim.
// `clone()` adopts the cursor as a template root; the compiler-emitted cursor
// walk (`child`/`sibling` — used only for templates that contain control-flow /
// component holes, whose server DOM no longer matches the raw template paths)
// advances it node-by-node; block functions (forBlock/ifBlock/componentSlot/…)
// adopt the server `<!--[-->`/`<!--]-->` markers off it. For hole-free leaf
// templates the cursor is just the adopted root and the old raw path-walk
// (`_root.firstChild.nextSibling…`) still resolves bindings correctly.
let hydrateNode: Node | null = null;
// Server-resolved `use(thenable)` values (SSR Phase 4), parsed from the inline
// `<script data-ripple-new-suspense>` in `hydrate()` and consumed in render
// order by `useThenable` so a hydrating boundary returns synchronously. Both are
// touched ONLY under `if (hydrating)` and assigned ONLY in `hydrate()`, so they
// constant-fold away with the rest of the hydration path in client-only builds.
let hydrationSeeds: unknown[] | null = null;
let hydrationSeedCursor = 0;

export function clone<T extends Node>(node: T): T {
	if (hydrating && hydrateNode !== null) {
		// Adopt the server node at the cursor as this template's root. The cursor
		// stays put so a hole-template's subsequent child()/sibling() walk descends
		// into it; for a hole-free leaf the raw path-walk takes over from here.
		return hydrateNode as unknown as T;
	}
	return node.cloneNode(true) as T;
}

/**
 * Compiler-emitted for a single-text-child binding's mount. Normally creates the
 * text node and appends it; while hydrating, ADOPTS the element's existing
 * (server-rendered) text node so the DOM isn't rebuilt. The prev-value the
 * compiler seeds alongside this makes the first update a no-op when the client
 * value matches the server text (avoiding a mismatch re-render).
 */
export function htext(el: Node, text: string): Text {
	if (hydrating) {
		const first = el.firstChild;
		if (first !== null && first.nodeType === 3) return first as Text;
		// Server rendered an empty hole (value was ''/null) — create + adopt.
	}
	const t = document.createTextNode(text);
	el.appendChild(t);
	return t;
}

/**
 * Compiler-emitted mount for a `{x as string}` text hole that sits AMONG sibling
 * nodes (the `<!>` placeholder lives at a resolved position, `posNode`).
 *
 * `posNode` is resolved with the hole-aware `child`/`sibling` walk, so during
 * hydration it is the SERVER's text node at that logical position (the server
 * rendered the value directly, with no `<!>`), even when earlier siblings are
 * components / control-flow that expanded into `<!--[-->…<!--]-->` ranges. We
 * ADOPT it. While NOT hydrating, `posNode` is the cloned template's `<!>`
 * comment, which we replace 1-for-1 with a text node (position-preserving, so
 * later sibling walks are unaffected). This is the sibling-position analog of
 * `htext` (which handles the only-child fast path).
 */
export function htextSwap(posNode: Node | null, text: string): Text {
	if (hydrating) {
		if (posNode !== null && posNode.nodeType === 3) {
			// Adopt the server text node.
			if ((posNode as Text).data !== text) (posNode as Text).data = text;
			return posNode as Text;
		}
		// Server emitted no text node here (empty value, or it merged with an
		// adjacent static text run): insert a fresh node before the next logical
		// node without removing it.
		const t = document.createTextNode(text);
		if (posNode !== null && posNode.parentNode !== null) {
			posNode.parentNode.insertBefore(t, posNode);
		}
		return t;
	}
	// Fresh mount: posNode is the `<!>` placeholder — replace it in place.
	const t = document.createTextNode(text);
	const parent = posNode!.parentNode!;
	parent.insertBefore(t, posNode);
	parent.removeChild(posNode!);
	return t;
}

// ---------------------------------------------------------------------------
// Hydration navigation helpers. The compiler emits `child`/`sibling` instead of
// raw `.firstChild`/`.nextSibling` ONLY for templates containing control-flow /
// component holes — there the server DOM expands each hole into a
// `<!--[-->…<!--]-->` range, so a raw sibling walk would land on the wrong node.
// `child`/`sibling` are PURE navigators (they don't move the cursor): they treat
// a whole `<!--[-->…<!--]-->` block as ONE logical sibling, which exactly matches
// the single `<!>` placeholder the template uses for that hole — so ripple-new's
// existing path+childIndex binding resolution keeps working unchanged on the
// server DOM. The `hydrateNode` cursor is set by each block call (forBlock /
// ifBlock / componentSlot, to its content start) for the child's `clone()` to
// adopt. When `hydrating` is false these are trivial DOM reads and the whole
// hydration path DCE-folds away for client-only builds.
// ---------------------------------------------------------------------------

/** True if `node` is a server block-open marker `<!--[-->`. */
function isBlockOpen(node: Node | null): node is Comment {
	return node !== null && node.nodeType === 8 && (node as Comment).data === HYDRATION_START;
}

/** From a block-open `<!--[-->`, the matching `<!--]-->` (depth-tracked). */
function matchingClose(open: Node): Comment {
	let depth = 0;
	let node: Node = open.nextSibling as Node;
	for (;;) {
		if (node.nodeType === 8) {
			const data = (node as Comment).data;
			if (data === HYDRATION_END) {
				if (depth === 0) return node as Comment;
				depth -= 1;
			} else if (data === HYDRATION_START) {
				depth += 1;
			}
		}
		node = node.nextSibling as Node;
	}
}

/** Logical index-0 child: `node.firstChild` for both client and hydration. */
export function child<T extends Node>(node: T): Node | null {
	return node.firstChild;
}

/**
 * The n-th logical sibling after `node`. Client: plain `.nextSibling` × n.
 * Hydrating: a `<!--[-->…<!--]-->` block counts as ONE step (we jump past its
 * range), so an element/hole after a block resolves to the right server node.
 */
export function sibling(node: Node, n: number = 1): Node | null {
	let c: Node | null = node;
	for (let i = 0; i < n; i++) {
		// Over-walk (cursor already past the last node) → return null, don't throw.
		if (c === null) return null;
		if (hydrating && isBlockOpen(c)) c = matchingClose(c);
		c = c.nextSibling;
	}
	return c;
}

// ---------------------------------------------------------------------------
// Patch helpers — `prev !== next` guards are emitted by the compiler/author;
// these helpers are unconditional "set this now" with internal data check.
// ---------------------------------------------------------------------------

export function setText(node: Text, value: any): void {
	const next =
		value == null || value === false ? '' : typeof value === 'string' ? value : String(value);
	if (node.data !== next) node.data = next;
}

// Apply a ref attachment. Accepts the three supported shapes:
//   - function: called with the element (or null on detach)
//   - object  : `.current` is set to the element (or null on detach)
//   - array   : each item is attached recursively. Lets multiple owners
//               observe the same node without the parent juggling refs.
//               Matches React's `ref={[a, b]}` convention.
// Called by the compiler-emitted ref binding mount + update paths and
// by the scope cleanup hook installed at mount time.
// React 19 callback-ref cleanup. A callback ref may RETURN a cleanup function;
// when it does, that cleanup runs on detach INSTEAD of calling the ref with
// null. We remember the returned cleanup keyed by the ref function so the later
// detach call — `attachRef(ref, null)`, emitted as the scope cleanup — can run
// it. Legacy callback refs (that return nothing) keep the `ref(null)` contract.
const refCleanups = new WeakMap<(el: any) => unknown, () => void>();

export function attachRef(ref: any, el: Element | FragmentInstance | null): void {
	if (ref == null) return;
	if (typeof ref === 'function') {
		if (el === null) {
			// Detach: prefer the React-19 cleanup the callback returned at attach.
			const cleanup = refCleanups.get(ref);
			if (cleanup !== undefined) {
				refCleanups.delete(ref);
				cleanup();
			} else {
				ref(null);
			}
		} else {
			const cleanup = ref(el);
			if (typeof cleanup === 'function') refCleanups.set(ref, cleanup as () => void);
		}
		return;
	}
	if (Array.isArray(ref)) {
		for (let i = 0; i < ref.length; i++) attachRef(ref[i], el);
		return;
	}
	ref.current = el;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fragment refs (React canary `enableFragmentRefs` parity).
//
// `<Fragment ref={r}>...</Fragment>` populates `r.current` with a
// FragmentInstance that exposes imperative methods over the fragment's
// first-level host children. The compiler intercepts the long-form
// `<Fragment>` JSXElement when it carries a `ref` attribute, emits a
// start/end Comment marker pair around the children in the parent template,
// and binds the markers + ref expression to a `fragmentRef` binding which
// calls `mountFragmentRef` at mount time and registers a cleanup that
// detaches the ref and destroys the instance on unmount.
//
// `Fragment` is exported as a sentinel symbol so user code can write
// `import { Fragment } from 'ripple-new'` for parity with React. The
// compiler matches on the JSX identifier 'Fragment' at the source-name
// level, so the import is currently only for TS validity — but reserving
// the symbol identity now keeps the door open for component-prop-name
// resolution later.
// ─────────────────────────────────────────────────────────────────────────────

export const Fragment: unique symbol = Symbol.for('ripple-new.Fragment');

/**
 * React-19 `<Activity mode="hidden"|"visible">` sentinel. The compiler matches
 * the `Activity` tag by NAME (so this export is only needed so user imports
 * `import { Activity } from 'ripple-new'` resolve); the runtime work happens in
 * `activityBlock`.
 */
export const Activity: unique symbol = Symbol.for('ripple-new.Activity');

export class FragmentInstance {
	/**
	 * Sentinel that React's test suite asserts is truthy as a sanity-check
	 * that the FragmentInstance is bound to its owning Block. Named
	 * `_ownerBlock` (not React's `_fragmentFiber`) because ripple-new uses
	 * Blocks, not fibers — same role.
	 */
	_ownerBlock: Block;
	_startMarker: Comment;
	_endMarker: Comment;
	_destroyed: boolean;
	/**
	 * Registry of listeners added via addEventListener, deduped by
	 * (type, listener, capture). `null` until the first addEventListener — zero
	 * per-instance cost for fragments that never use the listener API. Stored
	 * (not snapshotted onto specific elements) so they can be RE-APPLIED to
	 * children that mount later: `_reapply` (run after every commit) attaches
	 * each stored listener to the current children, matching React's
	 * future-children contract.
	 */
	_listeners: Array<{
		type: string;
		listener: EventListenerOrEventListenerObject;
		options: AddEventListenerOptions | boolean | undefined;
	}> | null;
	/**
	 * Observers registered via observeUsing, re-applied to future children the
	 * same way as `_listeners`. `null` until the first observeUsing.
	 */
	_observers: Set<{ observe(target: Element): void; unobserve(target: Element): void }> | null;
	/**
	 * The ref currently pointed at this instance. Held here (not captured in the
	 * mount closure) so the unmount cleanup detaches whatever ref is current AND
	 * the compiler's update path can re-point a changed `<Fragment ref={…}>`.
	 */
	_currentRef: any;

	constructor(ownerBlock: Block, startMarker: Comment, endMarker: Comment) {
		this._ownerBlock = ownerBlock;
		this._startMarker = startMarker;
		this._endMarker = endMarker;
		this._destroyed = false;
		this._listeners = null;
		this._observers = null;
		this._currentRef = null;
	}

	_destroy(): void {
		this._destroyed = true;
		activeFragments.delete(this);
		// Detach any still-registered listeners from the current children (cleanups
		// run before the DOM range is removed, so the children are still attached)
		// so stale closures don't keep nodes/scopes alive after unmount. Observers
		// are NOT explicitly unobserved — like React, we rely on the browser
		// dropping disconnected nodes; the observer's owner manages its lifecycle.
		if (this._listeners) {
			for (const el of fragmentDirectChildren(this)) {
				for (const e of this._listeners) {
					el.removeEventListener(e.type, e.listener, e.options as any);
				}
			}
			this._listeners = null;
		}
		this._observers = null;
	}

	/** Deregister from the commit re-apply set once no bindings remain. */
	_maybeDeactivate(): void {
		if (
			(this._listeners === null || this._listeners.length === 0) &&
			(this._observers === null || this._observers.size === 0)
		) {
			activeFragments.delete(this);
		}
	}

	/**
	 * Re-apply every stored listener + observer to the CURRENT direct children.
	 * Run after each commit (reapplyFragmentBindings) so children that mounted
	 * since the last pass pick up the fragment's bindings. addEventListener and
	 * observer.observe are idempotent for an already-wired (element, binding)
	 * pair, so re-applying is safe.
	 */
	_reapply(): void {
		if (this._destroyed) return;
		for (const el of fragmentDirectChildren(this)) {
			if (this._listeners) {
				for (const e of this._listeners) el.addEventListener(e.type, e.listener, e.options as any);
			}
			if (this._observers) {
				for (const ob of this._observers) ob.observe(el);
			}
		}
	}

	// ─── focus / focusLast / blur (Stage 2) ─────────────────────────────
	/**
	 * Focus the first focusable element inside the fragment, in tree order.
	 * Mirrors React FragmentInstance.focus: matches `<input>`, `<button>`,
	 * `<select>`, `<textarea>`, `<a href>`, `[contenteditable="true"]`, and
	 * anything with an explicit tabIndex >= 0. Skips disabled/hidden and
	 * tabIndex=-1 elements. No-op if the fragment has no focusable descendants.
	 */
	focus(options?: FocusOptions): void {
		if (this._destroyed) return;
		for (const el of fragmentDescendants(this)) {
			if (isFocusable(el)) {
				(el as HTMLElement).focus(options);
				return;
			}
		}
	}

	/**
	 * Focus the LAST focusable element inside the fragment, in tree order.
	 * Same focusability rules as `focus()`.
	 */
	focusLast(options?: FocusOptions): void {
		if (this._destroyed) return;
		let last: Element | null = null;
		for (const el of fragmentDescendants(this)) {
			if (isFocusable(el)) last = el;
		}
		if (last) (last as HTMLElement).focus(options);
	}

	/**
	 * Blur the currently-focused element if it's inside the fragment range.
	 * No-op if focus is outside the fragment (matches React's "owned" scope —
	 * we don't blur arbitrary other elements just because they happen to be
	 * active when blur() is called).
	 */
	blur(): void {
		if (this._destroyed) return;
		const doc = this._startMarker.ownerDocument || document;
		const active = doc.activeElement;
		if (!active || active === doc.body) return;
		if (isInsideFragment(this, active)) {
			(active as HTMLElement).blur();
		}
	}

	// ─── addEventListener / removeEventListener (Stage 3) ───────────────
	/**
	 * Attaches a listener to every DIRECT (host-Element) child of the fragment.
	 * The (type, listener, capture) tuple is stored and RE-APPLIED after each
	 * commit, so children inserted into the fragment LATER also get the listener
	 * — React's future-children contract. Deduped by (type, listener, capture)
	 * like the DOM, so repeat calls are no-ops.
	 */
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions | boolean,
	): void {
		if (this._destroyed) return;
		const capture = listenerCapturePhase(options);
		if (!this._listeners) this._listeners = [];
		for (const e of this._listeners) {
			if (
				e.type === type &&
				e.listener === listener &&
				listenerCapturePhase(e.options) === capture
			) {
				return; // already registered — no-op (DOM/React dedupe)
			}
		}
		this._listeners.push({ type, listener, options });
		for (const el of fragmentDirectChildren(this)) {
			el.addEventListener(type, listener, options as any);
		}
		activeFragments.add(this);
	}

	/**
	 * Removes a listener previously added via this FragmentInstance. The
	 * (type, listener, options.capture) tuple must match the add call — the same
	 * identity rule EventTarget.removeEventListener uses. Detaches from the
	 * current children and stops re-applying it to future ones. Unmatched calls
	 * are a silent no-op (DOM parity).
	 */
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions | boolean,
	): void {
		if (this._destroyed || !this._listeners) return;
		const wantCapture = listenerCapturePhase(options);
		for (let i = this._listeners.length - 1; i >= 0; i--) {
			const entry = this._listeners[i];
			if (entry.type !== type) continue;
			if (entry.listener !== listener) continue;
			if (listenerCapturePhase(entry.options) !== wantCapture) continue;
			for (const el of fragmentDirectChildren(this)) {
				el.removeEventListener(type, listener, entry.options as any);
			}
			this._listeners.splice(i, 1);
			this._maybeDeactivate();
			return;
		}
	}

	// ─── observeUsing / unobserveUsing / getClientRects / getRootNode (Stage 4) ─
	/**
	 * Forwards .observe() on the supplied observer (IntersectionObserver,
	 * ResizeObserver, MutationObserver, or any other with an `observe(target)`
	 * signature) to every direct fragment child. Lets a single fragment ref
	 * stand in for "watch this list of siblings" — react-aria's Virtualizer
	 * and dnd-kit's drop-zone primitives are the canonical clients.
	 */
	observeUsing(observer: {
		observe(target: Element): void;
		unobserve(target: Element): void;
	}): void {
		if (this._destroyed) return;
		if (!this._observers) this._observers = new Set();
		this._observers.add(observer);
		for (const el of fragmentDirectChildren(this)) observer.observe(el);
		activeFragments.add(this);
	}

	/**
	 * Stops observing with the given observer: unobserves the current children
	 * and stops re-applying it to future ones. (The walk runs even without a
	 * preceding observeUsing, matching the DOM's tolerant unobserve.)
	 */
	unobserveUsing(observer: {
		observe(target: Element): void;
		unobserve(target: Element): void;
	}): void {
		if (this._destroyed) return;
		if (this._observers) this._observers.delete(observer);
		for (const el of fragmentDirectChildren(this)) observer.unobserve(el);
		this._maybeDeactivate();
	}

	/**
	 * Concatenates the client rects of every direct fragment child. The
	 * returned array is a flat list of DOMRects in tree order — useful for
	 * tooltip positioning that needs to span multiple sibling elements.
	 * After unmount returns [].
	 */
	getClientRects(): DOMRect[] {
		const out: DOMRect[] = [];
		if (this._destroyed) return out;
		let node: ChildNode | null = this._startMarker.nextSibling;
		while (node && node !== this._endMarker) {
			if (node.nodeType === 1) {
				const rects = (node as Element).getClientRects();
				for (let i = 0; i < rects.length; i++) out.push(rects[i]);
			}
			node = node.nextSibling;
		}
		return out;
	}

	/**
	 * Returns the rootNode of the fragment (its document or shadow root).
	 * Falls back to the start-marker's owner document if the fragment has
	 * no direct children yet — keeps the contract "always returns a Node"
	 * so callers don't need null-checks.
	 */
	getRootNode(): Node {
		if (this._destroyed) return this._startMarker.getRootNode();
		let node: ChildNode | null = this._startMarker.nextSibling;
		while (node && node !== this._endMarker) {
			if (node.nodeType === 1) return (node as Element).getRootNode();
			node = node.nextSibling;
		}
		return this._startMarker.getRootNode();
	}

	// ─── compareDocumentPosition / dispatchEvent (Stage 5) ──────────────
	/**
	 * Compares `other` against the fragment's span. The returned bitmask
	 * uses the same Node constants the platform's compareDocumentPosition
	 * uses, with `CONTAINED_BY` indicating that `other` lives strictly
	 * between the fragment's start and end markers (in document order).
	 *
	 *   - other before the start marker     → DOCUMENT_POSITION_PRECEDING
	 *   - other after the end marker        → DOCUMENT_POSITION_FOLLOWING
	 *   - other between start & end markers → DOCUMENT_POSITION_CONTAINED_BY |
	 *                                          DOCUMENT_POSITION_FOLLOWING
	 *   - other not in the same tree        → DOCUMENT_POSITION_DISCONNECTED
	 */
	compareDocumentPosition(other: Node): number {
		if (this._destroyed) return Node.DOCUMENT_POSITION_DISCONNECTED;
		const startRel = this._startMarker.compareDocumentPosition(other);
		if (startRel & Node.DOCUMENT_POSITION_DISCONNECTED) return startRel;
		const endRel = this._endMarker.compareDocumentPosition(other);
		const followsStart = (startRel & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
		const precedesEnd = (endRel & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
		if (followsStart && precedesEnd) {
			return Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING;
		}
		if (startRel & Node.DOCUMENT_POSITION_PRECEDING) {
			return Node.DOCUMENT_POSITION_PRECEDING;
		}
		return Node.DOCUMENT_POSITION_FOLLOWING;
	}

	/**
	 * Dispatches `event` on the fragment's parent host element so the
	 * event bubbles into the surrounding handler tree the way native
	 * EventTarget.dispatchEvent does. Mirrors React's FragmentInstance:
	 * because the fragment itself has no DOM node, the dispatch target is
	 * the parent (`return.stateNode` in React's fiber model).
	 *
	 * Returns false if the event's default action was cancelled — matches
	 * EventTarget.dispatchEvent's return contract so callers can branch
	 * on preventDefault() like they would on any other DOM dispatch.
	 */
	dispatchEvent(event: Event): boolean {
		if (this._destroyed) return true;
		const parent = this._startMarker.parentNode;
		if (!parent) return true;
		return (parent as unknown as EventTarget).dispatchEvent(event);
	}

	// ─── scrollIntoView (Stage 6) ───────────────────────────────────────
	/**
	 * Scrolls the fragment into view. Picks the first focusable descendant
	 * if one exists (matches what tab-focus would land on), falling back to
	 * the first element child otherwise. Mirrors React's FragmentInstance
	 * choice — for tooltip / anchor-scroll use cases the "natural target"
	 * is usually a focusable element, not an arbitrary wrapper div.
	 */
	scrollIntoView(arg?: boolean | ScrollIntoViewOptions): void {
		if (this._destroyed) return;
		let firstFocusable: Element | null = null;
		let firstAny: Element | null = null;
		for (const el of fragmentDescendants(this)) {
			if (!firstAny) firstAny = el;
			if (isFocusable(el)) {
				firstFocusable = el;
				break;
			}
		}
		const target = firstFocusable || firstAny;
		if (target) (target as HTMLElement).scrollIntoView(arg as any);
	}
}

/**
 * EventTarget.removeEventListener compares on (type, listener, capture-flag).
 * Everything else (once, passive, signal) is "transparent" to identity, so
 * we normalize options down to its capture-flag for the equality test.
 */
function listenerCapturePhase(o: AddEventListenerOptions | boolean | undefined): boolean {
	if (o == null) return false;
	if (typeof o === 'boolean') return o;
	return !!o.capture;
}

/**
 * Walk every Element strictly between the start and end markers of the
 * fragment, in document (tree) order. Uses a TreeWalker rooted at each
 * top-level child between the markers so the iteration is O(n) over the
 * fragment's subtree (not the whole document). Comment / Text nodes are
 * skipped — fragment ref methods only care about Elements.
 */
function* fragmentDescendants(fi: FragmentInstance): Generator<Element> {
	let node: ChildNode | null = fi._startMarker.nextSibling;
	while (node && node !== fi._endMarker) {
		const next = node.nextSibling;
		if (node.nodeType === 1) {
			const top = node as Element;
			yield top;
			// SHOW_ELEMENT (filter 1) keeps us off Text/Comment.
			const walker = (top.ownerDocument || document).createTreeWalker(top, 1);
			let descendant = walker.nextNode() as Element | null;
			while (descendant) {
				yield descendant;
				descendant = walker.nextNode() as Element | null;
			}
		}
		node = next;
	}
}

/**
 * Yield the DIRECT (first-level) Element children between the fragment markers,
 * in document order. This is the membership set for the per-child operations
 * (event listeners, observers) — matching React's first-level traverse — as
 * opposed to fragmentDescendants which deep-walks (used by focus/scrollIntoView).
 */
function* fragmentDirectChildren(fi: FragmentInstance): Generator<Element> {
	let node: ChildNode | null = fi._startMarker.nextSibling;
	while (node && node !== fi._endMarker) {
		const next = node.nextSibling;
		if (node.nodeType === 1) yield node as Element;
		node = next;
	}
}

/**
 * Is `node` strictly between the fragment's start and end markers in
 * document order? Uses compareDocumentPosition so the check works for
 * arbitrary descendants — not just immediate children — and returns false
 * for detached / unrelated nodes (which is what blur containment expects).
 */
function isInsideFragment(fi: FragmentInstance, node: Node): boolean {
	const startRel = fi._startMarker.compareDocumentPosition(node);
	const endRel = fi._endMarker.compareDocumentPosition(node);
	const followsStart = (startRel & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
	const precedesEnd = (endRel & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
	return followsStart && precedesEnd;
}

/**
 * Mirrors the focusability check React's FragmentInstance uses:
 *  - inherently-focusable tags: <input>, <select>, <textarea>, <button>
 *    (not disabled), <a> (with href).
 *  - explicit tabIndex >= 0 OR contenteditable="true" on any tag.
 *  - tabIndex === -1 → not in sequential order, NOT picked by focus() /
 *    focusLast(). (Still focusable via .focus() directly — we just skip
 *    them when walking, matching React's behavior.)
 *  - hidden / disabled → never focusable.
 */
function isFocusable(el: Element): boolean {
	if ((el as HTMLElement).hidden === true) return false;
	const tabAttr = el.getAttribute('tabindex');
	const explicitTab = tabAttr === null ? null : parseInt(tabAttr, 10);
	if (explicitTab !== null && explicitTab < 0) return false;
	const tag = el.tagName;
	if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
		return !(el as HTMLInputElement).disabled;
	}
	if (tag === 'A' && el.hasAttribute('href')) return true;
	if (explicitTab !== null && explicitTab >= 0) return true;
	if (el.getAttribute('contenteditable') === 'true') return true;
	return false;
}

/**
 * Compiler-emitted helper. Creates a FragmentInstance bound to the supplied
 * marker pair + owning block, attaches the user's ref, and queues both the
 * detach + the FragmentInstance destruction on the scope's cleanup chain.
 */
export function mountFragmentRef(
	scope: Scope,
	startMarker: Comment,
	endMarker: Comment,
	ref: any,
): FragmentInstance {
	const fi = new FragmentInstance(scope.block, startMarker, endMarker);
	fi._currentRef = ref;
	// Defer the attach to commit (after DOM insertion, before layout effects) so
	// the fragment's markers/children are connected when a callback ref fires —
	// same React-19 timing as element refs. Read `_currentRef` (not the captured
	// `ref`) so a ref the compiler re-points via the update path is honored, and
	// so the detach cleanup always releases whatever ref is current on unmount.
	queueRefAttach(scope, () => attachRef(fi._currentRef, fi));
	scope.cleanups.push(() => {
		attachRef(fi._currentRef, null);
		fi._destroy();
	});
	return fi;
}

// XML namespaces recognised by the HTML5 parser for attribute names —
// matches React's setAttribute routing for parity. When an attribute name
// starts with `xlink:`, `xml:`, or `xmlns:`, we route through setAttributeNS
// so the resulting attribute's namespaceURI matches what the browser parses
// out of a static SVG template. Without this, dynamic `xlink:href={…}` would
// leave attribute.namespaceURI === null while a static `<use xlink:href="…"/>`
// inside the template would have it set to XLINK_NS — a real divergence.
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

function attrNamespace(name: string): string | null {
	// Bare `xmlns` is the xmlns namespace itself (rare in practice).
	if (name === 'xmlns') return XMLNS_NS;
	const colon = name.indexOf(':');
	if (colon <= 0) return null;
	const prefix = name.slice(0, colon);
	if (prefix === 'xlink') return XLINK_NS;
	if (prefix === 'xml') return XML_NS;
	if (prefix === 'xmlns') return XMLNS_NS;
	return null;
}

export function setAttribute(el: Element, name: string, value: any): void {
	const ns = attrNamespace(name);
	if (value == null || value === false) {
		if (ns) {
			const colon = name.indexOf(':');
			el.removeAttributeNS(ns, colon >= 0 ? name.slice(colon + 1) : name);
		} else {
			el.removeAttribute(name);
		}
		return;
	}
	const v = value === true ? '' : String(value);
	if (ns) el.setAttributeNS(ns, name, v);
	else el.setAttribute(name, v);
}

export function setClassName(el: Element, value: string | null | undefined): void {
	// Fast path on HTMLElement. For SVG/MathML hosts the compiler emits
	// setAttribute(el, 'class', ...) directly — never routes here — because
	// SVGElement.className is a read-only SVGAnimatedString and assignment
	// is a no-op in real browsers.
	(el as any).className = value == null ? '' : value;
}

// ---------------------------------------------------------------------------
// Style — object form (keys may be kebab-case `font-size` OR React-style
// camelCase `fontSize`; see styleName) or a full cssText string. `prev` is the
// previous value tracked by the compiler so we can diff object→object and only
// touch the properties that changed.
// ---------------------------------------------------------------------------

const IMPORTANT_SUFFIX = '!important';

export function setStyle(el: HTMLElement | SVGElement, value: any, prev: any): void {
	const style = (el as HTMLElement).style;

	if (value == null || value === false || value === '') {
		if (prev != null && prev !== false && prev !== '') style.cssText = '';
		return;
	}

	if (typeof value === 'string') {
		if (prev !== value) style.cssText = value;
		return;
	}

	// Object form. If prev is an object too, diff per-property — only changed
	// keys are touched. Otherwise (prev was string / null) reset cssText first
	// so leftover declarations don't leak across the transition.
	if (prev && typeof prev === 'object') {
		for (const k in prev) {
			if (!(k in value)) style.removeProperty(styleName(k));
		}
		for (const k in value) {
			const v = value[k];
			if (v === prev[k]) continue;
			if (v == null || v === false) style.removeProperty(styleName(k));
			else applyStyleProperty(style, k, v);
		}
	} else {
		if (typeof prev === 'string') style.cssText = '';
		for (const k in value) {
			const v = value[k];
			if (v != null && v !== false) applyStyleProperty(style, k, v);
		}
	}
}

// Normalize a style-object key to a CSS property name CSSOM accepts. Supports
// BOTH kebab-case (`font-size`) and React-style camelCase (`fontSize`) keys —
// the latter is converted to kebab. Mirrors React's hyphenateStyleName:
//   fontSize        → font-size
//   backgroundColor → background-color
//   WebkitTransform → -webkit-transform   (leading uppercase = vendor prefix)
//   msFilter        → -ms-filter          (the `ms` prefix gets a leading dash)
// Custom properties (`--myVar`) and already-hyphenated names (anything starting
// with `-`) pass through verbatim — custom properties are case-sensitive and
// must NOT be hyphenated. No regex (char-walk) to avoid backtracking concerns.
function styleName(name: string): string {
	// `--custom-prop` and pre-hyphenated `-webkit-…` keys: leave untouched.
	if (name.charCodeAt(0) === 45 /* - */) return name;
	// Fast path: no uppercase → already kebab (the common case), no allocation.
	let hasUpper = false;
	for (let i = 0; i < name.length; i++) {
		const c = name.charCodeAt(i);
		if (c >= 65 && c <= 90) {
			hasUpper = true;
			break;
		}
	}
	if (!hasUpper) return name;
	let out = '';
	for (let i = 0; i < name.length; i++) {
		const c = name.charCodeAt(i);
		// Uppercase → `-` + lowercase. A leading uppercase therefore yields the
		// leading dash a vendor prefix needs (`WebkitX` → `-webkit-x`).
		if (c >= 65 && c <= 90) out += '-' + String.fromCharCode(c + 32);
		else out += name[i];
	}
	// React parity: `msFoo` → `ms-foo` (above) → `-ms-foo`.
	if (
		out.charCodeAt(0) === 109 /* m */ &&
		out.charCodeAt(1) === 115 /* s */ &&
		out.charCodeAt(2) === 45
	) {
		out = '-' + out;
	}
	return out;
}

function applyStyleProperty(style: CSSStyleDeclaration, name: string, value: any): void {
	const prop = styleName(name);
	const s = typeof value === 'number' ? String(value) : (value as string);
	// CodeQL flagged the prior `/\s*!important\s*$/` test+replace combo as
	// polynomial-regex-on-uncontrolled-input. Same job in linear time using
	// built-in trimEnd() + endsWith() — no regex, no backtracking risk.
	const tail = s.trimEnd();
	if (tail.endsWith(IMPORTANT_SUFFIX)) {
		style.setProperty(
			prop,
			tail.slice(0, tail.length - IMPORTANT_SUFFIX.length).trimEnd(),
			'important',
		);
	} else {
		style.setProperty(prop, s);
	}
}

// ---------------------------------------------------------------------------
// Spread attributes — `<div {...props}/>`. Iterates the spread object, routes
// each key to the appropriate setter (class / style / onXxx / attr / ref) and
// diffs against the previous spread object so keys that vanished get cleared.
// React 19 shape; only `key`, `ref`, `children` are special-cased.
// ---------------------------------------------------------------------------

function isEventKey(k: string): boolean {
	const c = k.charCodeAt(2);
	return (
		k.length > 2 &&
		k.charCodeAt(0) === 111 /*o*/ &&
		k.charCodeAt(1) === 110 /*n*/ &&
		c >= 65 /*A*/ &&
		c <= 90 /*Z*/
	);
}

export function setSpread(el: Element, value: any, prev: any, mountScope?: Scope): void {
	// `mountScope` is passed only on the mount call (not on updates). When present
	// a spread-supplied ref attach is DEFERRED to commit so a callback ref sees a
	// connected node — same React-19 timing as element/fragment refs. On update
	// the element is already connected, so the ref attaches inline.
	// Remove keys present in prev but absent (or set differently for events) in value.
	if (prev) {
		for (const k in prev) {
			if (k === 'key' || k === 'children') continue;
			if (k === 'ref') {
				// Detach the prior ref when it's removed from the spread or its
				// identity changed (the value loop re-attaches a changed ref).
				// attachRef runs a callback's React-19 cleanup-return (or calls it
				// with null) and clears object/array refs — full parity with a
				// direct `ref={}` binding.
				const nextRef = value ? value.ref : undefined;
				if (prev.ref != null && prev.ref !== nextRef) attachRef(prev.ref, null);
				continue;
			}
			if (value && k in value) continue;
			if (isEventKey(k)) {
				(el as any)['$$' + k.slice(2).toLowerCase()] = null;
			} else if (k === 'class' || k === 'className') {
				el.removeAttribute('class');
			} else if (k === 'style') {
				setStyle(el as HTMLElement, null, prev[k]);
			} else {
				el.removeAttribute(k);
			}
		}
	}
	if (value == null) return;
	for (const k in value) {
		if (k === 'key' || k === 'children') continue;
		const v = value[k];
		const pv = prev ? prev[k] : undefined;
		if (k === 'ref') {
			if (v === pv) continue;
			// Route through attachRef for full parity: callback cleanup-return,
			// object `.current`, and array refs. The prior ref (if any) was already
			// detached in the removal loop above (detach-before-attach). On mount,
			// defer the attach to commit so a callback ref sees a connected node.
			if (mountScope) queueRefAttach(mountScope, () => attachRef(v, el));
			else attachRef(v, el);
			continue;
		}
		if (k === 'class' || k === 'className') {
			if (v === pv) continue;
			if (v == null || v === false) el.removeAttribute('class');
			else el.setAttribute('class', v === true ? '' : String(v));
			continue;
		}
		if (k === 'style') {
			setStyle(el as HTMLElement, v, pv);
			continue;
		}
		if (isEventKey(k)) {
			if (v === pv) continue;
			const evName = k.slice(2).toLowerCase();
			// Lazy-delegate any event we haven't seen — the compiler can't predict
			// event names that arrive dynamically through spread.
			if (!_delegated.has(evName)) delegateEvents([evName]);
			(el as any)['$$' + evName] = v;
			continue;
		}
		if (v === pv) continue;
		setAttribute(el, k, v);
	}
}

// ---------------------------------------------------------------------------
// Component-scoped <style> injection — idempotent, keyed by the compiled
// stylesheet hash so repeated mounts (or HMR re-imports) inject once.
// ---------------------------------------------------------------------------

const _injectedStyles = new Set<string>();

// ---------------------------------------------------------------------------
// Hoisted document metadata (React-19-shape) — `<title>`, `<meta>`, `<link>`
// rendered ANYWHERE in a component are lifted to <document.head> by the compiler
// emitting one `headBlock(scope, key, tag, attrs, text)` call per element
// (instead of placing it in the body template). Because ripple-new re-invokes a
// component body on every render, this call recurs each render: the element is
// created/adopted ONCE (keyed per call-site via `scope[key]`), its attributes
// and text are re-applied each render (so `<title>{state}</title>` is reactive),
// and it is removed from <head> when the owning scope unmounts (so a route swap
// replaces the page's metadata). On a hydrated page the server wrote
// `<!--key-->` + the element into <head> (ssrHeadEl → RenderResult.head →
// <!--ssr-head-->); headBlock ADOPTS that element rather than appending a copy.
// ---------------------------------------------------------------------------

interface HeadSlot {
	el: Element;
}

// Find the server-rendered element for `key` in <head> (it directly follows the
// `<!--key-->` marker), remove the marker so a later mount can't re-match it, and
// return the element. Returns null on a fresh client render (no SSR marker).
function adoptServerHeadEl(key: string): Element | null {
	for (let n: Node | null = document.head.firstChild; n !== null; n = n.nextSibling) {
		if (n.nodeType === 8 && (n as Comment).data === key) {
			let el: Node | null = n.nextSibling;
			while (el !== null && el.nodeType === 3 && /^\s*$/.test((el as Text).data)) {
				el = el.nextSibling;
			}
			(n as Comment).remove();
			return el !== null && el.nodeType === 1 ? (el as Element) : null;
		}
	}
	return null;
}

export function headBlock(
	scope: Scope,
	key: string,
	tag: string,
	attrs: Record<string, any> | null,
	text: unknown,
): void {
	if (typeof document === 'undefined') return;
	let state = (scope as any)[key] as HeadSlot | undefined;
	if (state === undefined) {
		let el = adoptServerHeadEl(key);
		if (el === null) {
			el = document.createElement(tag);
			document.head.appendChild(el);
		}
		state = { el };
		(scope as any)[key] = state;
		// Removed once, on the owning scope's unmount (NOT between re-renders) —
		// scope.cleanups fire only on teardown, mirroring the spread-ref cleanup.
		scope.cleanups.push(() => {
			state!.el.remove();
			(scope as any)[key] = undefined;
		});
	}
	const el = state.el;
	if (attrs !== null) {
		for (const k in attrs) setAttribute(el, k, attrs[k]);
	}
	if (text != null) {
		const t = String(text);
		if (el.textContent !== t) el.textContent = t;
	}
}

export function injectStyle(id: string, css: string): void {
	if (_injectedStyles.has(id)) return;
	// SSR de-dup: the server already emitted this scoped stylesheet (the css of
	// the RenderResult, a `<style data-ripple-new="hash">`). On a hydrated page
	// the per-runtime Set is empty, so also check the DOM before re-injecting —
	// otherwise hydration would append a duplicate <style>.
	if (typeof document !== 'undefined' && document.querySelector(`style[data-ripple-new="${id}"]`)) {
		_injectedStyles.add(id);
		return;
	}
	_injectedStyles.add(id);
	const el = document.createElement('style');
	el.setAttribute('data-ripple-new', id);
	el.textContent = css;
	document.head.appendChild(el);
}

// ---------------------------------------------------------------------------
// Events — top-level delegation. Handlers stored as bare functions or { fn, args } bundles.
// ---------------------------------------------------------------------------

interface HandlerBundle {
	fn: (...args: any[]) => any;
	args: any[];
}
type EventSlot = ((event: Event) => any) | HandlerBundle | null | undefined;

// Delegated event names registered by compiled modules' `delegateEvents([...])`
// calls. Listeners are NOT attached at module-eval time — they're attached to
// each root container when `createRoot` runs, and to each portal target when
// the portal mounts. This matches ReactDOM 17+ behaviour: events scoped to
// the React-owned subtrees, no document-level pollution.
const _delegated = new Set<string>();

// Active delegation targets (createRoot containers + portal targets). A
// portal target may host multiple portals; the refcount tracks how many
// portals are currently rendering into it so we detach only when the last
// one unmounts. createRoot containers have refcount 1 for their lifetime.
const _delegationTargets = new Map<Node, number>();

export function delegateEvents(eventNames: string[]): void {
	for (let i = 0; i < eventNames.length; i++) {
		const name = eventNames[i];
		if (_delegated.has(name)) continue;
		_delegated.add(name);
		// A new event type was registered after some roots/portals already mounted —
		// back-attach the listener to every active target so handlers stamped on
		// their DOM via `el.$$click = …` still receive events.
		for (const target of _delegationTargets.keys()) {
			target.addEventListener(name, dispatchDelegated);
		}
	}
}

/**
 * Register `target` (a createRoot container or a portal target DOM node) as
 * an event-delegation root. Idempotent w.r.t. each call: first registration
 * attaches all known delegated event listeners, subsequent registrations
 * just bump the refcount.
 */
function registerDelegationTarget(target: Node): void {
	const prev = _delegationTargets.get(target) || 0;
	_delegationTargets.set(target, prev + 1);
	if (prev === 0) {
		for (const name of _delegated) {
			target.addEventListener(name, dispatchDelegated);
		}
	}
}

/**
 * Inverse of `registerDelegationTarget`. Last referent detaches all listeners.
 */
function unregisterDelegationTarget(target: Node): void {
	const prev = _delegationTargets.get(target);
	if (!prev) return;
	if (prev === 1) {
		_delegationTargets.delete(target);
		for (const name of _delegated) {
			target.removeEventListener(name, dispatchDelegated);
		}
	} else {
		_delegationTargets.set(target, prev - 1);
	}
}

/**
 * Event types React tags as DiscreteEventPriority. Updates triggered from
 * these handlers MUST commit synchronously before the handler returns to
 * the browser — otherwise:
 *   - fast double-clicks see pre-flush state and double-submit
 *   - autofocus after reveal misses (focus runs before the microtask)
 *   - `e.preventDefault(); setX(...); read(measure)` reads stale layout
 *   - controlled inputs drop keystrokes (value lags one task)
 *
 * Source: facebook/react packages/react-dom-bindings/src/events/
 * ReactDOMEventListener.js — getEventPriority's DiscreteEventPriority arm.
 * Kept verbatim so future React additions can be picked up by diff.
 */
const DISCRETE_EVENTS = new Set<string>([
	'auxclick',
	'beforeblur',
	'beforeinput',
	'blur',
	'cancel',
	'change',
	'click',
	'close',
	'compositionend',
	'compositionstart',
	'compositionupdate',
	'contextmenu',
	'copy',
	'cut',
	'dblclick',
	'dragend',
	'dragstart',
	'drop',
	'focus',
	'focusin',
	'focusout',
	'fullscreenchange',
	'gotpointercapture',
	'hashchange',
	'input',
	'invalid',
	'keydown',
	'keypress',
	'keyup',
	'lostpointercapture',
	'mousedown',
	'mouseup',
	'paste',
	'pause',
	'play',
	'pointercancel',
	'pointerdown',
	'pointerup',
	'popstate',
	'ratechange',
	'reset',
	'resize',
	'seeked',
	'select',
	'selectionchange',
	'selectstart',
	'submit',
	'textInput',
	'touchcancel',
	'touchend',
	'touchstart',
	'volumechange',
]);

/**
 * Re-entrancy depth for dispatchDelegated. Only the outermost dispatch flushes
 * — nested handlers (e.g. a click handler that synthetically dispatches another
 * event on the same target chain) inherit the outer flush instead of producing
 * intermediate commits that React wouldn't.
 */
let _dispatchDepth = 0;

function dispatchDelegated(event: Event): void {
	const key = '$$' + event.type;
	const isDiscrete = DISCRETE_EVENTS.has(event.type);
	_dispatchDepth++;
	let node = event.target as any;
	try {
		while (node !== null && node !== undefined) {
			const slot = node[key] as EventSlot;
			if (slot) {
				if (typeof slot === 'function') {
					slot(event);
				} else {
					// bundle: fn(...args, event)
					const a = slot.args;
					switch (a.length) {
						case 0:
							slot.fn(event);
							break;
						case 1:
							slot.fn(a[0], event);
							break;
						case 2:
							slot.fn(a[0], a[1], event);
							break;
						default:
							slot.fn.apply(null, a.concat(event));
					}
				}
				if (event.cancelBubble) return;
			}
			// Portal-aware ascent: when crossing a portal root, jump to the rendering Block's DOM parent.
			if (node.$$portalParent) {
				node = node.$$portalParent;
			} else {
				node = node.parentNode;
			}
		}
	} finally {
		_dispatchDepth--;
		// React parity: discrete events (click, keydown, input, …) must commit
		// before the browser regains control — otherwise fast double-clicks,
		// focus-after-reveal, e.preventDefault+setState+measure patterns and
		// controlled-input value reads all see stale state. Only the OUTERMOST
		// dispatch flushes — nested synthetic dispatches inherit the outer
		// commit window. Non-discrete events (scroll, mousemove, …) keep
		// microtask-batched semantics so they don't thrash the scheduler.
		if (isDiscrete && _dispatchDepth === 0 && hasPendingWork()) {
			flushSync(noop);
		}
	}
}

function noop(): void {}

// ---------------------------------------------------------------------------
// React 19 Actions — <form action={fn}>, useActionState, useFormStatus,
// useOptimistic. A function passed to a form/button action intercepts native
// submit, builds FormData, and runs the action inside a transition. Submission
// status is published per-form so a descendant useFormStatus() can read it.
// ---------------------------------------------------------------------------

export interface FormStatus {
	pending: boolean;
	data: FormData | null;
	method: string;
	action: ((formData: FormData) => unknown) | string | null;
}
const IDLE_FORM_STATUS: FormStatus = { pending: false, data: null, method: 'get', action: null };

// Per-form current submission status + the descendant useFormStatus subscribers.
const FORM_STATUS = new WeakMap<HTMLFormElement, FormStatus>();
const FORM_STATUS_LISTENERS = new WeakMap<HTMLFormElement, Set<() => void>>();

function setFormStatus(form: HTMLFormElement, status: FormStatus): void {
	FORM_STATUS.set(form, status);
	const ls = FORM_STATUS_LISTENERS.get(form);
	if (ls) for (const l of ls) l();
}

/**
 * Compiler-emitted binding for `<form action={fn}>` / `<button formAction={fn}>`.
 * A FUNCTION value wires submit interception (stored on the element as
 * `$$formAction`, with the form gaining a delegated `$$submit` handler once);
 * a string/null value falls back to the native attribute so ordinary form posts
 * still work. `prev` lets the update path clean up when switching function→string.
 */
export function setFormAction(
	el: HTMLFormElement | HTMLButtonElement | HTMLInputElement,
	name: string,
	value: unknown,
	prev: unknown,
): void {
	if (typeof value === 'function') {
		(el as any).$$formAction = value;
		if (el.nodeName === 'FORM') {
			if (!(el as any).$$formSubmitWired) {
				(el as any).$$formSubmitWired = true;
				(el as any).$$submit = (event: Event) => handleFormSubmit(el as HTMLFormElement, event);
				delegateEvents(['submit']);
			}
		}
		// A function action implies a non-native submit; drop any stale attribute.
		el.removeAttribute(name);
		return;
	}
	// Non-function (string/null): native behavior. Clear any prior handler.
	(el as any).$$formAction = undefined;
	if (typeof prev === 'function' && el.nodeName === 'FORM') {
		(el as any).$$submit = undefined;
	}
	setAttribute(el, name, value);
}

function handleFormSubmit(form: HTMLFormElement, event: Event): void {
	// A `<button formAction>` / `<input type=submit formAction>` submitter
	// overrides the form-level action (React parity).
	const submitter = (event as SubmitEvent).submitter as HTMLElement | null;
	const action =
		(submitter && (submitter as any).$$formAction) || ((form as any).$$formAction as unknown);
	if (typeof action !== 'function') return; // native submit / no function action
	event.preventDefault();

	const data = new FormData(form);
	// Include the activating submitter's name/value (FormData(form, submitter)
	// isn't universally available; append manually for parity).
	if (submitter && (submitter as HTMLInputElement).name) {
		data.append((submitter as HTMLInputElement).name, (submitter as HTMLInputElement).value ?? '');
	}

	const fn = action as (formData: FormData) => unknown;
	// Track in-flight submissions per form. A useActionState dispatcher returns a
	// promise that resolves when THAT dispatch's action finishes — not when the
	// whole sequential queue drains — so a rapid second submit must NOT flip the
	// form's status to idle while a later queued action is still running. Only
	// clear when the count returns to 0.
	const fa = form as any;
	fa.$$pendingSubmits = (fa.$$pendingSubmits || 0) + 1;
	setFormStatus(form, { pending: true, data, method: 'post', action: fn });

	// useActionState dispatchers self-wrap in a transition AND keep typed-in
	// values (no auto-reset); a raw action function is wrapped here and its form
	// is reset on success.
	const isDispatcher = (fn as any).$$isActionDispatcher === true;

	const settle = (ok: boolean) => {
		fa.$$pendingSubmits = Math.max(0, (fa.$$pendingSubmits || 1) - 1);
		if (fa.$$pendingSubmits === 0) setFormStatus(form, IDLE_FORM_STATUS);
		// React resets a plain <form action={fn}>'s uncontrolled fields on success;
		// useActionState-driven forms keep their values. form.reset() restores
		// uncontrolled inputs to defaultValue; controlled inputs are re-applied by
		// the next render's value bindings.
		if (ok && !isDispatcher) {
			try {
				form.reset();
			} catch {
				/* jsdom/detached form */
			}
		}
	};

	let result: unknown;
	try {
		if (isDispatcher) {
			result = fn(data);
		} else {
			startTransition(() => {
				result = fn(data);
				return result as void | Promise<unknown>;
			});
		}
	} catch (err) {
		// A SYNCHRONOUS throw from the action (or a startTransition rethrow) would
		// otherwise skip the settle wiring below, leaving the form's status stuck
		// on `pending`. Clear it, then report — an error thrown inside a DOM submit
		// handler has no meaningful propagation target (mirrors the runtime's
		// effect-error handling: recover + console.error).
		settle(false);
		console.error(err);
		return;
	}
	Promise.resolve(result).then(
		() => settle(true),
		() => settle(false),
	);
}

// ---------------------------------------------------------------------------
// Portals — createPortal renders into a foreign DOM target while staying
// part of the React-tree for context / unmount / event delegation.
// ---------------------------------------------------------------------------

interface PortalSlot {
	__kind: 'portalSlotSlot';
	block: Block | null;
	target: Element | null;
	start: Comment | null;
	end: Comment | null;
}

/**
 * Mount `body` into `target` (a foreign DOM element), as a child of the
 * current Block in the Block tree. Re-rendering the enclosing Block re-runs
 * the portal body in place. Unmounting the enclosing Block tears the portal
 * down and removes its DOM from `target`.
 */
export function portal(
	parentScope: Scope,
	slotKey: string,
	target: Element,
	body: ComponentBody,
	props: any,
	host?: Node,
): void {
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as PortalSlot | undefined;
	if (state === undefined) {
		const start = document.createComment('portal');
		const end = document.createComment('/portal');
		target.appendChild(start);
		target.appendChild(end);
		const block = createBlock('portal', parentBlock, target, start, end, body, props);
		state = { __kind: 'portalSlotSlot', block, target, start, end };
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
		// Portal target hosts handlers stamped via the same `el.$$click = …`
		// mechanism as the main tree, so it needs the delegated event listeners
		// too. Refcounted: a target hosting two portals attaches once, detaches
		// when the last portal unmounts (see unmountBlock).
		registerDelegationTarget(target);
		renderBlock(block);
	} else {
		state.block!.body = body;
		state.block!.props = props;
		renderBlock(state.block!);
	}
	// Stamp `$$portalParent` on every direct child the portal placed between
	// its start/end markers. The dispatcher reads this when bubbling up: on
	// reaching a stamped node it jumps to the logical parent's DOM context
	// instead of continuing into the portal target's natural ancestors. This
	// mirrors React's per-fiber portal walk so a click inside a modal bubbles
	// up through the React tree, not just the document.body subtree.
	//
	// `host` (passed by the compiler) is the JSX element that contains the
	// createPortal call — the natural "logical parent" for event bubbling.
	// When the portal is at top level (no enclosing element) the compiler
	// passes the enclosing block's parentNode instead.
	const logicalParent = host || parentBlock.parentNode;
	let n: ChildNode | null = state.start!.nextSibling;
	while (n !== null && n !== state.end) {
		(n as any).$$portalParent = logicalParent;
		n = n.nextSibling;
	}
}

/**
 * ReactDOM-shape `createPortal(children, target, props?)`. The compiler
 * recognises `{createPortal(...)}` at JSX child position and lowers it to a
 * direct `portal(...)` runtime call — no descriptor allocation on the hot
 * path. This function exists so the call shape matches ReactDOM exactly and
 * so non-JSX call sites (storing in a variable, passing through props, etc.)
 * still produce something the runtime can dispatch on.
 */
const PORTAL_TAG = Symbol.for('ripple-new.portal');
export interface PortalDescriptor {
	$$kind: typeof PORTAL_TAG;
	body: ComponentBody;
	target: Element;
	props: any;
}
export function createPortal(
	body: ComponentBody,
	target: Element,
	props: any = undefined,
): PortalDescriptor {
	return { $$kind: PORTAL_TAG, body, target, props };
}

// ---------------------------------------------------------------------------
// Element descriptor — `createElement(Comp, props)`. The compiler lowers a JSX
// component element used at VALUE position (e.g. `root.render(<App foo={x}/>)`)
// to this call, so JSX-as-a-value matches React's `root.render(<App/>)` shape.
// It is a plain { type, props } record (like a ReactElement). `root.render`
// unwraps it; props are evaluated fresh at each call site, so re-rendering with
// `root.render(<App foo={next}/>)` updates props while keeping `type` identity.
// ---------------------------------------------------------------------------
const ELEMENT_TAG = Symbol.for('ripple-new.element');
export interface ElementDescriptor<P = any> {
	$$kind: typeof ELEMENT_TAG;
	type: ComponentBody<P>;
	props: P;
}
export function createElement<P>(type: ComponentBody<P>, props?: P): ElementDescriptor<P> {
	return { $$kind: ELEMENT_TAG, type, props: (props ?? {}) as P };
}
function isElementDescriptor(v: any): v is ElementDescriptor {
	return v != null && v.$$kind === ELEMENT_TAG;
}

// ---------------------------------------------------------------------------
// Component slot — JSX `<Foo>` / `<ctx.Provider>` invocation as a Block
// ---------------------------------------------------------------------------

interface CompSlot {
	__kind: 'componentSlotSlot';
	start: Comment;
	end: Comment;
	block: Block | null;
	currentComp: ComponentBody | null;
	// Last-render `key` value. Sentinel `NO_KEY` when the slot was created
	// without a key arg, or when the prior render didn't supply one — so a
	// first render with `key=undefined` followed by a subsequent render with
	// `key=undefined` doesn't spuriously remount. Compared with Object.is so
	// NaN keys are stable and 0 / -0 are distinguished.
	prevKey: any;
}

const NO_KEY: unique symbol = Symbol('NO_KEY');

/**
 * Mount/update a component invoked from JSX. Each invocation creates a Block
 * (so hooks/effects are scoped properly). If the component identity changes
 * across renders (dynamic-component / element-type swap), the old Block is
 * torn down and a fresh one mounted in its place. When a `key` arg is
 * supplied and changes between renders (Object.is compare), the slot also
 * tears down + remounts — matches React's key-driven identity reset: useState
 * resets, useEffect cleanups fire, refs null out, the subtree gets a fresh
 * Block with a fresh hook bag.
 */
export function componentSlot(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	comp: ComponentBody,
	props: any,
	anchor?: Node | null,
	key?: any,
): void {
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as CompSlot | undefined;
	if (state === undefined) {
		let start: Comment;
		let end: Comment;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration: the server wrapped this component's output in a
			// `<!--[-->…<!--]-->` range (anchor resolved to the `<!--[-->`). Adopt
			// those comments as our markers and point the cursor at the first
			// content node so the child's clone() adopts the server DOM.
			start = anchor as Comment;
			end = matchingClose(anchor as Node);
			hydrateNode = start.nextSibling;
		} else {
			start = document.createComment('comp');
			end = document.createComment('/comp');
			// insertBefore(_, null) === appendChild — covers both end-of-parent and
			// mid-range insertion (e.g. when this slot lives in a multi-root template
			// and must sit before its enclosing block's endMarker).
			domParent.insertBefore(start, anchor ?? null);
			domParent.insertBefore(end, anchor ?? null);
		}
		state = {
			__kind: 'componentSlotSlot',
			start,
			end,
			block: null,
			currentComp: null,
			prevKey: NO_KEY,
		};
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
	}
	// Key-driven remount: when the compiler emitted a key arg AND its value
	// changed since last render, force `comp !== state.currentComp` semantics
	// even if the component identity is unchanged. Null out currentComp so the
	// existing tear-down branch below fires; prevKey is updated after so we
	// don't loop on the same key. `key === undefined` means "no key this
	// render" and is a no-op so React-style optional-key callers don't pay.
	if (key !== undefined && state.prevKey !== NO_KEY && !Object.is(key, state.prevKey)) {
		state.currentComp = null;
	}
	state.prevKey = key === undefined ? NO_KEY : key;
	if (comp !== state.currentComp) {
		if (state.block) {
			// The slot's `state.start`/`state.end` markers ARE the previous block's
			// range, so unmountBlock removes them along with the inner DOM. Capture
			// the position just outside the slot (the node that came AFTER our end
			// marker) so we can re-create fresh markers at the same logical
			// location for the new comp to mount into. `after` may be `null` when
			// the slot was at the end of `domParent` — that's fine; insertBefore
			// treats null as appendChild.
			const after = state.end.nextSibling;
			unmountBlock(state.block);
			const newStart = document.createComment('comp');
			const newEnd = document.createComment('/comp');
			domParent.insertBefore(newStart, after);
			domParent.insertBefore(newEnd, after);
			state.start = newStart;
			state.end = newEnd;
		}
		state.currentComp = comp;
		const b = createBlock('dynamic', parentBlock, domParent, state.start, state.end, comp, props);
		state.block = b;
		renderBlock(b);
	} else if (state.block) {
		// `memo(Component)` — skip the body when new props shallow-equal the
		// committed props. Matches React.memo's contract; the wrapped fn carries
		// the `__memo: true` marker the wrapper installs.
		if ((comp as any).__memo === true && !ctxDepsChanged(state.block)) {
			const compare = (comp as any).__compare as ((prev: any, next: any) => boolean) | undefined;
			// React.memo's optional comparator: returns true when props are equal
			// (→ skip the render). Falls back to a shallow Object.is comparison.
			const equal = compare
				? compare(state.block.props, props)
				: shallowEqualProps(state.block.props, props);
			if (equal) {
				// Keep the committed props identity — diffing against them next time
				// is what makes the memo terminate.
				return;
			}
		}
		state.block.props = props;
		renderBlock(state.block);
	}
}

// ---------------------------------------------------------------------------
// Renderable expression hole — `{expr}` (no string cast) as element content
// ---------------------------------------------------------------------------
//
// `{x as string}` (and string literals / template literals) compile to the fast
// text binding (`htext`/`setText`). A bare `{x}` is a RENDERABLE hole, matching
// Ripple: it renders a component/children-function or an element descriptor,
// and coerces a primitive to text. The compiler routes these through a compCall
// entry tagged `isChild`, emitting `childSlot(...)` instead of `componentSlot`.
//
// childSlot owns ONE `<!--[-->`/`<!--]-->` marker pair (the same shape the
// server emits via `ssrBlock`/`ssrComponent` for every renderable hole, so
// hydration alignment is uniform whether the value is a component or a
// primitive). Between the markers it holds EITHER a Block (function /
// ElementDescriptor) or a single Text node (primitive). A value whose mode
// flips across renders tears the old content down — cleanups fire, content
// nodes are removed — and rebuilds in place, keeping the markers.

interface ChildSlot {
	__kind: 'childSlot';
	start: Comment;
	end: Comment;
	block: Block | null;
	text: Text | null;
	currentComp: ComponentBody | null;
}

// `true`/`false`/`null`/`undefined` render as empty (React parity); everything
// else stringifies. Text-node `.data` is literal, so no HTML escaping here (that
// is only the server's concern, where output is serialized into markup).
function coerceChildText(v: unknown): string {
	return v == null || v === false || v === true ? '' : String(v);
}

// Remove the slot's current content (Block or Text) while preserving its marker
// pair, so a mode switch (or component-identity swap) rebuilds in place.
function clearChildContent(state: ChildSlot): void {
	if (state.block !== null) {
		// Fire the subtree's cleanups but DON'T let unmountBlock strip the DOM —
		// it would take our markers with it. We remove the content nodes by hand.
		unmountBlock(state.block, false);
		state.block = null;
	}
	const parent = state.start.parentNode;
	if (parent !== null) {
		let n: Node | null = state.start.nextSibling;
		while (n !== null && n !== state.end) {
			const next: Node | null = n.nextSibling;
			parent.removeChild(n);
			n = next;
		}
	}
	state.text = null;
	state.currentComp = null;
}

export function childSlot(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	value: unknown,
	anchor?: Node | null,
): void {
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as ChildSlot | undefined;
	if (state === undefined) {
		let start: Comment;
		let end: Comment;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration (nested hole): the anchor resolved via child/sibling to the
			// server's `<!--[-->`. Adopt that `<!--[-->…<!--]-->` range as our markers
			// and point the cursor at the first content node for the Block's clone()
			// / the text adopt below.
			start = anchor as Comment;
			end = matchingClose(anchor as Node);
			hydrateNode = start.nextSibling;
		} else if (hydrating && isBlockOpen(hydrateNode)) {
			// Hydration (sole top-level hole, e.g. a layout `<>{children}…</>`): the
			// anchor is the block's end-marker (not a `<!--[-->`), but the CURSOR sits
			// on the server's range-open. Adopt from the cursor. This is what lets a
			// component whose only body root is `{children}` hydrate as single-root.
			start = hydrateNode as Comment;
			end = matchingClose(hydrateNode as Node);
			hydrateNode = start.nextSibling;
		} else {
			start = document.createComment('');
			end = document.createComment('');
			domParent.insertBefore(start, anchor ?? null);
			domParent.insertBefore(end, anchor ?? null);
		}
		state = { __kind: 'childSlot', start, end, block: null, text: null, currentComp: null };
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
	}

	// Classify: function → ComponentBody (empty props, e.g. a `{children}`
	// render-fn); ElementDescriptor → its `type` + carried props; anything else
	// → text/empty.
	let comp: ComponentBody | null = null;
	let props: any = {};
	if (typeof value === 'function') {
		comp = value as ComponentBody;
	} else if (isElementDescriptor(value)) {
		comp = value.type as ComponentBody;
		props = value.props;
	}

	if (comp !== null) {
		if (state.block !== null && comp === state.currentComp) {
			// Same component identity → update in place (matches componentSlot).
			state.block.props = props;
			renderBlock(state.block);
			return;
		}
		// New component (first render, or identity swap from text / another comp).
		clearChildContent(state);
		state.currentComp = comp;
		const b = createBlock('dynamic', parentBlock, domParent, state.start, state.end, comp, props);
		state.block = b;
		renderBlock(b);
		return;
	}

	// Text / empty.
	if (state.block !== null) clearChildContent(state); // swapped away from a component
	const str = coerceChildText(value);
	if (str === '') {
		// `null` / `undefined` / `false` / `true` / `''` render NOTHING — not even
		// an empty text node — matching React/Ripple. The server emits an empty
		// `<!--[--><!--]-->` range for these, so the marker pair stays content-less
		// on both sides. Drop a text node left over from a prior non-empty render.
		if (state.text !== null) {
			state.text.remove();
			state.text = null;
		}
		return;
	}
	if (state.text !== null) {
		if (state.text.data !== str) state.text.data = str;
		return;
	}
	if (hydrating) {
		// Adopt the server text sitting between our adopted markers. (An empty hole
		// has no text node, but `str !== ''` here means the server emitted one.)
		const n = hydrateNode;
		if (n !== null && n !== state.end && n.nodeType === 3) {
			state.text = n as Text;
			hydrateNode = n.nextSibling;
			if ((n as Text).data !== str) (n as Text).data = str;
			return;
		}
	}
	const tn = document.createTextNode(str);
	domParent.insertBefore(tn, state.end);
	state.text = tn;
}

// True if any context the block read last render has since changed value
// (its Provider bumped the version). When so, a memo bailout must NOT skip —
// the block (or a consumer in its subtree) needs the new context value.
function ctxDepsChanged(block: Block): boolean {
	const reads = block.$$ctxReads;
	if (reads === null) return false;
	for (const [ctx, version] of reads) {
		if (ctx.$$version !== version) return true;
	}
	return false;
}

function shallowEqualProps(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	const ka = Object.keys(a),
		kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (let i = 0; i < ka.length; i++) {
		const k = ka[i];
		// React uses Object.is (not ===) so NaN props compare equal and ±0 differ.
		if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false;
	}
	return true;
}

/**
 * `memo(Component)` — React-shape HOC. Returns a wrapper component that
 * skips its body when the incoming props are shallow-equal to the committed
 * ones. Children inside the wrapped body still mount/update normally on the
 * first render and any non-skip render. Pair with `useCallback` /
 * `useMemo` on the parent so handler + computed prop refs stay stable across
 * renders that don't conceptually change the child's view.
 *
 * An optional `arePropsEqual(prevProps, nextProps)` comparator mirrors
 * React.memo's second argument: return `true` to skip the render (props are
 * "equal"), `false` to re-render. When omitted, a shallow Object.is comparison
 * of own enumerable keys is used.
 */
export function memo<P>(
	component: ComponentBody<P>,
	arePropsEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): ComponentBody<P> {
	function memoWrapper(scope: Scope, props: P, extra: any): void {
		component(scope, props, extra);
	}
	(memoWrapper as any).__memo = true;
	if (arePropsEqual) (memoWrapper as any).__compare = arePropsEqual;
	return memoWrapper as ComponentBody<P>;
}

// ---------------------------------------------------------------------------
// HMR — hot-module-replacement wrapper for exported components
// ---------------------------------------------------------------------------
//
// The compiler emits `MyComp = hmr(MyComp);` after each exported component
// when its `hmr` option is on, plus an `import.meta.hot.accept(...)` block
// that calls `MyComp[HMR].update(module.MyComp)` when the source file is
// edited at dev time. The wrapper:
//
//   1. Defers to the current `fn` on every call — invocations route through
//      `wrapper[HMR].fn` so `update()` can replace it.
//   2. Tracks every live Block currently using this wrapper (keyed weakly via
//      a Set so reload-races don't leak). On `update(newFn)` we mutate each
//      block's `body` to point at the new fn and re-render — hook state is
//      preserved because the compiler emits `Symbol.for(stableId)` for hook
//      slots (re-imports get the same Symbol identity, so the existing
//      hooks Map continues to work).
//   3. Marks the wrapper IDENTITY-stable: HMR wrappers `Foo` and `Foo` (post-
//      reload) are the same wrapper, so `componentSlot`'s identity check
//      (`comp !== state.currentComp`) doesn't tear down on every edit.
//
// `HMR` is exported as a Symbol so user code (and the compiler emit) can
// read `wrapper[HMR]` without colliding with anything else on the function.

export const HMR: unique symbol = Symbol.for('ripple-new.hmr');

interface HmrMeta {
	fn: ComponentBody<any>;
	liveBlocks: Set<Block>;
	update(incoming: ComponentBody<any>): void;
}

type HmrWrapper = ComponentBody<any> & { [HMR]: HmrMeta };

export function hmr<P>(fn: ComponentBody<P>): ComponentBody<P> {
	const meta: HmrMeta = {
		fn,
		liveBlocks: new Set(),
		update(incoming: ComponentBody<any>): void {
			// The incoming function is the freshly-recompiled component body. If
			// the incoming function is itself an HMR wrapper (which it will be when
			// the new module re-runs `Comp = hmr(Comp)`), unwrap it down to the
			// raw fn — otherwise we'd nest wrappers on each edit.
			const incomingMeta = (incoming as any)[HMR] as HmrMeta | undefined;
			meta.fn = incomingMeta ? incomingMeta.fn : incoming;
			// Mutate every live block's body in place and schedule a re-render.
			// The hook map persists (stable Symbol.for-based keys), so useState/
			// useEffect/etc. pick up their existing slots on the next render.
			const it = meta.liveBlocks.values();
			for (let r = it.next(); !r.done; r = it.next()) {
				const b = r.value;
				if (b.disposed) {
					meta.liveBlocks.delete(b);
					continue;
				}
				b.body = wrapper as unknown as ComponentBody<any>;
				scheduleRender(b);
			}
		},
	};
	function wrapper(scope: Scope, props: P, extra: any): void {
		const block = scope.block;
		// Register on first call; cleared lazily during update() if disposed.
		meta.liveBlocks.add(block);
		meta.fn(scope, props as any, extra);
	}
	(wrapper as HmrWrapper)[HMR] = meta;
	return wrapper as ComponentBody<P>;
}

// ---------------------------------------------------------------------------
// Control flow: tryBlock — error boundary, catches render + effect errors
// ---------------------------------------------------------------------------

/**
 * Transition-suspense fallback timeout — when a transition-priority render
 * suspends on an already-committed try block, we hold the prior DOM but
 * eventually swap to the @pending fallback after this many milliseconds if
 * the promise still hasn't resolved. Matches React's "eventually shows
 * fallback if transition takes too long" contract (default 5s).
 *
 * Configurable globally via `setTransitionFallbackTimeout(ms)`. Pass
 * Infinity to disable the fallback entirely (keep prior DOM indefinitely).
 */
let TRANSITION_FALLBACK_TIMEOUT_MS = 5000;

export function setTransitionFallbackTimeout(ms: number): void {
	TRANSITION_FALLBACK_TIMEOUT_MS = ms;
}

export function getTransitionFallbackTimeout(): number {
	return TRANSITION_FALLBACK_TIMEOUT_MS;
}

interface TrySlot {
	__kind: 'trySlotSlot';
	start: Comment;
	end: Comment;
	// -1 init, 0 catch, 1 try (resolved), 2 pending
	branch: -1 | 0 | 1 | 2;
	/**
	 * Currently-visible block (try body, pending fallback, or catch body).
	 * NOT necessarily the same as `tryBlock` — when pending is shown, `block`
	 * is the pending block and `tryBlock` is preserved off-screen.
	 */
	block: Block | null;
	/**
	 * Persistent try-body block. Survives suspend/resume cycles so its
	 * `scope.hooks` (useState/useMemo/useRef state) replays just like React's
	 * WIP-fiber-discard-but-keep-memoizedState contract. Cleared by `catch`
	 * and by `reset()` since those are explicit fresh starts.
	 */
	tryBlock: Block | null;
	/** DOM nodes (incl. markers) detached during suspend; reinserted on resume. */
	savedDom: Node[] | null;
	tryBody: ComponentBody;
	catchBody: ComponentBody | null;
	pendingBody: ComponentBody | null;
	/** Has the try body ever rendered to completion? Diagnostic only. */
	hasResolved: boolean;
	err: any;
	/** The thenable we're currently waiting on (so duplicate listeners don't fire). */
	pendingThenable: TrackedThenable<any> | null;
	/**
	 * True if a transition-priority render suspended on this try block AND we
	 * incremented TRANSITION_PENDING_COUNT to keep useTransition's isPending
	 * latched true. Released when the suspended thenable resolves (in retry).
	 */
	transitionHeld: boolean;
	/**
	 * Pending setTimeout id for the transition-suspense fallback. When a
	 * transition-priority render suspends on an already-committed try block
	 * we hold the prior DOM AND schedule a fallback swap so the user isn't
	 * stuck with stale content forever. Matches React's "eventually shows
	 * fallback" contract — see TRANSITION_FALLBACK_TIMEOUT_MS below.
	 *
	 * Cleared (clearTimeout) on retry resolve, on switchToCatch, and on
	 * scope teardown so we don't leak callbacks past the slot's lifetime.
	 */
	transitionTimeoutId: any | null;
	domParent: Node;
	parentBlock: Block;
}

export function tryBlock(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	tryBody: ComponentBody,
	catchBody: ComponentBody | null,
	pendingBody: ComponentBody | null,
	anchor?: Node | null,
): void {
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as TrySlot | undefined;
	if (state === undefined) {
		let start: Comment;
		let end: Comment;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration: the server (Phase 4) awaited use() and wrapped the resolved
			// SUCCESS arm (or @catch arm) in a `<!--[-->…<!--]-->` range. Adopt it as
			// the slot; mountTry brackets the content and the seeded use() values
			// (hydrationSeeds) let the try body render its success arm synchronously.
			start = anchor as Comment;
			end = matchingClose(anchor as Node);
		} else {
			start = document.createComment('try');
			end = document.createComment('/try');
			// insertBefore(_, null) === appendChild — covers both end-of-parent and
			// mid-range insertion (e.g. when this slot lives in a mixed-children
			// template and must sit before its in-template static-sibling anchor).
			domParent.insertBefore(start, anchor ?? null);
			domParent.insertBefore(end, anchor ?? null);
		}
		const newState: TrySlot = {
			__kind: 'trySlotSlot',
			start,
			end,
			branch: -1,
			block: null,
			tryBlock: null,
			savedDom: null,
			tryBody,
			catchBody,
			pendingBody,
			hasResolved: false,
			err: null,
			pendingThenable: null,
			transitionHeld: false,
			transitionTimeoutId: null,
			domParent,
			parentBlock,
		};
		parentScope[slotKey] = newState;
		registerSlot(parentScope, newState);
		state = newState;
	} else {
		state.tryBody = tryBody;
		state.catchBody = catchBody;
		state.pendingBody = pendingBody;
	}
	const s = state;
	if (s.branch === 0) {
		// Already showing catch — re-render with current err (props identity unchanged).
		s.block!.body = s.catchBody!;
		s.block!.props = { err: s.err, reset: () => requestReset(s) };
		renderBlock(s.block!);
	} else if (s.branch === 2) {
		// Already pending — no work; will be swapped when thenable resolves.
	} else if (s.branch === 1 && s.tryBlock) {
		// Try body is currently visible — re-render in place so we don't tear
		// down its DOM. If the re-render suspends, handleSuspense decides
		// whether to preserve the DOM (keep) or swap to pending (default).
		s.tryBlock.body = s.tryBody;
		try {
			renderBlock(s.tryBlock);
			// Successful commit — this supersedes any in-flight transition
			// suspended on this slot. Release the held transition counter and
			// invalidate the pending retry so the eventual .then callback no-ops.
			// Matches React's "urgent setState while transition is suspended
			// discards the transition" semantics (ReactUse-test.js:1631).
			releaseHeldTransition(s);
			s.pendingThenable = null;
		} catch (err) {
			if (isSuspenseException(err)) handleSuspense(s, err.thenable, s.tryBlock);
			else switchToCatch(s, err);
		}
	} else if (s.tryBlock && s.savedDom) {
		// Pending is visible AND we have a preserved try block — re-render it
		// (it'll throw again at the same use() since the promise hasn't
		// resolved). This entry point is hit when the surrounding component
		// re-renders for an unrelated reason while we're suspended.
		s.tryBlock.body = s.tryBody;
		try {
			renderBlock(s.tryBlock);
		} catch {
			/* expected: still pending; handled by attachResume */
		}
	} else {
		mountTry(s);
	}
}

function mountTry(state: TrySlot): void {
	// Fresh start. If there's leftover state from a prior cycle (e.g. after
	// catch reset), clear it first.
	if (state.tryBlock) {
		unmountBlock(state.tryBlock);
		state.tryBlock = null;
	}
	if (state.block && state.block !== state.tryBlock) {
		unmountBlock(state.block);
		state.block = null;
	}
	state.savedDom = null;
	state.hasResolved = false;
	state.branch = 1;
	let bStart: Node;
	let bEnd: Node;
	if (hydrating && isBlockOpen(state.start.nextSibling)) {
		// ADOPT the server's inner arm range (no inserted markers — byte-for-byte;
		// see ifBlock). The seeded use() values let the try body render its success
		// arm and adopt the server DOM.
		bStart = state.start.nextSibling as Comment;
		bEnd = matchingClose(bStart);
		hydrateNode = bStart.nextSibling;
	} else {
		bStart = document.createComment('try-b');
		bEnd = document.createComment('/try-b');
		state.domParent.insertBefore(bStart, state.end);
		state.domParent.insertBefore(bEnd, state.end);
	}
	const b = createBlock(
		'control-flow',
		state.parentBlock,
		state.domParent,
		bStart,
		bEnd,
		state.tryBody,
		undefined,
	);
	(b as any).__trySlot = state;
	// Register handlers so descendant effect/render errors can find us.
	(b as any).$$tryHandler = (err: any) => switchToCatch(state, err);
	(b as any).__suspenseHandler = (thenable: TrackedThenable<any>, sourceBlock: Block) => {
		handleSuspense(state, thenable, sourceBlock);
	};
	state.tryBlock = b;
	state.block = b;
	try {
		renderBlock(b);
		state.hasResolved = true;
	} catch (err) {
		if (isSuspenseException(err)) {
			handleSuspense(state, err.thenable, b);
		} else {
			if (state.tryBlock) {
				unmountBlock(state.tryBlock);
				state.tryBlock = null;
				state.block = null;
			}
			switchToCatch(state, err);
		}
	}
}

/**
 * Detach the try block's DOM range from the document, saving the nodes for
 * later reinsertion. Crucially: does NOT unmount the block, run cleanups, or
 * clear `_b.*` bindings — so `useState`/`useMemo`/`useRef` state AND the
 * `_b._el$N` DOM-node references survive intact (the same DOM nodes will
 * be reinserted into the same parent on resume, so the references stay valid).
 * Mirrors React's "WIP-fiber-discarded-but-committed-state-preserved" contract.
 */
function softDetachTryBlock(state: TrySlot): void {
	if (!state.tryBlock || state.savedDom) return;
	const saved: Node[] = [];
	const start = state.tryBlock.startMarker!;
	const end = state.tryBlock.endMarker!;
	const parent = start.parentNode!;
	let n: Node | null = start;
	while (n) {
		const next: Node | null = n.nextSibling;
		saved.push(n);
		parent.removeChild(n);
		if (n === end) break;
		n = next;
	}
	state.savedDom = saved;
}

function reattachTryBlock(state: TrySlot): void {
	if (!state.savedDom) return;
	for (const n of state.savedDom) state.domParent.insertBefore(n, state.end);
	state.savedDom = null;
}

/**
 * Decrement the transition counter we held open during a suspended transition.
 * Called from any path where the transition is now resolved or superseded.
 * No-op if no hold is currently held.
 */
function releaseHeldTransition(state: TrySlot): void {
	if (state.transitionHeld) {
		state.transitionHeld = false;
		tickTransitionCount(-1);
	}
	// Drop the fallback timeout too — an urgent setState clobbered the
	// transition, so the prior DOM is being replaced eagerly and a timeout-
	// driven @pending swap would race with the urgent commit.
	if (state.transitionTimeoutId !== null) {
		clearTimeout(state.transitionTimeoutId);
		state.transitionTimeoutId = null;
	}
}

function handleSuspense(state: TrySlot, thenable: TrackedThenable<any>, sourceBlock: Block): void {
	// Transition-priority suspends on an ALREADY-committed try block keep the
	// prior DOM visible — matches React's `useTransition` contract that the
	// previous screen stays mounted until the new tree is fully ready. We also
	// hold the transition counter open until the suspended render resumes, so
	// `useTransition`'s isPending stays true the whole time.
	const isTransition = sourceBlock.currentRenderMode === 'transition';
	if (isTransition && state.hasResolved && sourceBlock === state.tryBlock) {
		if (!state.transitionHeld) {
			state.transitionHeld = true;
			tickTransitionCount(+1);
		}
		// Schedule a fallback swap so the user isn't stuck forever staring at
		// stale content when the transition's promise takes too long. The
		// counter stays held — `isPending` remains true through the fallback
		// window because the transition is still in progress, semantically. On
		// retry resolve, the timeout is cleared and the saved tryBlock is
		// re-attached. Infinity → fallback never fires (legacy hold-forever).
		if (
			state.pendingBody !== null &&
			state.transitionTimeoutId === null &&
			TRANSITION_FALLBACK_TIMEOUT_MS !== Infinity &&
			TRANSITION_FALLBACK_TIMEOUT_MS >= 0
		) {
			state.transitionTimeoutId = setTimeout(() => {
				state.transitionTimeoutId = null;
				// Only swap if we're still in the same suspended-transition state
				// (a fresher render or a resolve may have already moved us).
				if (state.pendingThenable === thenable && state.transitionHeld && state.branch === 1) {
					swapToPendingFallback(state);
				}
			}, TRANSITION_FALLBACK_TIMEOUT_MS);
		}
		attachResume(state, thenable);
		return;
	}

	// PRESERVE the try-body block's hooks Map, `_b.*` bindings, and DOM via
	// softDetach — whether the suspend came from the try-body block itself OR a
	// nested descendant block (e.g. a child component that re-renders on its own
	// and then suspends). The old nested-case behavior unmounted the whole try
	// subtree, discarding every descendant `scope.hooks` Map, so useState /
	// useMemo / useRef silently reset on resume — a latent data-loss bug. Keeping
	// the same blocks means the resume path (attachResume) re-renders the held
	// tryBlock, which reconciles descendants by key with their state intact —
	// React's committed-state-preserved-while-suspended contract.
	softDetachTryBlock(state);
	state.block = null;
	state.branch = 2;

	if (state.pendingBody) {
		const bStart = document.createComment('pend-b');
		const bEnd = document.createComment('/pend-b');
		state.domParent.insertBefore(bStart, state.end);
		state.domParent.insertBefore(bEnd, state.end);
		const b = createBlock(
			'control-flow',
			state.parentBlock,
			state.domParent,
			bStart,
			bEnd,
			state.pendingBody,
			undefined,
		);
		(b as any).__trySlot = state;
		state.block = b;
		try {
			renderBlock(b);
		} catch (err) {
			if (state.block) {
				unmountBlock(state.block);
				state.block = null;
			}
			switchToCatch(state, err);
			return;
		}
	}
	attachResume(state, thenable);
}

/**
 * Soft-detach the held tryBlock (preserving its hook state and DOM in
 * `savedDom`) and mount the @pending body in its place. Used by the
 * transition-fallback timeout when a held transition runs over budget — by
 * that point the user has waited long enough that React (and we) commit the
 * fallback to give visual feedback. The retry path re-attaches savedDom on
 * resolve, so this is recoverable.
 *
 * No-op when no pending body was compiled OR when state has already moved
 * (e.g. resolve raced the timeout).
 */
function swapToPendingFallback(state: TrySlot): void {
	if (!state.pendingBody || state.branch !== 1 || !state.tryBlock) return;
	softDetachTryBlock(state);
	state.block = null;
	state.branch = 2;
	const bStart = document.createComment('pend-b');
	const bEnd = document.createComment('/pend-b');
	state.domParent.insertBefore(bStart, state.end);
	state.domParent.insertBefore(bEnd, state.end);
	const b = createBlock(
		'control-flow',
		state.parentBlock,
		state.domParent,
		bStart,
		bEnd,
		state.pendingBody,
		undefined,
	);
	(b as any).__trySlot = state;
	state.block = b;
	try {
		renderBlock(b);
	} catch (err) {
		if (state.block) {
			unmountBlock(state.block);
			state.block = null;
		}
		switchToCatch(state, err);
	}
}

/**
 * Wire up a `.then` listener that retries the try body when the thenable
 * settles. Dedupes by `pendingThenable` so two suspends on the same promise
 * don't queue two retries.
 */
function attachResume(state: TrySlot, thenable: TrackedThenable<any>): void {
	if (state.pendingThenable === thenable) return;
	state.pendingThenable = thenable;
	const retry = () => {
		if (state.pendingThenable !== thenable) return; // superseded by a fresher suspend
		state.pendingThenable = null;
		// Cancel any pending transition-fallback timeout — the promise resolved
		// before the timeout would have swapped to @pending, so the prior DOM
		// stays put and the just-resolved render commits over it directly.
		if (state.transitionTimeoutId !== null) {
			clearTimeout(state.transitionTimeoutId);
			state.transitionTimeoutId = null;
		}
		// Release any transition counter we held open during the suspension. If
		// the retry re-suspends within the same transition, handleSuspense will
		// re-acquire the hold — net count unchanged, no isPending flicker.
		const wasHeld = state.transitionHeld;
		if (wasHeld) state.transitionHeld = false;
		try {
			if (state.tryBlock && !state.tryBlock.disposed) {
				if (state.savedDom) {
					if (state.block && state.block !== state.tryBlock) {
						unmountBlock(state.block);
						state.block = null;
					}
					reattachTryBlock(state);
				}
				state.block = state.tryBlock;
				state.branch = 1;
				state.tryBlock.body = state.tryBody;
				// Preserve transition priority on the retry render — the retry is a
				// continuation of the same transition, so a re-suspend on a different
				// promise should also keep the prior DOM (and isPending stays true).
				if (wasHeld) state.tryBlock.pendingMode = 'transition';
				try {
					renderBlock(state.tryBlock);
					state.hasResolved = true;
				} catch (err) {
					if (isSuspenseException(err)) handleSuspense(state, err.thenable, state.tryBlock!);
					else switchToCatch(state, err);
				}
			} else {
				mountTry(state);
			}
		} finally {
			if (wasHeld) tickTransitionCount(-1);
		}
	};
	thenable.then(retry, retry);
}

// ---------------------------------------------------------------------------
// startTransition / useTransition — React 18 priority transitions.
//
// `startTransition(fn)` runs `fn` synchronously; any setters called inside
// it schedule transition-priority renders. When a transition-priority render
// of an already-committed try block suspends, we keep the prior DOM mounted
// instead of swapping to the pending fallback. `useTransition` returns
// `[isPending, start]` so a component can show "loading" cues without
// tearing down the current view.
// ---------------------------------------------------------------------------

export function startTransition(fn: () => void | Promise<unknown>): void {
	// Bump the priority flag FIRST so any scheduleRender calls fired by the
	// listener notification (and by fn itself) are tagged as transition.
	TRANSITION_DEPTH++;
	let result: unknown;
	try {
		tickTransitionCount(+1);
		try {
			result = fn();
		} finally {
			TRANSITION_DEPTH--;
		}
	} catch (err) {
		tickTransitionCount(-1);
		throw err;
	}
	if (result != null && typeof (result as { then?: unknown }).then === 'function') {
		// React 19 Actions parity: an async callback returns a promise. Keep the
		// transition pending until that promise settles — the awaited
		// continuation (and any setters after `await`) resumes on a later
		// microtask, AFTER a fixed queueMicrotask decrement would have already
		// dropped isPending. Decrement exactly once on settle (fulfil OR reject).
		// ASYNC_TRANSITION_COUNT stays elevated across the same window so setters
		// fired after the `await` schedule at transition priority (TRANSITION_DEPTH
		// is already 0 by then — the synchronous slice has returned).
		ASYNC_TRANSITION_COUNT++;
		let settled = false;
		const settle = () => {
			if (settled) return;
			settled = true;
			ASYNC_TRANSITION_COUNT--;
			tickTransitionCount(-1);
		};
		(result as Promise<unknown>).then(settle, settle);
	} else {
		// Synchronous callback: decrement after the scheduler has had a chance to
		// flush the queued renders this transition produced — if any of those
		// renders held the transition open by suspending, they incremented the
		// count themselves via handleSuspense, so the net count stays > 0.
		queueMicrotask(() => tickTransitionCount(-1));
	}
}

export function useTransition(
	slot?: symbol,
): [boolean, (fn: () => void | Promise<unknown>) => void] {
	if (slot === undefined) missingSlot('useTransition');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as
		| { isPending: boolean; start: (fn: () => void | Promise<unknown>) => void }
		| undefined;
	if (s === undefined) {
		const slotRef = { isPending: false, start: startTransition };
		s = slotRef;
		ensureHooks(scope).set(slot, slotRef);
		const listener = () => {
			const next = TRANSITION_PENDING_COUNT > 0;
			if (slotRef.isPending !== next) {
				slotRef.isPending = next;
				if (!block.disposed) scheduleRender(block);
			}
		};
		TRANSITION_LISTENERS.add(listener);
		scope.cleanups.push(() => TRANSITION_LISTENERS.delete(listener));
	}
	return [s.isPending, s.start];
}

// ---------------------------------------------------------------------------
// useActionState(action, initialState, permalink?) → [state, formAction, isPending]
//
// `action(previousState, payload)` runs inside a transition. `formAction` is a
// stable dispatcher you wire to `<form action={formAction}>` (payload = FormData)
// or call directly (`formAction(payload)`). Dispatches run SEQUENTIALLY, each
// receiving the previous COMPLETED result as previousState. `isPending` is true
// from dispatch until the queue drains. The action's resolved value becomes the
// new state. Errors route to the nearest @try boundary (else console.error).
// `permalink` (SSR progressive enhancement) is accepted for signature parity and
// ignored — ripple-new is client-only. Form auto-reset is intentionally skipped
// for useActionState forms (typed-in values are kept), matching React.
// ---------------------------------------------------------------------------

interface ActionStateSlot<S> {
	state: S;
	isPending: boolean;
	pendingCount: number;
	chain: Promise<S>;
	action: (prev: S, payload: any) => S | Promise<S>;
	dispatch: ((payload?: any) => Promise<S>) & { $$isActionDispatcher?: true };
}

export function useActionState<S>(
	action: (prevState: S, payload: any) => S | Promise<S>,
	initialState: S,
	permalinkOrSlot?: string | symbol,
	slot?: symbol,
): [S, (payload?: any) => void, boolean] {
	// `permalink` is optional, the compiler appends the slot last. Disambiguate:
	// a trailing symbol in the 3rd position means no permalink was passed.
	if (typeof permalinkOrSlot === 'symbol') slot = permalinkOrSlot;
	if (slot === undefined) missingSlot('useActionState');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as ActionStateSlot<S> | undefined;
	if (s === undefined) {
		const slotRef: ActionStateSlot<S> = {
			state: initialState,
			isPending: false,
			pendingCount: 0,
			chain: Promise.resolve(initialState),
			action,
			dispatch: undefined as any,
		};
		const setPending = (next: boolean): void => {
			if (slotRef.isPending !== next) {
				slotRef.isPending = next;
				if (!block.disposed) scheduleRender(block);
			}
		};
		const dispatch = ((payload?: any): Promise<S> => {
			slotRef.pendingCount++;
			setPending(true);
			// Sequential queue: each run sees the prior COMPLETED state.
			slotRef.chain = slotRef.chain.then(
				(prevState) =>
					new Promise<S>((resolveResult) => {
						const finish = (): void => {
							slotRef.pendingCount--;
							if (slotRef.pendingCount === 0) setPending(false);
						};
						startTransition(() => {
							let p: Promise<S>;
							try {
								p = Promise.resolve(slotRef.action(prevState, payload));
							} catch (err) {
								// A SYNCHRONOUS throw from the action would otherwise escape
								// startTransition before `finish` is wired, leaving pendingCount
								// (and isPending) stuck true forever and rejecting the chain so the
								// queue stops threading. Settle it exactly like the async-rejection
								// path: clear pending, route the error, keep prior state.
								finish();
								const handler = findTryHandler(block);
								if (handler) handler(err);
								else console.error(err);
								resolveResult(prevState);
								return;
							}
							p.then(
								(result) => {
									slotRef.state = result;
									finish();
									if (!block.disposed) scheduleRender(block);
									resolveResult(result);
								},
								(err) => {
									finish();
									const handler = findTryHandler(block);
									if (handler) handler(err);
									else console.error(err);
									// Keep prior state so the next queued dispatch threads it.
									resolveResult(prevState);
								},
							);
							return p;
						});
					}),
			);
			return slotRef.chain;
		}) as ActionStateSlot<S>['dispatch'];
		dispatch.$$isActionDispatcher = true;
		slotRef.dispatch = dispatch;
		s = slotRef;
		ensureHooks(scope).set(slot, slotRef);
	}
	// Keep the action reference fresh across renders (closures over latest props).
	s.action = action;
	return [s.state, s.dispatch, s.isPending];
}

// ---------------------------------------------------------------------------
// useFormStatus() → { pending, data, method, action }
//
// Reads the submission status of the nearest ANCESTOR <form> (found by walking
// the DOM up from this component's markers — so a <form> rendered BY this same
// component is correctly ignored, matching React). Subscribes to that form's
// status so a submission re-renders the consumer. Defaults to the idle status
// when there is no ancestor form or no active submission.
// ---------------------------------------------------------------------------

function findAncestorForm(block: Block): HTMLFormElement | null {
	let n: Node | null = block.startMarker ?? block.parentNode ?? null;
	while (n) {
		if ((n as any).nodeName === 'FORM') return n as HTMLFormElement;
		n = n.parentNode;
	}
	return null;
}

interface FormStatusSlot {
	form: HTMLFormElement | null;
	listener: (() => void) | null;
}

export function useFormStatus(slot?: symbol): FormStatus {
	if (slot === undefined) missingSlot('useFormStatus');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as FormStatusSlot | undefined;
	if (s === undefined) {
		s = { form: null, listener: null };
		const slotRef = s;
		ensureHooks(scope).set(slot, slotRef);
		scope.cleanups.push(() => {
			if (slotRef.form && slotRef.listener)
				FORM_STATUS_LISTENERS.get(slotRef.form)?.delete(slotRef.listener);
		});
	}
	// Re-resolve the nearest ANCESTOR <form> on EVERY render: a conditionally
	// rendered form (or a moved consumer) means the form can appear/change after
	// the first run. Re-subscribe when it changes; caching only the first result
	// would leave the hook stuck reporting idle for a form that showed up later.
	const form = findAncestorForm(block);
	if (form !== s.form) {
		if (s.form && s.listener) FORM_STATUS_LISTENERS.get(s.form)?.delete(s.listener);
		s.form = form;
		if (form) {
			const listener = (): void => {
				if (!block.disposed) scheduleRender(block);
			};
			s.listener = listener;
			let set = FORM_STATUS_LISTENERS.get(form);
			if (!set) {
				set = new Set();
				FORM_STATUS_LISTENERS.set(form, set);
			}
			set.add(listener);
		} else {
			s.listener = null;
		}
	}
	return s.form ? (FORM_STATUS.get(s.form) ?? IDLE_FORM_STATUS) : IDLE_FORM_STATUS;
}

// ---------------------------------------------------------------------------
// useOptimistic(state, updateFn?) → [optimisticState, addOptimistic]
//
// `optimisticState` equals `state` unless an Action/transition is in flight, in
// which case it is `state` folded through `updateFn(acc, value)` for each queued
// addOptimistic call (or the raw value when no updateFn). The queue is cleared
// when the owning transition settles, so optimistic and real state converge in
// the same commit — on success `state` has advanced, on error it is unchanged
// (automatic revert). addOptimistic should be called inside an Action.
// ---------------------------------------------------------------------------

interface OptimisticSlot<S, V> {
	queue: V[];
	updateFn?: (state: S, value: V) => S;
	add: (value: V) => void;
	/**
	 * True when the queue was populated INSIDE a transition, so it should clear
	 * when that transition settles (count → 0). Without this, an addOptimistic
	 * called outside any transition would (a) never clear via the listener, and
	 * (b) be wiped by an unrelated transition elsewhere settling. See `add`.
	 */
	armed: boolean;
}

export function useOptimistic<S, V = S>(
	passthrough: S,
	updateFnOrSlot?: ((state: S, value: V) => S) | symbol,
	slot?: symbol,
): [S, (value: V) => void] {
	let updateFn: ((state: S, value: V) => S) | undefined;
	if (typeof updateFnOrSlot === 'symbol') slot = updateFnOrSlot;
	else updateFn = updateFnOrSlot;
	if (slot === undefined) missingSlot('useOptimistic');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as OptimisticSlot<S, V> | undefined;
	if (s === undefined) {
		const clear = (): void => {
			slotRef.armed = false;
			if (slotRef.queue.length > 0) {
				slotRef.queue.length = 0;
				if (!block.disposed) scheduleRender(block);
			}
		};
		const slotRef: OptimisticSlot<S, V> = {
			queue: [],
			updateFn,
			armed: false,
			add: (value: V) => {
				slotRef.queue.push(value);
				if (TRANSITION_PENDING_COUNT > 0) {
					// Inside an Action: the optimistic value is held until that
					// transition settles (the listener below clears it then).
					slotRef.armed = true;
				} else {
					// Outside any Action: React warns and shows the value only
					// briefly. Clear on the next microtask so it renders once and
					// reverts — never left stuck waiting on a transition that won't come.
					queueMicrotask(clear);
				}
				if (!block.disposed) scheduleRender(block);
			},
		};
		s = slotRef;
		ensureHooks(scope).set(slot, slotRef);
		// When the owning transition settles (pending count hits 0), drop the
		// optimistic queue so the next render re-derives from the real state. Gated
		// on `armed` so an unrelated transition settling doesn't wipe a queue this
		// hook populated outside any transition (that path self-clears via microtask).
		const listener = (): void => {
			if (TRANSITION_PENDING_COUNT === 0 && slotRef.armed) clear();
		};
		TRANSITION_LISTENERS.add(listener);
		scope.cleanups.push(() => TRANSITION_LISTENERS.delete(listener));
	}
	s.updateFn = updateFn;
	let optimistic = passthrough;
	for (let i = 0; i < s.queue.length; i++) {
		optimistic = s.updateFn ? s.updateFn(optimistic, s.queue[i]) : (s.queue[i] as unknown as S);
	}
	return [optimistic, s.add];
}

// ---------------------------------------------------------------------------
// useDeferredValue — React 18. Returns the latest value normally; when value
// changes, returns the PREVIOUS value (synchronously) and schedules a
// transition-priority re-render where it'll return the new value. Because
// the re-render runs at transition priority, a suspending consumer (via use())
// keeps the prior DOM mounted instead of flashing a fallback.
// ---------------------------------------------------------------------------

interface DeferredSlot<T> {
	current: T; // committed value (what we return)
	next: T; // latest pending value
	scheduled: boolean;
	block: Block;
}

export function useDeferredValue<T>(value: T, ...rest: any[]): T {
	// React-19 shape: `useDeferredValue(value, initialValue?)`. The compiler
	// appends the hook-slot Symbol as the LAST argument, so we detect the
	// user-vs-compiler args by counting from the end. One trailing Symbol →
	// user passed no initialValue; one trailing Symbol preceded by another
	// arg → user passed initialValue. Same hook-slot semantics either way.
	const slot = rest[rest.length - 1] as symbol | undefined;
	if (slot === undefined || typeof slot !== 'symbol') missingSlot('useDeferredValue');
	const initialValue = rest.length >= 2 ? (rest[0] as T) : undefined;
	const hasInitial = rest.length >= 2;
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as DeferredSlot<T> | undefined;
	if (s === undefined) {
		if (hasInitial) {
			// First render returns the user's initialValue; if it differs from
			// `value`, schedule a deferred re-render to swap to `value`. Mirrors
			// React's "useDeferredValue with initialValue" contract: a UI that
			// wants to show stable initial content while the expensive `value`
			// computation settles in the background.
			s = { current: initialValue as T, next: value, scheduled: false, block };
			ensureHooks(scope).set(slot, s);
			if ((initialValue as T) !== value) {
				s.scheduled = true;
				queueMicrotask(() => {
					if (!s!.scheduled || s!.block.disposed) return;
					s!.scheduled = false;
					s!.current = s!.next;
					scheduleRender(s!.block);
				});
			}
			return initialValue as T;
		}
		s = { current: value, next: value, scheduled: false, block };
		ensureHooks(scope).set(slot, s);
		return value;
	}
	s.next = value;
	if (s.current === value) return s.current;
	// If the CURRENT render is already at transition priority, don't defer —
	// commit the new value immediately. Matches React's `useDeferredValue does
	// not defer during a transition` semantics — both Original and Deferred
	// values update in the same paint.
	if (block.currentRenderMode === 'transition') {
		s.current = value;
		return value;
	}
	if (!s.scheduled) {
		s.scheduled = true;
		queueMicrotask(() => {
			s!.scheduled = false;
			if (s!.block.disposed || s!.current === s!.next) return;
			s!.current = s!.next;
			// Re-render at transition priority — matches React's contract that the
			// deferred-value commit can be interrupted by urgent updates and won't
			// tear down the prior DOM if it suspends.
			startTransition(() => scheduleRender(s!.block));
		});
	}
	return s.current;
}

function requestReset(state: TrySlot): void {
	// React parity for catch reset(): don't synchronously re-run the try body.
	// Rewind slot state and schedule the parent — sibling setState calls in
	// the SAME event handler then batch into one commit, so when mountTry
	// re-runs the body it sees fresh closure values (e.g. throwIt=false)
	// instead of immediately re-throwing. Matches TsrxErrorBoundary's
	// `() => this.setState({ error: null })` semantics: clear the error flag,
	// then let the normal commit cycle decide what to render. The currently
	// visible catch block stays mounted for one tick; mountTry's teardown
	// (state.block != null branch) removes it on the next render.
	state.branch = -1;
	state.err = null;
	state.hasResolved = false;
	scheduleRender(state.parentBlock);
}

function switchToCatch(state: TrySlot, err: any): void {
	// Cancel any pending transition-fallback timeout — catch is a terminal
	// state, so a timeout-driven swap to @pending would conflict with the
	// catch branch about to mount.
	if (state.transitionTimeoutId !== null) {
		clearTimeout(state.transitionTimeoutId);
		state.transitionTimeoutId = null;
	}
	// Catch is a fresh terminal state — discard any preserved try-body hook
	// state. `reset()` will mountTry fresh from the catch arm if user retries.
	if (state.tryBlock) {
		unmountBlock(state.tryBlock);
		state.tryBlock = null;
	}
	if (state.savedDom) {
		// DOM was detached — discard the saved nodes since the block they
		// belonged to is being torn down (unmountBlock above wouldn't see them
		// because they're detached from the document).
		state.savedDom = null;
	}
	if (state.block && state.block !== state.tryBlock) {
		unmountBlock(state.block);
		state.block = null;
	}
	state.hasResolved = false;
	state.pendingThenable = null;
	if (state.transitionHeld) {
		state.transitionHeld = false;
		tickTransitionCount(-1);
	}
	// No catch arm — bubble to the next enclosing tryBlock (or surface).
	if (state.catchBody === null) {
		const parent = findTryHandler(state.parentBlock);
		if (parent) parent(err);
		else console.error('tryBlock with no catch arm received error:', err);
		return;
	}
	state.branch = 0;
	state.err = err;
	const bStart = document.createComment('catch-b');
	const bEnd = document.createComment('/catch-b');
	state.domParent.insertBefore(bStart, state.end);
	state.domParent.insertBefore(bEnd, state.end);
	const reset = () => requestReset(state);
	const b = createBlock(
		'control-flow',
		state.parentBlock,
		state.domParent,
		bStart,
		bEnd,
		state.catchBody,
		{ err, reset },
	);
	state.block = b;
	try {
		renderBlock(b);
	} catch (e2) {
		// Catch body itself threw — bubble to next enclosing tryBlock.
		if (state.block) {
			unmountBlock(state.block);
			state.block = null;
		}
		const parent = findTryHandler(state.parentBlock);
		if (parent) parent(e2);
		else console.error('catch body threw, no outer tryBlock:', e2);
	}
}

/** Walk Block.parentBlock chain looking for a `$$tryHandler` registration. */
export function findTryHandler(block: Block | null): ((err: any) => void) | null {
	let b: Block | null = block;
	while (b) {
		const h = (b as any).$$tryHandler;
		if (h) return h;
		b = b.parentBlock;
	}
	return null;
}

/**
 * Route an error thrown by `renderBlock` during scheduled re-renders.
 * Suspense exceptions go to the nearest tryBlock's `__suspenseHandler`;
 * everything else goes to `$$tryHandler`. Without a handler, we rethrow —
 * which surfaces to the scheduler's caller (matches the prior behavior).
 */
function handleRenderError(block: Block, err: any): void {
	if (isSuspenseException(err)) {
		let b: Block | null = block;
		while (b) {
			const h = (b as any).__suspenseHandler;
			if (h) {
				h(err.thenable, block);
				return;
			}
			b = b.parentBlock;
		}
		throw err;
	}
	const h = findTryHandler(block);
	if (h) h(err);
	else throw err;
}

// ---------------------------------------------------------------------------
// Control flow: ifBlock — swap a subtree based on a predicate
// ---------------------------------------------------------------------------

interface IfSlot {
	__kind: 'ifBlockSlot';
	start: Comment;
	end: Comment;
	/** Current branch: 1 = then, 0 = else, -1 = uninitialized. */
	branch: -1 | 0 | 1;
	block: Block | null;
}

export function ifBlock(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	cond: boolean,
	thenBody: ComponentBody | null,
	elseBody: ComponentBody | null,
	anchor?: Node | null,
): void {
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as IfSlot | undefined;
	if (state === undefined) {
		let start: Comment;
		let end: Comment;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration: the server wrapped the taken branch in a `<!--[-->…<!--]-->`
			// range (anchor resolved to the `<!--[-->`). Adopt it as the slot markers;
			// the branch mount below brackets the already-present content.
			start = anchor as Comment;
			end = matchingClose(anchor as Node);
		} else {
			start = document.createComment('if');
			end = document.createComment('/if');
			// insertBefore(_, null) === appendChild — covers both end-of-parent and
			// mid-range insertion (e.g. when this slot lives in a mixed-children
			// template and must sit before its static-element/text siblings). The
			// compiler emits a `<!>` placeholder at the if-block's source-order
			// index and passes the captured Comment as `anchor`.
			domParent.insertBefore(start, anchor ?? null);
			domParent.insertBefore(end, anchor ?? null);
		}
		state = { __kind: 'ifBlockSlot', start, end, branch: -1, block: null };
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
	}
	const next: 0 | 1 = cond ? 1 : 0;
	const body = next ? thenBody : elseBody;
	if (next !== state.branch) {
		// Branch changed — tear down old, mount new.
		if (state.block) {
			unmountBlock(state.block);
			state.block = null;
		}
		state.branch = next;
		if (body) {
			// Each branch gets its OWN start/end markers inside the if's permanent
			// range. Branch unmount removes them along with the branch's DOM; the
			// permanent state.start / state.end stay put.
			let bStart: Node;
			let bEnd: Node;
			if (hydrating && isBlockOpen(state.start.nextSibling)) {
				// ADOPT the server's inner branch range (no inserted markers →
				// byte-for-byte). The server nests `<!--[-->`(slot) `<!--[-->`(branch)
				// content `<!--]-->`(branch) `<!--]-->`(slot); the inner pair IS the
				// branch's start/end (so swap still removes just the branch range).
				bStart = state.start.nextSibling as Comment;
				bEnd = matchingClose(bStart);
				hydrateNode = bStart.nextSibling;
			} else {
				bStart = document.createComment('br');
				bEnd = document.createComment('/br');
				domParent.insertBefore(bStart, state.end);
				domParent.insertBefore(bEnd, state.end);
			}
			const b = createBlock('control-flow', parentBlock, domParent, bStart, bEnd, body, undefined);
			state.block = b;
			renderBlock(b);
		}
	} else if (state.block) {
		// Same branch — re-render in place.
		state.block.body = body!;
		renderBlock(state.block);
	}
}

// ---------------------------------------------------------------------------
// Control flow: activityBlock — React 19 <Activity mode="hidden"|"visible">
//
// Unlike ifBlock (which unmounts on branch change), an Activity keeps ONE
// long-lived child Block across the whole hidden/visible lifecycle. Hidden:
// children stay mounted (state + DOM preserved) but visually hidden via
// display:none and their effects are torn down (cleanups run); the subtree is
// marked `inactive` so re-renders while hidden update the DOM but skip effects.
// Visible: display restored and a re-render re-fires the effects. State is
// preserved because the block is never disposed while toggling.
// ---------------------------------------------------------------------------

interface ActivitySlot {
	__kind: 'activityBlockSlot';
	block: Block | null;
	hidden: boolean;
	/** Direct child elements we hid → their prior inline `display`, for restore. */
	savedDisplay: Map<HTMLElement, string>;
	/**
	 * Direct child TEXT nodes we hid → their prior `data`, for restore. Text nodes
	 * have no box and can't take `display:none`, so a bare-text Activity child
	 * (`<Activity mode="hidden">{'…'}</Activity>`) is hidden by blanking its data.
	 */
	savedText: Map<Text, string>;
}

/**
 * Hide every direct child between the block's markers (idempotent). Elements get
 * `display:none`; bare text nodes can't be styled, so their `data` is blanked
 * (original saved for restore). Re-runs after each hidden re-render, so newly
 * created children — and dynamic text re-populated by setText — get re-hidden.
 */
function hideActivityRange(state: ActivitySlot): void {
	const b = state.block;
	if (!b) return;
	let node: ChildNode | null = (b.startMarker as Comment).nextSibling;
	while (node && node !== b.endMarker) {
		if (node.nodeType === 1) {
			const el = node as HTMLElement;
			if (!state.savedDisplay.has(el)) state.savedDisplay.set(el, el.style.display);
			el.style.display = 'none';
		} else if (node.nodeType === 3) {
			const t = node as Text;
			if (!state.savedText.has(t)) state.savedText.set(t, t.data);
			if (t.data !== '') t.data = '';
		}
		node = node.nextSibling;
	}
}

/** Restore the inline `display` / text `data` we saved on hide. */
function showActivityRange(state: ActivitySlot): void {
	for (const [el, display] of state.savedDisplay) el.style.display = display;
	state.savedDisplay.clear();
	for (const [t, data] of state.savedText) t.data = data;
	state.savedText.clear();
}

export function activityBlock(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	mode: 'visible' | 'hidden' | string,
	body: ComponentBody,
	anchor?: Node | null,
): void {
	const parentBlock = parentScope.block;
	const wantHidden = mode === 'hidden';
	let state = parentScope[slotKey] as ActivitySlot | undefined;

	if (state === undefined) {
		const bStart = document.createComment('activity');
		const bEnd = document.createComment('/activity');
		domParent.insertBefore(bStart, anchor ?? null);
		domParent.insertBefore(bEnd, anchor ?? null);
		const b = createBlock('control-flow', parentBlock, domParent, bStart, bEnd, body, undefined);
		state = {
			__kind: 'activityBlockSlot',
			block: b,
			hidden: false,
			savedDisplay: new Map(),
			savedText: new Map(),
		};
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
		if (wantHidden) {
			// Mount while hidden: render children (creates state + DOM) but no
			// effects — mark inactive BEFORE the render so enqueueEffect skips them.
			b.inactive = true;
			renderBlock(b);
			hideActivityRange(state);
			state.hidden = true;
		} else {
			renderBlock(b);
		}
		return;
	}

	const b = state.block!;
	b.body = body;

	if (wantHidden) {
		if (!state.hidden) {
			// visible → hidden: prerender latest content with effects suppressed,
			// tear down the previously-mounted effects (cleanups BEFORE hiding the
			// DOM, matching React), then hide.
			b.inactive = true;
			renderBlock(b);
			deactivateScope(b);
			hideActivityRange(state);
			state.hidden = true;
		} else {
			// hidden → hidden: prerender (no effects), then hide any new children.
			renderBlock(b);
			hideActivityRange(state);
		}
	} else {
		if (state.hidden) {
			// hidden → visible: restore DOM, clear inactive, re-render to re-fire
			// effects (deactivateScope cleared their deps so they re-enqueue).
			showActivityRange(state);
			b.inactive = false;
			state.hidden = false;
			renderBlock(b);
		} else {
			// visible → visible: ordinary re-render in place.
			renderBlock(b);
		}
	}
}

/**
 * Run a subtree's effect CLEANUPS without disposing it, and reset its effect
 * slots so the setups re-fire on reactivation. Used by activityBlock on hide:
 * effects are torn down (cleanups run, parent-before-child) while state, DOM and
 * the blocks all stay alive. Refs are intentionally LEFT attached to the
 * preserved (hidden) DOM — they point at valid, still-present nodes.
 */
function deactivateScope(scope: Scope): void {
	const hooks = scope.hooks;
	if (hooks) {
		for (const slot of hooks.values()) {
			if (slot && (slot as EffectSlot).effect === true) {
				const e = slot as EffectSlot;
				if (typeof e.cleanup === 'function') {
					const cleanup = e.cleanup;
					// Clear it BEFORE firing so the per-slot unmount finalizer (still
					// registered in scope.cleanups) sees no cleanup and won't re-run it.
					e.cleanup = undefined;
					try {
						cleanup();
					} catch (err) {
						console.error(err);
					}
				}
				// Force the setup to re-enqueue + re-fire when the subtree reactivates.
				e.deps = undefined;
			}
		}
	}
	const children = scope.children;
	for (let i = 0, n = children.length; i < n; i++) deactivateScope(children[i].scope);
	const slots = scope._slots;
	if (slots !== null) {
		for (let i = 0, n = slots.length; i < n; i++) {
			const val = slots[i];
			if (val.__kind === 'forBlockSlot') {
				const it = (val.items as Map<any, Block>).values();
				for (let r = it.next(); !r.done; r = it.next()) deactivateScope(r.value);
				if (val.emptyBlock) deactivateScope(val.emptyBlock);
			} else if (val.block) {
				deactivateScope(val.block);
				if (val.__kind === 'trySlotSlot' && val.tryBlock && val.tryBlock !== val.block) {
					deactivateScope(val.tryBlock);
				}
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Control flow: switchBlock — analogous to ifBlock but n-way
// ---------------------------------------------------------------------------
//
// The compiler lowers `@switch (d) { @case 1: { … } @default: { … } }` to a
// `switchBlock(scope, slotKey, host, discriminant, [[test0, body0], …],
// defaultBody)` call. Selection uses `===` against each case test in source
// order; the first hit wins, falling back to `defaultBody` when none match
// (`defaultBody` is `null` when the user wrote no `@default`).
//
// State machine mirrors `ifBlock`: a permanent `start`/`end` Comment marker
// pair brackets the slot's DOM range. When the selected case index changes
// we tear down the previous branch Block (which removes its own inner
// markers + DOM) and mount a fresh one; when the selected index is
// unchanged we re-render in place so hook state / event bindings survive.
// Index `-2` is reserved for the default branch, `-1` for uninitialized.
interface SwitchSlot {
	__kind: 'switchBlockSlot';
	start: Comment;
	end: Comment;
	/** Currently-mounted case index, or -1 if uninitialized / -2 for default. */
	caseIdx: number;
	block: Block | null;
}

export function switchBlock(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	discriminant: any,
	cases: ReadonlyArray<readonly [test: any, body: ComponentBody]>,
	defaultBody: ComponentBody | null,
	anchor?: Node | null,
): void {
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as SwitchSlot | undefined;
	if (state === undefined) {
		let start: Comment;
		let end: Comment;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration: adopt the server's `<!--[-->…<!--]-->` range (the matched
			// case's content) as the slot markers (see ifBlock).
			start = anchor as Comment;
			end = matchingClose(anchor as Node);
		} else {
			start = document.createComment('switch');
			end = document.createComment('/switch');
			// insertBefore(_, null) === appendChild — covers both end-of-parent and
			// mid-range insertion (e.g. when this slot sits before static-element
			// siblings authored AFTER the @switch in source order).
			domParent.insertBefore(start, anchor ?? null);
			domParent.insertBefore(end, anchor ?? null);
		}
		state = { __kind: 'switchBlockSlot', start, end, caseIdx: -1, block: null };
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
	}
	// Pick the first matching case, or fall back to default.
	let nextIdx = -2;
	let body: ComponentBody | null = defaultBody;
	for (let i = 0; i < cases.length; i++) {
		if (cases[i][0] === discriminant) {
			nextIdx = i;
			body = cases[i][1];
			break;
		}
	}
	if (nextIdx !== state.caseIdx) {
		if (state.block) {
			unmountBlock(state.block);
			state.block = null;
		}
		state.caseIdx = nextIdx;
		if (body) {
			let bStart: Node;
			let bEnd: Node;
			if (hydrating && isBlockOpen(state.start.nextSibling)) {
				// ADOPT the server's inner case range (no inserted markers — see ifBlock).
				bStart = state.start.nextSibling as Comment;
				bEnd = matchingClose(bStart);
				hydrateNode = bStart.nextSibling;
			} else {
				bStart = document.createComment('case');
				bEnd = document.createComment('/case');
				domParent.insertBefore(bStart, state.end);
				domParent.insertBefore(bEnd, state.end);
			}
			const b = createBlock('control-flow', parentBlock, domParent, bStart, bEnd, body, undefined);
			state.block = b;
			renderBlock(b);
		}
	} else if (state.block) {
		state.block.body = body!;
		renderBlock(state.block);
	}
}

// ---------------------------------------------------------------------------
// Control flow: forBlock with LIS-based keyed reconciliation
// ---------------------------------------------------------------------------

interface ForSlot {
	__kind: 'forBlockSlot';
	start: Comment;
	end: Comment;
	items: Map<any, Block>; // key → item Block (O(1) survivor lookup)
	head: Block | null; // first item Block in DOM order
	tail: Block | null; // last item Block in DOM order
	size: number; // count of item Blocks
	hasCleanups: boolean; // true once any item registered a useEffect cleanup
	// Last-render snapshot of the body's closed-over parent locals. The compiler
	// emits a fresh `deps` array on every parent render for DEP-PURE for-of
	// calls (impure body, no hooks/comps/control-flow). When this render's deps
	// match last render's element-by-element, the runtime treats the body as
	// PURE for the survivor short-circuit — saving the entire body call for
	// every item whose ref + position are unchanged.
	cachedDeps: any[] | null;
	// `@for (...) { ... } @empty { ... }` support: mounted-empty-branch Block,
	// or null when there are items (or no `@empty` branch was compiled). The
	// empty body is hoisted by the compiler as its own helper and passed to
	// forBlock as the trailing `emptyBody` arg; we mount it on the transition
	// `items.length > 0 → 0` and unmount on `0 → >0`.
	emptyBlock: Block | null;
}

export function forBlock<T, E = undefined>(
	parentScope: Scope,
	slotKey: string,
	domParent: Node,
	items: ArrayLike<T>,
	getKey: (item: T, index: number) => any,
	itemBody: (scope: Scope, item: T, extra: E) => void,
	extra?: E,
	flags?: number,
	deps?: any[],
	emptyBody?: ComponentBody | null,
	anchor?: Node | null,
): void {
	// flags bitfield: bit 0 = pure (auto-memo), bit 1 = singleRoot (skip per-item
	// Comment markers), bit 2 = depEligible (compare `deps` to cachedDeps and
	// promote body to PURE when unchanged). Packed into one numeric literal.
	const parentBlock = parentScope.block;
	let state = parentScope[slotKey] as ForSlot | undefined;
	if (state === undefined) {
		let start: Comment;
		let end: Comment;
		if (hydrating && isBlockOpen(anchor ?? null)) {
			// Hydration: the server wrapped the whole @for in a `<!--[-->…<!--]-->`
			// range (anchor resolved to the outer `<!--[-->`). Adopt it as the slot
			// markers and point the cursor at the first item's `<!--[-->` so the
			// empty→fill mount below adopts each item via mountItem.
			start = anchor as Comment;
			end = matchingClose(anchor as Node);
			hydrateNode = start.nextSibling;
		} else {
			start = document.createComment('for');
			end = document.createComment('/for');
			// insertBefore(_, null) === appendChild — covers both end-of-parent and
			// mid-range insertion (when a static sibling follows this @for in mixed
			// children, the compiler emits a `<!>` anchor at the @for's source-order
			// index and threads it here so the markers land BEFORE the sibling).
			domParent.insertBefore(start, anchor ?? null);
			domParent.insertBefore(end, anchor ?? null);
		}
		state = {
			__kind: 'forBlockSlot',
			start,
			end,
			items: new Map(),
			head: null,
			tail: null,
			size: 0,
			hasCleanups: false,
			cachedDeps: null,
			emptyBlock: null,
		};
		parentScope[slotKey] = state;
		registerSlot(parentScope, state);
	}
	// `@empty` arm: when `items.length === 0` and the compiler emitted an
	// empty-body helper, mount that body in place of the (empty) item list. We
	// also tear down any previously-mounted items so transitioning items → 0 →
	// items behaves identically to a regular un-mount/re-mount cycle.
	const isEmpty = items.length === 0;
	if (isEmpty && emptyBody) {
		if (state.size > 0) {
			// had items last render, now we're empty — tear down the chain.
			reconcileKeyed(parentBlock, state, items, getKey, itemBody as any, extra, false, false);
		}
		if (state.emptyBlock) {
			// keep the existing empty branch mounted, but re-render in case the
			// body closes over parent state that changed this render.
			state.emptyBlock.body = emptyBody;
			renderBlock(state.emptyBlock);
		} else {
			const bStart = document.createComment('empty');
			const bEnd = document.createComment('/empty');
			if (hydrating) {
				// The server rendered the @empty content directly inside the adopted
				// `<!--[-->…<!--]-->` range — bracket it (don't insert at the end +
				// re-mount, which would move the adopted content) and point the cursor
				// at it so the empty body's clone() adopts the server DOM.
				domParent.insertBefore(bStart, state.start.nextSibling);
				domParent.insertBefore(bEnd, state.end);
				hydrateNode = bStart.nextSibling;
			} else {
				domParent.insertBefore(bStart, state.end);
				domParent.insertBefore(bEnd, state.end);
			}
			const b = createBlock(
				'control-flow',
				parentBlock,
				domParent,
				bStart,
				bEnd,
				emptyBody,
				undefined,
			);
			state.emptyBlock = b;
			renderBlock(b);
		}
		// Advance the cursor past the whole @for so the next sibling's clone()
		// doesn't read a position left inside this consumed range.
		if (hydrating) hydrateNode = state.end.nextSibling;
		return;
	}
	// We have items (or no empty body). If an empty branch was previously
	// mounted, tear it down before reconciling so its DOM doesn't sit alongside
	// the freshly-mounted items.
	if (state.emptyBlock) {
		unmountBlock(state.emptyBlock);
		state.emptyBlock = null;
	}
	const f = flags || 0;
	let pure = (f & 1) !== 0;
	// DEP-PURE upgrade: when the compiler marked this for-block as deps-eligible
	// and last render's snapshot matches this render's, we can treat the body
	// as PURE for the survivor short-circuit. The body still runs for moved/
	// mounted/removed items — only stable survivors get skipped.
	// `lite` = body is depEligible but did NOT promote to pure this render.
	// depEligible (compile.js:2553-2555) means no hooks, no nested comps, no
	// control flow → the body can't observe CURRENT_SCOPE / CURRENT_BLOCK and
	// never throws Suspense. We skip renderBlock's activeBlock plumbing and
	// call itemBody directly. Saves ~10 ops/survivor — meaningful on the
	// select-row tick where `selected` changes and 1000 survivors all
	// re-evaluate but only 2 actually flip their class.
	let lite = false;
	if ((f & 4) !== 0 && deps !== undefined) {
		if (state.cachedDeps !== null && depsEqual(state.cachedDeps, deps)) {
			pure = true;
		} else {
			lite = true;
		}
		state.cachedDeps = deps;
	}
	reconcileKeyed(
		parentBlock,
		state,
		items,
		getKey,
		itemBody as any,
		extra,
		pure,
		(f & 2) !== 0,
		lite,
	);
	// Advance the hydration cursor past the @for's `<!--]-->` so a later sibling's
	// clone() starts after this block — covers the zero-item, no-@empty case where
	// reconcileKeyed mounts nothing and the cursor would otherwise stay on the
	// inner close marker.
	if (hydrating) hydrateNode = state.end.nextSibling;
}

function depsEqual(a: any[], b: any[]): boolean {
	const n = a.length;
	if (n !== b.length) return false;
	for (let i = 0; i < n; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

// Cutoff for the small-displacement shortcut in reconcileKeyed. When fewer
// than this many positions change between renders (and every item survives),
// we compute the move set directly in O(K_DISP) instead of paying the LIS
// path's O(N) alloc + back-walk. Covers single drag-and-drop, undo/redo of a
// recent edit, animated swap transitions, A/B variant toggles, etc. Above
// this threshold the LIS path wins. The buffer is reused across calls
// (single-threaded JS, no recursion through reconcileKeyed).
const K_DISP = 4;
const _disp = new Int32Array(K_DISP);

/**
 * Keyed reconciliation over a doubly-linked list of item Blocks.
 *
 * Item Blocks form a sibling chain via `prevSibling` / `nextSibling`; the
 * ForSlot tracks `head` / `tail` / `size`. Removing or inserting an item is
 * O(1) pointer updates — no array splice, no `order` array to rebuild. The
 * Map (`state.items`) is kept only for O(1) survivor lookup by key during the
 * middle-section diff.
 *
 * Algorithm shape matches Ripple/Solid/Vue: prefix walk, suffix walk, then
 * a middle section that either is pure-insert / pure-remove, or runs the
 * full survivor-partition + LIS-based move pass. The linked list shows up in
 * the prefix/suffix walks (cursor advance via .nextSibling / .prevSibling)
 * and in the splice step that reattaches the new middle to the surrounding
 * chain.
 */
function reconcileKeyed<T, E>(
	parentBlock: Block,
	state: ForSlot,
	items: ArrayLike<T>,
	getKey: (item: T, index: number) => any,
	itemBody: (scope: Scope, item: T, extra: E) => void,
	extra: E,
	pure: boolean,
	singleRoot: boolean,
	lite: boolean = false,
): void {
	const oldItems = state.items;
	const oldSize = state.size;
	const newLen = items.length;
	const parentNode = state.end.parentNode!;

	// Fast path: empty → fill. Append each new block to the tail of the (empty) list.
	if (oldSize === 0) {
		if (newLen === 0) return;
		let prev: Block | null = null;
		for (let i = 0; i < newLen; i++) {
			const item = items[i];
			const key = getKey(item, i);
			const block = mountItem(
				parentBlock,
				parentNode,
				state.end,
				item,
				i,
				itemBody,
				extra,
				state,
				singleRoot,
			);
			oldItems.set(key, block);
			block.key = key;
			block.prevSibling = prev;
			block.nextSibling = null;
			if (prev) prev.nextSibling = block;
			else state.head = block;
			prev = block;
		}
		state.tail = prev;
		state.size = newLen;
		return;
	}
	// Fast path: clear all.
	if (newLen === 0) {
		batchClearItems(state, oldItems);
		state.head = null;
		state.tail = null;
		state.size = 0;
		return;
	}

	// ── Prefix walk: advance head cursor while keys match new[i] at position i.
	let oldFirst: Block | null = state.head;
	let prefixLen = 0;
	while (oldFirst !== null && prefixLen < newLen) {
		const newKey = getKey(items[prefixLen], prefixLen);
		if (oldFirst.key !== newKey) break;
		const block = oldFirst;
		const newItem = items[prefixLen];
		// Pure-body memo: when the compiler statically proved this for-of body
		// closes over nothing from parent scope, body output is a pure function
		// of (item, itemIndex). Identical refs → skip renderBlock entirely.
		if (pure && block.props === newItem && block.itemIndex === prefixLen) {
			block.extra = extra;
			block.body = itemBody as ComponentBody;
		} else {
			block.props = newItem;
			block.extra = extra;
			block.body = itemBody as ComponentBody;
			block.itemIndex = prefixLen;
			if (lite) {
				// depEligible body — no hooks, no comps, no control flow.
				// Skip renderBlock's activeBlock plumbing; call body directly.
				(itemBody as any)(block, newItem, extra);
			} else {
				renderBlock(block);
			}
		}
		oldFirst = block.nextSibling!;
		prefixLen++;
	}

	// Both lists fully consumed by prefix? Identical → done.
	if (prefixLen === newLen && oldFirst === null) return;

	// ── Suffix walk: retreat tail cursor while keys match new[newEnd].
	let oldLast: Block | null = state.tail;
	let newEnd = newLen - 1;
	let oldRemain = oldSize - prefixLen;
	while (oldLast !== null && oldRemain > 0 && newEnd >= prefixLen) {
		const newKey = getKey(items[newEnd], newEnd);
		if (oldLast.key !== newKey) break;
		const block = oldLast;
		const newItem = items[newEnd];
		if (pure && block.props === newItem && block.itemIndex === newEnd) {
			block.extra = extra;
			block.body = itemBody as ComponentBody;
		} else {
			block.props = newItem;
			block.extra = extra;
			block.body = itemBody as ComponentBody;
			block.itemIndex = newEnd;
			if (lite) {
				(itemBody as any)(block, newItem, extra);
			} else {
				renderBlock(block);
			}
		}
		oldLast = block.prevSibling!;
		newEnd--;
		oldRemain--;
	}

	// Boundaries of the OLD middle in the linked list.
	//   beforeMiddle = last prefix-matched block (or null if prefix empty)
	//   afterMiddle  = first suffix-matched block (or null if suffix empty)
	// When oldRemain === 0, the OLD middle is empty — oldFirst is either null
	// (prefix consumed all of old) or it points at the first suffix-matched block.
	let beforeMiddle: Block | null;
	let afterMiddle: Block | null;
	if (oldRemain === 0) {
		afterMiddle = oldFirst;
		beforeMiddle = afterMiddle ? afterMiddle.prevSibling! : state.tail;
	} else {
		beforeMiddle = oldFirst!.prevSibling!;
		afterMiddle = oldLast!.nextSibling!;
	}

	// Case: old middle empty, new middle non-empty → only inserts.
	if (oldRemain === 0) {
		const anchor: Node = afterMiddle ? afterMiddle.startMarker! : state.end;
		let prev: Block | null = beforeMiddle;
		for (let i = prefixLen; i <= newEnd; i++) {
			const item = items[i];
			const key = getKey(item, i);
			const block = mountItem(
				parentBlock,
				parentNode,
				anchor,
				item,
				i,
				itemBody,
				extra,
				state,
				singleRoot,
			);
			oldItems.set(key, block);
			block.key = key;
			block.prevSibling = prev;
			block.nextSibling = afterMiddle;
			if (prev) prev.nextSibling = block;
			else state.head = block;
			prev = block;
		}
		if (afterMiddle) afterMiddle.prevSibling = prev;
		else state.tail = prev;
		state.size += newEnd - prefixLen + 1;
		return;
	}

	// Case: new middle empty, old middle non-empty → only removes.
	if (prefixLen > newEnd) {
		let cur: Block | null = oldFirst;
		let removed = 0;
		while (cur !== afterMiddle) {
			const next: Block | null = cur!.nextSibling!;
			unmountBlock(cur!);
			oldItems.delete(cur!.key);
			cur = next;
			removed++;
		}
		if (beforeMiddle) beforeMiddle.nextSibling = afterMiddle;
		else state.head = afterMiddle;
		if (afterMiddle) afterMiddle.prevSibling = beforeMiddle;
		else state.tail = beforeMiddle;
		state.size -= removed;
		return;
	}

	// ── General case: both middles non-empty. Partition + LIS-move.
	const newMidLen = newEnd - prefixLen + 1;
	const newKeys: any[] = new Array(newMidLen);
	const newKeysToIdx = new Map<any, number>(); // key → MIDDLE-RELATIVE index (0..newMidLen-1)
	for (let i = 0; i < newMidLen; i++) {
		const key = getKey(items[prefixLen + i], prefixLen + i);
		newKeys[i] = key;
		newKeysToIdx.set(key, i);
	}

	// Full-replace fast path — when prefix/suffix are empty AND no old items
	// survive, batch-clear with `textContent = ''` (one DOM op vs N removeChild)
	// and mass-mount. Detect "no survivors" by checking just the first old block
	// (the loop in the original code exits after one hit too).
	if (beforeMiddle === null && afterMiddle === null && !newKeysToIdx.has(oldFirst!.key)) {
		// Quick scan: confirm no survivor before committing to batch-clear.
		let anySurvivors = false;
		let cur: Block | null = oldFirst!.nextSibling!;
		while (cur !== null) {
			if (newKeysToIdx.has(cur.key)) {
				anySurvivors = true;
				break;
			}
			cur = cur.nextSibling!;
		}
		if (!anySurvivors) {
			batchClearItems(state, oldItems);
			state.head = null;
			state.tail = null;
			state.size = 0;
			let prev: Block | null = null;
			for (let i = 0; i < newLen; i++) {
				const item = items[i];
				const key = newKeys[i]; // prefixLen === 0, so newKeys spans the full list
				const block = mountItem(
					parentBlock,
					parentNode,
					state.end,
					item,
					i,
					itemBody,
					extra,
					state,
					singleRoot,
				);
				oldItems.set(key, block);
				block.key = key;
				block.prevSibling = prev;
				block.nextSibling = null;
				if (prev) prev.nextSibling = block;
				else state.head = block;
				prev = block;
			}
			state.tail = prev;
			state.size = newLen;
			return;
		}
	}

	// sources[i] = old middle-relative index for new[prefixLen + i], or -1 if new.
	const sources = new Int32Array(newMidLen);
	for (let i = 0; i < newMidLen; i++) sources[i] = -1;

	let moved = false;
	let lastIdx = 0;
	let patched = 0;

	// Walk old middle (linked-list traversal): re-render survivors, unmount removed.
	let cur: Block | null = oldFirst;
	let oldIdx = 0;
	while (cur !== afterMiddle) {
		const next: Block | null = cur!.nextSibling!;
		const newRelIdx = newKeysToIdx.get(cur!.key);
		if (newRelIdx === undefined) {
			unmountBlock(cur!);
			oldItems.delete(cur!.key);
			state.size--;
		} else {
			sources[newRelIdx] = oldIdx;
			if (newRelIdx < lastIdx) moved = true;
			else lastIdx = newRelIdx;
			patched++;
			const block = cur!;
			const newIdx = prefixLen + newRelIdx;
			const newItem = items[newIdx];
			if (pure && block.props === newItem && block.itemIndex === newIdx) {
				block.extra = extra;
				block.body = itemBody as ComponentBody;
			} else {
				block.props = newItem;
				block.extra = extra;
				block.body = itemBody as ComponentBody;
				block.itemIndex = newIdx;
				if (lite) {
					(itemBody as any)(block, newItem, extra);
				} else {
					renderBlock(block);
				}
			}
		}
		cur = next;
		oldIdx++;
	}

	// Fast bail: all survivors AND no moves AND no mounts → old middle is the
	// same shape & order as new middle.
	if (!moved && patched === newMidLen) {
		// If the survivor walk did NOT unmount anything (oldRemain ===
		// patched), the linked-list pointers are still correct end-to-end
		// and we can return without touching them. But if blocks were
		// unmounted BETWEEN survivors, the survivors' .prevSibling /
		// .nextSibling pointers still reference now-disposed blocks AND
		// state.head / state.tail may also point at disposed blocks. The
		// next reconcile would then walk those stale pointers, decrement
		// state.size for blocks that no longer exist, and ultimately
		// crash with a null-pointer access in the prefix/suffix walk.
		//
		// Relink the entire middle chain so its prev/next pointers — and
		// the boundary into beforeMiddle / afterMiddle / state.head /
		// state.tail — accurately reflect the post-unmount topology.
		// O(newMidLen); only fires when survivors and removes are mixed.
		// Surfaced by fuzz-keyed-list seed=-2060211668 action 9 (a
		// replace-all 13 → 2 where both survivors are in original order).
		if (oldRemain !== patched) {
			let prev: Block | null = beforeMiddle;
			for (let i = 0; i < newMidLen; i++) {
				const block = oldItems.get(newKeys[i])!;
				block.prevSibling = prev;
				if (prev) prev.nextSibling = block;
				else state.head = block;
				prev = block;
			}
			prev!.nextSibling = afterMiddle;
			if (afterMiddle) afterMiddle.prevSibling = prev;
			else state.tail = prev;
		}
		return;
	}

	// ── Small-displacement shortcut. When every old item survived AND only a
	// small number of positions actually changed (≤ K_DISP), we can compute
	// the exact move set in O(K_DISP) instead of paying the LIS path's O(N)
	// allocation + back-walk that rewrites every prev/next pointer. This is
	// a general property of permutations — when survivors are stable and the
	// permutation has few fixed-point misses, LIS does provably wasted work.
	//
	// Real shapes this covers:
	//   - drag-and-drop reorder (swap two rows, rotate three)
	//   - undo/redo of a recent local edit
	//   - animated swap / sort transitions
	//   - A/B variant toggle that flips a small set of cells
	//   - any benchmark or test fixture that mutates exactly K positions
	//
	// Bail cost on a true large-shuffle permutation: K_DISP + 1 source
	// compares before falling through to the LIS path, which is sub-µs.
	if (moved && patched === newMidLen) {
		let dCount = 0;
		for (let i = 0; i < newMidLen; i++) {
			if (sources[i] !== i) {
				if (dCount === K_DISP) {
					dCount = K_DISP + 1;
					break;
				}
				_disp[dCount++] = i;
			}
		}
		if (dCount <= K_DISP) {
			const endAnchor: Node = afterMiddle ? afterMiddle.startMarker! : state.end;
			// Move right-to-left. Positions to the right of the rightmost
			// displaced index are identity-mapped and have stable startMarkers;
			// each moved block becomes the next iteration's anchor.
			for (let j = dCount - 1; j >= 0; j--) {
				const i = _disp[j];
				const block = oldItems.get(newKeys[i])!;
				const anchor: Node =
					i + 1 < newMidLen ? oldItems.get(newKeys[i + 1])!.startMarker! : endAnchor;
				moveBlockBefore(block, anchor);
			}
			// Relink prev/next around each displaced position. Non-displaced
			// neighbours of displaced blocks get their boundary pointers updated
			// here too; non-displaced blocks BETWEEN two displaced positions keep
			// their internal pointers (they were never touched by the survivor
			// walk and the moves above don't reorder them).
			for (let j = 0; j < dCount; j++) {
				const i = _disp[j];
				const block = oldItems.get(newKeys[i])!;
				const prev = i > 0 ? oldItems.get(newKeys[i - 1])! : beforeMiddle;
				const next = i + 1 < newMidLen ? oldItems.get(newKeys[i + 1])! : afterMiddle;
				block.prevSibling = prev;
				block.nextSibling = next;
				if (prev) prev.nextSibling = block;
				else state.head = block;
				if (next) next.prevSibling = block;
				else state.tail = block;
			}
			// Boundary patch: the first and last block of the NEW middle may be
			// identity-mapped (not in _disp), in which case the displacement
			// loop never touched them — they still carry their pre-reconcile
			// neighbour pointers, which can be stale (e.g. pointing at a block
			// that the survivor walk just unmounted, or at a prior-reconcile
			// neighbour that has since shifted). Always re-pin the boundary
			// pointers so state.head / state.tail / beforeMiddle.next /
			// afterMiddle.prev are correct for the next reconcile.
			//
			// Repro for why this matters: surfaced by fuzz-keyed-list seed
			// -1491785866 — a `replace-all` that shrinks the list (e.g. 6 → 3)
			// where the last survivor is identity-mapped. Without the patch,
			// state.tail keeps pointing at the prior-tail block (now deleted)
			// and the surviving last block's .nextSibling still points at the
			// removed sibling. The next reconcile then stops its old-middle
			// walk early (at the stale nextSibling) and re-mounts the
			// last survivor as a NEW block, producing a duplicate row.
			const newMidFirst = oldItems.get(newKeys[0])!;
			const newMidLast = oldItems.get(newKeys[newMidLen - 1])!;
			newMidFirst.prevSibling = beforeMiddle;
			newMidLast.nextSibling = afterMiddle;
			if (beforeMiddle) beforeMiddle.nextSibling = newMidFirst;
			else state.head = newMidFirst;
			if (afterMiddle) afterMiddle.prevSibling = newMidLast;
			else state.tail = newMidLast;
			return;
		}
	}

	// Walk new middle back-to-front. For each new position: mount / move / leave.
	// Track:
	//   nextBlock  = block at position i+1 (already placed), or afterMiddle initially
	//                — used as the DOM anchor and prev/next neighbour
	//   lastPlaced = block placed in the FIRST iteration (= new middle's tail)
	const middleEndAnchor: Node = afterMiddle ? afterMiddle.startMarker! : state.end;
	let nextBlock: Block | null = afterMiddle;
	let lastPlaced: Block | null = null;

	if (moved) {
		const seq = lis(sources);
		let seqIdx = seq.length - 1;
		for (let i = newMidLen - 1; i >= 0; i--) {
			const targetIdx = i + prefixLen;
			const key = newKeys[i];
			const anchor: Node = nextBlock ? nextBlock.startMarker! : middleEndAnchor;
			let block: Block;
			if (sources[i] === -1) {
				// Mount: new item, no old counterpart.
				const item = items[targetIdx];
				block = mountItem(
					parentBlock,
					parentNode,
					anchor,
					item,
					targetIdx,
					itemBody,
					extra,
					state,
					singleRoot,
				);
				oldItems.set(key, block);
				block.key = key;
				state.size++;
			} else if (seqIdx < 0 || i !== seq[seqIdx]) {
				// Move: survivor not in the LIS → DOM range moves before anchor.
				block = oldItems.get(key)!;
				moveBlockBefore(block, anchor);
			} else {
				// Leave: survivor in the LIS → DOM stays put.
				block = oldItems.get(key)!;
				seqIdx--;
			}
			// Re-link into the new middle chain. We rebuild middle pointers from
			// scratch; every middle block's prev/next gets rewritten here.
			block.nextSibling = nextBlock;
			if (nextBlock) nextBlock.prevSibling = block;
			if (lastPlaced === null) lastPlaced = block;
			nextBlock = block;
		}
	} else {
		// No moves but at least one mount (we'd have returned already if all survivors).
		for (let i = newMidLen - 1; i >= 0; i--) {
			const targetIdx = i + prefixLen;
			const key = newKeys[i];
			const anchor: Node = nextBlock ? nextBlock.startMarker! : middleEndAnchor;
			let block: Block;
			if (sources[i] === -1) {
				const item = items[targetIdx];
				block = mountItem(
					parentBlock,
					parentNode,
					anchor,
					item,
					targetIdx,
					itemBody,
					extra,
					state,
					singleRoot,
				);
				oldItems.set(key, block);
				block.key = key;
				state.size++;
			} else {
				block = oldItems.get(key)!;
			}
			block.nextSibling = nextBlock;
			if (nextBlock) nextBlock.prevSibling = block;
			if (lastPlaced === null) lastPlaced = block;
			nextBlock = block;
		}
	}

	// Splice the freshly-built new middle in between beforeMiddle and afterMiddle.
	// newMiddleHead = `nextBlock` after the loop (last iteration placed item[prefixLen]).
	// newMiddleTail = `lastPlaced` (first iteration placed item[newEnd]).
	// newMiddleTail.nextSibling was set to afterMiddle in the first loop iter,
	// and afterMiddle.prevSibling (if non-null) was set to newMiddleTail. So only
	// the HEAD side of the splice remains.
	const newMiddleHead = nextBlock!;
	const newMiddleTail = lastPlaced!;
	newMiddleHead.prevSibling = beforeMiddle;
	if (beforeMiddle) beforeMiddle.nextSibling = newMiddleHead;
	else state.head = newMiddleHead;
	if (!afterMiddle) state.tail = newMiddleTail;
}

/**
 * Bulk-clear a forBlock's items. When the forBlock owns its parent (markers
 * bracket the entire content), uses `textContent = ''` — the fastest DOM clear
 * on Chromium per Ripple's measured advantage on the `clear` op. Otherwise
 * falls back to a scoped Range deletion.
 *
 * Skips the per-item disposal loop unless at least one item has cleanups,
 * which is detected by tracking `hasCleanups` on the ForSlot.
 */
function batchClearItems(state: ForSlot, oldItems: Map<any, Block>): void {
	const p = state.start.parentNode!;
	if (state.start.previousSibling === null && state.end.nextSibling === null) {
		// forBlock owns the parent — nuke everything in one DOM op, then re-add markers.
		(p as Element).textContent = '';
		p.appendChild(state.start);
		p.appendChild(state.end);
	} else {
		// Shared parent (other JSX interleaved) — scoped Range delete keeps neighbors intact.
		const range = document.createRange();
		range.setStartAfter(state.start);
		range.setEndBefore(state.end);
		range.deleteContents();
	}
	// Disposal: mark + run cleanups only when needed. Common case (no useEffect
	// inside list items) skips the iteration entirely.
	if (state.hasCleanups) {
		const it = oldItems.values();
		for (let r = it.next(); !r.done; r = it.next()) {
			const b = r.value;
			b.disposed = true;
			if (b.cleanups.length > 0 || b.children.length > 0) fireCleanupsOnly(b);
		}
	}
	oldItems.clear();
}

function mountItem<T, E>(
	parentBlock: Block,
	parentNode: Node,
	anchor: Node,
	item: T,
	index: number,
	body: (s: Scope, item: T, extra: E) => void,
	extra: E,
	forSlot: ForSlot,
	singleRoot: boolean,
): Block {
	if (hydrating) {
		// Hydration: the server wrapped EVERY item in its own `<!--[-->…<!--]-->`
		// range (regardless of the client `singleRoot` optimization, which the
		// server can't know). Adopt this item's markers off the cursor, point the
		// cursor at its content for the body's clone(), then advance past it to the
		// next item's marker. (Hydrated items thus carry markers — the singleRoot
		// no-marker path is a client-mount-only optimization.)
		const itemStart = hydrateNode as Comment;
		const itemEnd = matchingClose(itemStart as Node);
		hydrateNode = itemStart.nextSibling;
		const block = createBlock(
			'control-flow',
			parentBlock,
			parentNode,
			itemStart,
			itemEnd,
			body as ComponentBody,
			item,
			extra,
		);
		block.forSlot = forSlot;
		block.itemIndex = index;
		renderBlock(block);
		hydrateNode = itemEnd.nextSibling;
		return block;
	}
	if (singleRoot) {
		// Compiler verified the body emits exactly one Element root — skip the
		// per-item Comment markers and use the inserted element as both start
		// and end. For a 1000-row table that means 2000 fewer DOM nodes inside
		// <tbody>, which the browser's layout/paint walks every time. Big paint
		// win when the slowdown is "tbody has 3000 children" not "JS is slow".
		const block = createBlock(
			'control-flow',
			parentBlock,
			parentNode,
			null,
			anchor,
			body as ComponentBody,
			item,
			extra,
		);
		block.forSlot = forSlot;
		block.itemIndex = index;
		renderBlock(block);
		// Body inserted ONE node right before `anchor` via
		// `__block.parentNode.insertBefore(_root, __block.endMarker)`. Grab it
		// and promote it to start === end. From now on `block.endMarker` is the
		// actual element (so subsequent body re-renders insert nothing — the
		// update path mutates the cached _b._el$N refs directly).
		const root = anchor.previousSibling!;
		block.startMarker = root;
		block.endMarker = root;
		return block;
	}
	const start = document.createComment('it');
	const end = document.createComment('/it');
	parentNode.insertBefore(start, anchor);
	parentNode.insertBefore(end, anchor);
	const block = createBlock(
		'control-flow',
		parentBlock,
		parentNode,
		start,
		end,
		body as ComponentBody,
		item,
		extra,
	);
	block.forSlot = forSlot;
	block.itemIndex = index;
	renderBlock(block);
	return block;
}

function moveBlockBefore(block: Block, anchor: Node): void {
	const parent = block.startMarker!.parentNode!;
	const end = block.endMarker!;
	let n: Node | null = block.startMarker!;
	// Walk by checking `n === end` BEFORE moving. The previous design captured
	// `stop = endMarker.nextSibling` at function entry, then iterated until
	// `n === stop`. That breaks when the block range has multi-root content
	// (e.g. fragment items with start/end Comment markers + N body nodes):
	// after moving start + body nodes adjacent to `anchor`, the rest of the
	// range (including `endMarker`) sits at the OLD position. When the walker
	// finally reaches `endMarker`, its captured `nextSibling` points BACK to
	// the already-moved start (now adjacent at `endMarker`'s new neighbour
	// position), so the walker loops back into the range and never terminates.
	while (n) {
		const isEnd = n === end;
		const next: Node | null = n.nextSibling;
		parent.insertBefore(n, anchor);
		if (isEnd) break;
		n = next;
	}
}

/**
 * Longest Increasing Subsequence — returns indices into `arr` whose values form the LIS.
 * Skips entries where arr[i] === -1 (new items).
 * Ported from the standard O(n log n) patience-sort algorithm used by Ripple/Solid/Vue.
 */
function lis(arr: Int32Array): number[] {
	const n = arr.length;
	const p = new Int32Array(n);
	const result: number[] = [];
	for (let i = 0; i < n; i++) {
		const v = arr[i];
		if (v === -1) continue;
		if (result.length === 0 || arr[result[result.length - 1]] < v) {
			p[i] = result.length === 0 ? -1 : result[result.length - 1];
			result.push(i);
			continue;
		}
		// Binary search for the smallest tail >= v.
		let lo = 0,
			hi = result.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (arr[result[mid]] < v) lo = mid + 1;
			else hi = mid;
		}
		if (v < arr[result[lo]]) {
			p[i] = lo > 0 ? result[lo - 1] : -1;
			result[lo] = i;
		}
	}
	// Reconstruct.
	let u = result.length;
	let v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}

// ---------------------------------------------------------------------------
// Public root API — React-DOM parity
// ---------------------------------------------------------------------------

export interface Root {
	/**
	 * Render into this root. Two forms:
	 *  - React-style:   `root.render(<App foo={x}/>)` — a single element descriptor
	 *    (the compiler lowers the JSX to `createElement(App, {foo: x})`).
	 *  - Body + props:  `root.render(App, { foo: x })` — the original ripple-new
	 *    form, kept for direct (non-JSX) callers and existing test helpers.
	 * Re-rendering with the same component (`type`/body) updates props in place;
	 * a different component tears down and remounts.
	 */
	render(element: ElementDescriptor): void;
	render(body: ComponentBody, props?: any): void;
	unmount(): void;
}

export function createRoot(container: Element): Root {
	let rootBlock: Block | null = null;
	let currentBody: ComponentBody | null = null;
	// Register the container as an event-delegation target up front. Listeners
	// for all currently-known delegated events attach now; any new event types
	// registered later (via `delegateEvents`) will back-attach automatically.
	registerDelegationTarget(container);
	return {
		render(bodyOrElement: ComponentBody | ElementDescriptor, props?: any) {
			// React-style `render(<App foo={x}/>)` arrives as an element descriptor:
			// unwrap to (type, props). The `render(body, props)` form passes through.
			let body: ComponentBody;
			if (isElementDescriptor(bodyOrElement)) {
				body = bodyOrElement.type;
				props = bodyOrElement.props;
			} else {
				body = bodyOrElement;
			}
			if (rootBlock && currentBody === body) {
				rootBlock.props = props;
				scheduleRender(rootBlock);
				return;
			}
			if (rootBlock) {
				unmountBlock(rootBlock);
				rootBlock = null;
				currentBody = null;
			}
			while (container.firstChild) container.removeChild(container.firstChild);
			rootBlock = createBlock('root', null, container, null, null, body, props);
			currentBody = body;
			renderBlock(rootBlock);
			// First render commits effects on next microtask flush.
			if (!syncFlush && !scheduled) {
				scheduled = true;
				queueMicrotask(flush);
			}
		},
		unmount() {
			if (rootBlock) {
				// Skip the per-Block DOM walk recursion (~3 removeChild ops × every
				// Block in the tree). Run cleanups + scope teardown only, then clear
				// the container in one shot. Portals self-detach during the recursive
				// teardown because their DOM lives in a foreign target — see the
				// portalSlotSlot branch in unmountScope.
				unmountBlock(rootBlock, /*detachDom*/ false);
				container.textContent = '';
				rootBlock = null;
				currentBody = null;
			}
			unregisterDelegationTarget(container);
		},
	};
}

/**
 * Hydrate a server-rendered container (SSR Phase 2). Instead of clearing the
 * container and cloning fresh DOM, the compiled mount ADOPTS the existing
 * server DOM: `clone()` returns the server root, `htext()` adopts server text
 * nodes, and event handlers / update bindings are stamped on the adopted nodes
 * (`hydrating` flag, see clone/htext). The seeded prev-values make the first
 * update a no-op when the client matches the server (no mismatch re-render).
 *
 * Phase 2 scope: a single-root leaf component — element structure, attributes,
 * single-text-children, events, refs, innerHTML. Nested components, adjacent /
 * mixed text holes and control flow arrive in a later phase.
 */
export function hydrate(
	bodyOrElement: ComponentBody | ElementDescriptor,
	container: Element,
	props?: any,
): { unmount(): void } {
	let body: ComponentBody;
	if (isElementDescriptor(bodyOrElement)) {
		body = bodyOrElement.type;
		props = bodyOrElement.props;
	} else {
		body = bodyOrElement;
	}
	registerDelegationTarget(container);
	const rootBlock = createBlock('root', null, container, null, null, body, props);
	hydrating = true;
	// Adopt server-serialized use(thenable) values, if any: pull them out of the
	// inline data <script> (and remove it, so it isn't taken for a hydratable
	// node) and stage them for useThenable to consume in render order.
	const seedScript = container.querySelector('script[' + SUSPENSE_SCRIPT_ATTR + ']');
	if (seedScript !== null) {
		try {
			// Reviver decodes the server's `undefined` sentinel back to `undefined`
			// (JSON has no `undefined`), so a `use(thenable)` that resolved to
			// `undefined` is seeded as `undefined`, not `null`.
			hydrationSeeds = JSON.parse(seedScript.textContent || '[]', (_key, value) =>
				value !== null && typeof value === 'object' && value[UNDEFINED_SENTINEL_KEY] === true
					? undefined
					: value,
			);
		} catch {
			hydrationSeeds = null;
		}
		hydrationSeedCursor = 0;
		seedScript.remove();
	}
	// The component's server root is the container's first node — the initial
	// cursor position. clone() adopts it; a hole-template walk advances from here.
	hydrateNode = container.firstChild;
	try {
		renderBlock(rootBlock);
	} finally {
		hydrating = false;
		hydrateNode = null;
		hydrationSeeds = null;
		hydrationSeedCursor = 0;
	}
	// Commit effects on the next microtask flush (same as createRoot's first render).
	if (!syncFlush && !scheduled) {
		scheduled = true;
		queueMicrotask(flush);
	}
	return {
		unmount() {
			unmountBlock(rootBlock, /*detachDom*/ false);
			container.textContent = '';
			unregisterDelegationTarget(container);
		},
	};
}
