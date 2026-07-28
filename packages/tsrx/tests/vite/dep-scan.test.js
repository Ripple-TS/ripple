import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDepScanLoadPlugin, createDepScanTransformPlugin } from '../../src/vite/dep-scan.js';

const TSRX = /\.tsrx$/;

/** @param {string} code */
const echo = (code) => ({ code });

describe('createDepScanTransformPlugin', () => {
	it('filters on the supplied pattern', () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: echo,
		});

		expect(plugin.name).toBe('test:dep-scan');
		expect(plugin.transform.filter.id.test('/app/App.tsrx')).toBe(true);
		expect(plugin.transform.filter.id.test('/app/App.tsx')).toBe(false);
	});

	it('returns the compiled code as a tsx module by default', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: (code, id) => ({ code: `/* ${id} */ ${code}` }),
		});

		const result = await plugin.transform.handler('source', '/app/App.tsrx');

		expect(result).toEqual({ code: '/* /app/App.tsrx */ source', moduleType: 'tsx' });
	});

	it('awaits an async compile', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: async (code) => ({ code: code.toUpperCase() }),
		});

		const result = await plugin.transform.handler('source', '/app/App.tsrx');

		expect(result.code).toBe('SOURCE');
	});

	it('honors an overridden module type', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: echo,
			moduleType: 'js',
		});

		const result = await plugin.transform.handler('source', '/app/App.tsrx');

		expect(result.moduleType).toBe('js');
	});

	it('prepends the extra imports so the scanner records them', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: echo,
			imports: ['react/jsx-runtime', 'some/other-runtime'],
		});

		const result = await plugin.transform.handler('source', '/app/App.tsrx');

		expect(result.code).toBe('import "react/jsx-runtime";\nimport "some/other-runtime";\nsource');
	});

	it('emits nothing extra when no imports are configured', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: echo,
		});

		const result = await plugin.transform.handler('source', '/app/App.tsrx');

		expect(result.code).toBe('source');
	});

	it('returns an empty module when compile throws, rather than failing the scan', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: () => {
				throw new Error('SyntaxError: Unexpected token');
			},
			imports: ['react/jsx-runtime'],
		});

		const result = await plugin.transform.handler('source', '/app/App.tsrx');

		expect(result).toEqual({ code: '', moduleType: 'tsx' });
	});

	it('returns an empty module when an async compile rejects', async () => {
		const plugin = createDepScanTransformPlugin({
			name: 'test:dep-scan',
			filter: TSRX,
			compile: () => Promise.reject(new Error('boom')),
		});

		await expect(plugin.transform.handler('source', '/app/App.tsrx')).resolves.toEqual({
			code: '',
			moduleType: 'tsx',
		});
	});
});

describe('createDepScanLoadPlugin', () => {
	/** @type {string} */
	let dir;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'tsrx-dep-scan-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	/**
	 * @param {Partial<Parameters<typeof createDepScanLoadPlugin>[0]>} [overrides]
	 */
	function create(overrides) {
		return createDepScanLoadPlugin({
			name: 'test:dep-scan',
			isVirtual: (id) => id.endsWith('.tsrx.tsx'),
			toRealPath: (id) => id.slice(0, -'.tsx'.length),
			compile: echo,
			...overrides,
		});
	}

	it('ignores ids that are not virtual', async () => {
		expect(await create().load('/app/App.tsx')).toBeNull();
	});

	it('reads the real file and returns it as a tsx module', async () => {
		const real_path = join(dir, 'App.tsrx');
		writeFileSync(real_path, 'the source');

		const result = await create().load(real_path + '.tsx');

		expect(result).toEqual({ code: 'the source', moduleType: 'tsx' });
	});

	it('strips a query string before resolving the real path', async () => {
		const real_path = join(dir, 'App.tsrx');
		writeFileSync(real_path, 'the source');

		const result = await create().load(real_path + '.tsx?v=1');

		expect(result?.code).toBe('the source');
	});

	it('prepends the extra imports', async () => {
		const real_path = join(dir, 'App.tsrx');
		writeFileSync(real_path, 'the source');

		const result = await create({ imports: ['solid-js/web'] }).load(real_path + '.tsx');

		expect(result?.code).toBe('import "solid-js/web";\nthe source');
	});

	it('returns an empty module when compile throws', async () => {
		const real_path = join(dir, 'App.tsrx');
		writeFileSync(real_path, 'the source');

		const plugin = create({
			compile: () => {
				throw new Error('SyntaxError: Unexpected token');
			},
		});

		expect(await plugin.load(real_path + '.tsx')).toEqual({ code: '', moduleType: 'tsx' });
	});

	it('returns an empty module when the real file is missing', async () => {
		const result = await create().load(join(dir, 'Gone.tsrx.tsx'));

		expect(result).toEqual({ code: '', moduleType: 'tsx' });
	});
});
