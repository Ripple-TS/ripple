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
}

interface EffectSlot {
	deps: any[] | undefined;
	cleanup: Cleanup | undefined;
}

interface PendingEffect {
	scope: Scope;
	slot: symbol;
	fn: EffectFn;
	args: any[];
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
	const mode: 'urgent' | 'transition' = TRANSITION_DEPTH > 0 ? 'transition' : 'urgent';
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
	while (QUEUE.length) {
		const block = QUEUE.shift()!;
		block.pending = false;
		if (!block.disposed) {
			try {
				renderBlock(block);
			} catch (err) {
				handleRenderError(block, err);
			}
		}
	}
	commitEffects();
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
		while (QUEUE.length) {
			const block = QUEUE.shift()!;
			block.pending = false;
			if (!block.disposed) {
				try {
					renderBlock(block);
				} catch (err) {
					handleRenderError(block, err);
				}
			}
		}
		commitEffectsSync();
		return result;
	} finally {
		syncFlush = prevSync;
	}
}

// ---------------------------------------------------------------------------
// Effect commit pipeline (insertion → layout → passive)
// ---------------------------------------------------------------------------

function commitEffects(): void {
	drainPhase(INSERTION);
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
	for (let i = 0; i < q.length; i++) {
		const e = q[i];
		if (e.scope.block.disposed) continue;
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
		if (e.scope.block.disposed) continue;
		let cleanup: void | Cleanup;
		try {
			cleanup = e.fn.apply(null, e.args as []);
		} catch (err) {
			// Route effect errors to the nearest enclosing tryBlock, if any.
			const handler = findTryHandler(e.scope.block);
			if (handler) handler(err);
			else console.error(err);
			continue;
		}
		const slot = e.scope.hooks?.get(e.slot) as EffectSlot | undefined;
		if (slot && typeof cleanup === 'function') {
			slot.cleanup = cleanup;
			e.scope.cleanups.push(cleanup);
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
	// Hooks + cleanups (per-block state).
	hooks: Map<symbol, any> | null;
	cleanups: Cleanup[];
	children: ChildScope[];
	_slots: any[] | null;
	$$ctxValues: Map<Context<any>, any> | null;
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
		this.hooks = null;
		this.cleanups = [];
		this.children = [];
		this._slots = null;
		this.$$ctxValues = null;
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
		scope.block = new LiteBlockImpl(host, anchor ?? null, parentScope.block) as unknown as Block;
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
			if (k === 'ifBlockSlot' || k === 'switchBlockSlot') {
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

export function useReducer<S, A>(
	reducer: (s: S, a: A) => S,
	initial: S | (() => S),
	slot?: symbol,
): [S, (action: A) => void] {
	if (slot === undefined) missingSlot('useReducer');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as
		| { value: S; dispatch: (a: A) => void; reducer: (s: S, a: A) => S }
		| undefined;
	if (s === undefined) {
		const initVal = typeof initial === 'function' ? (initial as () => S)() : initial;
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

function enqueueEffect(slot: symbol, fn: EffectFn, deps: any[], phase: Phase): void {
	const scope = CURRENT_SCOPE!;
	const prev = scope.hooks?.get(slot) as EffectSlot | undefined;
	if (prev && !depsChanged(prev.deps, deps)) return;
	if (!prev) {
		ensureHooks(scope).set(slot, { deps, cleanup: undefined });
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

export function useEffect(fn: EffectFn, deps: any[], slot?: symbol): void {
	if (slot === undefined) missingSlot('useEffect');
	enqueueEffect(slot, fn, deps, PASSIVE);
}
export function useLayoutEffect(fn: EffectFn, deps: any[], slot?: symbol): void {
	if (slot === undefined) missingSlot('useLayoutEffect');
	enqueueEffect(slot, fn, deps, LAYOUT);
}
export function useInsertionEffect(fn: EffectFn, deps: any[], slot?: symbol): void {
	if (slot === undefined) missingSlot('useInsertionEffect');
	enqueueEffect(slot, fn, deps, INSERTION);
}

export function useMemo<T>(compute: (...deps: any[]) => T, deps: any[], slot?: symbol): T {
	if (slot === undefined) missingSlot('useMemo');
	const scope = CURRENT_SCOPE!;
	const prev = scope.hooks?.get(slot) as { deps: any[]; value: T } | undefined;
	if (prev && !depsChanged(prev.deps, deps)) return prev.value;
	// eslint-disable-next-line prefer-spread
	const value = compute.apply(null, deps);
	ensureHooks(scope).set(slot, { deps, value });
	return value;
}

export function useCallback<F extends (...args: any[]) => any>(
	fn: F,
	deps: any[],
	slot?: symbol,
): F {
	if (slot === undefined) missingSlot('useCallback');
	return useMemo(() => fn, deps, slot);
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
	deps: any[],
	slot?: symbol,
): void {
	if (slot === undefined) missingSlot('useImperativeHandle');
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
	// trailing Symbol preceded by another arg → user passed getServerSnapshot
	// (currently ignored; no SSR pipeline yet).
	const slot = rest[rest.length - 1] as symbol | undefined;
	if (slot === undefined || typeof slot !== 'symbol') missingSlot('useSyncExternalStore');
	const desc = slot.description ?? '';
	const tickSlot = Symbol.for(desc + ':uses:tick');
	const effectSlot = Symbol.for(desc + ':uses:effect');

	// Force a re-render when the store fires onStoreChange.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [, setTick] = useState(0, tickSlot);

	// Subscribe on mount; re-subscribe if subscribe identity changes.
	useEffect(
		() => {
			const handle = (): void => setTick((t: number) => t + 1);
			return subscribe(handle);
		},
		[subscribe],
		effectSlot,
	);

	// Fresh read on every render — guards against tearing between commits.
	return getSnapshot();
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
}

/**
 * Create a Context. Providers push the value into a Block-scoped slot; `use(ctx)`
 * walks the Block parent chain to find the nearest Provider for that context.
 */
export function createContext<T>(defaultValue: T): Context<T> {
	const ctx = { $$kind: CONTEXT_TAG, defaultValue } as Context<T>;
	// A Provider is a built-in component that stamps the value on its Block
	// and renders its `children` body inside its scope.
	ctx.Provider = function ProviderBody(scope, props) {
		// Stash on the scope (not block) so siblings of the Provider don't see it.
		// $$ctxValues is pre-initialised to null on every Scope/Block so this
		// assignment is a hidden-class-stable update (not a late stamp).
		if (scope.$$ctxValues === null) scope.$$ctxValues = new Map();
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

function useContextInternal<T>(context: Context<T>): T {
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

export function clone<T extends Node>(node: T): T {
	return node.cloneNode(true) as T;
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
export function attachRef(ref: any, el: Element | FragmentInstance | null): void {
	if (ref == null) return;
	if (typeof ref === 'function') {
		ref(el);
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
	 * Live registry of listeners added via addEventListener so subsequent
	 * removeEventListener calls can find them. Each entry records the host
	 * elements the listener was applied to so we can detach in one walk.
	 * `null` until the first addEventListener — keeps the per-instance
	 * memory cost at zero for fragments that never use the listener API.
	 */
	_listeners: Array<{
		type: string;
		listener: EventListenerOrEventListenerObject;
		options: AddEventListenerOptions | boolean | undefined;
		applied: Element[];
	}> | null;

	constructor(ownerBlock: Block, startMarker: Comment, endMarker: Comment) {
		this._ownerBlock = ownerBlock;
		this._startMarker = startMarker;
		this._endMarker = endMarker;
		this._destroyed = false;
		this._listeners = null;
	}

	_destroy(): void {
		this._destroyed = true;
		// Detach any still-registered listeners from their host elements so
		// stale closures don't keep DOM nodes / scopes alive after unmount.
		if (this._listeners) {
			for (const entry of this._listeners) {
				for (const el of entry.applied) {
					el.removeEventListener(entry.type, entry.listener, entry.options as any);
				}
			}
			this._listeners = null;
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
	 * Attaches a listener to every DIRECT (host-Element) child of the
	 * fragment, in tree order. Events that bubble up from descendants
	 * fire the listener too (standard DOM event bubbling). The listener
	 * is also recorded on the FragmentInstance so a later
	 * removeEventListener with the same (type, listener, options.capture)
	 * tuple detaches them in one walk.
	 *
	 * The current implementation is a SNAPSHOT model: children present
	 * at addEventListener-time get the listener, but children inserted
	 * later (via state changes inside the fragment) do not. React's spec
	 * is "applies to future children too" — that's tracked separately and
	 * will land alongside the dynamic-list integration. Snapshot mode is
	 * sufficient for the vast majority of real-world fragment-ref uses
	 * (tooltip / focus-trap libraries attach to a static child set).
	 */
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions | boolean,
	): void {
		if (this._destroyed) return;
		const applied: Element[] = [];
		let node: ChildNode | null = this._startMarker.nextSibling;
		while (node && node !== this._endMarker) {
			if (node.nodeType === 1) {
				(node as Element).addEventListener(type, listener, options as any);
				applied.push(node as Element);
			}
			node = node.nextSibling;
		}
		if (!this._listeners) this._listeners = [];
		this._listeners.push({ type, listener, options, applied });
	}

	/**
	 * Removes a listener that was previously added via this same
	 * FragmentInstance. The (type, listener, options.capture) tuple must
	 * match the original add call — same identity rule the platform
	 * uses on EventTarget.removeEventListener. Unmatched calls are a
	 * silent no-op (DOM parity).
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
			for (const el of entry.applied) {
				el.removeEventListener(type, listener, entry.options as any);
			}
			this._listeners.splice(i, 1);
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
	observeUsing(observer: { observe(target: Element): void }): void {
		if (this._destroyed) return;
		let node: ChildNode | null = this._startMarker.nextSibling;
		while (node && node !== this._endMarker) {
			if (node.nodeType === 1) observer.observe(node as Element);
			node = node.nextSibling;
		}
	}

	/**
	 * Forwards .unobserve() on the supplied observer to every direct fragment
	 * child. Mirrors observeUsing — same membership rule (direct children
	 * present at call time).
	 */
	unobserveUsing(observer: { unobserve(target: Element): void }): void {
		if (this._destroyed) return;
		let node: ChildNode | null = this._startMarker.nextSibling;
		while (node && node !== this._endMarker) {
			if (node.nodeType === 1) observer.unobserve(node as Element);
			node = node.nextSibling;
		}
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
	attachRef(ref, fi);
	scope.cleanups.push(() => {
		attachRef(ref, null);
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
// Style — kebab-case object form (Ripple semantics) or full cssText string.
// `prev` is the previous value tracked by the compiler so we can diff
// object→object and only touch the properties that changed.
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
			if (!(k in value)) style.removeProperty(k);
		}
		for (const k in value) {
			const v = value[k];
			if (v === prev[k]) continue;
			if (v == null || v === false) style.removeProperty(k);
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

function applyStyleProperty(style: CSSStyleDeclaration, name: string, value: any): void {
	const s = typeof value === 'number' ? String(value) : (value as string);
	// CodeQL flagged the prior `/\s*!important\s*$/` test+replace combo as
	// polynomial-regex-on-uncontrolled-input. Same job in linear time using
	// built-in trimEnd() + endsWith() — no regex, no backtracking risk.
	const tail = s.trimEnd();
	if (tail.endsWith(IMPORTANT_SUFFIX)) {
		style.setProperty(
			name,
			tail.slice(0, tail.length - IMPORTANT_SUFFIX.length).trimEnd(),
			'important',
		);
	} else {
		style.setProperty(name, s);
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

export function setSpread(el: Element, value: any, prev: any): void {
	// Remove keys present in prev but absent (or set differently for events) in value.
	if (prev) {
		for (const k in prev) {
			if (k === 'key' || k === 'children' || k === 'ref') continue;
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
			if (typeof v === 'function') v(el);
			else if (v != null) (v as any).current = el;
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

export function injectStyle(id: string, css: string): void {
	if (_injectedStyles.has(id)) return;
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
		const start = document.createComment('comp');
		const end = document.createComment('/comp');
		// insertBefore(_, null) === appendChild — covers both end-of-parent and
		// mid-range insertion (e.g. when this slot lives in a multi-root template
		// and must sit before its enclosing block's endMarker).
		domParent.insertBefore(start, anchor ?? null);
		domParent.insertBefore(end, anchor ?? null);
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
		if ((comp as any).__memo === true && shallowEqualProps(state.block.props, props)) {
			// Keep the committed props identity — diffing against them next time
			// is what makes the memo terminate.
			return;
		}
		state.block.props = props;
		renderBlock(state.block);
	}
}

function shallowEqualProps(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	const ka = Object.keys(a),
		kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (let i = 0; i < ka.length; i++) {
		const k = ka[i];
		if (a[k] !== b[k]) return false;
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
 */
export function memo<P>(component: ComponentBody<P>): ComponentBody<P> {
	function memoWrapper(scope: Scope, props: P, extra: any): void {
		component(scope, props, extra);
	}
	(memoWrapper as any).__memo = true;
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
		const start = document.createComment('try');
		const end = document.createComment('/try');
		// insertBefore(_, null) === appendChild — covers both end-of-parent and
		// mid-range insertion (e.g. when this slot lives in a mixed-children
		// template and must sit before its in-template static-sibling anchor).
		domParent.insertBefore(start, anchor ?? null);
		domParent.insertBefore(end, anchor ?? null);
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
	const bStart = document.createComment('try-b');
	const bEnd = document.createComment('/try-b');
	state.domParent.insertBefore(bStart, state.end);
	state.domParent.insertBefore(bEnd, state.end);
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

	if (sourceBlock === state.tryBlock) {
		// Urgent suspend on the try-body block itself (initial render OR
		// re-render). PRESERVE its hooks Map and `_b.*` bindings so useMemo /
		// useState etc. survive across replays — matches React's WIP-discard
		// contract where even an unfinished render's hook state is preserved.
		softDetachTryBlock(state);
	} else {
		// Nested-block suspended — pop the whole try subtree. (Rare in current
		// codegen; future enhancement could preserve more granularly.)
		if (state.tryBlock) {
			unmountBlock(state.tryBlock);
			state.tryBlock = null;
		}
	}
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

export function startTransition(fn: () => void): void {
	// Bump the priority flag FIRST so any scheduleRender calls fired by the
	// listener notification (and by fn itself) are tagged as transition.
	TRANSITION_DEPTH++;
	try {
		tickTransitionCount(+1);
		try {
			fn();
		} finally {
			TRANSITION_DEPTH--;
		}
	} catch (err) {
		tickTransitionCount(-1);
		throw err;
	}
	// The synchronous slice is done. Decrement after the scheduler has had a
	// chance to flush the queued renders this transition produced — if any of
	// those renders held the transition open by suspending, they incremented
	// the count themselves via handleSuspense, so the net count stays > 0.
	queueMicrotask(() => tickTransitionCount(-1));
}

export function useTransition(slot?: symbol): [boolean, (fn: () => void) => void] {
	if (slot === undefined) missingSlot('useTransition');
	const scope = CURRENT_SCOPE!;
	const block = CURRENT_BLOCK!;
	let s = scope.hooks?.get(slot) as
		| { isPending: boolean; start: (fn: () => void) => void }
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
		const start = document.createComment('if');
		const end = document.createComment('/if');
		// insertBefore(_, null) === appendChild — covers both end-of-parent and
		// mid-range insertion (e.g. when this slot lives in a mixed-children
		// template and must sit before its static-element/text siblings). The
		// compiler emits a `<!>` placeholder at the if-block's source-order
		// index and passes the captured Comment as `anchor`.
		domParent.insertBefore(start, anchor ?? null);
		domParent.insertBefore(end, anchor ?? null);
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
			const bStart = document.createComment('br');
			const bEnd = document.createComment('/br');
			domParent.insertBefore(bStart, state.end);
			domParent.insertBefore(bEnd, state.end);
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
		const start = document.createComment('switch');
		const end = document.createComment('/switch');
		// insertBefore(_, null) === appendChild — covers both end-of-parent and
		// mid-range insertion (e.g. when this slot sits before static-element
		// siblings authored AFTER the @switch in source order).
		domParent.insertBefore(start, anchor ?? null);
		domParent.insertBefore(end, anchor ?? null);
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
			const bStart = document.createComment('case');
			const bEnd = document.createComment('/case');
			domParent.insertBefore(bStart, state.end);
			domParent.insertBefore(bEnd, state.end);
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
		const start = document.createComment('for');
		const end = document.createComment('/for');
		// insertBefore(_, null) === appendChild — covers both end-of-parent and
		// mid-range insertion (when a static sibling follows this @for in mixed
		// children, the compiler emits a `<!>` anchor at the @for's source-order
		// index and threads it here so the markers land BEFORE the sibling).
		domParent.insertBefore(start, anchor ?? null);
		domParent.insertBefore(end, anchor ?? null);
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
			domParent.insertBefore(bStart, state.end);
			domParent.insertBefore(bEnd, state.end);
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
	// same shape & order as new middle. Linked-list pointers are still correct
	// (we never touched them). Just return.
	if (!moved && patched === newMidLen) return;

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
		render(body, props) {
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
