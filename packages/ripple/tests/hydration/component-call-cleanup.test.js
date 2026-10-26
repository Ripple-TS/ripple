import { describe, expect, it } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as ServerComponents from './compiled/server/component-call-cleanup.js';
import * as ClientComponents from './compiled/client/component-call-cleanup.js';

describe('hydration > component call DOM ownership', () => {
	it.each([
		{ native: false, initialShown: false },
		{ native: true, initialShown: false },
	])(
		'cleans up keyed children (native: $native, initially shown: $initialShown)',
		async (props) => {
			const { body, topLevelError } = await render(ServerComponents.ComponentCallCleanup, {
				props,
			});
			expect(topLevelError).toBeNull();
			container.innerHTML = body;
			const section = container.querySelector('section');
			const child = container.querySelector('.child');
			const toggle = container.querySelector('#toggle');
			const unmount = hydrate(ClientComponents.ComponentCallCleanup, { target: container, props });
			try {
				expect(container.querySelector('section')).toBe(section);
				expect(container.querySelector('.child')).toBe(child);
				expect(container.innerHTML).toBe(body);
				let shown = props.initialShown;
				for (let i = 0; i < 4; i++) {
					toggle.click();
					flushSync();
					shown = !shown;
					expect(container.querySelectorAll('.child').length).toBe(shown ? 1 : 0);
				}
			} finally {
				unmount();
			}
			expect(container.innerHTML).toBeHtml('');
		},
	);
});
