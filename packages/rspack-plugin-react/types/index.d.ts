import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface TsrxReactRspackPluginOptions {
	jsxImportSource?: string;
	runtimeImports?: 'compiler' | 'direct';
}

export declare class TsrxReactRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxReactRspackPluginOptions);
	options: Required<TsrxReactRspackPluginOptions>;
	apply(compiler: Compiler): void;
}

export default TsrxReactRspackPlugin;
