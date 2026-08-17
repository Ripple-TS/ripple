import type { BunPlugin } from 'bun';
import type { RuntimeImportMode } from '@tsrx/react';

export interface TsrxReactBunPluginOptions {
	runtimeImports?: RuntimeImportMode;
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	jsxImportSource?: string;
	emitCss?: boolean;
}

export function tsrxReact(options?: TsrxReactBunPluginOptions): BunPlugin;
export default tsrxReact;
