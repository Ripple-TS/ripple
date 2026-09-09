import { describe, expect, it } from 'vitest';
import { flushSync as flush_sync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import { TypedText as server_typed_text } from './compiled/server/typed-text.js';
import { TypedText as client_typed_text } from './compiled/client/typed-text.js';

describe('typed text hydration', () => {
	it('reuses server text nodes and updates imported primitive types', async () => {
		const { body } = await render(server_typed_text);
		expect(body).toContain('&lt;first>');
		container.innerHTML = body;
		const run = container.querySelector('.typed-run');
		const text = run.firstChild;
		const number = container.querySelector('.typed-number').firstChild;
		const tail = run.querySelector('span');
		const unmount = hydrate(client_typed_text, { target: container });
		try {
			expect(container.querySelector('.typed-run')).toBe(run);
			expect(run.firstChild).toBe(text);
			expect(run.textContent).toBe('value: <first>2tail');
			expect(container.querySelector('.typed-number').firstChild).toBe(number);
			container.querySelector('button').click();
			flush_sync();
			expect(run.textContent).toBe('value: &next3tail');
			expect(run.firstChild).toBe(text);
			expect(run.querySelector('span')).toBe(tail);
			expect(container.querySelector('.typed-number').firstChild).toBe(number);
			expect(number.textContent).toBe('3');
		} finally {
			unmount();
		}
	});
});
