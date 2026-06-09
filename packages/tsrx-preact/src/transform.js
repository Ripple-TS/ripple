/** @import { JsxPlatform } from '@tsrx/core/types' */

import { createJsxTransform } from '@tsrx/core';

/**
 * Public re-export for downstream consumers (e.g. the Vite plugin) that
 * want to let the user override which module `Suspense` is imported from.
 * Preact defaults to `preact/compat` — projects running on `@preact/compat`
 * or a workspace alias can pass `suspenseSource: '...'` to `compile`.
 */
export const DEFAULT_SUSPENSE_SOURCE = 'preact/compat';

/**
 * Per-call compile options for tsrx-preact. Exposed publicly so the Vite
 * plugin's typings can extend them.
 *
 * @typedef {{ suspenseSource?: string }} CompileOptions
 */

/**
 * Preact platform descriptor consumed by `createJsxTransform`.
 *
 * Differences from React:
 * - `suspense` imports from `preact/compat` (overridable via `suspenseSource`).
 * - `rewriteClassAttr: false` — Preact accepts `class` natively.
 * - async function components are preserved as ordinary TypeScript functions.
 *
 * @type {JsxPlatform}
 */
const preact_platform = {
	name: 'Preact',
	imports: {
		fragment: 'preact',
		suspense: DEFAULT_SUSPENSE_SOURCE,
		dynamic: '@tsrx/preact/dynamic',
		errorBoundary: '@tsrx/preact/error-boundary',
		mergeRefs: '@tsrx/preact/ref',
		refProp: '@tsrx/preact/ref',
		forOfIterableHelper: '@tsrx/preact/runtime/iterable',
	},
	jsx: {
		rewriteClassAttr: false,
		multiRefStrategy: 'merge-refs',
	},
	validation: {
		requireUseServerForAwait: false,
	},
};

export const transform = createJsxTransform(preact_platform);
