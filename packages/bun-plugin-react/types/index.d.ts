import type { BunPlugin } from 'bun';

export interface TsrxReactBunPluginOptions {
	runtimeImports?: 'compiler' | 'direct';
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	jsxImportSource?: string;
	emitCss?: boolean;
}

export function tsrxReact(options?: TsrxReactBunPluginOptions): BunPlugin;
export default tsrxReact;
