import type { Plugin } from 'vite';
import type { DepScanTransformPlugin } from '@tsrx/core/types/vite/dep-scan';

export interface TsrxReactPluginOptions {
	jsxImportSource?: string;
}

export interface TsrxReactTransformResult {
	code: string;
	map: unknown;
}

export interface TsrxReactPlugin extends Omit<
	Plugin,
	'config' | 'transform' | 'resolveId' | 'load'
> {
	config: () => {
		optimizeDeps: {
			extensions: string[];
			rolldownOptions: {
				transform: { jsx: { importSource: string } };
				plugins: [DepScanTransformPlugin];
			};
		};
	};
	transform: {
		(code: string, id: `${string}.tsrx`): Promise<TsrxReactTransformResult>;
		(code: string, id: string): Promise<TsrxReactTransformResult | null>;
	};
	resolveId: {
		(source: `${string}?tsrx-css&lang.css`): `\0${string}?tsrx-css&lang.css`;
		(source: string): string | null;
	};
	load: {
		(id: `\0${string}?tsrx-css&lang.css`): string;
		(id: string): string | null;
	};
}

export function tsrxReact(options?: TsrxReactPluginOptions): TsrxReactPlugin;
export default tsrxReact;
