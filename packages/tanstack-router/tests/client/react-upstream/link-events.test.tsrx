// Ported from TanStack/react-router tests/link-events.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track, flushSync } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, fireEvent, render, renderHook } from '../../react-harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import {
	Link,
	RouterContextProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
	useLinkProps,
} from '@ripple-ts/tanstack-router';

afterEach(cleanup);
test.each([false, true])('preserves caller click handlers across destination changes (cancel=%s)', (
	cancel,
) => {
	const router = createRouter({
		routeTree: createRootRoute(),
		history: createMemoryHistory(),
		isServer: false,
		rewrite: {
			output: ({ url }) => url.pathname === '/external'
				? new URL('https://other.example/rewritten')
				: url,
		},
	});
	const navigate = vi.spyOn(router, 'navigate').mockResolvedValue();
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const onClick = vi.fn((event: React.MouseEvent) => {
		if (cancel) {
			event.preventDefault();
		}
	});
	let toValue;
	const content = () => {
		toValue = track('/safe');
		return <RouterContextProvider router={router}>
			<Link to={toValue} onClick={onClick}>{'Target'}</Link>
		</RouterContextProvider>;
	};
	try {
		const view = render(() => content());
		const anchor = view.getByText('Target');
		for (const [to, internal] of [
			['/safe', true],
			['https://other.example/', false],
			['/external', false],
			['javascript:blocked()', false],
			['/next', true],
		] as const) {
			onClick.mockClear();
			navigate.mockClear();
			flushSync(() => {
				toValue.value = to;
			});
			expect(view.getByText('Target')).toBe(anchor);
			let intercepted: boolean | undefined;
			const preventNativeNavigation = (event: Event) => {
				intercepted = event.defaultPrevented;
				event.preventDefault();
			};
			document.addEventListener('click', preventNativeNavigation);
			try {
				fireEvent.click(anchor);
			} finally {
				document.removeEventListener('click', preventNativeNavigation);
			}
			expect(onClick).toHaveBeenCalledOnce();
			// Ripple also cancels the default action on protocol-blocked anchors.
			expect(intercepted).toBe(cancel || internal || to.startsWith('javascript:'));
			expect(navigate).toHaveBeenCalledTimes(internal && !cancel ? 1 : 0);
		}
	} finally {
		cleanup();
		navigate.mockRestore();
		warn.mockRestore();
	}
});
test.each(['https://other.example/', 'javascript:blocked()'])(
	'cancels delayed internal preloads when the destination changes to %s',
	(destination) => {
		vi.useFakeTimers();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const router = createRouter({
			routeTree: createRootRoute(),
			history: createMemoryHistory(),
		});
		const preload = vi.spyOn(router, 'preloadRoute').mockResolvedValue(undefined);
		let toValue;
		const content = () => {
			toValue = track('/safe');
			return <RouterContextProvider router={router}>
				<Link to={toValue} preload="intent" preloadDelay={50}>{'Target'}</Link>
			</RouterContextProvider>;
		};
		try {
			const view = render(() => content());
			fireEvent.mouseEnter(view.getByText('Target'));
			flushSync(() => {
				toValue.value = destination;
			});
			act(() => {
				vi.advanceTimersByTime(100);
			});
			expect(preload).not.toHaveBeenCalled();
			flushSync(() => {
				toValue.value = '/next';
			});
			fireEvent.mouseEnter(view.getByText('Target'));
			act(() => {
				vi.advanceTimersByTime(100);
			});
			expect(preload).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ to: '/next' }));
		} finally {
			cleanup();
			warn.mockRestore();
			vi.useRealTimers();
		}
	},
);
test.each(['onClick', 'onFocus', 'onMouseEnter', 'onTouchStart'] as const)(
	'%s respects cancellation before and after the user handler',
	(eventName) => {
		const router = createRouter({
			routeTree: createRootRoute(),
			history: createMemoryHistory(),
			isServer: false,
		});
		const navigate = vi.spyOn(router, 'navigate').mockResolvedValue();
		const preload = vi.spyOn(router, 'preloadRoute').mockResolvedValue(undefined);
		const userHandler = vi.fn((event: React.SyntheticEvent) => {
			if (cancelInUserHandler) {
				event.preventDefault();
			}
		});
		let cancelInUserHandler = false;
		const { result } = renderHook(
			() => useLinkProps({
				to: '/target',
				preload: 'intent',
				preloadDelay: 0,
				[eventName]: userHandler,
			}),
			{
				wrapper: ({ children }) =>
					<RouterContextProvider router={router}>{children}</RouterContextProvider>,
			},
		);
		const internalHandler =
			eventName === 'onClick' ? navigate : preload;
		const anchor = document.createElement('a');
		for (const initiallyPrevented of [true, false]) {
			for (const cancel of [true, false]) {
				cancelInUserHandler = cancel;
				userHandler.mockClear();
				internalHandler.mockClear();
				const event = {
					defaultPrevented: initiallyPrevented,
					preventDefault() {
						this.defaultPrevented = true;
					},
					currentTarget: anchor,
					button: 0,
				};
				result.current[eventName]!(
					event as unknown as React.MouseEvent<HTMLAnchorElement> & React.TouchEvent<
						HTMLAnchorElement
					> & React.FocusEvent<HTMLAnchorElement>,
				);
				// Ripple preserves the native user callback even on a pre-cancelled event.
				expect(userHandler).toHaveBeenCalledOnce();
				expect(internalHandler).toHaveBeenCalledTimes(initiallyPrevented || cancel ? 0 : 1);
			}
		}
	},
);
