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
 * - `acceptedTsxKinds` includes both `preact` and `react` for compat blocks.
 * - `requireUseServerForAwait: true` — top-level `await` in components
 *   requires a `"use server"` directive at module scope.
 *
 * @type {JsxPlatform}
 */
const preact_platform = {
	name: 'Preact',
	imports: {
		suspense: DEFAULT_SUSPENSE_SOURCE,
		errorBoundary: '@tsrx/preact/error-boundary',
		mergeRefs: '@tsrx/preact/merge-refs',
	},
	jsx: {
		rewriteClassAttr: false,
		acceptedTsxKinds: ['preact', 'react'],
		multiRefStrategy: 'merge-refs',
	},
	validation: {
		requireUseServerForAwait: true,
	},
};

export const transform = createJsxTransform(preact_platform);
