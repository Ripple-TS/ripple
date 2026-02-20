import { request as node_http_request } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { serve, serveStatic } from '../src/index.js';

/**
 * @param {(request: Request, platform?: any) => Response | Promise<Response>} fetch_handler
 * @param {(base_url: string) => Promise<void>} run
 * @param {import('../types/index.d.ts').ServeOptions} [options]
 * @returns {Promise<void>}
 */
async function with_server(fetch_handler, run, options = {}) {
	const app = serve(fetch_handler, { hostname: '127.0.0.1', ...options });
	const server = app.listen(0);

	await new Promise((resolve, reject) => {
		server.once('listening', resolve);
		server.once('error', reject);
	});

	const address = server.address();
	if (address == null || typeof address === 'string') {
		throw new Error('Expected TCP server address');
	}

	try {
		await run(`http://127.0.0.1:${address.port}`);
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) reject(error);
				else resolve(undefined);
			});
		});
	}
}

/**
 * @param {string} cwd
 * @param {() => Promise<void>} run
 * @returns {Promise<void>}
 */
async function with_cwd(cwd, run) {
	const previous_cwd = process.cwd();
	process.chdir(cwd);
	try {
		await run();
	} finally {
		process.chdir(previous_cwd);
	}
}

/**
 * @param {string} url
 * @param {{ method?: string, headers?: import('node:http').OutgoingHttpHeaders, body?: string }} [options]
 * @returns {Promise<{
 * 	status_code: number,
 * 	headers: import('node:http').IncomingHttpHeaders,
 * 	body: string
 * }>}
 */
function send_node_request(url, options = {}) {
	return new Promise((resolve, reject) => {
		const request = node_http_request(
			url,
			{
				method: options.method ?? 'GET',
				headers: options.headers,
			},
			(response) => {
				/** @type {string[]} */
				const chunks = [];
				response.setEncoding('utf8');
				response.on('data', (chunk) => {
					chunks.push(chunk);
				});
				response.on('end', () => {
					resolve({
						status_code: response.statusCode ?? 0,
						headers: response.headers,
						body: chunks.join(''),
					});
				});
			},
		);

		request.on('error', reject);
		if (options.body) {
			request.write(options.body);
		}
		request.end();
	});
}

