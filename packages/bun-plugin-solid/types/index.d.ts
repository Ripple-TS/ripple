import type { BunPlugin } from 'bun';
import type { RuntimeImportMode } from '@tsrx/solid';

export interface TsrxSolidBunPluginOptions {
	runtimeImports?: RuntimeImportMode;
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	emitCss?: boolean;
	solid?: object;
}

export function tsrxSolid(options?: TsrxSolidBunPluginOptions): BunPlugin;
export default tsrxSolid;
