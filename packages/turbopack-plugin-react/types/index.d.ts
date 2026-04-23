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

export interface TsrxReactTurbopackRule {
	condition: {
		all: Array<unknown>;
	};
	loaders: string[];
	as: '*.tsx';
}

export interface TsrxReactTurbopackCssRule {
	condition: {
		all: Array<unknown>;
	};
	loaders: string[];
	type: 'css';
}

export declare function create_tsrx_react_turbopack_rule(): TsrxReactTurbopackRule;

export declare function create_tsrx_react_turbopack_css_rule(): TsrxReactTurbopackCssRule;

export declare function tsrxReactTurbopack(next_config?: NextTurbopackConfig): NextTurbopackConfig;

export default tsrxReactTurbopack;
