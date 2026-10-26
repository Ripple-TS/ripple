import { describe, expect, it } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';
import * as ServerComponents from './compiled/server/dom-properties.js';
import * as ClientComponents from './compiled/client/dom-properties.js';

describe('hydration > DOM property updates', () => {
	it.each([false, true])('preserves externally opened dialogs (managed: %s)', async (managed) => {
		const name = managed ? 'ManagedDialog' : 'Dialog';
		const { unmount } = await hydrateComponent(ServerComponents[name], ClientComponents[name]);
		try {
			const dialog = container.querySelector('dialog');
			const [update, toggle] = dialog.querySelectorAll('button');
			expect(dialog.open).toBe(false);

			dialog.open = true;
			update.click();
			flushSync();
			expect(dialog.className).toBe('v1');
			expect(dialog.open).toBe(true);

			toggle.click();
			flushSync();
			toggle.click();
			flushSync();
			expect(dialog.open).toBe(!managed);
		} finally {
			unmount();
		}
	});
});
