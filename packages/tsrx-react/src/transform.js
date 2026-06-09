/** @import { JsxPlatform } from '@tsrx/core/types' */

import { createJsxTransform } from '@tsrx/core';

/**
 * React platform descriptor consumed by `createJsxTransform`. Each field
 * configures one React-specific decision the shared transformer would
 * otherwise have to branch on (import sources, `use server` validation, error
 * message prefix).
 *
 * @type {JsxPlatform}
 */
const react_platform = {
	name: 'React',
	imports: {
		fragment: 'react',
		suspense: 'react',
		dynamic: '@tsrx/react/dynamic',
		errorBoundary: '@tsrx/react/error-boundary',
		mergeRefs: '@tsrx/react/ref',
		refProp: '@tsrx/react/ref',
		forOfIterableHelper: '@tsrx/react/runtime/iterable',
	},
	jsx: {
		rewriteClassAttr: false,
		classAttrName: 'className',
		multiRefStrategy: 'merge-refs',
	},
	validation: {
		requireUseServerForAwait: false,
	},
};

export const transform = createJsxTransform(react_platform);
