// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expect, test, vi } from 'vitest';
import { render, fireEvent } from '../../harness.js';
import {
	Link,
	RouterContextProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { linkHrefCases } from './link-href-cases';

test.each(linkHrefCases)('validates %s href %j and its active state', (
	kind,
	href,
	blocked,
	active,
) => {
	const history = createMemoryHistory({ initialEntries: ['/safe'] });
	history.createHref = vi.fn((path) => kind === 'history' ? href : path);
	const router = createRouter({
		routeTree: createRootRoute(),
		history,
		isServer: false,
		protocolAllowlist: ['http:', 'https:', 'myapp:'],
		rewrite: kind === 'rewrite' ? { output: ({ url }) => new URL(href, url) } : undefined,
	});
	const navigate = vi.spyOn(router, 'navigate').mockResolvedValue();
	const preload = vi.spyOn(router, 'preloadRoute').mockResolvedValue(undefined);
	const activeProps = { class: 'active', href: 'javascript:active()' };
	const inactiveProps = { class: 'inactive', href: 'javascript:inactive()' };
	function App() {
		return <RouterContextProvider {router}>
			<Link
				to={kind === 'to' ? href : '/safe'}
				preload="intent"
				preloadDelay={0}
				{activeProps}
				{inactiveProps}
				render={({ isActive }) => String(isActive)}
			/>
		</RouterContextProvider>;
	}
	const { container } = render(App);
	const anchor = container.querySelector('a')!;
	if (kind === 'history') expect(history.createHref).toHaveBeenCalledWith('/safe');
	expect(anchor.getAttribute('href')).toBe(blocked ? null : href);
	expect(anchor.textContent).toBe(String(active));
	expect(anchor.getAttribute('aria-current')).toBe(active ? 'page' : null);
	expect(anchor.getAttribute('aria-disabled')).toBe(blocked ? 'true' : null);
	expect(anchor.className.trim()).toBe(active ? 'active' : 'inactive');
	if (blocked) {
		// Ripple suppresses disabled clicks explicitly; the upstream link has no href.
		expect(fireEvent.click(anchor)).toBe(false);
		fireEvent.focus(anchor);
		fireEvent.mouseEnter(anchor);
		fireEvent.touchStart(anchor);
		expect(navigate).not.toHaveBeenCalled();
		expect(preload).not.toHaveBeenCalled();
	}
});
