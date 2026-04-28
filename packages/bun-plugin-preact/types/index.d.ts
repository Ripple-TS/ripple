import type { BunPlugin } from 'bun';

export interface TsrxPreactBunPluginOptions {
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	jsxImportSource?: string;
	suspenseSource?: string;
	emitCss?: boolean;
}

export function tsrxPreact(options?: TsrxPreactBunPluginOptions): BunPlugin;
export default tsrxPreact;
