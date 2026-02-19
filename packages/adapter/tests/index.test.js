import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
	DEFAULT_HOSTNAME,
	DEFAULT_PORT,
	get_mime_type,
	get_static_cache_control,
	internal_server_error_response,
	is_hashed_asset,
	run_next_middleware,
	serveStatic,
} from '../src/index.js';

describe('@ripple-ts/adapter', () => {
	it('exports stable default host and port', () => {
		expect(DEFAULT_PORT).toBe(3000);
		expect(DEFAULT_HOSTNAME).toBe('localhost');
	});

	it('creates standardized internal server error response', async () => {
		const response = internal_server_error_response();
		expect(response.status).toBe(500);
		expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(await response.text()).toBe('Internal Server Error');
	});

	it('run_next_middleware returns middleware response when short-circuited', async () => {
		const response = await run_next_middleware(
			() => new Response('middleware'),
			new Request('http://localhost/'),
			{ id: 'server' },
			async () => new Response('handler'),
		);

		expect(await response.text()).toBe('middleware');
	});

	it('run_next_middleware resolves next() only once and returns handler response', async () => {
		let handler_calls = 0;

		const response = await run_next_middleware(
			async (request, server, next) => {
				void request;
				void server;
				await next();
				return await next();
			},
			new Request('http://localhost/'),
			{ id: 'server' },
			async () => {
				handler_calls += 1;
				return new Response('handler');
			},
		);

		expect(handler_calls).toBe(1);
		expect(await response.text()).toBe('handler');
	});

	it('run_next_middleware falls through to next handler when middleware returns void', async () => {
		const response = await run_next_middleware(
			() => {},
			new Request('http://localhost/'),
			{ id: 'server' },
			async () => new Response('handler'),
		);

		expect(await response.text()).toBe('handler');
	});

	it('run_next_middleware supports non-Response result types', async () => {
		const value = await run_next_middleware(
			() => 'middleware-value',
			{ request: 1 },
			{ id: 'server' },
			async () => 'handler-value',
		);

		expect(value).toBe('middleware-value');
	});

	it('resolves MIME types with fallback', () => {
		expect(get_mime_type('app.js')).toBe('text/javascript; charset=utf-8');
		expect(get_mime_type('image.svg')).toBe('image/svg+xml');
		expect(get_mime_type('file.unknown')).toBe('application/octet-stream');
	});

	it('detects hashed assets and computes cache-control', () => {
		expect(is_hashed_asset('/assets/app.2f1abce9.js')).toBe(true);
		expect(is_hashed_asset('/assets/app.js')).toBe(false);
		expect(get_static_cache_control('/assets/app.2f1abce9.js')).toBe(
			'public, max-age=31536000, immutable',
		);
		expect(get_static_cache_control('/assets/app.js', 60, false)).toBe('public, max-age=60');
	});

	it('serveStatic serves files for GET and HEAD requests', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-static-'));
		try {
			writeFileSync(join(temp_dir, 'app.js'), 'console.log("ok");');

			const static_handler = serveStatic(temp_dir, { prefix: '/assets' });

			const get_response = static_handler(new Request('http://localhost/assets/app.js'));
			expect(get_response).not.toBeNull();
			if (get_response === null) {
				throw new Error('Expected static GET response');
			}
			expect(get_response.status).toBe(200);
			expect(get_response.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
			expect(get_response.headers.get('cache-control')).toBe('public, max-age=86400');
			expect(await get_response.text()).toContain('console.log');

			const head_response = static_handler(
				new Request('http://localhost/assets/app.js', { method: 'HEAD' }),
			);
			expect(head_response).not.toBeNull();
			if (head_response === null) {
				throw new Error('Expected static HEAD response');
			}
			expect(head_response.status).toBe(200);
			expect(await head_response.text()).toBe('');
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serveStatic falls through for non-matching requests', () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-static-fallthrough-'));
		try {
			writeFileSync(join(temp_dir, 'index.html'), '<h1>ok</h1>');
			const static_handler = serveStatic(temp_dir, { prefix: '/assets' });

			expect(static_handler(new Request('http://localhost/index.html'))).toBeNull();
			expect(static_handler(new Request('http://localhost/assets/missing.js'))).toBeNull();
			expect(
				static_handler(new Request('http://localhost/assets/index.html', { method: 'POST' })),
			).toBeNull();
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serveStatic applies configured cache-control options', async () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-static-cache-'));
		try {
			writeFileSync(join(temp_dir, 'app.js'), 'console.log("cache");');

			const max_age_handler = serveStatic(temp_dir, { prefix: '/assets', maxAge: 120 });
			const max_age_response = max_age_handler(new Request('http://localhost/assets/app.js'));
			expect(max_age_response).not.toBeNull();
			if (max_age_response === null) {
				throw new Error('Expected static response');
			}
			expect(max_age_response.headers.get('cache-control')).toBe('public, max-age=120');

			const immutable_handler = serveStatic(temp_dir, {
				prefix: '/assets',
				maxAge: 120,
				immutable: true,
			});
			const immutable_response = immutable_handler(new Request('http://localhost/assets/app.js'));
			expect(immutable_response).not.toBeNull();
			if (immutable_response === null) {
				throw new Error('Expected static response');
			}
			expect(immutable_response.headers.get('cache-control')).toBe(
				'public, max-age=31536000, immutable',
			);
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});

	it('serveStatic blocks traversal and directory targets', () => {
		const temp_dir = mkdtempSync(join(tmpdir(), 'adapter-static-security-'));
		try {
			const public_dir = join(temp_dir, 'public');
			mkdirSync(public_dir);
			mkdirSync(join(public_dir, 'nested'));
			writeFileSync(join(temp_dir, 'secret.txt'), 'secret');

			const static_handler = serveStatic(public_dir, { prefix: '/assets' });
			expect(static_handler(new Request('http://localhost/assets/%2e%2e/secret.txt'))).toBeNull();
			expect(static_handler(new Request('http://localhost/assets/nested'))).toBeNull();
		} finally {
			rmSync(temp_dir, { recursive: true, force: true });
		}
	});
});
