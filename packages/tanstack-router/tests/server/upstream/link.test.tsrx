import { track, isRefProp } from 'ripple';
// Ported from TanStack/solid-router tests/server/link.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
/** @jsxImportSource solid-js */
import { renderToString } from '../render.js';
import { expect, test, vi } from 'vitest';
import {
	Link,
	RouterContextProvider,
	createLink,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import type { Derived, HTMLAnchorAttributes } from 'ripple';

test.each([
	{ to: '/', href: '/' },
	{ to: '/internal', href: '/internal' },
	{ to: 'https://example.com/', href: 'https://example.com/' },
	{ to: '/external', href: 'https://example.com/rewritten' },
	{ to: 'javascript:blocked()', href: undefined },
])('SSR custom links retain caller props for $to', async ({ to, href }) => {
	let received: HTMLAnchorAttributes | undefined;
	const CustomLink = createLink((props: { linkProps: Derived<HTMLAnchorAttributes> }) => {
		received = { ...props.linkProps.value };
		return <a />;
	});
	const router = createRouter({
		routeTree: createRootRoute(),
		history: createMemoryHistory(),
		isServer: true,
		rewrite: {
			output: ({ url }) => url.pathname === '/external'
				? new URL('https://example.com/rewritten')
				: url,
		},
	});
	const handlers = {
		onClick: vi.fn(),
		onBlur: vi.fn(),
		onFocus: vi.fn(),
		onMouseEnter: vi.fn(),
		onMouseLeave: vi.fn(),
		onMouseOut: vi.fn(),
		onMouseOver: vi.fn(),
		onTouchStart: vi.fn(),
	};
	const ref = vi.fn();
	const callerProps = { ref, ...handlers };
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		await renderToString(
			() => <RouterContextProvider router={router}>
				{<CustomLink
					to={to}
					href={track(() => to.startsWith('/') ? undefined : 'javascript:spoofed()')}
					target="_blank"
					title="custom link"
					{...callerProps}
				/>}
			</RouterContextProvider>,
		);
		expect(received).toMatchObject({
			href,
			target: '_blank',
			title: 'custom link',
		});
		const receivedRef =
			received &&
				received[Object.getOwnPropertySymbols(received).filter(isRefProp).at(
					-1,
				)!] as (element: HTMLAnchorElement) => void;
		expect(receivedRef).toBeTypeOf('function');
		const element = {} as HTMLAnchorElement;
		receivedRef(element);
		expect(ref).toHaveBeenCalledExactlyOnceWith(element);
		for (const name of Object.keys(handlers) as Array<keyof typeof handlers>) {
			const handler = received?.[name] as (event: Event) => void;
			expect(handler).toBeTypeOf('function');
			const event = new Event('test', { cancelable: true });
			event.preventDefault();
			handler(event);
			expect(handlers[name]).toHaveBeenCalledExactlyOnceWith(event);
		}
		if (!href) {
			expect(received).toMatchObject({ role: 'link', 'aria-disabled': true });
		}
	} finally {
		warn.mockRestore();
	}
});
test.each([
	{ to: 'https://example.com/', href: 'https://example.com/' },
	{ to: 'myapp:open', href: 'myapp:open' },
	{ to: 'javascript:alert(1)', href: undefined },
	{ to: 'mailto:person@example.com', href: undefined },
	{ to: '/external', href: 'https://example.com/rewritten' },
	{ to: '/blocked', href: undefined },
])('keeps the final SSR href safe and inactive for $to', async ({ to, href }) => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const router = createRouter({
			routeTree: createRootRoute(),
			history: createMemoryHistory(),
			isServer: true,
			protocolAllowlist: ['http:', 'https:', 'myapp:'],
			rewrite: {
				output: ({ url }) => url.pathname === '/external'
					? new URL('https://example.com/rewritten')
					: url.pathname === '/blocked'
						? new URL('javascript:alert(1)')
						: url,
			},
		});
		for (const disabled of [false, true]) {
			for (const customStyles of [false, true]) {
				const inactiveProps =
					customStyles
						? {
								class: 'inactive',
								style: { color: 'red' },
								href: 'javascript:inactive()',
							}
						: undefined;
				const html = await renderToString(
					() => <RouterContextProvider router={router}>
						{<Link
							to={to}
							disabled={disabled}
							href={track(() => to.startsWith('/') ? undefined : 'javascript:spoofed()')}
							class={customStyles ? 'base' : undefined}
							inactiveProps={inactiveProps}
							render={({ isActive }) => String(isActive)}
						></Link>}
					</RouterContextProvider>,
				);
				// Ripple intentionally removes href from every disabled Link, including direct schemes.
				const expectedHref = disabled ? undefined : href;
				if (expectedHref) {
					expect(html).toContain(`href="${expectedHref}"`);
				} else {
					expect(html).not.toContain('href=');
				}
				expect(html).not.toContain('javascript:');
				expect(html).not.toContain('aria-current');
				expect(html).toContain('false');
				if (disabled || !href) {
					expect(html).toContain('aria-disabled="true"');
				}
				if (customStyles) {
					expect(html).toContain('base inactive');
					expect(html).toMatch(/color:\s*red/);
				}
			}
		}
	} finally {
		warn.mockRestore();
	}
});
