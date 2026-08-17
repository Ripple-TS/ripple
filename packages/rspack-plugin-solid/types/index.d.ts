import type { Compiler, RspackPluginInstance } from '@rspack/core';
import type { RuntimeImportMode } from '@tsrx/solid';

export interface TsrxSolidRspackPluginOptions {
	hot?: boolean;
	/** Direct mode requires `@tsrx/solid-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
}

export declare class TsrxSolidRspackPlugin implements RspackPluginInstance {
	constructor(options?: TsrxSolidRspackPluginOptions);
	options: Pick<TsrxSolidRspackPluginOptions, 'hot'> &
		Required<Pick<TsrxSolidRspackPluginOptions, 'runtimeImports'>>;
	apply(compiler: Compiler): void;
}

export default TsrxSolidRspackPlugin;
