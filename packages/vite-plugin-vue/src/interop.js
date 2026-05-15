/** @import { Plugin } from 'vite' */

import { addVaporInteropToCreateVaporApp } from '@tsrx/vue/interop';

/**
 * Vue's built-in renderer primitives, including `Suspense`, need Vapor/VDOM
 * interop when mounted from a Vapor app. TSRX can emit `Suspense` for
 * `try/pending`, so make Vapor app creation install the interop plugin without
 * every app entry point needing to remember it.
 *
 * @returns {Plugin}
 */
export function createVaporInteropPlugin() {
	return {
		name: '@tsrx/vite-plugin-vue:vapor-interop',
		enforce: 'pre',
		transform(code) {
			if (!/\bcreateVaporApp\b/.test(code) || !/\bfrom\s*['"]vue['"]/.test(code)) {
				return null;
			}

			const transformed = addVaporInteropToCreateVaporApp(code);
			if (transformed === code) {
				return null;
			}

			return { code: transformed, map: null };
		},
	};
}
