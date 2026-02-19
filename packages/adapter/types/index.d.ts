export type FetchHandler<Platform = any, ResultValue = Response> = (
	request: Request,
	platform?: Platform,
) => ResultValue | Promise<ResultValue>;

export type AdapterCoreOptions = {
	port?: number;
	hostname?: string;
};

export type ServeStaticOptions = {
	prefix?: string;
	maxAge?: number;
	immutable?: boolean;
};

export type ServeStaticDirectoryOptions = ServeStaticOptions & {
	dir?: string;
};
export type NextMiddleware<RequestValue = Request, Server = any, ResultValue = Response> = (
	request: RequestValue,
	server: Server,
	next: () => Promise<ResultValue>,
) => ResultValue | Promise<ResultValue> | void;

export type ServeResult<Server = any> = {
	listen: (port?: number) => Server;
	close: () => void;
};

export const DEFAULT_HOSTNAME: 'localhost';
export const DEFAULT_PORT: 3000;

export function internal_server_error_response(): Response;

export function run_next_middleware<RequestValue, Server, ResultValue = Response>(
	middleware: NextMiddleware<RequestValue, Server, ResultValue>,
	request: RequestValue,
	server: Server,
	next_handler: () => Promise<ResultValue>,
): Promise<ResultValue>;
