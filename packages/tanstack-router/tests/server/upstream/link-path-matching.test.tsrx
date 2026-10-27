import { track } from 'ripple';
// Ported from TanStack/solid-router tests/server/link-path-matching.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { renderToString } from '../render.js';
import { expect, test } from 'vitest';
import {
	Link,
	RouterContextProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { linkPathCases } from '../../client/upstream/link-path-cases';

for (const basepath of ['', '/app']) {
	test.each(linkPathCases)(
		`SSR pathname matching with basepath "${basepath}": $current -> $to, exact=$exact`,
		async ({ current, to, exact, active }) => {
			const router = createRouter({
				routeTree: createRootRoute(),
				history: createMemoryHistory({ initialEntries: [basepath + current] }),
				basepath,
				trailingSlash: 'preserve',
				isServer: true,
			});
			const html = await renderToString(
				() => <RouterContextProvider router={router}>
					{<Link
						to={to}
						activeOptions={{ exact }}
						inactiveProps={{ class: 'inactive' }}
						render={({ isActive }) => String(isActive)}
					></Link>}
				</RouterContextProvider>,
			);
			expect(html.replace(/<[^>]*>/g, '')).toBe(String(active));
			expect(html.match(/class="([^"]*)"/)?.[1]?.trim()).toBe(active ? 'active' : 'inactive');
			if (active) {
				expect(html).toContain('aria-current="page"');
			} else {
				expect(html).not.toContain('aria-current');
			}
		},
	);
}