describe('@ripple-ts/adapter-node serve()', () => {
	it('maps node request values to a web Request and returns response values', async () => {
		/** @type {{ method: string, url: string, body: string, custom_header: string | null } | null} */
		let captured = null;

		await with_server(
			async (request) => {
				captured = {
					method: request.method,
					url: request.url,
					body: await request.text(),
					custom_header: request.headers.get('x-custom'),
				};

				return new Response('created', {
					status: 201,
					headers: {
						'x-response': 'ok',
					},
				});
			},
			async (base_url) => {
				const response = await fetch(`${base_url}/users?id=1`, {
					method: 'POST',
					headers: {
						'x-forwarded-proto': 'https, http',
						'x-forwarded-host': 'example.com, proxy.local',
						'x-custom': 'abc123',
					},
					body: 'payload',
				});

				expect(response.status).toBe(201);
				expect(response.headers.get('x-response')).toBe('ok');
				expect(await response.text()).toBe('created');
			},
			{ trustProxy: true },
		);

		expect(captured).toEqual({
			method: 'POST',
			url: 'https://example.com/users?id=1',
			body: 'payload',
			custom_header: 'abc123',
		});
	});

	it('ignores x-forwarded-* headers when trustProxy is not enabled', async () => {
		/** @type {{ url: string } | null} */
		let captured = null;

		await with_server(
			async (request) => {
				captured = { url: request.url };
				return new Response('ok');
			},
			async (base_url) => {
				await fetch(`${base_url}/test`, {
					headers: {
						'x-forwarded-proto': 'https',
						'x-forwarded-host': 'evil.com',
					},
				});
			},
		);

		// Should NOT use forwarded headers; URL should use http and the real host
		expect(captured).not.toBeNull();
		const url = new URL((captured ?? { url: '' }).url);
		expect(url.protocol).toBe('http:');
		expect(url.hostname).not.toBe('evil.com');
	});

	it('runs middleware before handler when middleware calls next()', async () => {
		/** @type {string[]} */
		const calls = [];

		await with_server(
			() => {
				calls.push('handler');
				return new Response('ok');
			},
			async (base_url) => {
				const response = await fetch(base_url);
				expect(response.status).toBe(200);
				expect(await response.text()).toBe('ok');
			},
			{
				middleware(req, res, next) {
					void req;
					void res;
					calls.push('middleware');
					next();
				},
			},
		);

		expect(calls).toEqual(['middleware', 'handler']);
	});

	it('short-circuits the handler when middleware already handled the response', async () => {
		const fetch_handler = vi.fn(() => new Response('from-handler'));

		await with_server(
			fetch_handler,
			async (base_url) => {
				const response = await fetch(base_url);
				expect(response.status).toBe(204);
				expect(await response.text()).toBe('');
			},
			{
				middleware(req, res, next) {
					void req;
					res.statusCode = 204;
					res.end();
					next();
				},
			},
		);

		expect(fetch_handler).not.toHaveBeenCalled();
	});

	it('forwards multiple set-cookie headers', async () => {
		await with_server(
			() => {
				const headers = new Headers();
				headers.append('set-cookie', 'session=abc; Path=/');
				headers.append('set-cookie', 'theme=dark; Path=/');
				return new Response('ok', { headers });
			},
			async (base_url) => {
				const response = await send_node_request(base_url);
				const set_cookie = response.headers['set-cookie'];
				const normalized_set_cookie = Array.isArray(set_cookie)
					? set_cookie.join('\n')
					: String(set_cookie ?? '');

				expect(response.status_code).toBe(200);
				expect(normalized_set_cookie).toContain('session=abc');
				expect(normalized_set_cookie).toContain('theme=dark');
			},
		);
	});

	it('returns internal server error when handler throws', async () => {
		await with_server(
			() => {
				throw new Error('boom');
			},
			async (base_url) => {
				const response = await send_node_request(base_url);

				expect(response.status_code).toBe(500);
				expect(response.body).toBe('Internal Server Error');
				expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
			},
		);
	});

	it('does not write response body for HEAD requests', async () => {
		/** @type {string | undefined} */
		let request_method;

		await with_server(
			(request) => {
				request_method = request.method;
				return new Response('body-should-not-be-sent');
			},
			async (base_url) => {
				const response = await fetch(base_url, { method: 'HEAD' });

				expect(response.status).toBe(200);
				expect(await response.text()).toBe('');
			},
		);

		expect(request_method).toBe('HEAD');
	});

	it('serveStatic middleware serves files and bypasses fetch handler', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-node-static-'));
		try {
			writeFileSync(join(temp_dir, 'hello.txt'), 'hello static');

			const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));
			await with_server(
				fetch_handler,
				async (base_url) => {
					const response = await fetch(`${base_url}/assets/hello.txt`);
					expect(response.status).toBe(200);
					expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
					expect(await response.text()).toBe('hello static');
				},
				{
					middleware: serveStatic(temp_dir, { prefix: '/assets' }),
				},
			);

			expect(fetch_handler).not.toHaveBeenCalled();
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serveStatic middleware falls through when file is missing', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-node-static-fallthrough-'));
		try {
			const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));

			await with_server(
				fetch_handler,
				async (base_url) => {
					const response = await fetch(`${base_url}/assets/missing.txt`);
					expect(response.status).toBe(404);
					expect(await response.text()).toBe('fallback');
				},
				{
					middleware: serveStatic(temp_dir, { prefix: '/assets' }),
				},
			);

			expect(fetch_handler).toHaveBeenCalledTimes(1);
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serves files from ./public by default', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-node-default-static-'));
		try {
			const public_dir = join(temp_dir, 'public');
			mkdirSync(public_dir);
			writeFileSync(join(public_dir, 'llms.txt'), 'hello llms');

			const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));

			await with_cwd(temp_dir, async () => {
				await with_server(fetch_handler, async (base_url) => {
					const response = await fetch(`${base_url}/llms.txt`);
					expect(response.status).toBe(200);
					expect(await response.text()).toBe('hello llms');
				});
			});

			expect(fetch_handler).not.toHaveBeenCalled();
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('can disable default static serving via options.static = false', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-node-default-static-disabled-'));
		try {
			const public_dir = join(temp_dir, 'public');
			mkdirSync(public_dir);
			writeFileSync(join(public_dir, 'llms.txt'), 'hello llms');

			const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));

			await with_cwd(temp_dir, async () => {
				await with_server(
					fetch_handler,
					async (base_url) => {
						const response = await fetch(`${base_url}/llms.txt`);
						expect(response.status).toBe(404);
						expect(await response.text()).toBe('fallback');
					},
					{ static: false },
				);
			});

			expect(fetch_handler).toHaveBeenCalledTimes(1);
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serves static files via options.static with custom prefix and cache settings', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-node-static-options-'));
		try {
			writeFileSync(join(temp_dir, 'asset.txt'), 'asset-data');

			const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));
			await with_server(
				fetch_handler,
				async (base_url) => {
					const response = await fetch(`${base_url}/public/asset.txt`);
					expect(response.status).toBe(200);
					expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
					expect(await response.text()).toBe('asset-data');
				},
				{
					static: {
						dir: temp_dir,
						prefix: '/public',
						maxAge: 60,
						immutable: true,
					},
				},
			);

			expect(fetch_handler).not.toHaveBeenCalled();
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});
});
