import type {
	AdapterCoreOptions,
	FetchHandler,
	NextMiddleware,
	ServeResult,
} from '@ripple-ts/adapter';

export type ServeOptions = AdapterCoreOptions & {
	middleware?: NextMiddleware<Request, any> | null;
};

export function serve(
	fetch_handler: FetchHandler<{ bun_server: any }>,
	options?: ServeOptions,
): ServeResult<any>;
