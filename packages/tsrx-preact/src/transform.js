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
		// Production output aliases dynamic tags to a scoped component const
		// inside an expression-child IIFE, re-evaluated on every render; the
		// type-only transform keeps the `Dynamic` component shape (types only).
		dynamicFactory: {},
		errorBoundary: '@tsrx/preact/error-boundary',
		mergeRefs: '@tsrx/preact/ref',
		refProp: '@tsrx/preact/ref',
		forOfIterableHelper: '@tsrx/preact/runtime/iterable',
	},
	directRuntimeImports: {
		errorBoundary: '@tsrx/preact-runtime/error-boundary',
		mergeRefs: '@tsrx/preact-runtime/ref',
		refProp: '@tsrx/preact-runtime/ref',
		forOfIterableHelper: '@tsrx/preact-runtime/iterable',
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
