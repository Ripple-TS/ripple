/** @import { Plugin } from 'vite' */
/** @import { DepScanTransformPlugin } from '@tsrx/core/types/vite/dep-scan' */

/**
 * @typedef {{ code: string, map: unknown }} TsrxPreactTransformResult
 * @typedef {{
 *   (code: string, id: `${string}.tsrx`): Promise<TsrxPreactTransformResult>,
 *   (code: string, id: string): Promise<TsrxPreactTransformResult | null>,
 * }} TsrxPreactTransform
 * @typedef {{
 *   (source: `${string}?tsrx-css&lang.css`): `\0${string}?tsrx-css&lang.css`,
 *   (source: string): string | null,
 * }} TsrxPreactResolveId
 * @typedef {{
 *   (id: `\0${string}?tsrx-css&lang.css`): string,
 *   (id: string): string | null,
 * }} TsrxPreactLoad
 * @typedef {() => {
 *   optimizeDeps: {
 *     extensions: string[],
 *     rolldownOptions: {
 *       transform: { jsx: { importSource: string } },
 *       plugins: [DepScanTransformPlugin],
 *     },
 *   },
 * }} TsrxPreactConfigHook
 * @typedef {Omit<Plugin, 'config' | 'transform' | 'resolveId' | 'load'> & {
 *   config: TsrxPreactConfigHook,
 *   transform: TsrxPreactTransform,
 *   resolveId: TsrxPreactResolveId,
 *   load: TsrxPreactLoad,
 * }} TsrxPreactPlugin
 */

import { transformWithOxc } from 'vite';
import { compile } from '@tsrx/preact';
import { createDepScanTransformPlugin } from '@tsrx/core/vite/dep-scan';

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
 *   runtimeImports?: 'compiler' | 'direct',
 * }} [options]
 * @returns {TsrxPreactPlugin}
 */
export function tsrxPreact(options = {}) {
	const jsxImportSource = options.jsxImportSource ?? 'preact';
	const compile_options = {
		suspenseSource: options.suspenseSource,
		runtimeImports: options.runtimeImports,
	};

	/** @type {Map<string, string>} */
	const css_cache = new Map();

	/**
	 * @param {string} source
	 * @param {string} id
	 * @returns {void}
	 */
	function update_css_cache(source, id) {
		const { css } = compile(source, id, compile_options);
		if (css) {
			css_cache.set(id, css);
		} else {
			css_cache.delete(id);
		}
	}

	return /** @type {TsrxPreactPlugin} */ ({
		name: '@tsrx/vite-plugin-preact',
		enforce: 'pre',

		config() {
			return {
				optimizeDeps: {
					// The scanner externalizes anything that is not a known JS
					// type unless its extension is listed here, so without this
					// entry the dep-scan plugin below never runs.
					extensions: ['.tsrx'],
					rolldownOptions: {
						// The scan runs its own jsx transform over the tsx the
						// dep-scan plugin hands back, and that transform defaults to
						// react's runtime. Point it at the configured source, or the
						// scan fails outright on an unresolvable
						// `react/jsx-dev-runtime` in a project that has no react.
						transform: { jsx: { importSource: jsxImportSource } },
						plugins: [create_dep_scan_plugin(jsxImportSource, compile_options)],
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

			let { code: tsx_code, css, map } = compile(code, id, compile_options);

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
 * @param {string} jsxImportSource
 * @param {{ suspenseSource?: string }} compile_options
 * @returns {DepScanTransformPlugin}
 */
function create_dep_scan_plugin(jsxImportSource, compile_options) {
	return createDepScanTransformPlugin({
		name: '@tsrx/vite-plugin-preact:dep-scan',
		filter: TSRX_EXTENSION_PATTERN,
		compile: (code, id) => compile(code, id, compile_options),
		// The main transform always emits automatic-runtime JSX, so the jsx
		// runtime module is a dependency of every compiled `.tsrx` file. Import
		// it explicitly so the scanner records it no matter how the scan's own
		// jsx transform is configured — in dev it resolves `jsx-dev-runtime`,
		// while the transform above emits plain `jsx-runtime`.
		imports: [jsxImportSource + '/jsx-runtime'],
	});
}

export default tsrxPreact;
