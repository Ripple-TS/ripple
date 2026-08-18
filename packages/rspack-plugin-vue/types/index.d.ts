import type { Compiler, RspackPluginInstance } from '@rspack/core';
import type { RuntimeImportMode } from '@tsrx/vue';

export interface TsrxVueRspackVaporOptions {
	macros?: boolean | object;
	compiler?: {
		runtimeModuleName?: string;
	};
}

export interface TsrxVueRspackPluginOptions {
	vapor?: TsrxVueRspackVaporOptions;
	/** Direct mode requires `@tsrx/vue-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
}

export declare class TsrxVueRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxVueRspackPluginOptions);
	options: Pick<TsrxVueRspackPluginOptions, 'vapor'> &
		Required<Pick<TsrxVueRspackPluginOptions, 'runtimeImports'>>;
	apply(compiler: Compiler): void;
}

export default TsrxVueRspackPlugin;
