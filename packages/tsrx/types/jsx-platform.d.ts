import type * as AST from 'estree';
import type { RawSourceMap } from 'source-map';
import type { CompileError } from './index';

/**
 * Result returned by a JSX platform transform (React, Preact, Solid).
 */
export interface JsxTransformResult {
	ast: AST.Program;
	code: string;
	/**
	 * Esrap-shaped source map over the generated TSX. Consumed by
	 * `create_volar_mappings_result` to build Volar code mappings and by
	 * downstream Vite / Rollup plugins to chain source maps.
	 */
	map: RawSourceMap;
	/** Rendered CSS for the module, or `''` when the module emits no styles. */
	css: string;
	/**
	 * Space-separated scope hashes for the rendered CSS, or `null` when the
	 * module emits no styles. When multiple `<style>` blocks contribute, the
	 * hashes appear in source order.
	 */
	cssHash: string | null;
}

/**
 * Shared base for the per-call transform context that the JSX factory passes
 * into every visitor and helper. Platform-specific transforms (e.g. Solid)
 * extend this with their own `needs_*` flags via `hooks.initialState`; helpers
 * defined in `@tsrx/core` only ever rely on these base fields.
 */
export interface JsxTransformContext {
	platform: JsxPlatform;
	local_statement_component_index: number;
	needs_error_boundary: boolean;
	needs_suspense: boolean;
	needs_merge_refs: boolean;
	needs_normalize_spread_props: boolean;
	needs_normalize_spread_props_for_ref_attr: boolean;
	needs_fragment: boolean;
	needs_for_of_iterable: boolean;
	needs_iteration_value_type: boolean;
	stylesheets: AST.CSS.StyleSheet[];
	type_only_style_anchors: AST.Statement[];
	module_scoped_hook_components: boolean;
	helper_state: {
		base_name: string;
		next_id: number;
		helpers: any[];
		statics: any[];
	} | null;
	hook_helpers_enabled: boolean;
	available_bindings: Map<string, AST.Identifier>;
	lazy_next_id: number;
	/** Scope map used to resolve runtime Dynamic imports for scoped CSS pruning. */
	runtime_dynamic_scopes: Map<any, any> | null;
	inside_element_child?: boolean;
	/** Full source text for source-aware diagnostics. */
	source: string;
	/** Source filename for diagnostics; null when the caller did not supply one. */
	filename: string | null;
	/** True when recoverable errors should be collected onto `errors` instead of thrown. */
	collect: boolean;
	/** Collected non-fatal errors. Undefined when `collect` is false. */
	errors: CompileError[] | undefined;
	/** Module-level comments used to honor `@tsrx-ignore` / `@tsrx-expect-error`. */
	comments: AST.CommentWithLocation[] | undefined;
	/** True when emitting a type-only virtual TSX module; preserves lazy destructuring patterns. */
	typeOnly: boolean;
}

/**
 * Optional per-call compile options passed to a created JSX transform.
 */
export interface JsxTransformOptions {
	/**
	 * Override the import source used for `Suspense` in try-block transforms.
	 * Falls back to `platform.imports.suspense`. Preact uses this to let the
	 * host pick `preact/compat` vs. another compat entry point.
	 */
	suspenseSource?: string;
	/**
	 * When true, recoverable transform errors are pushed onto `errors` instead
	 * of thrown so editor tooling can surface them as diagnostics. Errors that
	 * leave the transform in an unrecoverable state are still thrown.
	 */
	collect?: boolean;
	/**
	 * Don't collect allowable errors such as unclosed tags
	 */
	loose?: boolean;
	/**
	 * Collected non-fatal errors. The transform appends to this array when
	 * `collect` or `loose` is true; callers read it after the transform returns.
	 */
	errors?: CompileError[];
	/**
	 * Module-level comments used to suppress diagnostics via `@tsrx-ignore` /
	 * `@tsrx-expect-error` line comments.
	 */
	comments?: AST.CommentWithLocation[];
	/**
	 * Override whether hook-isolation helper components are emitted directly at
	 * module scope. React runtime compilation enables this, while editor tooling
	 * can disable it to preserve lexical `typeof` helper prop types.
	 */
	moduleScopedHookComponents?: boolean;
	/**
	 * Emit a type-only virtual TSX module — output is fed to TypeScript for
	 * editor diagnostics / completions and never executed. Skips the lazy
	 * destructuring rewrite (`&{ a, b }` → `__lazy0: { a: any; b: any }`) so
	 * destructuring patterns survive and TypeScript can flow real types to the
	 * bindings.
	 */
	typeOnly?: boolean;
}

