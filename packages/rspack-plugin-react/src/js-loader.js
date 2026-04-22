/** @import { LoaderContext } from '@rspack/core' */

import { compile } from '@tsrx/react';

/**
 * Compiles `.tsrx` source to TSX and, when a `<style>` block is present,
 * prepends an `import` to the sibling virtual CSS module so rspack can
 * include the styles in the asset graph.
 *
 * @this {LoaderContext<object>}
 * @param {string} source
 * @returns {void}
 */
export default function jsLoader(source) {
	const callback = this.async();
	const resourcePath = this.resourcePath;

	try {
		const { code, map, css } = compile(source, resourcePath);

		let output = code;
		if (css) {
			const cssImport = `${resourcePath}?tsrx-css&lang.css`;
			output = `import ${JSON.stringify(cssImport)};\n${code}`;
		}

		callback(null, output, /** @type {any} */ (map ?? undefined));
	} catch (/** @type {any} */ err) {
		callback(err);
	}
}
