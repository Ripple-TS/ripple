/** @import { Plugin } from 'vite' */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve as pathResolve } from 'node:path';
import { compile } from '@tsrx/vue';
import vueJsxVaporModule from 'vue-jsx-vapor/vite';
import { createVaporInteropPlugin } from './interop.js';

const DEFAULT_TSRX_PATTERN = /\.tsrx$/;
const VIRTUAL_TSX_SUFFIX = '.tsx';
const CSS_QUERY = '?tsrx-vue-css&lang.css';
const DEFAULT_VAPOR_OPTIONS = {
	macros: true,
	compiler: {
		runtimeModuleName: 'vue-jsx-vapor',
	},
};

/**
 * @typedef {(options: {
 *   macros?: boolean | object;
 *   compiler?: { runtimeModuleName?: string };
 * }) => Plugin[]} VueJsxVaporPlugin
 */

const vueJsxVaporModuleInterop = /** @type {VueJsxVaporPlugin | { default: VueJsxVaporPlugin }} */ (
	/** @type {unknown} */ (vueJsxVaporModule)
);
const vueJsxVapor =
	typeof vueJsxVaporModuleInterop === 'function'
		? vueJsxVaporModuleInterop
		: vueJsxVaporModuleInterop.default;

/**
 * Vite plugin that compiles `.tsrx` files to Vue-flavoured TSX via
 * `@tsrx/vue`, then runs the downstream `vue-jsx-vapor` transform. It rewrites
 * module ids to a virtual `<path>.tsx` form so the Vapor JSX plugin can handle
 * the Vue JSX runtime stage.
 * Per-component `<style>` blocks become virtual CSS modules that the compiled
 * JS imports.
 *
 * @param {import('../types/index.js').TsrxVueOptions} [options]
 * @returns {Plugin[]}
 */
export function tsrxVue(options = {}) {
	return [
		createVaporInteropPlugin(),
		create_tsrx_vue_plugin(options),
		...vueJsxVapor(resolve_vapor_options(options.vapor)),
	];
}

/**
 * @param {import('../types/index.js').TsrxVueOptions['vapor']} options
 */
function resolve_vapor_options(options) {
	const { interop: _interop, ...rest } =
		/** @type {{ interop?: boolean, macros?: boolean | object, compiler?: { runtimeModuleName?: string } }} */ (
			options ?? {}
		);
	return {
		...DEFAULT_VAPOR_OPTIONS,
		...rest,
		compiler: {
			...DEFAULT_VAPOR_OPTIONS.compiler,
			...rest.compiler,
		},
	};
}

/**
 * @param {import('../types/index.js').TsrxVueOptions} options
 * @returns {Plugin}
 */
function create_tsrx_vue_plugin(options) {
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

		config() {
			return {
				resolve: {
					dedupe: ['vue', 'vue-jsx-vapor'],
				},
				optimizeDeps: {
					rolldownOptions: {
						plugins: [create_tsrx_vue_scan_plugin(isVirtual, toRealPath)],
					},
				},
			};
		},

		configResolved(config) {
			rootDir = config.root;
		},

		async resolveId(source, importer, options) {
			if (source.includes(CSS_QUERY)) {
				if (source.startsWith('\0')) return source;
				return '\0' + source;
			}

			if (isVirtual(source)) {
				return isAbsolute(source) ? source : pathResolve(rootDir, source.replace(/^\/+/, ''));
			}

			if (isTsrxSource(source)) {
				const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
				if (resolved && !isVirtual(resolved.id)) {
					const resolvedId = isAbsolute(resolved.id)
						? resolved.id
						: pathResolve(rootDir, resolved.id.replace(/^\/+/, ''));
					return { ...resolved, id: resolvedId + VIRTUAL_TSX_SUFFIX };
				}
				if (resolved) return resolved;
				// Re-anchor the fallback virtual id to an absolute path so
				// downstream import resolution walks `node_modules` from the
				// real file's location rather than from workspace root —
				// otherwise package deps declared inside
				// `packages/<pkg>/node_modules` are invisible to vite.
				const absoluteSource = isAbsolute(source)
					? source
					: pathResolve(rootDir, source.replace(/^\/+/, ''));
				return absoluteSource + VIRTUAL_TSX_SUFFIX;
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

/**
 * Vite's dependency scanner runs through Rolldown and does not call Vite
 * `load()` hooks for virtual ids. Teach the scan pass how to read the same
 * `<path>.tsrx.tsx` modules so dev pre-bundling can crawl their imports.
 *
 * @param {(id: string) => boolean} isVirtual
 * @param {(id: string) => string} toRealPath
 */
function create_tsrx_vue_scan_plugin(isVirtual, toRealPath) {
	return {
		name: '@tsrx/vite-plugin-vue:dep-scan',
		/**
		 * @param {string} id
		 */
		async load(id) {
			if (!isVirtual(id)) return null;

			const realPath = toRealPath(id.split('?')[0]);
			const source = await readFile(realPath, 'utf-8');
			const { code } = compile(source, realPath);

			return {
				code,
				moduleType: 'tsx',
			};
		},
	};
}

export default tsrxVue;
