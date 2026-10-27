// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
// Stable wrapper configuration lives on the router; provider context may be tracked.
import { Context } from 'ripple';
import { describe, expect, it } from 'vitest';
import { render } from '../../harness.js';
import {
	createRootRoute,
	createRouter,
	RouterProvider,
	createMemoryHistory,
} from '@ripple-ts/tanstack-router';

describe('RouterProvider', () => {
	it('should provide context through RouterProvider Wrap', async () => {
		const ctx = new Context<string>();
		function Wrap(props) @{
			ctx.set('findMe');
			<>
				{props.children}
			</>
		}
		const rootRoute = createRootRoute({
			component: () => {
				const contextValue = ctx.get();
				expect(contextValue, 'Context is not provided').not.toBeUndefined();
				return <div>{contextValue}</div>;
			},
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([]),
			history: createMemoryHistory(),
			Wrap,
		});
		const app = render(() => <RouterProvider {router} />);
		expect(await app.findByText('findMe')).toBeInTheDocument();
	});
});
