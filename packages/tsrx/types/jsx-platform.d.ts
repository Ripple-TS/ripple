import type * as AST from 'estree';
import type { RawSourceMap } from 'source-map';

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
	css: { code: string; hash: string } | null;
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
	 * Lower a `component` declaration to a FunctionDeclaration. React / Preact
	 * use a default that extracts hooks, hoists statics, and handles async
	 * bodies. Solid replaces this with a setup-once implementation that
	 * hoists post-early-return JSX into a reactive `<Show>`.
	 */
	componentToFunction?: (component: any, ctx: any, helperState?: any) => any;
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
	 * Lower a Ripple `Element` node to a JSXElement. Default is the
	 * factory's `to_jsx_element`. The hook receives the walker-transformed
	 * node (`inner`, with children already lowered) plus the element's
	 * raw pre-walk children — Solid uses the latter to detect a lone
	 * `Text` child it can hoist to a `textContent` attribute before the
	 * generic text→JSXExpressionContainer transform runs.
	 */
	transformElement?: (inner: any, ctx: any, rawChildren: any[]) => any;
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
		 * Module to import `Suspense` from when a `try { ... } pending { ... }`
		 * block appears. React: `'react'`. Preact: `'preact/compat'`.
		 */
		suspense: string;
		/**
		 * Module to import `TsrxErrorBoundary` from when a `try { ... } catch (...)`
		 * block appears. Usually `'@tsrx/<platform>/error-boundary'`.
		 */
		errorBoundary: string;
		/**
		 * Module to import `mergeRefs` from when an element has more than one
		 * `ref` attribute and the platform uses the `'merge-refs'` strategy.
		 * Required when `jsx.multiRefStrategy === 'merge-refs'`; ignored
		 * otherwise. React: `'@tsrx/react/merge-refs'`. Preact: `'@tsrx/preact/merge-refs'`.
		 */
		mergeRefs?: string;
	};

	jsx: {
		/**
		 * Rewrite Ripple's `class` attribute to React's `className`. React: true.
		 * Preact and Solid accept `class` natively, so: false.
		 */
		rewriteClassAttr: boolean;
		/**
		 * Accepted values of `kind` in `<tsx:kind>` compat blocks. React accepts
		 * only `'react'`. Preact accepts both `'preact'` and `'react'`.
		 */
		acceptedTsxKinds: readonly string[];
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
