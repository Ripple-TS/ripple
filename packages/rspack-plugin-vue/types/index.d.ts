import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxVueRspackVaporOptions {
	interop?: boolean;
	macros?: boolean | object;
	compiler?: {
		runtimeModuleName?: string;
	};
}

export interface TsrxVueRspackPluginOptions {
	vapor?: TsrxVueRspackVaporOptions;
}

export declare class TsrxVueRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxVueRspackPluginOptions);
	options: TsrxVueRspackPluginOptions;
	apply(compiler: Compiler): void;
}

export default TsrxVueRspackPlugin;
