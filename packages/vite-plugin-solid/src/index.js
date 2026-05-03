/** @import { Plugin } from 'vite' */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve as path_resolve, isAbsolute } from 'node:path';
import { compile } from '@tsrx/solid';

const DEFAULT_TSRX_PATTERN = /\.tsrx$/;
const VIRTUAL_TSX_SUFFIX = '.tsx';
const CSS_QUERY = '?tsrx-solid-css&lang.css';

/**
 * Vite plugin that compiles `.tsrx` files to Solid-flavoured TSX via
 * `@tsrx/solid`. It does not run Solid's JSX-DOM-expressions transform
 * itself — instead it rewrites module ids so the upstream `vite-plugin-solid`
 * can handle that stage. Per-component `<style>` blocks become virtual CSS
 * modules that the compiled JS imports.
 *
 * @param {import('../types/index.js').TsrxSolidOptions} [options]
 * @returns {Plugin}
 */
export function tsrxSolid(options = {}) {
	/** @type {Map<string, string>} */
	const css_cache = new Map();

	/** @type {string} */
	let root_dir = process.cwd();

	const include_pattern = options.include ?? DEFAULT_TSRX_PATTERN;

	/**
	 * Decide whether a real (on-disk) path should be treated as a tsrx
	 * source module. Falls back to matching `.tsrx` when no custom
	 * `include` regex was supplied. Resets `lastIndex` before testing so
	 * user-supplied regexes with the `g` or `y` flag don't produce
	 * alternating true/false results across calls.
	 *
	 * @param {string} path
	 * @returns {boolean}
	 */
	const is_tsrx_source = (path) => {
		include_pattern.lastIndex = 0;
		return include_pattern.test(path);
	};

	/**
	 * Detect the virtual id form produced by {@link resolveId} (real path
	 * plus a `.tsx` suffix). A real path that matches `include_pattern`
	 * becomes virtual once we append `.tsx`, so the check is: strip `.tsx`
	 * and see if the remainder would have been accepted as a tsrx source.
	 *
	 * @param {string} id
	 * @returns {boolean}
	 */
	const is_virtual = (id) => {
		if (!id.endsWith(VIRTUAL_TSX_SUFFIX)) return false;
		return is_tsrx_source(id.slice(0, -VIRTUAL_TSX_SUFFIX.length));
	};

	/**
	 * @param {string} id
	 * @returns {string}
	 */
	const to_real_path = (id) => {
		const stripped = id.slice(0, -VIRTUAL_TSX_SUFFIX.length);
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

			// Rewrite tsrx source imports to their virtual `<path>.tsx` form
			// so downstream extension-based plugins pick the module up as TSX.
			if (is_tsrx_source(source)) {
				const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
				if (resolved && !is_virtual(resolved.id)) {
					return { ...resolved, id: resolved.id + VIRTUAL_TSX_SUFFIX };
				}
				if (resolved) return resolved;
				// Fallback: when `this.resolve` can't resolve (e.g. an absolute
				// path coming in as a root entry such as a vitest test file),
				// still rewrite to the virtual `.tsx` id directly so `load`
				// can read the real file.
				return source + VIRTUAL_TSX_SUFFIX;
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
			let final_map = /** @type {any} */ (map);
			if (css) {
				css_cache.set(real_path, css);
				final_code = `import ${JSON.stringify(real_path + CSS_QUERY)};\n${code}`;
				// The prepended import adds one line to the generated output;
				// shift every mapping down by one line so source positions stay
				// aligned. In VLQ source maps, each `;` separates generated
				// lines, so prefixing one `;` offsets all mappings by one line.
				if (final_map && typeof final_map.mappings === 'string') {
					final_map = { ...final_map, mappings: ';' + final_map.mappings };
				}
			} else {
				css_cache.delete(real_path);
			}

			return { code: final_code, map: final_map };
		},

		handleHotUpdate(ctx) {
			if (!is_tsrx_source(ctx.file)) return;
			// Invalidate the virtual `<path>.tsx` module so Vite re-runs `load`.
			// Also invalidate the virtual CSS module — Vite doesn't cascade
			// invalidation from importer to importee, so without this the CSS
			// module keeps serving the cached content and `<style>` edits in
			// `.tsrx` files wouldn't hot-reload.
			const virtual_id = ctx.file + VIRTUAL_TSX_SUFFIX;
			const css_virtual_id = '\0' + ctx.file + CSS_QUERY;
			const extra = [];
			const mod = ctx.server.moduleGraph.getModuleById(virtual_id);
			if (mod) extra.push(mod);
			const css_mod = ctx.server.moduleGraph.getModuleById(css_virtual_id);
			if (css_mod) extra.push(css_mod);
			if (extra.length > 0) return [...extra, ...ctx.modules];
			return ctx.modules;
		},
	};
}

export default tsrxSolid;
