import { afterEach, expect, it, vi } from 'vitest';
import {
	Asset,
	HeadContent,
	RouterProvider,
	RouterContextProvider,
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
} from '@ripple-ts/tanstack-router';
import { isDataScript } from '../../src/assets.js';
import { render, cleanup } from '../harness.js';

afterEach(() => {
	cleanup();
	document.head.innerHTML = '';
});

it.each([
	['application/json', true],
	['application/ld+json', true],
	[' Application/JSON; charset=utf-8 ', true],
	['text/javascript', false],
	['application/javascript', false],
	['TEXT/JAVASCRIPT; charset=utf-8', false],
	['module', false],
	['importmap', false],
	['speculationrules', false],
	['', false],
	[undefined, false],
])('classifies a dynamic script type %s', (type, expected) => {
	expect(isDataScript(type)).toBe(expected);
});

it('retains a shared executable script until its final owner unmounts', () => {
	const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
	const App = () => <RouterContextProvider {router}>
		<Asset tag="script" attrs={{ src: '/shared.js' }} />
	</RouterContextProvider>;
	const first = render(App), second = render(App);
	const script = document.querySelector('script[src="/shared.js"]');
	expect(document.querySelectorAll('script[src="/shared.js"]')).toHaveLength(1);
	first.unmount();
	expect(script).toBeInTheDocument();
	second.unmount();
	expect(script).not.toBeInTheDocument();
});

it('encodes JSON-LD as valid data without allowing a closing script delimiter', async () => {
	const payload = { title: '</script><script>bad()</script>', quote: '" & <' };
	const router = createRouter({
		routeTree: createRootRoute({
			head: () => ({ meta: [{ 'script:ld+json': payload }] }),
			component: HeadContent,
		}),
		history: createMemoryHistory(),
	});
	await router.load();
	render(() => <RouterProvider {router} />);
	const script = document.head.querySelector('script[type="application/ld+json"]')!;
	expect(JSON.parse(script.textContent!)).toEqual(payload);
	expect(script.textContent).not.toContain('</script>');
	expect(document.scripts).toHaveLength(1);
});

it(
	'removes obsolete style attributes after navigation and preserves unchanged stylesheet nodes',
	async () => {
		const root = createRootRoute({ component: HeadContent });
		const first = createRoute({
			getParentRoute: () => root,
			path: '/',
			head: () => ({
				styles: [
					{ children: 'p{color:red}', media: 'print' },
				],
				links: [
					{ rel: 'stylesheet', href: '/shared.css' },
				],
			}),
		});
		const second = createRoute({
			getParentRoute: () => root,
			path: '/next',
			head: () => ({
				styles: [{ children: 'p{color:red}' }],
				links: [
					{ rel: 'stylesheet', href: '/shared.css' },
				],
			}),
		});
		const router = createRouter({
			routeTree: root.addChildren([first, second]),
			history: createMemoryHistory(),
		});
		await router.load();
		render(() => <RouterProvider {router} />);
		const link = document.querySelector('link');
		expect(document.querySelector('style')).toHaveAttribute('media', 'print');
		await router.navigate({ to: '/next' });
		expect(document.querySelector('style')).not.toHaveAttribute('media');
		expect(document.querySelector('link')).toBe(link);
		expect(document.querySelectorAll('style')).toHaveLength(1);
	},
);

it('classifies script types after applying case-insensitive attribute overrides', () => {
	const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
	const view = render(
		() => <RouterContextProvider {router}>
			<Asset
				tag="script"
				attrs={{ type: 'application/json', TYPE: 'application/javascript', id: 'executable' }}
				children="void 0"
			/>
			<Asset
				tag="script"
				attrs={{ TYPE: 'application/javascript', type: 'application/json', id: 'inert' }}
				children="{}"
			/>
		</RouterContextProvider>,
	);
	expect(document.head.querySelector('#executable')).toHaveAttribute(
		'type',
		'application/javascript',
	);
	expect(view.container.querySelector('#inert')).toHaveAttribute('type', 'application/json');
});

it(
	'deduplicates inline scripts by content, type and nonce even when other attributes differ',
	() => {
		const existing = document.createElement('script');
		existing.textContent = 'void 0';
		existing.nonce = 'same';
		document.head.append(existing);
		const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
		const view = render(
			() => <RouterContextProvider {router}>
				<Asset tag="script" attrs={{ nonce: 'same', id: 'new-id' }} children="void 0" />
			</RouterContextProvider>,
		);
		expect(document.scripts).toHaveLength(1);
		view.unmount();
		expect(existing).toBeInTheDocument();
	},
);
