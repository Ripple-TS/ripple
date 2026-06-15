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

import { BLOCK_OPEN, BLOCK_CLOSE, EMPTY_COMMENT } from './constants';

interface SSRScope {
	parent: SSRScope | null;
	/** Context Provider values stamped on this scope (lazily allocated). */
	$$ctxValues: Map<unknown, unknown> | null;
}

type ServerComponent = (scope: SSRScope, props: any, extra?: any) => string;

let CURRENT_SCOPE: SSRScope | null = null;
let ID_COUNTER = 0;
let CSS: Map<string, string> | null = null;

function ssrScope(parent: SSRScope | null): SSRScope {
	return { parent, $$ctxValues: null };
}

const NOOP = (): void => {};

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
		else out += ssrAttr(k, v);
	}
	return out;
}

/** Render a child component into the string: fresh scope, server body → HTML. */
export function ssrComponent(parent: SSRScope, comp: ServerComponent, props: any): string {
	const prev = CURRENT_SCOPE;
	const scope = ssrScope(parent ?? prev);
	CURRENT_SCOPE = scope;
	try {
		return comp(scope, props ?? {}, undefined) ?? '';
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

// Sentinel thrown by `use(thenable)` on the server: a server render is sync and
// can't await, so a pending value suspends. The nearest `@try` catches this and
// renders its `@pending` fallback (see the compiler's ssrEmitTry). Distinct from
// real errors, which route to `@catch`.
const SSR_SUSPENSE = Symbol('ripple-new.ssr.suspense');
export function ssrIsSuspense(err: unknown): boolean {
	return err === SSR_SUSPENSE;
}

export function use<T>(usable: Context<T> | PromiseLike<T>): T {
	if (usable && (usable as any).$$kind === CONTEXT_TAG) return readContext(usable as Context<T>);
	// A thenable: server render can't resolve it — suspend so the enclosing
	// @try renders its @pending fallback.
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

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export interface RenderResult {
	head: string;
	body: string;
	css: string;
}

/**
 * Render a server-compiled component (a function returning an HTML string) to
 * `{ head, body, css }`. `head` is empty (no document-head API yet); `css` is
 * the scoped stylesheets of the components that actually rendered, emitted as
 * ready-to-place `<style data-ripple-new="hash">…</style>` tags (one per hash,
 * deduped). The client's `injectStyle` matches that `data-ripple-new` hash and
 * skips re-injecting on hydration — so the styles cross the boundary once.
 */
export function render(component: ServerComponent, props?: any): RenderResult {
	const prevScope = CURRENT_SCOPE;
	const prevId = ID_COUNTER;
	const prevCss = CSS;
	ID_COUNTER = 0;
	CSS = new Map();
	try {
		const root = ssrScope(null);
		CURRENT_SCOPE = root;
		const body = component(root, props ?? {}, undefined) ?? '';
		let css = '';
		for (const [hash, sheet] of CSS) {
			css += '<style data-ripple-new="' + hash + '">' + sheet + '</style>';
		}
		return { head: '', body, css };
	} finally {
		CURRENT_SCOPE = prevScope;
		ID_COUNTER = prevId;
		CSS = prevCss;
	}
}
