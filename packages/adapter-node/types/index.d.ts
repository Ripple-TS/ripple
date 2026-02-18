import type { AdapterCoreOptions, FetchHandler, ServeResult } from '@ripple-ts/adapter';

export type ServeOptions = AdapterCoreOptions & {
	middleware?:
		| ((
				req: import('node:http').IncomingMessage,
				res: import('node:http').ServerResponse,
				next: (error?: any) => void,
		  ) => void)
		| null;
};

export function serve(
	fetch_handler: FetchHandler<{
		node_request: import('node:http').IncomingMessage;
		node_response: import('node:http').ServerResponse;
	}>,
	options?: ServeOptions,
): ServeResult<import('node:http').Server>;
