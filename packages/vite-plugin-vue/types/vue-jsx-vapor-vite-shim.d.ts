declare module 'vue-jsx-vapor/vite' {
	import type { PluginOption } from 'vite';

	export interface VueJsxVaporViteOptions {
		macros?: boolean;
		compiler?: {
			runtimeModuleName?: string;
		};
	}

	const vueJsxVapor: (options?: VueJsxVaporViteOptions) => PluginOption;
	export default vueJsxVapor;
}