/**
 * Override hooks for the parts of the transform that differ substantially
 * between platforms. Every hook is optional — when omitted, the factory
 * uses its React/Preact-style default.
 *
 * Solid uses all of these: control-flow statements become `<Show>` /
 * `<For>` / `<Switch>/<Match>` / `<Errored>/<Loading>` JSX; component
 * bodies are hoisted to preserve setup-once semantics; module imports
 * come from `solid-js` instead of `react`; element attributes support
 * composite-element / textContent shortcuts.
 *
 * The `ctx` parameter is the active `TransformContext` — see the
 * target's transform.js for its shape; platform-owned fields can be
 * read and written freely.
 */
export interface JsxPlatformHooks {
	/**
	 * Per-statement control-flow rewrites. Each hook receives the original
	 * Ripple statement (with children already walked) and returns a JSX
	 * child (or an expression container wrapping one).
	 */
	controlFlow?: {
		ifStatement?: (node: any, ctx: any) => any;
		forOf?: (node: any, ctx: any) => any;
		switchStatement?: (node: any, ctx: any) => any;
		tryStatement?: (node: any, ctx: any) => any;
	};
	/**
	 * Mark a top-level call expression inside a control-flow branch as requiring
	 * helper-component isolation so setup/state is created once per mounted
	 * branch instead of once per parent rerender. Vue uses this for branch-local
	 * Composition API state like `ref()`.
	 */
	isTopLevelSetupCall?: (callExpression: any, ctx: any) => boolean;
	/**
	 * Wrap a hoisted helper component declaration emitted by the shared control-
	 * flow splitter. The default is the plain function declaration; Vue uses
	 * this to wrap helpers in `defineVaporComponent(...)` so branch-local setup
	 * state behaves like normal component state.
	 */
	wrapHelperComponent?: (helperFn: any, helperId: any, ctx: any, sourceNode: any) => any;
	/**
	 * Emit hook-isolation helper components as unique module-scope declarations
	 * instead of lazily creating and caching them from the parent component body.
	 * React enables this so generated branches stay compatible with the React
	 * Compiler's Rules of Hooks validation.
	 */
	moduleScopedHookComponents?: boolean;
	/**
	 * Split ordinary uppercase function component bodies when an early
	 * conditional return would make later React/Preact hooks conditional.
	 */
	componentBodyHookHelpers?: boolean;
	/**
	 * Inject module-level imports after the main walk. Default: import
	 * `Suspense` from `platform.imports.suspense` and `TsrxErrorBoundary`
	 * from `platform.imports.errorBoundary` if the walk flagged them.
	 * Solid injects `Show`, `For`, `Switch`, `Match`, `Errored`, `Loading`
	 * from `solid-js`.
	 */
	injectImports?: (program: AST.Program, ctx: any, suspenseSource: string) => void;
	/**
	 * Transform a Ripple element's attributes to JSX attributes. Default
	 * is "map over `to_jsx_attribute`" plus the shared multi-`ref` merge
	 * pass. Platforms that own a `transformElement` hook (e.g. Solid) bypass
	 * this entirely — they never reach the dispatch path that would call
	 * it — and run their own attribute pass inside their `transformElement`.
	 */
	transformElementAttributes?: (attrs: any[], ctx: any, element: any) => any[];
	/**
	 * Rewrite or normalize raw Ripple attributes before the shared
	 * `to_jsx_attribute()` mapping runs.
	 */
	preprocessElementAttributes?: (attrs: any[], ctx: any, element: any) => any[];
	/**
	 * Optionally replace the default React-style `.map(...)` lowering for a
	 * `for...of` body after the shared transform has already produced its render
	 * statements and applied any explicit or implicit keys. Vue uses this to hand
	 * the loop to the downstream Vapor JSX compiler as a typed `VaporFor` component.
	 */
	renderForOf?: (node: any, loopParams: any[], bodyStatements: any[], ctx: any) => any | null;
	/**
	 * Optionally replace the default React-style pending lowering for
	 * `@try { ... } @pending { ... }`. The default emits
	 * `<Suspense fallback={fallbackContent}>tryContent</Suspense>`.
	 * Vue Vapor uses this to provide `default` and `fallback` slots via
	 * `v-slots`.
	 */
	createPendingBoundary?: (
		tryContent: any,
		fallbackContent: any,
		ctx: any,
		node: any,
	) => any | null;
	/**
	 * Optionally create a generated component for a catch fallback body while
	 * the catch parameters are still in scope. Platforms can use this to reuse
	 * one mapped catch-body component from multiple runtime catch sites.
	 */
	createErrorFallbackComponent?: (
		catchBodyNodes: any[],
		catchParams: any[],
		ctx: any,
		node: any,
	) => any | null;
	/**
	 * Optionally replace the default `try/catch` boundary wrapper. The hook
	 * receives the current render content, the original try-body content before
	 * any pending wrapper, and the generated catch fallback function.
	 */
	createErrorBoundary?: (
		tryContent: any,
		rawTryContent: any,
		fallbackFn: any,
		ctx: any,
		node: any,
		info?: { fallbackComponent?: any },
	) => any | null;
	/**
	 * Optionally move the primary `try { ... }` render content into an explicit
	 * error-boundary prop instead of rendering it as the boundary's JSX children.
	 * Vue Vapor uses this because boundary content must execute lazily from a
	 * zero-argument function. If a `pending` block exists, `tryContent` is the
	 * already-created pending boundary so catch wrappers still enclose it.
	 */
	createErrorBoundaryContent?: (tryContent: any, ctx: any, node: any) => any | null;
	/**
	 * Customize lowering for a native JSX element. Default is the
	 * factory's `to_jsx_element`. The hook receives the walker-transformed
	 * node (`inner`, with children already lowered) plus the element's
	 * raw pre-walk children — Solid uses the latter to detect a lone
	 * `JSXText` child it can hoist to a `textContent` attribute before the
	 * generic text→JSXExpressionContainer transform runs.
	 */
	transformElement?: (inner: any, ctx: any, rawChildren: any[]) => any;
	/**
	 * Optionally rewrite a host element's children into attributes or another
	 * specialized child shape after generic attribute lowering but before the
	 * default child-to-JSX conversion runs.
	 *
	 * This lets a target support target-native DOM content props such as
	 * `textContent` without forking the whole element lowering.
	 * The hook may mutate `attrs` directly and either return a replacement
	 * `children` array (plus optional `selfClosing` override) or `null` to fall
	 * back to the default child handling.
	 */
	transformElementChildren?: (
		element: any,
		walkedChildren: any[],
		rawChildren: any[],
		attrs: any[],
		ctx: any,
	) => { children: any[]; selfClosing?: boolean } | null;
	/**
	 * Decide whether a JSX subtree may be hoisted to module scope when it is
	 * otherwise statically safe. Targets can use this to keep runtime-sensitive
	 * JSX, such as component invocations, inside render/setup execution.
	 */
	canHoistStaticNode?: (node: any, ctx: any) => boolean;
	/**
	 * Custom validation for a component body that uses top-level `await`.
	 * Default: enforce `validation.requireUseServerForAwait`. Solid rejects
	 * component-level await outright with a keyword-precise location.
	 */
	validateComponentAwait?: (
		awaitNode: any,
		component: any,
		ctx: any,
		moduleUsesServerDirective: boolean,
		source: string,
	) => void;
	/**
	 * Factory-managed state extra fields. Returns a record merged into the
	 * initial `transform_context`. Lets solid seed its `needs_show` /
	 * `needs_for` / etc. flags without forking the factory.
	 */
	initialState?: () => Record<string, unknown>;
}

