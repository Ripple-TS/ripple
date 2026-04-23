import vueJsxVapor from '../../../playground/vue/node_modules/vue-jsx-vapor/dist/vite.js';

export function tsrxVueVapor() {
	return vueJsxVapor({
		macros: true,
		compiler: {
			runtimeModuleName: 'vue-jsx-vapor',
		},
	});
}
