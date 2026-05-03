/** @import { Plugin } from 'vite' */

import vueJsxVaporModule from 'vue-jsx-vapor/vite';

/**
 * @typedef {(options: {
 *   macros: boolean;
 *   compiler: { runtimeModuleName: string };
 * }) => Plugin[]} VueJsxVaporPlugin
 */

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
