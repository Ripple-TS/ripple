/** @import { JsxPlatform } from '@tsrx/core/types' */

import { createJsxTransform } from '@tsrx/core';

/**
 * React platform descriptor consumed by `createJsxTransform`. Each field
 * configures one React-specific decision the shared transformer would
 * otherwise have to branch on (import sources, `class`→`className` rewrite,
 * accepted `<tsx:kind>` values, `use server` validation, error message
 * prefix).
 *
 * @type {JsxPlatform}
 */
const react_platform = {
	name: 'React',
	imports: {
		fragment: 'react',
		suspense: 'react',
		errorBoundary: '@tsrx/react/error-boundary',
		mergeRefs: '@tsrx/react/merge-refs',
	},
	jsx: {
		rewriteClassAttr: true,
		acceptedTsxKinds: ['react'],
		multiRefStrategy: 'merge-refs',
	},
	validation: {
		requireUseServerForAwait: false,
	},
	hooks: {
		moduleScopedHookComponents: true,
	},
};

export const transform = createJsxTransform(react_platform);
