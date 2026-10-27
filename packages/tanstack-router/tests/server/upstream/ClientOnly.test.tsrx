import { track } from 'ripple';
// Ported from TanStack/solid-router tests/server/ClientOnly.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { describe, expect, it } from 'vitest';
import { renderToStringAsync } from '../render.js';
import {
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { ClientOnly } from '@ripple-ts/tanstack-router';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

function createTestRouter(initialHistory?: RouterHistory) {
	const history = initialHistory ?? createMemoryHistory({ initialEntries: ['/'] });
	const rootRoute = createRootRoute({});
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>
			<p>{'Index Route'}</p>
			<ClientOnly fallback={<div data-testid="loading">{'Loading...'}</div>}>
				<div data-testid="client-only-content">{'Client Only Content'}</div>
			</ClientOnly>
		</div>,
	});
	const routeTree = rootRoute.addChildren([indexRoute]);
	const router = createRouter({ routeTree, history });
	return {
		router,
		routes: { indexRoute },
	};
}
describe('ClientOnly (server)', () => {
	it('should render fallback during SSR', async () => {
		const { router } = createTestRouter();
		await router.load();
		// Initial render (SSR)
		const html = await renderToStringAsync(() => <RouterProvider router={router} />);
		expect(html).include('Loading...');
		expect(html).not.include('Client Only Content');
	});
});
