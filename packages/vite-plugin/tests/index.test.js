import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ripple/compiler', () => ({
	compile: vi.fn(() => ({
		js: { code: 'export const rendered = true;', map: null },
		css: '',
	})),
}));

import { compile } from 'ripple/compiler';
import { ripple } from '../src/index.js';

/**
 * @returns {import('vite').Plugin}
 */
function create_plugin() {
	return ripple({ excludeRippleExternalModules: true })[0];
}

describe('vite-plugin', () => {
	beforeEach(() => {
		compile.mockClear();
		compile.mockImplementation(() => ({
			js: { code: 'export const rendered = true;', map: null },
			css: '',
		}));
	});

	it('returns hydration bootstrap with mount fallback and explicit errors', async () => {
		const plugin = create_plugin();
		const code = await plugin.load('\0virtual:ripple-hydrate');

		expect(code).toContain("import { hydrate, mount } from 'ripple';");
		expect(code).toContain("const target = document.getElementById('root');");
		expect(code).toContain(
			"Object.entries(module).find(([key, value]) => typeof value === 'function' && /^[A-Z]/.test(key))?.[1];",
		);
		expect(code).toContain("console.warn('[ripple] Hydration failed, falling back to mount.', error);");
		expect(code).toContain("console.error('[ripple] Failed to bootstrap client hydration.', error);");
	});

	it('compiles in server mode when transform opts set ssr=true', async () => {
		const plugin = create_plugin();

		await plugin.configResolved({
			root: '/workspace',
			command: 'build',
		});

		await plugin.transform.handler.call(
			{
				environment: {
					config: { consumer: 'client' },
				},
			},
			'component default() {}',
			'/workspace/example.ripple',
			{ ssr: true },
		);

		expect(compile).toHaveBeenCalledWith(
			'component default() {}',
			'/example.ripple',
			expect.objectContaining({
				mode: 'server',
				dev: false,
			}),
		);
	});

	it('compiles in client mode when transform opts set ssr=false for client consumer', async () => {
		const plugin = create_plugin();

		await plugin.configResolved({
			root: '/workspace',
			command: 'build',
		});

		await plugin.transform.handler.call(
			{
				environment: {
					config: { consumer: 'client' },
				},
			},
			'component default() {}',
			'/workspace/example.ripple',
			{ ssr: false },
		);

		expect(compile).toHaveBeenCalledWith(
			'component default() {}',
			'/example.ripple',
			expect.objectContaining({
				mode: 'client',
				dev: false,
			}),
		);
	});
});
