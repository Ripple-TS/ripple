/** @import {Plugin} from 'vite' */
/** @import {StylexOptions} from './index.js' */

import stylex_vite from '@stylexjs/unplugin/vite';

/**
 * Compile StyleX after Ripple has lowered `.tsrx` to JavaScript.
 * @param {StylexOptions} [options]
 * @returns {Plugin}
 */
export function stylex(options = {}) {
	const plugin_options = {
		...options,
		sxPropName: false,
		babelConfig: {
			...options.babelConfig,
			plugins: [
				...(options.babelConfig?.plugins ?? []),
				{
					name: 'ripple-stylex-source-maps',
					// The unplugin does not request Babel maps by default. Vite
					// needs this map to compose with Ripple's original source map.
					/** @param {{ generatorOpts: { sourceMaps?: boolean } }} options */
					manipulateOptions(options) {
						options.generatorOpts.sourceMaps = true;
					},
				},
			],
		},
	};
	/** @type {Plugin} */
	const plugin = stylex_vite(plugin_options);
	const transform = plugin.transform;
	const handler = typeof transform === 'function' ? transform : transform?.handler;

	/** @type {Plugin} */
	const adapter = {
		...plugin,
		name: 'vite-plugin-ripple:stylex',
		// Ripple runs in the pre phase. A normal transform also works when
		// users place stylex() before ripple() in their plugin array.
		enforce: undefined,
		async transform(code, id, opts) {
			// StyleX 0.19 only accepts JS/TS and Svelte IDs. Its transform
			// strips the query before passing the filename to Babel, preserving
			// relative imports, diagnostics, and source maps for the real file.
			const stylex_id = id.endsWith('.tsrx') ? `${id}?stylex.js` : id;
			// Vite owns the dev module graph. The unplugin's eager ctx.load()
			// walk can deadlock on optimized dependencies while the scanner is
			// waiting for this transform. Only disable that walk, not Vite HMR.
			const context =
				this.environment.mode === 'dev'
					? Object.create(this, { meta: { value: { ...this.meta, watchMode: false } } })
					: this;
			return handler?.call(context, code, stylex_id, opts);
		},
	};
	return adapter;
}
