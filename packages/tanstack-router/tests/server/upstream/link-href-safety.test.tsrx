import { track } from 'ripple';
// Ported from TanStack/solid-router tests/server/link-href-safety.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { renderToString } from '../render.js';
import { afterEach, expect, test, vi } from 'vitest';
import {
	Link,
	RouterContextProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { linkHrefCases } from '../../client/upstream/link-href-cases';

afterEach(() => vi.restoreAllMocks());
test.each(linkHrefCases)('validates SSR %s href %j and its active state', async (
	kind,
	href,
	blocked,
	active,
) => {
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	const history = createMemoryHistory({ initialEntries: ['/safe'] });
	history.createHref = vi.fn((path) => (kind === 'history' ? href : path));
	const router = createRouter({
		routeTree: createRootRoute(),
		history,
		isServer: true,
		protocolAllowlist: ['http:', 'https:', 'myapp:'],
		rewrite: kind === 'rewrite'
			? {
					output: ({ url }) => new URL(href, url),
				}
			: undefined,
	});
	const activeProps = { class: 'active', href: 'javascript:active()' };
	const inactiveProps = { class: 'inactive', href: 'javascript:inactive()' };
	const html = await renderToString(
		() => <RouterContextProvider router={router}>
			{<Link
				to={kind === 'to' ? href : '/safe'}
				activeProps={activeProps}
				inactiveProps={inactiveProps}
				render={({ isActive }) => String(isActive)}
			></Link>}
		</RouterContextProvider>,
	);
	if (kind === 'history') {
		expect(history.createHref).toHaveBeenCalledWith('/safe');
	}
	expect(html.match(/href="([^"]*)"/)?.[1] ?? null).toBe(blocked ? null : href);
	expect(html.replace(/<[^>]*>/g, '')).toBe(String(active));
	expect(html.match(/class="([^"]*)"/)?.[1]?.trim()).toBe(active ? 'active' : 'inactive');
	expect(html.includes('aria-current="page"')).toBe(active);
	expect(html.includes('aria-disabled="true"')).toBe(blocked);
});
