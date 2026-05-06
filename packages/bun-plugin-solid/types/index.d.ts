import type { BunPlugin } from 'bun';

export interface TsrxSolidBunPluginOptions {
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	emitCss?: boolean;
	solid?: object;
}

export function tsrxSolid(options?: TsrxSolidBunPluginOptions): BunPlugin;
export default tsrxSolid;
