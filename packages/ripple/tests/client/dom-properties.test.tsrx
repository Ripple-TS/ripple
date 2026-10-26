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

	it(
		'keeps a direct property authoritative when a conflicting spread changes or removes it',
		() => {
			function App() @{
				const attributes = track<{ open?: boolean }>({ open: false });
				const open = track(true);
				<>
					<button
						onClick={() => (attributes.value = { open: !attributes.value.open })}
					>{'Spread'}</button>
					<button onClick={() => (attributes.value = {})}>{'Remove'}</button>
					<button onClick={() => (open.value = !open.value)}>{'Direct'}</button>
					<dialog {...attributes.value} open={open.value} />
				</>
			}

			render(App);
			const dialog = container.querySelector('dialog');
			const [spread, remove, direct] = container.querySelectorAll('button');
			expect(dialog.open).toBe(true);

			spread.click();
			flushSync();
			expect(dialog.open).toBe(true);
			spread.click();
			flushSync();
			expect(dialog.open).toBe(true);
			remove.click();
			flushSync();
			expect(dialog.open).toBe(true);

			direct.click();
			flushSync();
			expect(dialog.open).toBe(false);
			spread.click();
			flushSync();
			expect(dialog.open).toBe(false);
		},
	);

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

	it('keeps a camelCase property binding authoritative over its spread attribute alias', () => {
		function App() @{
			const attributes = track<{ readonly?: boolean }>({ readonly: true });
			const read_only = track(true);
			<>
				<button onClick={() => (attributes.value = {})}>{'Remove'}</button>
				<input {...attributes.value} readOnly={read_only.value} />
			</>
		}

		render(App);
		const input = container.querySelector('input');
		expect(input.readOnly).toBe(true);
		container.querySelector('button').click();
		flushSync();
		expect(input.readOnly).toBe(true);
	});

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
