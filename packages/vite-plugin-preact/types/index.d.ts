import type { Plugin } from 'vite';
import type { RuntimeImportMode } from '@tsrx/preact';

export interface TsrxPreactPluginOptions {
	jsxImportSource?: string;
	suspenseSource?: string;
	/** Direct mode requires `@tsrx/preact-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
}

export function tsrxPreact(options?: TsrxPreactPluginOptions): Plugin;
export default tsrxPreact;
