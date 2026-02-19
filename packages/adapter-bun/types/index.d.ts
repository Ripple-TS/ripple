import type {
	AdapterCoreOptions,
	FetchHandler,
	NextMiddleware,
	ServeStaticOptions as BaseServeStaticOptions,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
	ServeResult,
} from '@ripple-ts/adapter';

export type ServeOptions = AdapterCoreOptions & {
	middleware?: NextMiddleware<Request, any> | null;
	static?: BaseServeStaticDirectoryOptions | false;
};

export type ServeStaticOptions = BaseServeStaticOptions;

export function serve(
	fetch_handler: FetchHandler<{ bun_server: any }>,
	options?: ServeOptions,
): ServeResult<any>;

export function serveStatic(
	dir: string,
	options?: ServeStaticOptions,
): NextMiddleware<Request, any, Response>;
