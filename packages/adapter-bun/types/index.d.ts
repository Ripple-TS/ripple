import type {
	AdapterCoreOptions,
	NextMiddleware,
	ServeFunction,
	ServeStaticOptions as BaseServeStaticOptions,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
} from '@ripple-ts/adapter';

export type ServeOptions = AdapterCoreOptions & {
	middleware?: NextMiddleware<Request, any> | null;
	static?: BaseServeStaticDirectoryOptions | false;
};

export type ServeStaticOptions = BaseServeStaticOptions;

export const serve: ServeFunction<{ bun_server: any }, ServeOptions, any>;

export function serveStatic(
	dir: string,
	options?: ServeStaticOptions,
): NextMiddleware<Request, any, Response>;
