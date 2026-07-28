/**
 * Rolldown plugins that make `.tsrx` modules visible to Vite's dependency
 * scanner.
 *
 * The scanner runs through Rolldown without the main plugin pipeline, so on its
 * own it cannot read `.tsrx` modules. Any npm dependency imported only from
 * `.tsrx` files is then discovered at request time rather than at startup,
 * which forces a re-optimize and a full page reload. Registering one of these
 * under `optimizeDeps.rolldownOptions.plugins` teaches the scan pass to compile
 * `.tsrx` modules so their imports are crawled up front.
 *
 * Which factory to use depends on how the host plugin exposes `.tsrx` modules:
 *
 * - {@link createDepScanTransformPlugin} for plugins that transform `.tsrx`
 *   ids directly. Those plugins must also list the extension in
 *   `optimizeDeps.extensions`, because the scanner externalizes anything that
 *   is not a known JS type before a plugin gets a chance to run.
 * - {@link createDepScanLoadPlugin} for plugins that rewrite `.tsrx` ids to a
 *   virtual `<path>.tsx` form. The scanner accepts those on extension alone, so
 *   no `optimizeDeps.extensions` entry is needed, but it never calls Vite
 *   `load()` hooks for virtual ids.
 *
 * Both swallow compile failures. Vite responds to a scan error by skipping
 * pre-bundling for the whole project, so a single malformed file would
 * otherwise cost every other dependency its pre-bundle. Handing back an empty
 * module keeps the rest of the graph crawlable and leaves the error to the host
 * plugin's own transform, which reports it at request time where it can be
 * surfaced properly.
 *
 * @import { DepScanCompile, DepScanLoadPlugin, DepScanTransformPlugin } from '../../types/vite/dep-scan.js'
 */

import { readFile } from 'node:fs/promises';

/**
 * Render `imports` as a side-effect import prelude. Used for runtime modules
 * that the host plugin's own output depends on but that the scan pass would
 * otherwise miss — a JSX runtime, for instance, which the scanner's own JSX
 * transform may resolve to a different specifier than the host plugin does.
 *
 * @param {string[] | undefined} imports
 * @returns {string}
 */
function render_prelude(imports) {
	if (imports === undefined || imports.length === 0) return '';

	return imports.map((source) => `import ${JSON.stringify(source)};`).join('\n') + '\n';
}

/**
 * Scan plugin for host plugins that transform `.tsrx` ids directly.
 *
 * @param {{
 *   name: string,
 *   filter: RegExp,
 *   compile: DepScanCompile,
 *   imports?: string[],
 *   moduleType?: string,
 * }} options
 * @returns {DepScanTransformPlugin}
 */
export function createDepScanTransformPlugin({
	name,
	filter,
	compile,
	imports,
	moduleType = 'tsx',
}) {
	const prelude = render_prelude(imports);

	return {
		name,
		transform: {
			filter: { id: filter },
			async handler(/** @type {string} */ code, /** @type {string} */ id) {
				try {
					const { code: compiled } = await compile(code, id);
					return { code: prelude + compiled, moduleType };
				} catch {
					return { code: '', moduleType };
				}
			},
		},
	};
}

/**
 * Scan plugin for host plugins that rewrite `.tsrx` ids to a virtual
 * `<path>.tsx` form, which the scanner resolves but never loads.
 *
 * @param {{
 *   name: string,
 *   isVirtual: (id: string) => boolean,
 *   toRealPath: (id: string) => string,
 *   compile: DepScanCompile,
 *   imports?: string[],
 *   moduleType?: string,
 * }} options
 * @returns {DepScanLoadPlugin}
 */
export function createDepScanLoadPlugin({
	name,
	isVirtual,
	toRealPath,
	compile,
	imports,
	moduleType = 'tsx',
}) {
	const prelude = render_prelude(imports);

	return {
		name,
		async load(/** @type {string} */ id) {
			// Both callbacks are written against plain paths, so drop any query
			// suffix once here rather than leaving each caller to remember.
			const path = id.split('?')[0];

			if (!isVirtual(path)) return null;

			const real_path = toRealPath(path);

			try {
				// The read is inside the try along with the compile: a virtual id
				// pointing at a file that has since moved is just as survivable as
				// one that fails to parse, and the host plugin's own `load()` will
				// report either at request time.
				const source = await readFile(real_path, 'utf-8');
				const { code } = await compile(source, real_path);
				return { code: prelude + code, moduleType };
			} catch {
				return { code: '', moduleType };
			}
		},
	};
}