/**
 * A JSX platform descriptor is the parameter to `createJsxTransform`. It
 * declares how to render a Ripple AST as valid TSX for the target platform
 * (React, Preact, Solid). The shared transformer in `@tsrx/core` reads this
 * descriptor at each platform-specific decision point instead of branching
 * on the platform name.
 */
export interface JsxPlatform {
	/**
	 * Human-readable platform name, used in error messages
	 * (e.g. "React TSRX does not support …").
	 */
	name: string;

	imports: {
		/**
		 * Module to import `Fragment` from when a keyed fragment is required
		 * for a multi-child loop body. React: `'react'`. Preact: `'preact'`.
		 */
		fragment?: string;
		/**
		 * Module to import `Suspense` from when an `@try { ... } @pending { ... }`
		 * block appears. React: `'react'`. Preact: `'preact/compat'`.
		 */
		suspense: string;
		/**
		 * Module that exports the target runtime `Dynamic` component. When set,
		 * the shared JSX transform treats imported `Dynamic` elements with an
		 * `is` prop as runtime-dynamic for scoped CSS pruning.
		 */
		dynamic?: string;
		/**
		 * Module to import `TsrxErrorBoundary` from when an `@try { ... } @catch (...)`
		 * block appears. Usually `'@tsrx/<platform>/error-boundary'`.
		 */
		errorBoundary: string;
		/**
		 * Module to import `mergeRefs` from when an element has more than one
		 * `ref` attribute and the platform uses the `'merge-refs'` strategy.
		 * Required when `jsx.multiRefStrategy === 'merge-refs'`; ignored
		 * otherwise. React: `'@tsrx/react/ref'`. Preact: `'@tsrx/preact/ref'`.
		 */
		mergeRefs?: string;
		/**
		 * Module to import host-spread normalization helpers from.
		 */
		refProp?: string;
		/**
		 * Module to import the `map_iterable` runtime helper (and the
		 * `IterationValue` type) from when compiling `for ... of` bodies whose
		 * source can be any `Iterable` — not just an array. React and Preact
		 * use target-owned paths like `'@tsrx/react/runtime/iterable'` and
		 * `'@tsrx/preact/runtime/iterable'`, which re-export from
		 * `'@tsrx/core/runtime/iterable'`. Solid and Vue lower for-of via their
		 * own iteration components and leave this unset.
		 */
		forOfIterableHelper?: string;
	};

