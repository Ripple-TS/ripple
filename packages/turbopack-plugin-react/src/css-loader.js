import { compile } from '@tsrx/react';

/**
 * @typedef {{
 * 	resourcePath: string,
 * 	async: () => (err: unknown, output?: string | null, map?: unknown) => void,
 * }} LoaderContext
 */

/**
 * Re-runs the `@tsrx/react` compiler against the `.tsrx` source to extract
 * the scoped CSS emitted by its `<style>` block. Invoked when Turbopack
 * resolves the sibling `?tsrx-css&lang.css` import prepended by the JS loader.
 *
 * @this {LoaderContext}
 * @param {string} source
 * @returns {void}
 */
export default function tsrx_react_turbopack_css_loader(source) {
	const callback = this.async();

	try {
		const { css } = compile(source, this.resourcePath);
		callback(null, css);
	} catch (/** @type {any} */ err) {
		callback(err);
	}
}
