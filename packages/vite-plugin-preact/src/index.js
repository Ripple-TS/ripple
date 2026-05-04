/** @import { Plugin } from 'vite' */

import { transformWithOxc } from 'vite';
import { compile } from '@tsrx/preact';

const TSRX_EXTENSION_PATTERN = /\.tsrx$/;
const CSS_QUERY = '?tsrx-css&lang.css';

/**
 * Vite plugin for `.tsrx` files that compiles them via `@tsrx/preact` and then
 * runs esbuild's JSX transform so the final output calls Preact's automatic
 * `jsx-runtime`. Per-component `<style>` blocks are emitted as virtual CSS
 * modules that are imported by the compiled JS output.
 *
 * @param {{
 *   jsxImportSource?: string,
 *   suspenseSource?: string,
 * }} [options]
 * @returns {Plugin}
 */
export function tsrxPreact(options = {}) {
	const jsxImportSource = options.jsxImportSource ?? 'preact';
	const compile_options = {
		suspenseSource: options.suspenseSource,
	};

	/** @type {Map<string, string>} */
	const css_cache = new Map();

	return {
		name: '@tsrx/vite-plugin-preact',
		enforce: 'pre',

		resolveId(source) {
			if (!source.includes(CSS_QUERY)) return null;
			if (source.startsWith('\0')) return source;
			return '\0' + source;
		},

		load(id) {
			if (!id.startsWith('\0') || !id.includes(CSS_QUERY)) return null;
			const key = id.slice(1).split('?')[0];
			const css = css_cache.get(key);
			return css ?? '';
		},

		async transform(code, id) {
			if (!TSRX_EXTENSION_PATTERN.test(id)) return null;

			const { code: tsx_code, css } = compile(code, id, compile_options);

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
	};
}

export default tsrxPreact;
