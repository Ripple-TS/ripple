/**
 * ripple-new server runtime (SSR Phase 1).
 *
 * The `@tsrx/ripple-new` compiler, in `mode: 'server'`, emits component bodies
 * that build an HTML STRING (instead of cloning a DOM template) by calling the
 * `ssr*` helpers here, and that call these server hook implementations. The
 * server analogue of `createRoot().render()` is `render(Component, props)` →
 * `{ head, body, css }`.
 *
 * Phase 1 scope: static markup, dynamic text holes, attributes (incl. class /
 * style / spread), nested components, scoped CSS collection, and the leaf hooks
 * (state returns its initial value, effects no-op, memo runs once, ids are
 * deterministic). Events and refs are dropped (no DOM on the server). Control
 * flow (@if/@for/@switch/@try), portals, Activity and fragment refs are rejected
 * by the compiler in server mode until later phases. No hydration markers are
 * emitted yet — that arrives with the client hydrate runtime.
 */

// ---------------------------------------------------------------------------
// Per-render ambient state. A render is synchronous and single-threaded, so a
// module-global "current scope" (mirroring the client's CURRENT_SCOPE) is safe.
// ---------------------------------------------------------------------------

import {
	BLOCK_OPEN,
	BLOCK_CLOSE,
	EMPTY_COMMENT,
	SUSPENSE_SCRIPT_ATTR,
	UNDEFINED_SENTINEL_KEY,
} from './constants';

interface SSRScope {
	parent: SSRScope | null;
	/** Context Provider values stamped on this scope (lazily allocated). */
	$$ctxValues: Map<unknown, unknown> | null;
}

type ServerComponent = (scope: SSRScope, props: any, extra?: any) => string;

let CURRENT_SCOPE: SSRScope | null = null;
let ID_COUNTER = 0;
let CSS: Map<string, string> | null = null;
// Accumulates top-level `<head>` content during the active render pass (a
// mutable container, mirroring CSS's mutable Map, so a per-pass local capture
// keeps accumulating via `HEAD.html +=` even though strings are immutable).
// Returned as RenderResult.head; the metaframework injects it at <!--ssr-head-->.
let HEAD: { html: string } | null = null;

// Suspense (SSR Phase 4). A render pass that reaches an unresolved `use(thenable)`
// records the thenable in SUSPENDED and throws SSR_SUSPENSE; the nearest @try
// renders its @pending fallback. render()'s retry loop awaits everything in
// SUSPENDED, caches each outcome in RESOLVED (keyed by the compiler-injected
// call-site key + per-pass occurrence index), then re-renders — on the next pass
// use() finds the cached value and returns it, so the @try renders its success
// arm (or, on rejection, routes the error to @catch). SERIAL collects the
// resolved values in render (depth-first) order so the client can seed them back
// in the same order during hydration. OCC counts per-site occurrences so a use()
// inside an @for gets a distinct key per iteration. All four are reinstalled
// fresh at the top of every pass (see render()) so concurrent render() calls
// that interleave across an `await` cannot clobber one another.
let SUSPENDED: { promise: PromiseLike<unknown>; key: string }[] | null = null;
let RESOLVED: Map<string, { value: unknown } | { reason: unknown }> | null = null;
let SERIAL: unknown[] | null = null;
let OCC: Map<string, number> | null = null;

function ssrScope(parent: SSRScope | null): SSRScope {
	return { parent, $$ctxValues: null };
}

const NOOP = (): void => {};

// Matches the client runtime's `ELEMENT_TAG` (createElement descriptor marker)
// so `ssrChild` can render a `<Comp/>`-as-value descriptor server-side too.
const ELEMENT_TAG = Symbol.for('ripple-new.element');

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

