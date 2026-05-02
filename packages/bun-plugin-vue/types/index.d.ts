import type { BunPlugin } from 'bun';

export interface TsrxVueBunPluginVaporOptions {
	interop?: boolean;
	macros?: boolean | object;
	compiler?: {
		runtimeModuleName?: string;
	};
}

export interface TsrxVueBunPluginOptions {
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	emitCss?: boolean;
	vapor?: TsrxVueBunPluginVaporOptions;
}

export function tsrxVue(options?: TsrxVueBunPluginOptions): BunPlugin;
export default tsrxVue;
