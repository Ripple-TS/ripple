import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxVueRspackVaporOptions {
	macros?: boolean | object;
	compiler?: {
		runtimeModuleName?: string;
	};
}

export interface TsrxVueRspackPluginOptions {
	vapor?: TsrxVueRspackVaporOptions;
	runtimeImports?: 'compiler' | 'direct';
}

export declare class TsrxVueRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxVueRspackPluginOptions);
	options: Pick<TsrxVueRspackPluginOptions, 'vapor'> &
		Required<Pick<TsrxVueRspackPluginOptions, 'runtimeImports'>>;
	apply(compiler: Compiler): void;
}

export default TsrxVueRspackPlugin;
