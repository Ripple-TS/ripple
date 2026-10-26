import { describe, expect, it } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';
import * as ServerComponents from './compiled/server/enum.js';
import * as ClientComponents from './compiled/client/enum.js';

describe('hydration > runtime enums', () => {
	it('preserves module, component and loop scopes during SSR and hydration', async () => {
		await hydrateComponent(ServerComponents.EnumValues, ClientComponents.EnumValues);
		expect(container.innerHTML).toBeHtml(
			'<span class="enum-number">2</span><span class="enum-string">ready</span><span class="enum-local">6</span><span class="enum-scopes">0,1</span>',
		);
	});
});
