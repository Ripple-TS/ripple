import { describe, it, expect } from 'vitest';
import { DEV } from 'esm-env';
import { flushSync } from 'ripple';
import {
	hydrateComponent,
	hydrateComponentWithRootBoundary,
	container,
} from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/try.js';
import * as ClientComponents from './compiled/client/try.js';

const TRACK_ASYNC_PUBLIC_ERROR_MESSAGE = 'An error occurred during async rendering';
const ROOT_TRACK_ASYNC_ERROR_MESSAGE = DEV ? 'root async failed' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;

describe('hydration > try blocks (async)', () => {
	it('hydrates async try with resolved server content', async () => {
		await hydrateComponent(
			ServerComponents.AsyncListInTryPending,
			ClientComponents.AsyncListInTryPending,
		);

		// Server resolves trackAsync fully, so the resolved list is in the SSR HTML
		const items = Array.from(container.querySelectorAll('.items li')).map((n) => n.textContent);
		expect(items).toEqual(['alpha', 'beta', 'gamma']);
		expect(container.querySelector('.loading')).toBeNull();
	});

	it('hydrates async try with leading sibling and resolved content', async () => {
		await hydrateComponent(
			ServerComponents.AsyncTryWithLeadingSibling,
			ClientComponents.AsyncTryWithLeadingSibling,
		);

		expect(container.querySelector('.before')?.textContent).toBe('before');
		expect(container.querySelector('.resolved')?.textContent).toBe('ready');
		expect(container.querySelector('.loading')).toBeNull();
	});
});

describe('hydration > root try boundary', () => {
	it('hydrates root catch content rendered by the server root boundary', async () => {
		/** @type {Element | null | undefined} */
		let ssrCatch;
		/** @type {Element | null | undefined} */
		let ssrError;
		/** @type {Element | null | undefined} */
		let ssrReset;

		await hydrateComponentWithRootBoundary(
			ServerComponents.RootThrows,
			ClientComponents.RootThrows,
			{ catch: ServerComponents.RootCatch, pending: ServerComponents.RootPending },
			{ catch: ClientComponents.RootCatch, pending: ClientComponents.RootPending },
			({ container, body }) => {
				expect(body).toContain('<!--[-->');
				expect(body).toContain('<!--]-->');

				ssrCatch = container.querySelector('.root-catch');
				ssrError = container.querySelector('.root-error');
				ssrReset = container.querySelector('.root-reset');
			},
		);

		expect(container.querySelector('.root-catch')).toBe(ssrCatch);
		expect(container.querySelector('.root-error')).toBe(ssrError);
		expect(container.querySelector('.root-reset')).toBe(ssrReset);
		expect(ssrError?.textContent).toBe('root exploded');
		expect(container.querySelector('.root-pending')).toBeNull();
		expect(container.textContent).not.toContain('should not render');
	});

	it('hydrates resolved root content from a server trackAsync result', async () => {
		/** @type {Element | null | undefined} */
		let ssrValue;

		await hydrateComponentWithRootBoundary(
			ServerComponents.RootAsyncDirect,
			ClientComponents.RootAsyncDirect,
			{ catch: ServerComponents.RootCatch, pending: ServerComponents.RootPending },
			{ catch: ClientComponents.RootCatch, pending: ClientComponents.RootPending },
			({ container, body }) => {
				expect(body).toContain('<!--[-->');
				expect(body).toContain('<!--]-->');
				expect(body).toContain('__tsrx_ta_');

				ssrValue = container.querySelector('.root-async-value');
			},
		);

		expect(container.querySelector('.root-async-value')).toBe(ssrValue);
		expect(ssrValue?.textContent).toBe('root async value');
		expect(container.querySelector('.root-pending')).toBeNull();
		expect(container.querySelector('.root-catch')).toBeNull();
		expect(container.querySelector('script[id^="__tsrx_ta_"]')).toBeNull();
	});

	it('hydrates root catch content from a rejected server trackAsync result', async () => {
		/** @type {Element | null | undefined} */
		let ssrCatch;
		/** @type {Element | null | undefined} */
		let ssrError;
		/** @type {Element | null | undefined} */
		let ssrReset;

		await hydrateComponentWithRootBoundary(
			ServerComponents.RootAsyncRejects,
			ClientComponents.RootAsyncRejects,
			{ catch: ServerComponents.RootCatch, pending: ServerComponents.RootPending },
			{ catch: ClientComponents.RootCatch, pending: ClientComponents.RootPending },
			({ container, body }) => {
				expect(body).toContain('<!--[-->');
				expect(body).toContain('<!--]-->');
				expect(body).toContain('__tsrx_ta_');

				ssrCatch = container.querySelector('.root-catch');
				ssrError = container.querySelector('.root-error');
				ssrReset = container.querySelector('.root-reset');
			},
		);

		expect(container.querySelector('.root-catch')).toBe(ssrCatch);
		expect(container.querySelector('.root-error')).toBe(ssrError);
		expect(container.querySelector('.root-reset')).toBe(ssrReset);
		expect(ssrError?.textContent).toBe(ROOT_TRACK_ASYNC_ERROR_MESSAGE);
		expect(container.querySelector('.root-async-value')).toBeNull();
		expect(container.querySelector('.root-pending')).toBeNull();
		expect(container.querySelector('script[id^="__tsrx_ta_"]')).toBeNull();
	});
});

describe.skip('streaming ssr > try blocks (async pending)', () => {
	it('hydrates async try/pending and retains pending fallback', async () => {
		await hydrateComponent(
			ServerComponents.AsyncListInTryPending,
			ClientComponents.AsyncListInTryPending,
		);

		expect(container.querySelector('.loading')?.textContent).toBe('loading...');

		await Promise.resolve();
		flushSync();

		expect(container.querySelector('.loading')?.textContent).toBe('loading...');
		expect(container.querySelectorAll('.items li').length).toBe(0);
	});

	it('hydrates async try/pending with leading sibling intact', async () => {
		await hydrateComponent(
			ServerComponents.AsyncTryWithLeadingSibling,
			ClientComponents.AsyncTryWithLeadingSibling,
		);

		await Promise.resolve();
		flushSync();

		expect(container.querySelector('.before')?.textContent).toBe('before');
		expect(container.querySelector('.loading')?.textContent).toBe('loading async content');
		expect(container.querySelector('.resolved')).toBeNull();
	});
});
