import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxSolidRspackPluginOptions {
	hot?: boolean;
}

export declare class TsrxSolidRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxSolidRspackPluginOptions);
	options: TsrxSolidRspackPluginOptions;
	apply(compiler: Compiler): void;
}

export default TsrxSolidRspackPlugin;
