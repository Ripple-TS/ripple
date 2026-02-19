import type {
	AdapterCoreOptions,
	FetchHandler,
	NextMiddleware,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
	ServeResult,
} from '@ripple-ts/adapter';

export type ServeOptions = AdapterCoreOptions & {
	middleware?: NextMiddleware<Request, any> | null;
	static?: BaseServeStaticDirectoryOptions | false;
};

export function serve(
	fetch_handler: FetchHandler<{ bun_server: any }>,
	options?: ServeOptions,
): ServeResult<any>;
