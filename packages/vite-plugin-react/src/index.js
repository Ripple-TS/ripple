/** @import { Plugin } from 'vite' */

/**
 * @typedef {{ code: string, map: unknown }} TsrxReactTransformResult
 * @typedef {{
 *   (code: string, id: `${string}.tsrx`): Promise<TsrxReactTransformResult>,
 *   (code: string, id: string): Promise<TsrxReactTransformResult | null>,
 * }} TsrxReactTransform
 * @typedef {{
 *   (source: `${string}?tsrx-css&lang.css`): `\0${string}?tsrx-css&lang.css`,
 *   (source: string): string | null,
 * }} TsrxReactResolveId
 * @typedef {{
 *   (id: `\0${string}?tsrx-css&lang.css`): string,
 *   (id: string): string | null,
 * }} TsrxReactLoad
 * @typedef {Omit<Plugin, 'transform' | 'resolveId' | 'load'> & {
 *   transform: TsrxReactTransform,
 *   resolveId: TsrxReactResolveId,
 *   load: TsrxReactLoad,
 * }} TsrxReactPlugin
 */

import { transformWithOxc } from 'vite';
import { compile } from '@tsrx/react';

const TSRX_EXTENSION_PATTERN = /\.tsrx$/;
const CSS_QUERY = '?tsrx-css&lang.css';

/**
 * Vite plugin for `.tsrx` files that compiles them via `@tsrx/react` and then
 * runs esbuild's JSX transform so the final output calls React's automatic
 * `jsx-runtime`. Per-component `<style>` blocks are emitted as virtual CSS
 * modules that are imported by the compiled JS output.
 *
 * @param {{ jsxImportSource?: string }} [options]
 * @returns {TsrxReactPlugin}
 */
export function tsrxReact(options = {}) {
	const jsxImportSource = options.jsxImportSource ?? 'react';

	/** @type {Map<string, string>} */
	const css_cache = new Map();

	return /** @type {TsrxReactPlugin} */ ({
		name: '@tsrx/vite-plugin-react',
		enforce: 'pre',

		resolveId(/** @type {string} */ source) {
			if (!source.includes(CSS_QUERY)) return null;
			if (source.startsWith('\0')) return source;
			return '\0' + source;
		},

		load(/** @type {string} */ id) {
			if (!id.startsWith('\0') || !id.includes(CSS_QUERY)) return null;
			const key = id.slice(1).split('?')[0];
			const css = css_cache.get(key);
			return css ?? '';
		},

		async transform(/** @type {string} */ code, /** @type {string} */ id) {
			if (!TSRX_EXTENSION_PATTERN.test(id)) return null;

			const { code: tsx_code, css } = compile(code, id);

			let source = tsx_code;
			if (css) {
				css_cache.set(id, css);
				source = `import ${JSON.stringify(id + CSS_QUERY)};\n${tsx_code}`;
			} else {
				css_cache.delete(id);
			}

			const result = await transformWithOxc(source, id, {
				lang: 'tsx',
				sourcemap: true,
				jsx: {
					runtime: 'automatic',
					importSource: jsxImportSource,
				},
				target: 'esnext',
			});

			return { code: result.code, map: result.map };
		},
	});
}

export default tsrxReact;
