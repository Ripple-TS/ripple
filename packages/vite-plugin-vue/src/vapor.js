import vueJsxVapor from 'vue-jsx-vapor/vite';

export function tsrxVueVapor() {
	return vueJsxVapor({
		macros: true,
		compiler: {
			runtimeModuleName: 'vue-jsx-vapor',
		},
	});
}
