/** @import { Plugin } from 'vite' */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve as pathResolve } from 'node:path';
import { defineConfig } from 'vite';
import { compile } from '@tsrx/vue';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const DEFAULT_TSRX_PATTERN = /\.tsrx$/;
const VIRTUAL_TSX_SUFFIX = '.tsx';
const CSS_QUERY = '?tsrx-vue-css&lang.css';

function tsrxVue() {
	/** @type {Map<string, string>} */
	const cssCache = new Map();

	/** @type {string} */
	let rootDir = process.cwd();

	const isTsrxSource = (path) => {
		DEFAULT_TSRX_PATTERN.lastIndex = 0;
		return DEFAULT_TSRX_PATTERN.test(path);
	};

	const isVirtual = (id) => {
		if (!id.endsWith(VIRTUAL_TSX_SUFFIX)) return false;
		return isTsrxSource(id.slice(0, -VIRTUAL_TSX_SUFFIX.length));
	};

	const toRealPath = (id) => {
		const stripped = id.slice(0, -VIRTUAL_TSX_SUFFIX.length);
		if (isAbsolute(stripped) && existsSync(stripped)) return stripped;
		const reAnchored = pathResolve(rootDir, stripped.replace(/^\/+/, ''));
		if (existsSync(reAnchored)) return reAnchored;
		return stripped;
	};

	return {
		name: '@tsrx/vue-playground-plugin',
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
			let finalMap = map;
			if (css) {
				cssCache.set(realPath, css.code);
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

export default defineConfig({
	plugins: [
		tsrxVue(),
		vueJsxVapor({
			macros: true,
			compiler: {
				runtimeModuleName: 'vue-jsx-vapor',
			},
		}),
	],
});
