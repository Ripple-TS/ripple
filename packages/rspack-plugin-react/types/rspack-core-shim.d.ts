declare module '@rspack/core' {
	export interface Compiler {
		options: {
			resolve: {
				extensions?: string[];
			};
			experiments?: {
				css?: boolean;
			};
			module: {
				rules: any[];
			};
		};
	}

	export interface RspackPluginInstance {
		apply(compiler: Compiler): void;
	}

	export interface LoaderContext<TOptions = object> {
		async(): (
			error?: Error | null,
			content?: string,
			sourceMap?: any,
			additionalData?: any,
		) => void;
		resourcePath: string;
	}
}
