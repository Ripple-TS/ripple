import type { Plugin } from 'vite';

export interface TsrxReactPluginOptions {
	jsxImportSource?: string;
}

export interface TsrxReactTransformResult {
	code: string;
	map: unknown;
}

export interface TsrxReactPlugin extends Omit<Plugin, 'transform' | 'resolveId' | 'load'> {
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
