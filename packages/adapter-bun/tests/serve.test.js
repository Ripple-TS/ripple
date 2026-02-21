import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serve, serveStatic } from '../src/index.js';

const original_bun = Reflect.get(globalThis, 'Bun');

/**
 * Create a mock for Bun.file() that uses node:fs under the hood.
 * Returns a Blob-like object so `new Response(bun_file)` works correctly.
 *
 * @param {string | URL} file_path
 */
function mock_bun_file(file_path) {
	file_path = String(file_path);
	const file_exists = existsSync(file_path);
	const stats = file_exists ? statSync(file_path) : null;
	const is_dir = stats?.isDirectory() ?? false;

	if (!file_exists || is_dir) {
		return {
			exists: async () => false,
			size: 0,
		};
	}

	const content = readFileSync(file_path);
	const blob = new Blob([content]);

	// Attach Bun.file-specific methods onto the Blob so it can act as both
	// a BodyInit (Blob) and a BunFile (exists/size).
	const bun_file = Object.assign(blob, {
		exists: /** @returns {Promise<boolean>} */ async () => true,
	});
	const file_size = /** @type {import('node:fs').Stats} */ (stats).size;
	Object.defineProperty(bun_file, 'size', { value: file_size });
	return bun_file;
}

/**
 * Ensure globalThis.Bun has at least the `file` mock.
 */
function ensure_bun_file_mock() {
	const bun = Reflect.get(globalThis, 'Bun');
	if (!bun) {
		Object.defineProperty(globalThis, 'Bun', {
			value: { file: mock_bun_file },
			writable: true,
			configurable: true,
		});
		return;
	}
	if (!bun.file) {
		Object.defineProperty(bun, 'file', {
			value: mock_bun_file,
			writable: true,
			configurable: true,
		});
	}
}

beforeEach(() => {
	ensure_bun_file_mock();
});

afterEach(() => {
	if (original_bun === undefined) {
		Reflect.deleteProperty(globalThis, 'Bun');
	} else {
		Object.defineProperty(globalThis, 'Bun', {
			value: original_bun,
			writable: true,
			configurable: true,
		});
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

	Object.defineProperty(globalThis, 'Bun', {
		value: { serve: serve_spy, file: mock_bun_file },
		writable: true,
		configurable: true,
	});

	return {
		serve_spy,
		server,
		get_fetch() {
			return fetch_handler;
		},
	};
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

	it('serveStatic middleware serves matching files', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-bun-static-'));
		try {
			writeFileSync(join(temp_dir, 'app.js'), 'console.log("bun");');

			const static_middleware = serveStatic(temp_dir, { prefix: '/assets' });
			const next = vi.fn(async () => new Response('next'));

			const response = await static_middleware(
				new Request('http://localhost/assets/app.js'),
				/** @type {import('bun').Server<undefined>} */ ({}),
				next,
			);

			expect(next).not.toHaveBeenCalled();
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
			expect(await response.text()).toContain('console.log');
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serveStatic middleware falls through when no file is found', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-bun-static-fallthrough-'));
		try {
			const static_middleware = serveStatic(temp_dir, { prefix: '/assets' });
			const next = vi.fn(async () => new Response('next'));

			const response = await static_middleware(
				new Request('http://localhost/assets/missing.js'),
				/** @type {import('bun').Server<undefined>} */ ({}),
				next,
			);

			expect(next).toHaveBeenCalledTimes(1);
			expect(await response.text()).toBe('next');
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serves files from ./ by default', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-bun-default-static-dir'));
		try {
			writeFileSync(join(temp_dir, 'llms.txt'), 'hello llms');

			await with_cwd(temp_dir, async () => {
				const { server, get_fetch } = create_bun_mock();
				const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));
				const app = serve(fetch_handler);
				app.listen();

				const response = await get_fetch()(new Request('http://localhost/llms.txt'), server);
				expect(response.status).toBe(200);
				expect(await response.text()).toBe('hello llms');
				expect(fetch_handler).not.toHaveBeenCalled();
			});
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('can disable default static serving via options.static = false', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-bun-default-static-disabled-dir'));
		try {
			writeFileSync(join(temp_dir, 'llms.txt'), 'hello llms');

			await with_cwd(temp_dir, async () => {
				const { server, get_fetch } = create_bun_mock();
				const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));
				const app = serve(fetch_handler, { static: false });
				app.listen();

				const response = await get_fetch()(new Request('http://localhost/llms.txt'), server);
				expect(response.status).toBe(404);
				expect(await response.text()).toBe('fallback');
				expect(fetch_handler).toHaveBeenCalledTimes(1);
			});
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serves static files via options.static with custom prefix and cache settings', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-bun-static-options-'));
		try {
			writeFileSync(join(temp_dir, 'asset.txt'), 'asset-data');

			const { server, get_fetch } = create_bun_mock();
			const fetch_handler = vi.fn(() => new Response('fallback', { status: 404 }));
			const app = serve(fetch_handler, {
				static: {
					dir: temp_dir,
					prefix: '/public',
					maxAge: 60,
					immutable: true,
				},
			});
			app.listen();

			const response = await get_fetch()(new Request('http://localhost/public/asset.txt'), server);
			expect(response.status).toBe(200);
			expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
			expect(await response.text()).toBe('asset-data');
			expect(fetch_handler).not.toHaveBeenCalled();
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});
});
