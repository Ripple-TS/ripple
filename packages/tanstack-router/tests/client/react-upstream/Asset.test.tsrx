// Ported from TanStack/react-router tests/Asset.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '../../react-harness.js';
import {
	Asset,
	RouterContextProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import type { RouterManagedTag } from '@tanstack/router-core';

afterEach(() => {
	cleanup();
	vi.unstubAllEnvs();
});
test.each([undefined, '/asset.js'])('injects and cleans up executable scripts with src=%s', (
	src,
) => {
	const router = createRouter({
		routeTree: createRootRoute(),
		history: createMemoryHistory(),
	});
	const { unmount } = render(
		() => <RouterContextProvider router={router}>
			<Asset
				tag="script"
				attrs={{
					id: 'injected-asset',
					src,
					async: true,
					defer: false,
					nonce: 'asset-nonce',
					'data-empty': '',
					'data-omitted': undefined,
				}}
				children={src ? undefined : 'void 0'}
			/>
		</RouterContextProvider>,
	);
	const script = document.head.querySelector<HTMLScriptElement>('#injected-asset');
	expect(script).toHaveAttribute('async', '');
	expect(script).not.toHaveAttribute('defer');
	expect(script).toHaveAttribute('data-empty', '');
	expect(script).not.toHaveAttribute('data-omitted');
	expect(script).not.toHaveAttribute('suppresshydrationwarning');
	expect(script?.nonce).toBe('asset-nonce');
	expect(script?.textContent).toBe(src ? '' : 'void 0');
	expect(script?.getAttribute('src')).toBe(src ?? null);
	unmount();
	expect(script).not.toBeInTheDocument();
});
test.each(['/asset.js', '//cdn.example.com/asset.js', 'http://['])(
	'reuses existing executable scripts with src=%s',
	(src) => {
		const existing = document.createElement('script');
		existing.src = src;
		document.head.appendChild(existing);
		const router = createRouter({
			routeTree: createRootRoute(),
			history: createMemoryHistory(),
		});
		try {
			const { unmount } = render(
				() => <RouterContextProvider router={router}>
					<Asset tag="script" attrs={{ src }} />
				</RouterContextProvider>,
			);
			expect(Array.from(document.scripts)).toEqual([existing]);
			unmount();
			expect(existing).toBeInTheDocument();
		} finally {
			existing.remove();
		}
	},
);
test.each([undefined, '', '/asset.js'])(
	'only deduplicates inline content against scripts without src (src=%s)',
	(src) => {
		const existing = document.createElement('script');
		existing.textContent = 'void 0';
		if (src !== undefined) {
			existing.setAttribute('src', src);
		}
		document.head.appendChild(existing);
		const router = createRouter({
			routeTree: createRootRoute(),
			history: createMemoryHistory(),
		});
		try {
			const { unmount } = render(
				() => <RouterContextProvider router={router}>
					<Asset tag="script" children="void 0" />
				</RouterContextProvider>,
			);
			expect(document.scripts).toHaveLength(src === undefined ? 1 : 2);
			unmount();
			expect(Array.from(document.scripts)).toEqual([existing]);
		} finally {
			existing.remove();
		}
	},
);
