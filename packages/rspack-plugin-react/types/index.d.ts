import type { Compiler, RspackPluginInstance } from '@rspack/core';
import type { RuntimeImportMode } from '@tsrx/react';

export interface TsrxReactRspackPluginOptions {
	jsxImportSource?: string;
	/** Direct mode requires `@tsrx/react-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
}

export declare class TsrxReactRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxReactRspackPluginOptions);
	options: Required<TsrxReactRspackPluginOptions>;
	apply(compiler: Compiler): void;
}

export default TsrxReactRspackPlugin;
