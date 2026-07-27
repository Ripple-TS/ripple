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
 * @typedef {{
 *   name: string,
 *   transform: {
 *     filter: { id: RegExp },
 *     handler: (code: string, id: string) => { code: string, moduleType: 'tsx' },
 *   },
 * }} TsrxDepScanPlugin
 * @typedef {() => {
 *   optimizeDeps: {
 *     extensions: string[],
 *     rolldownOptions: { plugins: [TsrxDepScanPlugin] },
 *   },
 * }} TsrxReactConfigHook
 * @typedef {Omit<Plugin, 'config' | 'transform' | 'resolveId' | 'load'> & {
 *   config: TsrxReactConfigHook,
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

	/**
	 * @param {string} source
	 * @param {string} id
	 * @returns {void}
	 */
	function update_css_cache(source, id) {
		const { css } = compile(source, id);
		if (css) {
			css_cache.set(id, css);
		} else {
			css_cache.delete(id);
		}
	}

	return /** @type {TsrxReactPlugin} */ ({
		name: '@tsrx/vite-plugin-react',
		enforce: 'pre',

		config() {
			return {
				optimizeDeps: {
					// The scanner externalizes anything that is not a known JS
					// type unless its extension is listed here, so without this
					// entry the dep-scan plugin below never runs.
					extensions: ['.tsrx'],
					rolldownOptions: {
						plugins: [create_dep_scan_plugin(jsxImportSource)],
					},
				},
			};
		},

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

			let { code: tsx_code, css, map } = compile(code, id);

			let source = tsx_code;
			if (css) {
				css_cache.set(id, css);
				source = `import ${JSON.stringify(id + CSS_QUERY)};\n${tsx_code}`;
				if (map && typeof map.mappings === 'string') {
					map = { ...map, mappings: ';' + map.mappings };
				}
			} else {
				css_cache.delete(id);
			}

			const result = await transformWithOxc(
				source,
				id,
				{
					lang: 'tsx',
					sourcemap: true,
					jsx: {
						runtime: 'automatic',
						importSource: jsxImportSource,
					},
					target: 'esnext',
				},
				map,
			);

			return { code: result.code, map: result.map };
		},

		async handleHotUpdate(ctx) {
			if (!TSRX_EXTENSION_PATTERN.test(ctx.file)) return;

			update_css_cache(await ctx.read(), ctx.file);

			const css_mod = ctx.server.moduleGraph.getModuleById('\0' + ctx.file + CSS_QUERY);
			if (!css_mod) return ctx.modules;

			ctx.server.moduleGraph.invalidateModule(css_mod);
			return [...ctx.modules, css_mod];
		},
	});
}

/**
 * Vite's dependency scanner runs through Rolldown without the main plugin
 * pipeline, so on its own it cannot read `.tsrx` modules. Any npm dependency
 * imported only from `.tsrx` files would then be discovered at request time
 * instead of at startup, forcing a re-optimize and a full page reload.
 * Registered under `optimizeDeps.rolldownOptions.plugins`, this plugin
 * teaches the scan pass to compile `.tsrx` modules so their imports are
 * crawled up front.
 *
 * @param {string} jsxImportSource
 * @returns {TsrxDepScanPlugin}
 */
function create_dep_scan_plugin(jsxImportSource) {
	return {
		name: '@tsrx/vite-plugin-react:dep-scan',
		transform: {
			filter: { id: TSRX_EXTENSION_PATTERN },
			handler(code, id) {
				const { code: tsx_code } = compile(code, id);

				// The main transform always emits automatic-runtime JSX, so the
				// jsx runtime module is a dependency of every compiled `.tsrx`
				// file. Import it explicitly so the scanner records it no matter
				// how the scan's own jsx transform is configured.
				const jsx_runtime_import = `import ${JSON.stringify(jsxImportSource + '/jsx-runtime')};\n`;

				return { code: jsx_runtime_import + tsx_code, moduleType: 'tsx' };
			},
		},
	};
}

export default tsrxReact;
