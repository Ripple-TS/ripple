// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { resolve } from 'node:path';
import { beforeAll, expect, test, vi } from 'vitest';
import { build } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';
import * as Ripple from 'ripple';
import * as runtime from 'ripple/internal/client';
import * as core from '@tanstack/router-core';
import { render, screen } from '../../harness.js';
import type { lazyRouteComponent } from '@ripple-ts/tanstack-router';

let productionLazyRouteComponent: typeof lazyRouteComponent;
beforeAll(async () => {
	const result = await build({
		configFile: false,
		logLevel: 'silent',
		plugins: [ripple({ excludeRippleExternalModules: true })],
		build: {
			write: false,
			minify: true,
			lib: {
				entry: resolve(import.meta.dirname, '../../../src/lazyRouteComponent.tsrx'),
				formats: ['cjs'],
			},
			rolldownOptions: { external: ['ripple', 'ripple/internal/client', '@tanstack/router-core'] },
		},
	});
	const code = ((Array.isArray(result) ? result : [result])).flatMap((r) => r.output).filter(
		(c) => c.type === 'chunk',
	).map((c) => c.code).join('\n');
	const module = { exports: {} };
	new Function('require', 'module', 'exports', code)((id) => {
		if (id === 'ripple') return Ripple;
		if (id === 'ripple/internal/client') return runtime;
		if (id === '@tanstack/router-core') return core;
		throw new Error(`Unexpected external: ${id}`);
	}, module, module.exports);
	productionLazyRouteComponent = module.exports.lazyRouteComponent;
	expect(productionLazyRouteComponent).toBeTypeOf('function');
}, 15000);

test('a preloaded production component renders synchronously with its props', async () => {
	const importer = vi.fn(
		() => Promise.resolve({ Page: (props: { label: string }) => <span>{props.label}</span> }),
	);
	const Page = productionLazyRouteComponent(importer, 'Page');
	await Page.preload?.();
	function App() @{
		@try {
			<Page label="Ready component" />
		} @pending {
			<span>Loading component</span>
		}
	}
	render(App);
	expect(screen.getByText('Ready component')).toBeInTheDocument();
	expect(screen.queryByText('Loading component')).not.toBeInTheDocument();
	expect(importer).toHaveBeenCalledOnce();
	expect(Page.preload).toBeUndefined();
});
test('a rejected production import reaches the error boundary', async () => {
	const importer = vi.fn().mockRejectedValue(new Error('component download failed'));
	const Page = productionLazyRouteComponent(importer);
	function App() @{
		@try {
			<Page />
		} @pending {
			<span>Loading component</span>
		} @catch (error) {
			<span>{error.message}</span>
		}
	}
	render(App);
	expect(await screen.findByText('component download failed')).toBeInTheDocument();
	expect(importer).toHaveBeenCalledOnce();
});
test.each([
	{ exportName: undefined, preload: false },
	{ exportName: 'Missing', preload: false },
	{ exportName: undefined, preload: true },
	{ exportName: 'Missing', preload: true },
])('Ripple reports a missing production export $exportName with preload=$preload', async ({
	exportName,
	preload,
}) => {
	const importer = vi.fn().mockResolvedValue({ Other: () => null });
	const Page = productionLazyRouteComponent(importer, exportName);
	if (preload) await Page.preload?.();
	function App() @{
		@try {
			<Page />
		} @pending {
			<span>Loading component</span>
		} @catch (error) {
			<span>{error.message}</span>
		}
	}
	render(App);
	expect(
		await screen.findByText(`lazyRouteComponent: export "${exportName ?? 'default'}" not found`),
	).toBeInTheDocument();
	expect(importer).toHaveBeenCalledOnce();
});
