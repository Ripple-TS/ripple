import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxPreactRspackPluginOptions {
	jsxImportSource?: string;
	suspenseSource?: string;
}

export declare class TsrxPreactRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxPreactRspackPluginOptions);
	options: Required<Pick<TsrxPreactRspackPluginOptions, 'jsxImportSource'>> &
		Pick<TsrxPreactRspackPluginOptions, 'suspenseSource'>;
	apply(compiler: Compiler): void;
}

export default TsrxPreactRspackPlugin;
