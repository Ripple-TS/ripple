import { track } from 'ripple';
// Ported from TanStack/solid-router tests/server/HeadContent.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { describe, expect, it } from 'vitest';
import { renderToStringAsync } from '../render.js';
import {
	HeadContent,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import type { Manifest } from '@tanstack/router-core';

async function renderHeadContent(manifest: Omit<Manifest, 'routes'> = {}) {
	const rootRoute = createRootRoute({
		component: HeadContent,
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute,
		isServer: true,
	});
	router.ssr = {
		manifest: {
			...manifest,
			routes: {
				[rootRoute.id]: {
					preloads: ['/low-priority.js'],
				},
			},
		},
	};
	await router.load();
	const html = await renderToStringAsync(() => <RouterProvider router={router} />);
	return html.match(/<link\b[^>]*\/low-priority\.js[^>]*>/)?.[0];
}
describe('HeadContent (server)', () => {
	it('renders manifest module preloads with low fetch priority', async () => {
		const link = await renderHeadContent();
		expect(link).toMatch(/\brel="modulepreload"/);
		expect(link).toMatch(/\bfetchpriority="low"/i);
	});
	it('renders iife manifest preloads as low priority script links', async () => {
		const link = await renderHeadContent({ scriptFormat: 'iife' });
		expect(link).toMatch(/\brel="preload"/);
		expect(link).toMatch(/\bas="script"/);
		expect(link).toMatch(/\bfetchpriority="low"/i);
	});
});
