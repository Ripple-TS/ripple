import type { BunPlugin } from 'bun';
import type { RuntimeImportMode } from '@tsrx/vue';

export interface TsrxVueBunPluginVaporOptions {
	macros?: boolean | object;
	compiler?: {
		runtimeModuleName?: string;
	};
}

export interface TsrxVueBunPluginOptions {
	/** Direct mode requires `@tsrx/vue-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	emitCss?: boolean;
	vapor?: TsrxVueBunPluginVaporOptions;
}

export function tsrxVue(options?: TsrxVueBunPluginOptions): BunPlugin;
export default tsrxVue;
