import { describe, expect, it } from 'vitest';
import { flushSync, track } from 'ripple';

describe('lazy array destructuring', () => {
	it('updates unknown lazy array bindings through tracked values', () => {
		function Child({ tr: &[count, tr] }) @{
			<button
				onClick={() => {
					count++;
					tr[0]++;
				}}
			>{count}</button>
		}

		function App() @{
			let tracked = track(0);
			<Child tr={tracked} />
		}

		render(App);

		const button = container.querySelector('button');
		expect(button?.textContent).toBe('0');

		flushSync(() => {
			button?.click();
		});

		expect(button?.textContent).toBe('2');
	});
});