	jsx: {
		/**
		 * Rewrite Ripple's `class` attribute to `className` for legacy targets
		 * that require it. First-party targets keep authored `class`.
		 */
		rewriteClassAttr: boolean;
		/**
		 * Attribute name to use when TSRX injects scoped CSS classes. This does
		 * not rewrite authored attributes.
		 */
		classAttrName?: 'class' | 'className';
		/**
		 * How to collapse multiple `ref` attributes on the same element into
		 * one. React's and Preact's runtimes treat duplicate `ref` props as
		 * a normal duplicate-prop collision (last wins), so they need a
		 * compile-time merge. Solid's runtime accepts an array of refs
		 * natively, so it can use the cheaper array form.
		 *
		 * - `'merge-refs'`: emit `ref={mergeRefs(a, b, ...)}` and inject an
		 *   import from `imports.mergeRefs`.
		 * - `'array'`: emit `ref={[a, b, ...]}`. No runtime helper needed.
		 * - `undefined`: no merging — duplicate `ref` attributes pass through
		 *   unchanged. The platform's runtime is responsible.
		 */
		multiRefStrategy?: 'merge-refs' | 'array';
		/**
		 * Some JSX runtimes do not apply a `ref` that arrives through a props
		 * spread. In that case, host spread normalization also emits an
		 * explicit `ref={normalized.ref}` attribute.
		 */
		hostSpreadRefStrategy?: 'explicit-ref-attr';
	};

	validation: {
		/**
		 * Require a top-level `"use server"` directive before a component may
		 * contain top-level `await`. Preact/Solid: true. React: false.
		 *
		 * Solid keeps this enabled as a fallback invariant (if its custom await
		 * validator hook is removed, the default factory validation still rejects
		 * component-level `await` without `"use server"`).
		 */
		requireUseServerForAwait: boolean;
		/**
		 * When `false`, skip scanning for a top-level `"use server"` directive
		 * while a custom `validateComponentAwait` hook is present.
		 *
		 * This is useful for platforms whose custom validator never uses the
		 * directive signal (for example Solid, which always rejects component-level
		 * `await`), while still keeping `requireUseServerForAwait: true` as a
		 * fallback if the custom validator is removed.
		 *
		 * Default: `true`.
		 */
		scanUseServerDirectiveForAwaitWithCustomValidator?: boolean;
		/**
		 * Optional branded compiler error for targets that cannot lower
		 * `@try { ... } @pending { ... }` in component template context.
		 *
		 * When provided, the shared try-block lowering rejects any `pending`
		 * block with this message instead of emitting a React-style
		 * `<Suspense fallback={...}>` wrapper.
		 */
		unsupportedTryPendingMessage?: string;
	};

	/**
	 * Optional overrides for parts of the transform that diverge substantially
	 * between platforms (control flow, component lowering, imports, element
	 * attributes). When absent, each hook falls back to the React/Preact-style
	 * default baked into the factory.
	 */
	hooks?: JsxPlatformHooks;
}

/**
 * Build a `transform()` function for a specific JSX platform. The returned
 * function takes a parsed Ripple AST and produces a TSX module plus source
 * map and optional CSS.
 */
export function createJsxTransform(
	platform: JsxPlatform,
): (
	ast: AST.Program,
	source: string,
	filename?: string,
	options?: JsxTransformOptions,
) => JsxTransformResult;
