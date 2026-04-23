import type { Plugin } from 'vite';

export interface TsrxPreactPluginOptions {
	jsxImportSource?: string;
	suspenseSource?: string;
}

export function tsrxPreact(options?: TsrxPreactPluginOptions): Plugin;
export default tsrxPreact;
