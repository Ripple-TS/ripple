/** @import { Plugin } from 'vite' */

import vueJsxVaporModule from 'vue-jsx-vapor/vite';

/**
 * @typedef {(options: {
 *   macros: boolean;
 *   compiler: { runtimeModuleName: string };
 * }) => Plugin[]} VueJsxVaporPlugin
 */

const vueJsxVaporModuleInterop = /** @type {VueJsxVaporPlugin | { default: VueJsxVaporPlugin }} */ (
	/** @type {unknown} */ (vueJsxVaporModule)
);
const vueJsxVapor =
	typeof vueJsxVaporModuleInterop === 'function'
		? vueJsxVaporModuleInterop
		: vueJsxVaporModuleInterop.default;

export function tsrxVueVapor() {
	return vueJsxVapor({
		macros: true,
		compiler: {
			runtimeModuleName: 'vue-jsx-vapor',
		},
	});
}
