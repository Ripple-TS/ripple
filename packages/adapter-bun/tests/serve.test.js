import { afterEach, describe, expect, it, vi } from 'vitest';
import { serve } from '../src/index.js';

/** @type {any} */
const original_bun = globalThis.Bun;

afterEach(() => {
	if (original_bun === undefined) {
		Reflect.deleteProperty(globalThis, 'Bun');
	} else {
		globalThis.Bun = original_bun;
	}
	vi.restoreAllMocks();
});

/**
 * @returns {{
 * 	serve_spy: import('vitest').Mock,
 * 	server: { stop: import('vitest').Mock },
 * 	get_fetch: () => (request: Request, server: any) => Promise<Response>
 * }}
 */
function create_bun_mock() {
	/** @type {(request: Request, server: any) => Promise<Response>} */
	let fetch_handler = async () => new Response('not-configured', { status: 500 });

	const server = { stop: vi.fn() };
	const serve_spy = vi.fn((options) => {
		fetch_handler = options.fetch;
		return server;
	});

	globalThis.Bun = {
		serve: serve_spy,
	};

	return {
		serve_spy,
		server,
		get_fetch() {
			return fetch_handler;
		},
	};
}

describe('@ripple-ts/adapter-bun serve()', () => {
	it('throws when Bun runtime is unavailable', () => {
		Reflect.deleteProperty(globalThis, 'Bun');

		const app = serve(() => new Response('ok'));
		expect(() => app.listen()).toThrow('@ripple-ts/adapter-bun requires Bun runtime');
	});

	it('starts bun server and forwards request to fetch handler', async () => {
		const { serve_spy, server, get_fetch } = create_bun_mock();
		const fetch_handler = vi.fn(() => new Response('ok'));

		const app = serve(fetch_handler);
		const returned_server = app.listen();

		expect(returned_server).toBe(server);
		expect(serve_spy).toHaveBeenCalledTimes(1);
		expect(serve_spy).toHaveBeenCalledWith(expect.objectContaining({ port: 3000 }));
		expect(serve_spy).toHaveBeenCalledWith(expect.objectContaining({ hostname: 'localhost' }));

		const request = new Request('http://localhost/users');
		const response = await get_fetch()(request, server);

		expect(fetch_handler).toHaveBeenCalledTimes(1);
		expect(fetch_handler).toHaveBeenCalledWith(request, { bun_server: server });
		expect(await response.text()).toBe('ok');
	});

	it('uses explicit listen port over default option port', () => {
		const { serve_spy } = create_bun_mock();

		const app = serve(() => new Response('ok'), { port: 8080, hostname: '0.0.0.0' });
		app.listen(9090);

		expect(serve_spy).toHaveBeenCalledWith(expect.objectContaining({ port: 9090 }));
		expect(serve_spy).toHaveBeenCalledWith(expect.objectContaining({ hostname: '0.0.0.0' }));
	});

	it('supports middleware short-circuit responses', async () => {
		const { server, get_fetch } = create_bun_mock();
		const fetch_handler = vi.fn(() => new Response('handler'));
		const middleware = vi.fn(() => new Response('middleware', { status: 202 }));

		const app = serve(fetch_handler, { middleware });
		app.listen();

		const response = await get_fetch()(new Request('http://localhost/'), server);
		expect(middleware).toHaveBeenCalledTimes(1);
		expect(fetch_handler).not.toHaveBeenCalled();
		expect(response.status).toBe(202);
		expect(await response.text()).toBe('middleware');
	});

	it('supports middleware next() flow', async () => {
		const { server, get_fetch } = create_bun_mock();
		const fetch_handler = vi.fn(() => new Response('handler'));
		const middleware = vi.fn(async (request, bun_server, next) => {
			void request;
			void bun_server;
			return await next();
		});

		const app = serve(fetch_handler, { middleware });
		app.listen();

		const response = await get_fetch()(new Request('http://localhost/'), server);
		expect(middleware).toHaveBeenCalledTimes(1);
		expect(fetch_handler).toHaveBeenCalledTimes(1);
		expect(await response.text()).toBe('handler');
	});

	it('returns 500 response when fetch handler throws', async () => {
		const { server, get_fetch } = create_bun_mock();
		const app = serve(() => {
			throw new Error('boom');
		});
		app.listen();

		const response = await get_fetch()(new Request('http://localhost/'), server);
		expect(response.status).toBe(500);
		expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(await response.text()).toBe('Internal Server Error');
	});

	it('stops server on close()', () => {
		const { server } = create_bun_mock();

		const app = serve(() => new Response('ok'));
		app.listen();
		app.close();

		expect(server.stop).toHaveBeenCalledTimes(1);
	});
});
