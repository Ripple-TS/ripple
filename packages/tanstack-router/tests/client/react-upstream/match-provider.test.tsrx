// Ported from TanStack/react-router tests/match-provider.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, render, screen } from '../../react-harness.js';

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

afterEach(cleanup);
function NearestMatch({ name }: { name: string }) {
	const match = useMatch({ strict: false });
	return <span data-testid={name}>{match.value.routeId}</span>;
}
function createTestRouter(disableGlobalCatchBoundary = false, isServer = false) {
	const root = createRootRoute({
		shellComponent: function Shell({ children }) {
			const [count, setCount] = React.useState(0);
			return <section data-testid="shell">
				<NearestMatch name="shell-match" />
				<button onClick={() => setCount(count.value + 1)}>
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
test.each([false, true])(
	'shell keeps nearest match context and state across navigation (global catch disabled: %s)',
	async (disableGlobalCatchBoundary) => {
		const router = createTestRouter(disableGlobalCatchBoundary);
		await router.load();
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByTestId('leaf-match')).toHaveTextContent('/first');
		expect(screen.getByTestId('shell-match')).toHaveTextContent('__root__');
		expect(screen.getByTestId('root-match')).toHaveTextContent('__root__');
		const shell = screen.getByTestId('shell');
		act(() => screen.getByRole('button').click());
		await act(async () => {
			await router.navigate({ to: '/second' });
		});
		expect(screen.getByTestId('leaf-match')).toHaveTextContent('/second');
		expect(screen.getByTestId('shell-match')).toHaveTextContent('__root__');
		expect(screen.getByTestId('shell')).toBe(shell);
		expect(screen.getByRole('button')).toHaveTextContent('Count 1');
	},
);
