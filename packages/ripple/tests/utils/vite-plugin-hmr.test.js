import { describe, it, expect, vi } from 'vitest';
import { ripple } from '@ripple-ts/vite-plugin';

describe('vite-plugin-ripple hotUpdate', () => {
	it('invalidates SSR modules for non-self-accepting .ripple files', async () => {
		const [plugin] = ripple({ excludeRippleExternalModules: true });
		await plugin.configResolved?.({ root: '/workspace', command: 'serve' });

		const transform_request = vi.fn().mockResolvedValue(undefined);
		const get_css_module = vi.fn().mockReturnValue(undefined);
		const invalidate_css_module = vi.fn();
		const send_hot_update = vi.fn();
		const get_ssr_modules = vi.fn().mockReturnValue(new Set([{ id: 'ssr:a' }, { id: 'ssr:b' }]));
		const invalidate_ssr_module = vi.fn();

		const result = await plugin.hotUpdate.handler.call(
			{
				environment: {
					name: 'client',
					transformRequest: transform_request,
					moduleGraph: {
						getModuleById: get_css_module,
						invalidateModule: invalidate_css_module,
					},
					hot: {
						send: send_hot_update,
					},
				},
			},
			{
				file: '/workspace/src/non-component.ripple',
				modules: [{ id: 'client:non-component', isSelfAccepting: false }],
				server: {
					environments: {
						ssr: {
							moduleGraph: {
								getModulesByFile: get_ssr_modules,
								invalidateModule: invalidate_ssr_module,
							},
						},
					},
				},
			},
		);

		expect(transform_request).toHaveBeenCalledWith('/src/non-component.ripple');
		expect(get_ssr_modules).toHaveBeenCalledWith('/workspace/src/non-component.ripple');
		expect(invalidate_ssr_module).toHaveBeenCalledTimes(2);
		expect(send_hot_update).toHaveBeenCalledWith({ type: 'full-reload' });
		expect(result).toEqual([]);
	});

	it('keeps self-accepting .ripple files on Vite HMR path', async () => {
		const [plugin] = ripple({ excludeRippleExternalModules: true });
		await plugin.configResolved?.({ root: '/workspace', command: 'serve' });

		const transform_request = vi.fn().mockResolvedValue(undefined);
		const get_ssr_modules = vi.fn();
		const invalidate_ssr_module = vi.fn();
		const send_hot_update = vi.fn();

		const result = await plugin.hotUpdate.handler.call(
			{
				environment: {
					name: 'client',
					transformRequest: transform_request,
					moduleGraph: {
						getModuleById: vi.fn().mockReturnValue(undefined),
						invalidateModule: vi.fn(),
					},
					hot: {
						send: send_hot_update,
					},
				},
			},
			{
				file: '/workspace/src/component.ripple',
				modules: [{ id: 'client:component', isSelfAccepting: true }],
				server: {
					environments: {
						ssr: {
							moduleGraph: {
								getModulesByFile: get_ssr_modules,
								invalidateModule: invalidate_ssr_module,
							},
						},
					},
				},
			},
		);

		expect(transform_request).toHaveBeenCalledWith('/src/component.ripple');
		expect(get_ssr_modules).not.toHaveBeenCalled();
		expect(invalidate_ssr_module).not.toHaveBeenCalled();
		expect(send_hot_update).not.toHaveBeenCalled();
		expect(result).toBeUndefined();
	});
});
