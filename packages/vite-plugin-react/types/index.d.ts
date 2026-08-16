import type { EnvironmentOptions, Plugin } from 'vite';
import type { DepScanTransformPlugin } from '@tsrx/core/types/vite/dep-scan';

export interface TsrxReactPluginOptions {
	jsxImportSource?: string;
	runtimeImports?: 'compiler' | 'direct';
}

export interface TsrxReactTransformResult {
	code: string;
	map: unknown;
}

export interface TsrxReactPlugin extends Omit<
	Plugin,
	'configEnvironment' | 'transform' | 'resolveId' | 'load'
> {
	configEnvironment: (
		name: string,
		config: EnvironmentOptions,
	) =>
		| {
				optimizeDeps: {
					extensions: string[];
					rolldownOptions: {
						transform: { jsx: { importSource: string } };
						plugins: [DepScanTransformPlugin];
					};
				};
		  }
		| undefined;
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
