/** @import { Plugin } from 'vite' */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve as path_resolve, isAbsolute } from 'node:path';
import { compile } from '@tsrx/solid';

const TSRX_EXTENSION = '.tsrx';
/**
 * Suffix appended to `.tsrx` module ids so downstream plugins (in particular
 * `vite-plugin-solid`) see a `.tsx` extension and pick up the module for
 * JSX-DOM-expressions transformation.
 */
const VIRTUAL_SUFFIX = '.tsrx.tsx';
const CSS_QUERY = '?tsrx-solid-css&lang.css';

/**
 * Vite plugin that compiles `.tsrx` files to Solid-flavoured TSX via
 * `@tsrx/solid`. It does not run Solid's JSX-DOM-expressions transform
 * itself — instead it rewrites module ids so the upstream `vite-plugin-solid`
 * can handle that stage. Per-component `<style>` blocks become virtual CSS
 * modules that the compiled JS imports.
 *
 * @param {import('../types/index.js').TsrxSolidOptions} [_options]
 * @returns {Plugin}
 */
export function tsrxSolid(_options = {}) {
	/** @type {Map<string, string>} */
	const css_cache = new Map();

	/** @type {string} */
	let root_dir = process.cwd();

	/**
	 * @param {string} id
	 * @returns {boolean}
	 */
	const is_virtual = (id) => id.endsWith(VIRTUAL_SUFFIX);

	/**
	 * @param {string} id
	 * @returns {string}
	 */
	const to_real_path = (id) => {
		const stripped = id.slice(0, -'.tsx'.length);
		if (isAbsolute(stripped) && existsSync(stripped)) return stripped;
		// Vitest sometimes strips the workspace root from ids; re-anchor them.
		const re_anchored = path_resolve(root_dir, stripped.replace(/^\/+/, ''));
		if (existsSync(re_anchored)) return re_anchored;
		return stripped;
	};

	return {
		name: '@tsrx/vite-plugin-solid',
		enforce: 'pre',

		configResolved(config) {
			root_dir = config.root;
		},

		async resolveId(source, importer, options) {
			// Intercept virtual CSS imports.
			if (source.includes(CSS_QUERY)) {
				if (source.startsWith('\0')) return source;
				return '\0' + source;
			}
			if (is_virtual(source)) return source;

			// Rewrite `.tsrx` imports to their `.tsrx.tsx` virtual form so
			// downstream extension-based plugins pick the module up as TSX.
			if (source.endsWith(TSRX_EXTENSION)) {
				const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
				if (resolved && !is_virtual(resolved.id)) {
					return { ...resolved, id: resolved.id + '.tsx' };
				}
				if (resolved) return resolved;
				// Fallback: when `this.resolve` can't resolve (e.g. an absolute
				// path coming in as a root entry such as a vitest test file),
				// still rewrite to the virtual `.tsx` id directly so `load`
				// can read the real file.
				return source + '.tsx';
			}
			return null;
		},

		async load(id) {
			if (id.startsWith('\0') && id.includes(CSS_QUERY)) {
				const key = id.slice(1).split('?')[0];
				return css_cache.get(key) ?? '';
			}
			if (!is_virtual(id)) return null;

			const real_path = to_real_path(id.split('?')[0]);
			const source = await readFile(real_path, 'utf-8');
			const { code, css, map } = compile(source, real_path);

			let final_code = code;
			if (css) {
				css_cache.set(real_path, css.code);
				final_code = `import ${JSON.stringify(real_path + CSS_QUERY)};\n${code}`;
			} else {
				css_cache.delete(real_path);
			}

			return { code: final_code, map: /** @type {any} */ (map) };
		},

		handleHotUpdate(ctx) {
			if (!ctx.file.endsWith(TSRX_EXTENSION)) return;
			// Invalidate the virtual `.tsrx.tsx` module so Vite re-runs `load`.
			const virtual_id = ctx.file + '.tsx';
			const mod = ctx.server.moduleGraph.getModuleById(virtual_id);
			if (mod) return [mod, ...ctx.modules];
			return ctx.modules;
		},
	};
}

export default tsrxSolid;
