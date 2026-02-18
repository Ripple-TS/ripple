export type ServeOptions = {
	port?: number;
	hostname?: string;
	middleware?:
		| ((
				request: Request,
				server: any,
				next: () => Promise<Response>,
		  ) => Response | Promise<Response> | void)
		| null;
};

export function serve(
	fetch_handler: (request: Request, platform?: any) => Response | Promise<Response>,
	options?: ServeOptions,
): {
	listen: (port?: number) => any;
	close: () => void;
};
