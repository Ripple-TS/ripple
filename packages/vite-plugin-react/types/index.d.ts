import type { Plugin } from 'vite';

export interface TsrxReactPluginOptions {
	jsxImportSource?: string;
}

export function tsrxReact(options?: TsrxReactPluginOptions): Plugin;
export default tsrxReact;
