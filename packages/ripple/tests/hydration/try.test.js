import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/try.js';
import * as ClientComponents from './compiled/client/try.js';

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
