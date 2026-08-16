import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxPreactRspackPluginOptions {
	jsxImportSource?: string;
	suspenseSource?: string;
	runtimeImports?: 'compiler' | 'direct';
}

export declare class TsrxPreactRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxPreactRspackPluginOptions);
	options: Required<Pick<TsrxPreactRspackPluginOptions, 'jsxImportSource'>> &
		Pick<TsrxPreactRspackPluginOptions, 'suspenseSource'> &
		Required<Pick<TsrxPreactRspackPluginOptions, 'runtimeImports'>>;
	apply(compiler: Compiler): void;
}

export default TsrxPreactRspackPlugin;
