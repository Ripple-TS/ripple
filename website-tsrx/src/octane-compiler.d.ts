declare module 'octane/compiler' {
	export type CompileResult = {
		code: string;
		map: unknown;
	};

	export function compile(
		source: string,
		filename: string,
		options?: {
			hmr?: boolean | 'vite' | 'webpack';
			mode?: 'client' | 'server';
			dev?: boolean;
		},
	): CompileResult;
}
