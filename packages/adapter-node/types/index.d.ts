import type {
	AdapterCoreOptions,
	RuntimePrimitives,
	ServeFunction,
	ServeStaticOptions as BaseServeStaticOptions,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
} from '@ripple-ts/adapter';

/**
 * Node.js runtime primitives for the Ripple adapter contract.
 *
 * - `hash`: SHA-256 (truncated to 8 hex chars) via `node:crypto`
 * - `createAsyncContext`: `AsyncLocalStorage` from `node:async_hooks`
 */
export const runtime: RuntimePrimitives;

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

/**
 * Convert a Node.js IncomingMessage to a Web Request.
 */
export function nodeRequestToWebRequest(
	node_request: import('node:http').IncomingMessage,
	signal: AbortSignal,
	trust_proxy?: boolean,
): Request;

/**
 * Write a Web Response to a Node.js ServerResponse.
 */
export function webResponseToNodeResponse(
	web_response: Response,
	node_response: import('node:http').ServerResponse,
	request_method: string,
): void;
