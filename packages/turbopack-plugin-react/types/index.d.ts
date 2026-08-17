import type { RuntimeImportMode } from '@tsrx/react';

export interface NextTurbopackConfig {
	turbopack?: {
		root?: string;
		rules?: Record<string, unknown>;
		resolveAlias?: Record<string, unknown>;
		resolveExtensions?: string[];
		debugIds?: boolean;
	};
	[key: string]: unknown;
}

export interface TsrxReactTurbopackOptions {
	/** Direct mode requires `@tsrx/react-runtime` as a direct production dependency. */
	runtimeImports?: RuntimeImportMode;
}

export interface TsrxReactTurbopackLoader {
	loader: string;
	options: TsrxReactTurbopackOptions;
}

export interface TsrxReactTurbopackRule {
	condition: {
		all: Array<unknown>;
	};
	loaders: Array<string | TsrxReactTurbopackLoader>;
	as: '*.tsx';
}

export interface TsrxReactTurbopackCssRule {
	condition: {
		all: Array<unknown>;
	};
	loaders: Array<string | TsrxReactTurbopackLoader>;
	type: 'css';
}

export declare function create_tsrx_react_turbopack_rule(
	options?: TsrxReactTurbopackOptions,
): TsrxReactTurbopackRule;

export declare function create_tsrx_react_turbopack_css_rule(
	options?: TsrxReactTurbopackOptions,
): TsrxReactTurbopackCssRule;

export declare function tsrxReactTurbopack(
	next_config?: NextTurbopackConfig,
	options?: TsrxReactTurbopackOptions,
): NextTurbopackConfig;

export default tsrxReactTurbopack;
