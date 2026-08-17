import type { BunPlugin } from 'bun';
import type { RuntimeImportMode } from '@tsrx/preact';

export interface TsrxPreactBunPluginOptions {
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	jsxImportSource?: string;
	suspenseSource?: string;
	runtimeImports?: RuntimeImportMode;
	emitCss?: boolean;
}

export function tsrxPreact(options?: TsrxPreactBunPluginOptions): BunPlugin;
export default tsrxPreact;
