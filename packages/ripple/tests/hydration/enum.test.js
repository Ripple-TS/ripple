import { describe, expect, it } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';
import * as ServerComponents from './compiled/server/enum.js';
import * as ClientComponents from './compiled/client/enum.js';

describe('hydration > runtime enums', () => {
	it('uses the same numeric, string and component-local values during SSR and hydration', async () => {
		await hydrateComponent(ServerComponents.EnumValues, ClientComponents.EnumValues);
		expect(container.innerHTML).toBeHtml(
			'<span class="enum-number">2</span><span class="enum-string">ready</span><span class="enum-local">6</span>',
		);
	});
});
