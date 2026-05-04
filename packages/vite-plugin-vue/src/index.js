/** @import { Plugin } from 'vite' */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve as pathResolve } from 'node:path';
import { compile } from '@tsrx/vue';

const DEFAULT_TSRX_PATTERN = /\.tsrx$/;
const VIRTUAL_TSX_SUFFIX = '.tsx';
const CSS_QUERY = '?tsrx-vue-css&lang.css';

/**
 * Vite plugin that compiles `.tsrx` files to Vue-flavoured TSX via
 * `@tsrx/vue`. It rewrites module ids to a virtual `<path>.tsx` form so the
 * downstream `vue-jsx-vapor` plugin can handle the Vue JSX runtime stage.
 * Per-component `<style>` blocks become virtual CSS modules that the compiled
 * JS imports.
 *
 * @param {import('../types/index.js').TsrxVueOptions} [options]
 * @returns {Plugin}
 */
export function tsrxVue(options = {}) {
	/** @type {Map<string, string>} */
	const cssCache = new Map();

	/** @type {string} */
	let rootDir = process.cwd();

	const includePattern = options.include ?? DEFAULT_TSRX_PATTERN;

	/**
	 * @param {string} path
	 * @returns {boolean}
	 */
	const isTsrxSource = (path) => {
		includePattern.lastIndex = 0;
		return includePattern.test(path);
	};

	/**
	 * @param {string} id
	 * @returns {boolean}
	 */
	const isVirtual = (id) => {
		if (!id.endsWith(VIRTUAL_TSX_SUFFIX)) return false;
		return isTsrxSource(id.slice(0, -VIRTUAL_TSX_SUFFIX.length));
	};

	/**
	 * @param {string} id
	 * @returns {string}
	 */
	const toRealPath = (id) => {
		const stripped = id.slice(0, -VIRTUAL_TSX_SUFFIX.length);
		if (isAbsolute(stripped) && existsSync(stripped)) return stripped;
		const reAnchored = pathResolve(rootDir, stripped.replace(/^\/+/, ''));
		if (existsSync(reAnchored)) return reAnchored;
		return stripped;
	};

	return {
		name: '@tsrx/vite-plugin-vue',
		enforce: 'pre',

		configResolved(config) {
			rootDir = config.root;
		},

		async resolveId(source, importer, options) {
			if (source.includes(CSS_QUERY)) {
				if (source.startsWith('\0')) return source;
				return '\0' + source;
			}

			if (isVirtual(source)) return source;

			if (isTsrxSource(source)) {
				const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
				if (resolved && !isVirtual(resolved.id)) {
					return { ...resolved, id: resolved.id + VIRTUAL_TSX_SUFFIX };
				}
				if (resolved) return resolved;
				return source + VIRTUAL_TSX_SUFFIX;
			}

			return null;
		},

		async load(id) {
			if (id.startsWith('\0') && id.includes(CSS_QUERY)) {
				const key = id.slice(1).split('?')[0];
				return cssCache.get(key) ?? '';
			}

			if (!isVirtual(id)) return null;

			const realPath = toRealPath(id.split('?')[0]);
			const source = await readFile(realPath, 'utf-8');
			const { code, css, map } = compile(source, realPath);

			let finalCode = code;
			let finalMap = /** @type {any} */ (map);
			if (css) {
				cssCache.set(realPath, css);
				finalCode = `import ${JSON.stringify(realPath + CSS_QUERY)};\n${code}`;
				if (finalMap && typeof finalMap.mappings === 'string') {
					finalMap = { ...finalMap, mappings: ';' + finalMap.mappings };
				}
			} else {
				cssCache.delete(realPath);
			}

			return { code: finalCode, map: finalMap };
		},

		handleHotUpdate(ctx) {
			if (!isTsrxSource(ctx.file)) return;

			const virtualId = ctx.file + VIRTUAL_TSX_SUFFIX;
			const cssVirtualId = '\0' + ctx.file + CSS_QUERY;
			const extra = [];
			const mod = ctx.server.moduleGraph.getModuleById(virtualId);
			if (mod) extra.push(mod);
			const cssMod = ctx.server.moduleGraph.getModuleById(cssVirtualId);
			if (cssMod) extra.push(cssMod);
			if (extra.length > 0) return [...extra, ...ctx.modules];
			return ctx.modules;
		},
	};
}

export default tsrxVue;
