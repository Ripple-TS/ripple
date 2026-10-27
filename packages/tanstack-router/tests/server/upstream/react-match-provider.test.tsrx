// Ported from TanStack/react-router tests/match-provider.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../../client/upstream/reactivity.js';

import { renderToString } from '../render.js';
import { afterEach, expect, test } from 'vitest';
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	useMatch,
} from '@ripple-ts/tanstack-router';

function NearestMatch({ name }: { name: string }) {
	const match = useMatch({ strict: false });
	return <span data-testid={name}>{match.value.routeId}</span>;
}
function createTestRouter(disableGlobalCatchBoundary = false, isServer = false) {
	const root = createRootRoute({
		shellComponent: function Shell({ children }) {
			const count = track(0);
			return <section data-testid="shell">
				<NearestMatch name="shell-match" />
				<button onClick={() => count.value++}>
					{'Count '}
					{count.value}
				</button>
				{children}
			</section>;
		},
		component: () => <>
			<NearestMatch name="root-match" />
			<Outlet />
		</>,
	});
	const first = createRoute({
		getParentRoute: () => root,
		path: '/first',
		component: () => <NearestMatch name="leaf-match" />,
	});
	const second = createRoute({
		getParentRoute: () => root,
		path: '/second',
		component: () => <NearestMatch name="leaf-match" />,
	});
	return createRouter({
		routeTree: root.addChildren([first, second]),
		history: createMemoryHistory({ initialEntries: ['/first'] }),
		disableGlobalCatchBoundary,
		isServer,
	});
}
test('server shell and nested component read their nearest match context', async () => {
	const router = createTestRouter(false, true);
	await router.load();
	const html = (await renderToString(() => <RouterProvider router={router} />)).replace(
		/<!--[\s\S]*?-->/g,
		'',
	);
	expect(html).toContain('data-testid="shell-match">__root__');
	expect(html).toContain('data-testid="root-match">__root__');
	expect(html).toContain('data-testid="leaf-match">/first');
});
