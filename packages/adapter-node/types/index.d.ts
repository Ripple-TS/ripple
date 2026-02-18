export type ServeOptions = {
	port?: number;
	hostname?: string;
	middleware?:
		| ((
				req: import('node:http').IncomingMessage,
				res: import('node:http').ServerResponse,
				next: (error?: any) => void,
		  ) => void)
		| null;
};

export function serve(
	fetch_handler: (request: Request, platform?: any) => Response | Promise<Response>,
	options?: ServeOptions,
): {
	listen: (port?: number) => import('node:http').Server;
	close: () => void;
};
