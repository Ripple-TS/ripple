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

export declare function create_tsrx_react_turbopack_rule(): {
	condition: { not: 'foreign' };
	loaders: string[];
	as: '*.tsx';
};

export declare function tsrxReactTurbopack(next_config?: NextTurbopackConfig): NextTurbopackConfig;

export default tsrxReactTurbopack;