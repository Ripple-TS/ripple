// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track, flushSync } from 'ripple';
import { expect, test } from 'vitest';
import { render } from '../../harness.js';
import {
	Link,
	RouterContextProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { linkPathCases } from './link-path-cases';

for (const basepath of ['', '/app']) {
	test.each(linkPathCases)(
		`pathname matching with basepath "${basepath}": $current -> $to, exact=$exact`,
		({ current, to, exact, active }) => {
			const router = createRouter({
				routeTree: createRootRoute(),
				history: createMemoryHistory({ initialEntries: [basepath + current] }),
				basepath,
				trailingSlash: 'preserve',
				isServer: false,
			});
			function App() {
				return <RouterContextProvider {router}>
					<Link
						{to}
						activeOptions={{ exact }}
						inactiveProps={{ class: 'inactive' }}
						render={({ isActive }) => String(isActive)}
					/>
				</RouterContextProvider>;
			}
			const { container } = render(App);
			const anchor = container.querySelector('a')!;
			expect(anchor.textContent).toBe(String(active));
			expect(anchor.getAttribute('aria-current')).toBe(active ? 'page' : null);
			expect(anchor.className).toBe(active ? 'active' : 'inactive');
		},
	);
}

test('pathname matching reacts when exact mode changes', () => {
	let setExact!: (value: boolean) => void;
	const router = createRouter({
		routeTree: createRootRoute(),
		history: createMemoryHistory({ initialEntries: ['/posts/item'] }),
		isServer: false,
	});
	function App() @{
		const exact = track(true);
		setExact = (value) => {
			exact.value = value;
		};
		<RouterContextProvider {router}>
			<Link
				to="/posts"
				activeOptions={track(() => ({ exact: exact.value }))}
				inactiveProps={{ class: 'inactive' }}
				render={({ isActive }) => String(isActive)}
			/>
		</RouterContextProvider>
	}
	const { container } = render(App);
	const anchor = container.querySelector('a')!;
	for (const mode of [true, false, true]) {
		setExact(mode);
		flushSync();
		expect(anchor.textContent).toBe(String(!mode));
		expect(anchor.getAttribute('aria-current')).toBe(mode ? null : 'page');
		expect(anchor.className).toBe(mode ? 'inactive' : 'active');
	}
});
