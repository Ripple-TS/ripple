import { describe, expect, it, vi } from 'vitest';
import { flushSync, track } from 'ripple';

describe('DOM property updates', () => {
	it.each([false, true])(
		'preserves an externally opened dialog when a spread changes (managed: %s)',
		(managed) => {
			function App() @{
				const version = track(0);
				const open = track(false);
				<dialog {...{ class: 'v' + version.value }} open={managed ? open.value : undefined}>
					<button onClick={() => version.value++}>{'Update'}</button>
				</dialog>
			}

			render(App);
			const dialog = container.querySelector('dialog');
			expect(dialog.open).toBe(false);

			// jsdom does not implement showModal(), which sets this property in browsers.
			dialog.open = true;
			dialog.querySelector('button').click();
			flushSync();

			expect(dialog.className).toBe('v1');
			expect(dialog.open).toBe(true);
		},
	);

	it('applies the initial direct property after a conflicting spread property', () => {
		function App() @{
			const open = track(true);
			<dialog {...{ open: false }} open={open.value} />
		}

		render(App);
		expect(container.querySelector('dialog').open).toBe(true);
	});

	it(
		'preserves external changes on ordinary attribute updates and applies new property values',
		() => {
			function App() @{
				const version = track(0);
				const open = track(true);
				<>
					<button onClick={() => version.value++}>{'Update'}</button>
					<button onClick={() => (open.value = !open.value)}>{'Toggle'}</button>
					<details class={'v' + version.value} open={open.value} />
				</>
			}

			render(App);
			const details = container.querySelector('details');
			const [update, toggle] = container.querySelectorAll('button');
			expect(details.open).toBe(true);

			details.open = false;
			update.click();
			flushSync();
			expect(details.className).toBe('v1');
			expect(details.open).toBe(false);

			toggle.click();
			flushSync();
			expect(details.open).toBe(false);

			toggle.click();
			flushSync();
			expect(details.open).toBe(true);

			toggle.click();
			flushSync();
			expect(details.open).toBe(false);
		},
	);

	it('assigns an initial undefined property once and applies transitions back to undefined', () => {
		const set_open = vi.spyOn(HTMLDialogElement.prototype, 'open', 'set');
		try {
			function App() @{
				const version = track(0);
				const open = track<boolean | undefined>(undefined);
				<>
					<button onClick={() => version.value++}>{'Update'}</button>
					<button onClick={() => (open.value = open.value ? undefined : true)}>{'Toggle'}</button>
					<dialog {...{ class: 'v' + version.value }} open={open.value} />
				</>
			}

			render(App);
			const dialog = container.querySelector('dialog');
			const [update, toggle] = container.querySelectorAll('button');
			expect(set_open.mock.calls).toEqual([[undefined]]);

			update.click();
			flushSync();
			expect(set_open.mock.calls).toEqual([[undefined]]);

			toggle.click();
			flushSync();
			expect(dialog.open).toBe(true);

			toggle.click();
			flushSync();
			expect(dialog.open).toBe(false);
			expect(set_open.mock.calls).toEqual([[undefined], [true], [undefined]]);
		} finally {
			set_open.mockRestore();
		}
	});
});
