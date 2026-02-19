import type {
	AdapterCoreOptions,
	ServeFunction,
	ServeStaticOptions as BaseServeStaticOptions,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
} from '@ripple-ts/adapter';

export type ServeOptions = AdapterCoreOptions & {
	middleware?:
		| ((
				req: import('node:http').IncomingMessage,
				res: import('node:http').ServerResponse,
				next: (error?: any) => void,
		  ) => void)
		| null;
	static?: BaseServeStaticDirectoryOptions | false;
};

export type ServeStaticOptions = BaseServeStaticOptions;

export type StaticMiddleware = (
	req: import('node:http').IncomingMessage,
	res: import('node:http').ServerResponse,
	next: (error?: any) => void,
) => void;

export const serve: ServeFunction<
	{
		node_request: import('node:http').IncomingMessage;
		node_response: import('node:http').ServerResponse;
	},
	ServeOptions,
	import('node:http').Server
>;

/**
 * Create a middleware that serves static files from a directory
 */
export function serveStatic(dir: string, options?: ServeStaticOptions): StaticMiddleware;
