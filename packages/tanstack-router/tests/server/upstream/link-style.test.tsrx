import { track, isRefProp } from 'ripple';
// Ported from TanStack/solid-router tests/server/link-style.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { JSDOM } from 'jsdom';
import { expect, test, vi } from 'vitest';
import {
	RouterProvider,
	Link,
	createRootRoute,
	createRoute,
	createRouter,
	useLinkProps,
} from '@ripple-ts/tanstack-router';
import { createRequestHandler, renderRouterToString } from '@ripple-ts/tanstack-router/ssr/server';

test('preserves routing options, selected state props, and styling during SSR', async () => {
	const activeRef = vi.fn();
	const inactiveRef = vi.fn();
	let resolvedActiveRef: unknown;
	let resolvedInactiveRef: unknown;
	const active = vi.fn(
		() => ({
			class: 'selected',
			style: { color: 'blue' },
			title: 'selected',
			ref: activeRef,
			href: '/state-active',
			target: '_self',
			disabled: true,
		}),
	);
	const inactive = {
		class: 'idle',
		'data-state': 'idle',
		ref: inactiveRef,
		href: '/state-inactive',
		target: '_self',
		disabled: true,
	};
	const unused = vi.fn(() => ({ class: 'unused' }));
	const root = createRootRoute({
		component: () => {
			const activeProps = useLinkProps({
				to: '/',
				target: '_blank',
				class: 'base',
				style: { color: 'red', 'margin-top': '2px' },
				activeProps: active,
				inactiveProps: unused,
			});
			const inactiveProps = useLinkProps({
				to: '/other',
				target: '_blank',
				activeProps: unused,
				inactiveProps: inactive,
			});
			resolvedActiveRef = activeProps.value[Object.getOwnPropertySymbols(activeProps.value).filter(
				isRefProp,
			).at(-1)!];
			resolvedInactiveRef = inactiveProps.value[Object.getOwnPropertySymbols(
				inactiveProps.value,
			).filter(isRefProp).at(-1)!];
			return <>
				<a {...activeProps.value}>{'Active'}</a>
				<a {...inactiveProps.value}>{'Inactive'}</a>
				<Link to="/">{'Default'}</Link>
				<Link to="/" activeProps={{}}>{'Empty'}</Link>
			</>;
		},
	});
	const routeTree = root.addChildren([
		createRoute({ getParentRoute: () => root, path: '/' }),
		createRoute({ getParentRoute: () => root, path: '/other' }),
	]);
	const handler = createRequestHandler({
		request: new Request('http://localhost/'),
		createRouter: () => createRouter({ routeTree, isServer: true }),
	});
	const response = await handler(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	const dom = new JSDOM(await response.text());
	try {
		const links = dom.window.document.querySelectorAll('a');
		expect(links).toHaveLength(4);
		expect([...links[0]!.classList]).toEqual(['base', 'selected']);
		expect(links[0]!.style.color).toBe('blue');
		expect(links[0]!.style.marginTop).toBe('2px');
		expect(links[0]!.getAttribute('title')).toBe('selected');
		expect(links[0]!.getAttribute('href')).toBe('/');
		expect(links[0]!.getAttribute('target')).toBe('_blank');
		expect(links[0]!.hasAttribute('disabled')).toBe(false);
		expect(resolvedActiveRef).toBe(activeRef);
		expect([...links[1]!.classList]).toEqual(['idle']);
		expect(links[1]!.getAttribute('data-state')).toBe('idle');
		expect(links[1]!.getAttribute('href')).toBe('/other');
		expect(links[1]!.getAttribute('target')).toBe('_blank');
		expect(links[1]!.hasAttribute('disabled')).toBe(false);
		expect(resolvedInactiveRef).toBe(inactiveRef);
		expect([...links[2]!.classList]).toEqual(['active']);
		expect([...links[3]!.classList]).toEqual([]);
		expect(active).toHaveBeenCalled();
		expect(unused).not.toHaveBeenCalled();
	} finally {
		dom.window.close();
	}
});
