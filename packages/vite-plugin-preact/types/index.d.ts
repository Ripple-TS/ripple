import type { Plugin } from 'vite';
import type { RuntimeImportMode } from '@tsrx/preact';

export interface TsrxPreactPluginOptions {
	jsxImportSource?: string;
	suspenseSource?: string;
	runtimeImports?: RuntimeImportMode;
}

export function tsrxPreact(options?: TsrxPreactPluginOptions): Plugin;
export default tsrxPreact;
