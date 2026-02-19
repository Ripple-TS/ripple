export async function loggingMiddleware(context: any, next: any) {
	const start = Date.now();
	const { method, url } = context.request;

	console.log(`→ ${method} ${url}`);

	const response = await next();

	const duration = Date.now() - start;
	console.log(`← ${method} ${url} ${response.status} (${duration}ms)`);

	return response;
}
