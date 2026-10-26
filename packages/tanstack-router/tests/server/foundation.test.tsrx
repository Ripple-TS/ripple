import { describe, expect, it } from 'vitest';
import { render } from 'ripple/server';
import { Probe } from '../fixtures/consumer/server.js';
import {
	createMemoryHistory,
	defaultParseSearch,
	defaultStringifySearch,
	isRedirect,
	redirect,
} from '@ripple-ts/tanstack-router';

describe('server package imports', () => {
	it('renders a source dependency without browser globals', async () => {
		expect(typeof window).toBe('undefined');
		const result = await render(Probe);
		expect(result.topLevelError).toBeFalsy();
		expect(result.body).toContain('data-path="/foundation"');
		expect(result.body).toContain('Clicks:');
	});

	it('exposes the pinned core helpers and history implementation', () => {
		const history = createMemoryHistory({ initialEntries: ['/first'] });
		history.push('/second');
		expect(history.location.pathname).toBe('/second');
		history.destroy();
		const search = { page: 2, filters: ['open'] };
		expect(defaultParseSearch(defaultStringifySearch(search))).toEqual(search);
		expect(isRedirect(redirect({ href: '/login' }))).toBe(true);
	});
});
