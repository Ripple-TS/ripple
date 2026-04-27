/** @import { Plugin } from 'vite' */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const vueJsxVaporViteEntry = 'vue-jsx-vapor/vite';

/**
 * @typedef {(options: {
 *   macros: boolean;
 *   compiler: { runtimeModuleName: string };
 * }) => Plugin[]} VueJsxVaporPlugin
 */

const vueJsxVaporModule = /** @type {{ default: VueJsxVaporPlugin } | VueJsxVaporPlugin} */ (
	require(vueJsxVaporViteEntry)
);
const vueJsxVapor =
	typeof vueJsxVaporModule === 'function' ? vueJsxVaporModule : vueJsxVaporModule.default;

export function tsrxVueVapor() {
	return vueJsxVapor({
		macros: true,
		compiler: {
			runtimeModuleName: 'vue-jsx-vapor',
		},
	});
}
