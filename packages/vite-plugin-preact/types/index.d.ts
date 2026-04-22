import type { Plugin } from 'vite';

export interface TsrxPreactPluginOptions {
	jsxImportSource?: string;
}

export function tsrxPreact(options?: TsrxPreactPluginOptions): Plugin;
export default tsrxPreact;
