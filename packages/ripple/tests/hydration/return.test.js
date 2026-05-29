import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/return.js';
import * as ClientComponents from './compiled/client/return.js';

describe('hydration > function returns', () => {
	it('hydrates guard returns before TSRX output', async () => {
		await hydrateComponent(
			ServerComponents.GuardReturnRenders,
			ClientComponents.GuardReturnRenders,
		);
		expect(container.querySelector('.ready')?.textContent).toBe('ready');
	});

	it('hydrates null returns', async () => {
		await hydrateComponent(ServerComponents.GuardReturnNull, ClientComponents.GuardReturnNull);
		expect(container.textContent).toBe('');
	});

	it('hydrates string returns', async () => {
		await hydrateComponent(ServerComponents.StringReturn, ClientComponents.StringReturn);
		expect(container.textContent).toBe('hello');
	});
});
