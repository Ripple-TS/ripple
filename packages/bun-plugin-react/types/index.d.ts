import type { BunPlugin } from 'bun';
import type { RuntimeImportMode } from '@tsrx/react';

export interface TsrxReactBunPluginOptions {
	/** Direct mode requires `@tsrx/react-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
	include?: RegExp;
	exclude?: RegExp | RegExp[];
	jsxImportSource?: string;
	emitCss?: boolean;
}

export function tsrxReact(options?: TsrxReactBunPluginOptions): BunPlugin;
export default tsrxReact;
