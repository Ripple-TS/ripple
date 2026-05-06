import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock @vercel/nft to avoid actual dependency tracing in unit tests
vi.mock('@vercel/nft', () => ({
	nodeFileTrace: vi.fn(async () => ({
		fileList: new Set(),
		warnings: [],
	})),
}));

describe('adapt()', () => {
	/** @type {string} */
	let tmp_dir;
	/** @type {string} */
	let original_cwd;

	beforeEach(() => {
		tmp_dir = mkdtempSync(join(tmpdir(), 'ripple-adapter-vercel-'));
		original_cwd = process.cwd();
		process.chdir(tmp_dir);
	});

	afterEach(() => {
		process.chdir(original_cwd);
		rmSync(tmp_dir, { recursive: true, force: true });
	});

	/**
	 * Create a minimal Ripple build output structure.
	 *
	 * @param {string} root
	 * @param {{ outDir?: string }} [options]
	 */
	function create_build_output(root, options = {}) {
		const { outDir = 'dist' } = options;
		const build_dir = join(root, outDir);

		// Client output
		const client_dir = join(build_dir, 'client');
		mkdirSync(join(client_dir, 'assets'), { recursive: true });
		writeFileSync(join(client_dir, 'index.html'), '<!doctype html><html></html>');
		writeFileSync(join(client_dir, 'assets', 'app.abc12345.js'), 'console.log("app")');
		writeFileSync(join(client_dir, 'assets', 'style.def67890.css'), 'body{}');

		// Server output
		const server_dir = join(build_dir, 'server');
		mkdirSync(server_dir, { recursive: true });
		writeFileSync(
			join(server_dir, 'entry.js'),
			'export const handler = (req) => new Response("ok");',
		);
	}

	it('throws when client build output is missing', async () => {
		const { adapt } = await import('../src/adapt.js');
		await expect(adapt()).rejects.toThrow('Client build output not found');
	});

	it('throws when server entry is missing', async () => {
		const { adapt } = await import('../src/adapt.js');
		const client_dir = join(tmp_dir, 'dist', 'client');
		mkdirSync(client_dir, { recursive: true });
		writeFileSync(join(client_dir, 'index.html'), '<html></html>');

		await expect(adapt()).rejects.toThrow('Server entry not found');
	});

	it('generates .vercel/output/ structure', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false });

		const output_dir = join(tmp_dir, '.vercel', 'output');

		// config.json exists
		expect(existsSync(join(output_dir, 'config.json'))).toBe(true);

		// Static directory exists with assets
		expect(existsSync(join(output_dir, 'static', 'assets', 'app.abc12345.js'))).toBe(true);
		expect(existsSync(join(output_dir, 'static', 'assets', 'style.def67890.css'))).toBe(true);

		// index.html is removed from static (SSR handles root)
		expect(existsSync(join(output_dir, 'static', 'index.html'))).toBe(false);

		// Function directory exists
		expect(existsSync(join(output_dir, 'functions', 'index.func'))).toBe(true);
		expect(existsSync(join(output_dir, 'functions', 'index.func', 'index.js'))).toBe(true);
		expect(existsSync(join(output_dir, 'functions', 'index.func', '.vc-config.json'))).toBe(true);
		expect(existsSync(join(output_dir, 'functions', 'index.func', 'package.json'))).toBe(true);
	});

	it('generates valid config.json with Build Output API v3', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false });

		const config = JSON.parse(
			readFileSync(join(tmp_dir, '.vercel', 'output', 'config.json'), 'utf-8'),
		);

		expect(config.version).toBe(3);
		expect(config.cleanUrls).toBe(true);
		expect(Array.isArray(config.routes)).toBe(true);

		// Should have a filesystem handler
		const filesystem_route = config.routes.find(
			(/** @type {any} */ r) => r.handle === 'filesystem',
		);
		expect(filesystem_route).toBeTruthy();

		// Should have a catch-all route to the serverless function
		const catchall_route = config.routes.find((/** @type {any} */ r) => r.src === '/.*' && r.dest);
		expect(catchall_route).toBeTruthy();
		expect(catchall_route.dest).toBe('/index');

		// Should have immutable cache header for assets
		const asset_route = config.routes.find((/** @type {any} */ r) => r.src === '/assets/.+');
		expect(asset_route).toBeTruthy();
		expect(asset_route.headers['Cache-Control']).toContain('immutable');
	});

	it('generates valid .vc-config.json', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false });

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.handler).toBe('index.js');
		expect(vc_config.launcherType).toBe('Nodejs');
		expect(vc_config.experimentalResponseStreaming).toBe(true);
		expect(vc_config.framework.slug).toBe('ripple');
		expect(vc_config.framework.version).toMatch(/^\d+\.\d+\.\d+/);
		expect(vc_config.runtime).toMatch(/^nodejs\d+\.x$/);
	});

	it('generates ESM package.json in function directory', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false });

		const pkg = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', 'package.json'),
				'utf-8',
			),
		);

		expect(pkg.type).toBe('module');
	});

	it('generates Web Standard handler using Vercel native fetch API', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false });

		const handler_source = readFileSync(
			join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', 'index.js'),
			'utf-8',
		);

		// Uses static import (not dynamic await import)
		expect(handler_source).toContain('import { handler }');

		// Uses Vercel's native Web Standard export format
		expect(handler_source).toContain('export default');
		expect(handler_source).toContain('async fetch(request)');
		expect(handler_source).toContain('handler(request)');

		// No Node.js (req, res) bridge — no adapter-node dependency
		expect(handler_source).not.toContain('adapter-node');
		expect(handler_source).not.toContain('webResponseToNodeResponse');
		expect(handler_source).not.toContain('bufferRequestBody');
		expect(handler_source).not.toContain('(req, res)');

		// No self-referential fetch hack — handled at framework level
		expect(handler_source).not.toContain('_selfHosts');
		expect(handler_source).not.toContain('_realFetch');

		// Handler should import the server entry at its project-relative path
		expect(handler_source).toContain('dist/server/entry.js');
	});

	it('respects custom outDir', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir, { outDir: 'build' });

		await adapt({ verbose: false, outDir: 'build' });

		expect(existsSync(join(tmp_dir, '.vercel', 'output', 'config.json'))).toBe(true);
		expect(existsSync(join(tmp_dir, '.vercel', 'output', 'functions', 'index.func'))).toBe(true);
	});

	it('applies serverless config options', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			serverless: {
				runtime: 'nodejs22.x',
				regions: ['iad1', 'sfo1'],
				memory: 1024,
				maxDuration: 30,
			},
		});

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.runtime).toBe('nodejs22.x');
		expect(vc_config.regions).toEqual(['iad1', 'sfo1']);
		expect(vc_config.memory).toBe(1024);
		expect(vc_config.maxDuration).toBe(30);
	});

	it('includes custom redirects in config', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			redirects: [{ source: '/old', destination: '/new', permanent: true }],
		});

		const config = JSON.parse(
			readFileSync(join(tmp_dir, '.vercel', 'output', 'config.json'), 'utf-8'),
		);

		const redirect = config.routes.find(
			(/** @type {any} */ r) => r.src === '/old' && r.headers?.Location,
		);
		expect(redirect).toBeTruthy();
		expect(redirect.headers.Location).toBe('/new');
		expect(redirect.status).toBe(308);
	});

	it('includes custom headers in config', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			headers: [
				{
					source: '/(.*)',
					headers: [{ key: 'X-Custom', value: 'test' }],
				},
			],
		});

		const config = JSON.parse(
			readFileSync(join(tmp_dir, '.vercel', 'output', 'config.json'), 'utf-8'),
		);

		const header_route = config.routes.find(
			(/** @type {any} */ r) => r.src === '/(.*)' && r.headers?.['X-Custom'],
		);
		expect(header_route).toBeTruthy();
		expect(header_route.headers['X-Custom']).toBe('test');
	});

	it('includes images config when provided', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			images: {
				sizes: [640, 1080, 1920],
				domains: ['example.com'],
				formats: ['image/avif', 'image/webp'],
			},
		});

		const config = JSON.parse(
			readFileSync(join(tmp_dir, '.vercel', 'output', 'config.json'), 'utf-8'),
		);

		expect(config.images).toEqual({
			sizes: [640, 1080, 1920],
			domains: ['example.com'],
			formats: ['image/avif', 'image/webp'],
		});
	});

	it('cleans previous output before generating', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		// Create a stale file in the output directory
		const stale_dir = join(tmp_dir, '.vercel', 'output', 'stale');
		mkdirSync(stale_dir, { recursive: true });
		writeFileSync(join(stale_dir, 'old-file.txt'), 'stale');

		await adapt({ verbose: false });

		// Stale file should be gone
		expect(existsSync(join(stale_dir, 'old-file.txt'))).toBe(false);
		// Fresh output should exist
		expect(existsSync(join(tmp_dir, '.vercel', 'output', 'config.json'))).toBe(true);
	});

	it('handles trailingSlash option', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false, trailingSlash: true });

		const config = JSON.parse(
			readFileSync(join(tmp_dir, '.vercel', 'output', 'config.json'), 'utf-8'),
		);

		expect(config.trailingSlash).toBe(true);
	});

	it('handles cleanUrls option', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false, cleanUrls: false });

		const config = JSON.parse(
			readFileSync(join(tmp_dir, '.vercel', 'output', 'config.json'), 'utf-8'),
		);

		expect(config.cleanUrls).toBe(false);
	});

	// ---------------------------------------------------------------
	// ISR (Incremental Static Regeneration)
	// ---------------------------------------------------------------

	it('adds prerender config to .vc-config.json when isr is set', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			isr: {
				expiration: 60,
			},
		});

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.prerender).toBeTruthy();
		expect(vc_config.prerender.expiration).toBe(60);
	});

	it('supports isr.expiration = false for never-expiring cache', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			isr: {
				expiration: false,
			},
		});

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.prerender).toBeTruthy();
		expect(vc_config.prerender.expiration).toBe(false);
	});

	it('includes bypassToken and allowQuery in prerender config', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({
			verbose: false,
			isr: {
				expiration: 300,
				bypassToken: 'my-secret-token',
				allowQuery: ['page', 'q'],
			},
		});

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.prerender.expiration).toBe(300);
		expect(vc_config.prerender.bypassToken).toBe('my-secret-token');
		expect(vc_config.prerender.allowQuery).toEqual(['page', 'q']);
	});

	it('does not add prerender config when isr is false', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false, isr: false });

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.prerender).toBeUndefined();
	});

	it('does not add prerender config when isr is omitted', async () => {
		const { adapt } = await import('../src/adapt.js');
		create_build_output(tmp_dir);

		await adapt({ verbose: false });

		const vc_config = JSON.parse(
			readFileSync(
				join(tmp_dir, '.vercel', 'output', 'functions', 'index.func', '.vc-config.json'),
				'utf-8',
			),
		);

		expect(vc_config.prerender).toBeUndefined();
	});
});
