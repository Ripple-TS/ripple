import type { Compiler, RspackPluginInstance } from '@rspack/core';
import type { RuntimeImportMode } from '@tsrx/preact';

export interface TsrxPreactRspackPluginOptions {
	jsxImportSource?: string;
	suspenseSource?: string;
	/** Direct mode requires `@tsrx/preact-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
}

export declare class TsrxPreactRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxPreactRspackPluginOptions);
	options: Required<Pick<TsrxPreactRspackPluginOptions, 'jsxImportSource'>> &
		Pick<TsrxPreactRspackPluginOptions, 'suspenseSource'> &
		Required<Pick<TsrxPreactRspackPluginOptions, 'runtimeImports'>>;
	apply(compiler: Compiler): void;
}

export default TsrxPreactRspackPlugin;
