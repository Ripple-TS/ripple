/** @import { LoaderContext } from '@rspack/core' */

import { compile } from '@tsrx/preact';

/**
 * Re-runs the `@tsrx/preact` compiler against the `.tsrx` source to extract
 * the scoped CSS emitted by its `<style>` block. Invoked when rspack resolves
 * the sibling `?tsrx-css&lang.css` import prepended by the JS loader.
 *
 * @this {LoaderContext<{ suspenseSource?: string }>}
 * @param {string} source
 * @returns {void}
 */
export default function cssLoader(source) {
	const callback = this.async();
	const resourcePath = this.resourcePath;

	try {
		const { css } = compile(source, resourcePath, this.getOptions?.());
		callback(null, css);
	} catch (/** @type {any} */ err) {
		callback(err);
	}
}
