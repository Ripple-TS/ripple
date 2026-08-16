import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxSolidRspackPluginOptions {
	hot?: boolean;
	runtimeImports?: 'compiler' | 'direct';
}

export declare class TsrxSolidRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxSolidRspackPluginOptions);
	options: Pick<TsrxSolidRspackPluginOptions, 'hot'> &
		Required<Pick<TsrxSolidRspackPluginOptions, 'runtimeImports'>>;
	apply(compiler: Compiler): void;
}

export default TsrxSolidRspackPlugin;