export function escapeHtml(v: unknown): string {
	return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(v: unknown): string {
	return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Codegen helpers — the compiled server body interleaves static HTML chunks
// with these calls. All return a string fragment.
// ---------------------------------------------------------------------------

/** A dynamic text hole. null/false/undefined render as empty (React parity). */
export function ssrText(v: unknown): string {
	if (v == null || v === false) return '';
	return escapeHtml(v);
}

/**
 * A RENDERABLE expression hole — the value of a `{expr}` that is NOT marked as
 * definite text (`{expr as string}`). Mirrors Ripple: a `{children}` / component
 * function or element descriptor RENDERS (wrapped in a hydration block range, so
 * the client adopts it), while a primitive coerces to text. The compiler routes
 * `{x as string}` / literals / `+`-concats to `ssrText`, everything else here.
 */
export function ssrChild(v: unknown, scope: SSRScope): string {
	// Every renderable hole serializes to ONE `<!--[-->…<!--]-->` range so the
	// client's childSlot adopts a uniform marker pair on hydration regardless of
	// whether the value is a component, an element, a primitive, or empty — and
	// an empty hole still occupies one logical node, keeping sibling cursor
	// alignment intact. `ssrComponent` already wraps its output in block markers.
	if (v == null || v === false || v === true) return ssrBlock('');
	// A component-body / children render function, or `<Comp/>` used as a value.
	if (typeof v === 'function') return ssrComponent(scope, v as ServerComponent, {});
	if (typeof v === 'object' && (v as any).$$kind === ELEMENT_TAG) {
		const d = v as { type: ServerComponent; props: any };
		return ssrComponent(scope, d.type, d.props);
	}
	return ssrBlock(escapeHtml(v));
}

/**
 * Wrap a control-flow branch / for-item's HTML in hydration block markers
 * (`<!--[-->` … `<!--]-->`), so a future client hydrate cursor can find the
 * block boundaries and adopt the chosen branch. Mirrors Ripple's marker
 * protocol (shared constants in ./constants).
 */
export function ssrBlock(content: string): string {
	return BLOCK_OPEN + content + BLOCK_CLOSE;
}

/**
 * A portal's site marker. The portal body renders into a foreign target at the
 * client, so server-side it leaves a single anchor comment placeholder.
 */
export function ssrPortal(): string {
	return EMPTY_COMMENT;
}

/** A dynamic attribute: ` name="value"`, ` name` for `true`, or '' to omit. */
export function ssrAttr(name: string, v: unknown): string {
	if (v == null || v === false) return '';
	if (v === true) return ' ' + name;
	return ' ' + name + '="' + escapeAttr(v) + '"';
}

function styleObjectToCss(obj: Record<string, unknown>): string {
	let out = '';
	for (const k in obj) {
		const val = obj[k];
		if (val == null || val === false) continue;
		out += hyphenate(k) + ':' + val + ';';
	}
	return out;
}

// camelCase / vendor-prefixed style keys → kebab-case (mirrors runtime.styleName).
function hyphenate(name: string): string {
	if (name.charCodeAt(0) === 45 /* - */) return name; // --custom-prop / -webkit-…
	let out = '';
	let changed = false;
	for (let i = 0; i < name.length; i++) {
		const c = name.charCodeAt(i);
		if (c >= 65 && c <= 90) {
			out += '-' + String.fromCharCode(c + 32);
			changed = true;
		} else out += name[i];
	}
	if (!changed) return name;
	if (out.charCodeAt(0) === 109 && out.charCodeAt(1) === 115 && out.charCodeAt(2) === 45)
		out = '-' + out;
	return out;
}

/** A dynamic `style` attribute (string cssText or an object). */
export function ssrStyle(v: unknown): string {
	if (v == null || v === false || v === '') return '';
	const css = typeof v === 'string' ? v : styleObjectToCss(v as Record<string, unknown>);
	if (!css) return '';
	return ' style="' + escapeAttr(css) + '"';
}

// Legal HTML attribute name: non-empty, no ASCII whitespace, `"`, `'`, `>`, `/`,
// `=`, or control chars. Rejects spread keys that would inject markup (e.g.
// 'x onload=alert(1)' or 'a>'); mirrors the client's setAttribute behavior.
const VALID_ATTR_NAME = /^[^\s"'>\/=\u0000-\u001F]+$/;

/** A spread `{...obj}`: serialize attr-like keys; drop events/refs/key/children. */
export function ssrSpread(obj: unknown): string {
	if (obj == null || typeof obj !== 'object') return '';
	let out = '';
	for (const k in obj as Record<string, unknown>) {
		if (k === 'ref' || k === 'key' || k === 'children' || k === 'innerHTML') continue;
		if (k.length > 2 && k[0] === 'o' && k[1] === 'n' && k[2] >= 'A' && k[2] <= 'Z') continue; // onX
		const v = (obj as Record<string, unknown>)[k];
		if (k === 'style') out += ssrStyle(v);
		else if (k === 'className') out += ssrAttr('class', v);
		else if (VALID_ATTR_NAME.test(k)) out += ssrAttr(k, v); // skip injection-unsafe names
	}
	return out;
}

/** Render a child component into the string: fresh scope, server body → HTML. */
export function ssrComponent(parent: SSRScope, comp: ServerComponent, props: any): string {
	const prev = CURRENT_SCOPE;
	const scope = ssrScope(parent ?? prev);
	CURRENT_SCOPE = scope;
	try {
		// Wrap the child's output in a hydration block range so the client's
		// componentSlot can ADOPT it during hydration (its `<!--[-->`/`<!--]-->`
		// become the slot's start/end markers, exactly like control-flow blocks).
		return BLOCK_OPEN + (comp(scope, props ?? {}, undefined) ?? '') + BLOCK_CLOSE;
	} finally {
		CURRENT_SCOPE = prev;
	}
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CONTEXT_TAG = Symbol.for('ripple-new.context');

export interface Context<T> {
	$$kind: typeof CONTEXT_TAG;
	defaultValue: T;
	$$version: number;
	Provider: (scope: SSRScope, props: { value: T; children?: any }) => string;
}

export function createContext<T>(defaultValue: T): Context<T> {
	const ctx = { $$kind: CONTEXT_TAG, defaultValue, $$version: 0 } as Context<T>;
	ctx.Provider = function ProviderBody(scope, props) {
		if (scope.$$ctxValues === null) scope.$$ctxValues = new Map();
		scope.$$ctxValues.set(ctx, props.value);
		return typeof props.children === 'function' ? (props.children(scope) ?? '') : '';
	};
	return ctx;
}

function readContext<T>(ctx: Context<T>): T {
	for (let s = CURRENT_SCOPE; s !== null; s = s.parent) {
		if (s.$$ctxValues !== null && s.$$ctxValues.has(ctx)) return s.$$ctxValues.get(ctx) as T;
	}
	return ctx.defaultValue;
}

export function useContext<T>(ctx: Context<T>): T {
	return readContext(ctx);
}

// Sentinel thrown by `use(thenable)` on the server when the value isn't resolved
// yet. The nearest `@try` catches it and renders its `@pending` fallback (see the
// compiler's ssrEmitTry) for this pass; render()'s loop then awaits the thenable
// and re-renders. Distinct from real errors, which route to `@catch`.
const SSR_SUSPENSE = Symbol('ripple-new.ssr.suspense');
export function ssrIsSuspense(err: unknown): boolean {
	return err === SSR_SUSPENSE;
}

export function use<T>(usable: Context<T> | PromiseLike<T>, siteKey?: string | symbol): T {
	if (usable && (usable as any).$$kind === CONTEXT_TAG) return readContext(usable as Context<T>);
	// A thenable. Key it by the compiler-injected call-site key, disambiguated by
	// how many times this site has already run THIS pass (so a use() inside an
	// @for gets a distinct key per iteration). The key is stable across passes
	// because each pass re-derives it from the same deterministic render.
	const base =
		siteKey === undefined
			? '@'
			: typeof siteKey === 'symbol'
				? (siteKey as symbol).toString()
				: String(siteKey);
	const occ = OCC;
	const n = occ !== null ? (occ.get(base) ?? 0) : 0;
	if (occ !== null) occ.set(base, n + 1);
	const key = base + '#' + n;

	const resolved = RESOLVED;
	if (resolved !== null && resolved.has(key)) {
		const entry = resolved.get(key)!;
		// Rejected on a prior pass → throw so the enclosing @try renders @catch.
		// (Not seeded for hydration; the client re-derives a rejected boundary.)
		if ('reason' in entry) throw entry.reason;
		// Resolved → return it, and record it (in render order) for client seeding.
		if (SERIAL !== null) SERIAL.push(entry.value);
		return entry.value as T;
	}
	// First time we reach this site this render — record the thenable so render()'s
	// loop can await it, then suspend so the nearest @try shows @pending this pass.
	if (SUSPENDED !== null) SUSPENDED.push({ promise: usable as PromiseLike<unknown>, key });
	throw SSR_SUSPENSE;
}

// ---------------------------------------------------------------------------
// Hooks — server semantics. All accept the compiler-injected trailing slot
// symbol (ignored: a server render is single-pass with no re-render).
// ---------------------------------------------------------------------------

export function useState<T>(initial: T | (() => T)): [T, (next: any) => void] {
	const value = typeof initial === 'function' ? (initial as () => T)() : initial;
	return [value, NOOP];
}

export function useReducer<S, A, I = S>(
	reducer: (s: S, a: A) => S,
	initialArg: I,
	initOrSlot?: ((arg: I) => S) | symbol,
): [S, (action: A) => void] {
	const init = typeof initOrSlot === 'function' ? initOrSlot : undefined;
	const value = init ? init(initialArg) : (initialArg as unknown as S);
	return [value, NOOP];
}

export function useEffect(): void {}
export const useLayoutEffect = useEffect;
export const useInsertionEffect = useEffect;
export function useImperativeHandle(): void {}

export function useMemo<T>(compute: (...deps: any[]) => T, deps?: any[] | symbol): T {
	// deps may be a real array, omitted, or (per the trailing-slot ABI) a symbol.
	const d = Array.isArray(deps) ? deps : [];
	return compute.apply(null, d);
}

export function useCallback<F>(fn: F): F {
	return fn;
}

export function useRef<T>(initial: T): { current: T } {
	return { current: initial };
}

export function useId(): string {
	// Same shape as the client (':in-<base36>:') so a future hydrate pass lines up.
	return ':in-' + (ID_COUNTER++).toString(36) + ':';
}

export function useEffectEvent<F>(fn: F): F {
	return fn;
}

export function useTransition(): [boolean, (fn: () => void | Promise<unknown>) => void] {
	return [false, NOOP];
}

export function useDeferredValue<T>(value: T, ...rest: any[]): T {
	// Optional initialValue precedes the trailing slot symbol.
	return rest.length >= 2 ? (rest[0] as T) : value;
}

export function useSyncExternalStore<T>(
	_subscribe: unknown,
	getSnapshot: () => T,
	...rest: any[]
): T {
	// `getServerSnapshot` (if provided) precedes the trailing slot symbol.
	const getServerSnapshot = rest.length >= 2 ? (rest[0] as () => T) : undefined;
	return getServerSnapshot ? getServerSnapshot() : getSnapshot();
}

export function useActionState<S>(
	_action: unknown,
	initialState: S,
): [S, (payload?: any) => void, boolean] {
	return [initialState, NOOP, false];
}

export interface FormStatus {
	pending: boolean;
	data: FormData | null;
	method: string;
	action: ((formData: FormData) => unknown) | string | null;
}
export function useFormStatus(): FormStatus {
	return { pending: false, data: null, method: 'get', action: null };
}

export function useOptimistic<S, V = S>(state: S): [S, (value: V) => void] {
	return [state, NOOP];
}

export function memo<P>(component: P): P {
	return component;
}

// ---------------------------------------------------------------------------
// CSS — the compiled server body calls injectStyle(hash, css) at the top of
// each component; we accumulate into the active render's CSS map (deduped by
// hash) for the RenderResult.css field.
// ---------------------------------------------------------------------------

export function injectStyle(id: string, css: string): void {
	if (CSS !== null) CSS.set(id, css);
}

// Compiler-emitted for each hoisted `<title>`/`<meta>`/`<link>` (rendered
// anywhere in a component). Serializes the element — prefixed with a `<!--key-->`
// marker the client's headBlock adopts — into the active render pass's head
// buffer (null-guarded like injectStyle, so it only collects during a
// synchronous pass). Returned as RenderResult.head and injected at <!--ssr-head-->.
const HEAD_VOID_ELEMENTS = new Set(['meta', 'link', 'base']);

export function ssrHeadEl(
	key: string,
	tag: string,
	attrs: Record<string, unknown> | null,
	text: unknown,
): void {
	if (HEAD === null) return;
	let s = '<!--' + key + '--><' + tag;
	if (attrs !== null) {
		for (const k in attrs) {
			const v = attrs[k];
			if (v == null || v === false) continue;
			s += v === true ? ' ' + k : ' ' + k + '="' + escapeAttr(v) + '"';
		}
	}
	if (HEAD_VOID_ELEMENTS.has(tag)) {
		s += '>';
	} else {
		s += '>' + (text == null ? '' : escapeHtml(text)) + '</' + tag + '>';
	}
	HEAD.html += s;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export interface RenderResult {
	head: string;
	body: string;
	css: string;
}

/** Guard against a `use(thenable)` that never resolves wedging the render loop. */
const MAX_SUSPENSE_PASSES = 50;

// Wall-clock bound on a single suspense await. MAX_SUSPENSE_PASSES caps the
// NUMBER of re-render passes, but it's checked BEFORE the await — so a thenable
// that never settles would leave `Promise.all` (and the request) hung forever.
// This deadline races that await so a stuck thenable fails the render instead.
// 0 disables the deadline (await indefinitely). Configurable for tests/hosts.
let SUSPENSE_TIMEOUT_MS = 10_000;

export function setSsrSuspenseTimeout(ms: number): void {
	SUSPENSE_TIMEOUT_MS = ms;
}

export function getSsrSuspenseTimeout(): number {
	return SUSPENSE_TIMEOUT_MS;
}

/**
 * Serialize the resolved `use(thenable)` values (in render order) into an inline
 * data `<script>` the client reads during hydration. `<` is escaped to `<`
 * so the JSON payload can't terminate the `<script>` element or open an HTML
 * comment. Only emitted when at least one value was resolved.
 */
function serializeSuspenseSeeds(values: unknown[]): string {
	// Encode `undefined` (which JSON drops/nulls) as a sentinel so a
	// `use(thenable)` that resolved to `undefined` round-trips to `undefined` on
	// the client — not `null`. The replacer fires for array elements AND nested
	// object properties, so deeply-nested `undefined` survives too.
	const json = JSON.stringify(values, (_key, value) =>
		value === undefined ? { [UNDEFINED_SENTINEL_KEY]: true } : value,
	).replace(/</g, '\\u003c');
	return '<script type="application/json" ' + SUSPENSE_SCRIPT_ATTR + '>' + json + '</script>';
}

/**
 * Render a server-compiled component (a function returning an HTML string) to
 * `{ head, body, css }`. `head` is empty (no document-head API yet); `css` is
 * the scoped stylesheets of the components that actually rendered, emitted as
 * ready-to-place `<style data-ripple-new="hash">…</style>` tags (one per hash,
 * deduped). The client's `injectStyle` matches that `data-ripple-new` hash and
 * skips re-injecting on hydration — so the styles cross the boundary once.
 *
 * Async because of Suspense (Phase 4): a `use(thenable)` that hasn't resolved
 * suspends the pass; render() awaits it and re-renders, so the @try ends up
 * showing its resolved success arm (or @catch on rejection). Each resolved value
 * is appended to `body` as an inline data `<script>` for the client to seed.
 */
export async function render(component: ServerComponent, props?: any): Promise<RenderResult> {
	// The suspense cache persists across this render's passes; it is render-local
	// (never a module global) so concurrent renders can't share it.
	const resolved = new Map<string, { value: unknown } | { reason: unknown }>();
	let attempt = 0;
	for (;;) {
		// Run ONE synchronous pass entirely within this tick: save the ambient
		// module globals, install this pass's fresh state, run the (synchronous)
		// component, capture the results into locals, then restore the globals —
		// all before the `await` below. So no pass state is ever held in a module
		// global across a suspension point, and a concurrent render() that runs
		// during our await can't observe or clobber our in-flight pass.
		const prevScope = CURRENT_SCOPE;
		const prevId = ID_COUNTER;
		const prevCss = CSS;
		const prevHead = HEAD;
		const prevSusp = SUSPENDED;
		const prevRes = RESOLVED;
		const prevSerial = SERIAL;
		const prevOcc = OCC;
		ID_COUNTER = 0;
		const cssMap = (CSS = new Map());
		const headBuf = (HEAD = { html: '' });
		const suspended = (SUSPENDED = [] as { promise: PromiseLike<unknown>; key: string }[]);
		const serial = (SERIAL = [] as unknown[]);
		OCC = new Map();
		RESOLVED = resolved;
		const root = ssrScope(null);
		CURRENT_SCOPE = root;
		let body = '';
		try {
			body = component(root, props ?? {}, undefined) ?? '';
		} catch (err) {
			// A suspension with no enclosing @try unwinds to here; its thenable is
			// already in `suspended`, so fall through to the await + retry. Any other
			// throw is a genuine render failure — propagate it (the finally restores).
			if (!ssrIsSuspense(err)) throw err;
		} finally {
			CURRENT_SCOPE = prevScope;
			ID_COUNTER = prevId;
			CSS = prevCss;
			HEAD = prevHead;
			SUSPENDED = prevSusp;
			RESOLVED = prevRes;
			SERIAL = prevSerial;
			OCC = prevOcc;
		}

		if (suspended.length === 0) {
			let css = '';
			for (const [hash, sheet] of cssMap) {
				css += '<style data-ripple-new="' + hash + '">' + sheet + '</style>';
			}
			if (serial.length > 0) body += serializeSuspenseSeeds(serial);
			return { head: headBuf.html, body, css };
		}
		if (++attempt > MAX_SUSPENSE_PASSES) {
			throw new Error(
				'ripple-new SSR: exceeded ' +
					MAX_SUSPENSE_PASSES +
					' suspense passes — a use(thenable) never resolved.',
			);
		}
		// Await everything this pass surfaced; cache each outcome by its key. Only
		// render-local state (`suspended`, `resolved`) is touched across the await.
		// Raced against SUSPENSE_TIMEOUT_MS so a thenable that never settles fails
		// the render (with a clear error) instead of hanging the request forever.
		const settleAll = Promise.all(
			suspended.map(async ({ promise, key }) => {
				if (resolved.has(key)) return;
				try {
					resolved.set(key, { value: await promise });
				} catch (reason) {
					resolved.set(key, { reason });
				}
			}),
		);
		if (SUSPENSE_TIMEOUT_MS > 0) {
			let timer: ReturnType<typeof setTimeout> | undefined;
			const deadline = new Promise<never>((_, reject) => {
				timer = setTimeout(
					() =>
						reject(
							new Error(
								'ripple-new SSR: a use(thenable) did not settle within ' +
									SUSPENSE_TIMEOUT_MS +
									'ms.',
							),
						),
					SUSPENSE_TIMEOUT_MS,
				);
				// Don't let the deadline timer hold the event loop open if the render
				// settles first (Node-only; harmless where unref is absent).
				(timer as any)?.unref?.();
			});
			try {
				await Promise.race([settleAll, deadline]);
			} finally {
				clearTimeout(timer);
			}
		} else {
			await settleAll;
		}
	}
}
