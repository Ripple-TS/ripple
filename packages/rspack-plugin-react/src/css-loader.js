/** @import { LoaderContext } from '@rspack/core' */

import { compile } from '@tsrx/react';

/**
 * Re-runs the `@tsrx/react` compiler against the `.tsrx` source to extract
 * the scoped CSS emitted by its `<style>` block. Invoked when rspack resolves
 * the sibling `?tsrx-css&lang.css` import prepended by the JS loader.
 *
 * @this {LoaderContext<object>}
 * @param {string} source
 * @returns {void}
 */
export default function cssLoader(source) {
	const callback = this.async();
	const resourcePath = this.resourcePath;

	try {
		const { css } = compile(source, resourcePath);
		callback(null, css);
	} catch (/** @type {any} */ err) {
		callback(err);
	}
}
