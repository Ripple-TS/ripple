import { compile } from '@tsrx/react';

/**
 * @typedef {{
 * 	resourcePath: string,
 * 	async: () => (err: unknown, output?: string | null, map?: unknown) => void,
 * }} LoaderContext
 */

/**
 * Compile `.tsrx` files to TSX for consumption by Turbopack's built-in
 * TypeScript/React pipeline.
 *
 * MVP limitation: component-local `<style>` blocks are not supported yet,
 * because Turbopack's loader bridge is JS-oriented and does not currently map
 * cleanly to the sibling CSS sidecar model used by the Vite and Rspack
 * integrations.
 *
 * @this {LoaderContext}
 * @param {string} source
 * @returns {void}
 */
export default function tsrx_react_turbopack_loader(source) {
	const callback = this.async();

	try {
		const { code, map, css } = compile(source, this.resourcePath);

		if (css) {
			throw new Error(
				'@tsrx/turbopack-plugin-react does not support component-local <style> blocks yet. Use external CSS, or switch to @tsrx/vite-plugin-react or @tsrx/rspack-plugin-react.',
			);
		}

		callback(null, code, /** @type {any} */ (map ?? undefined));
	} catch (/** @type {any} */ err) {
		callback(err);
	}
}