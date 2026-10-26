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

	it(
		'preserves a bound defaultValue while a spread updates the value attribute or live value',
		() => {
			function App() @{
				const attributes = track<{ value?: string | number }>({ value: 'spread' });
				const default_value = track('default');
				<>
					<button onClick={() => (attributes.value = { value: 'changed' })}>{'Attribute'}</button>
					<button onClick={() => (attributes.value = { value: 42 })}>{'Property'}</button>
					<button onClick={() => (attributes.value = {})}>{'Remove'}</button>
					<input {...attributes.value} defaultValue={default_value.value} />
				</>
			}

			render(App);
			const input = container.querySelector('input');
			const [attribute, property, remove] = container.querySelectorAll('button');
			expect(input.defaultValue).toBe('default');
			input.value = 'edited';

			attribute.click();
			flushSync();
			expect(input.defaultValue).toBe('default');
			expect(input.value).toBe('edited');

			property.click();
			flushSync();
			expect(input.defaultValue).toBe('default');
			expect(input.value).toBe('42');

			remove.click();
			flushSync();
			expect(input.defaultValue).toBe('default');
			expect(input.value).toBe('42');
		},
	);

	it('preserves a bound defaultChecked while a spread controls the live checked state', () => {
		function App() @{
			const attributes = track<{ checked?: boolean | string }>({ checked: false });
			const default_checked = track(true);
			<>
				<button onClick={() => (attributes.value = { checked: true })}>{'Check'}</button>
				<button onClick={() => (attributes.value = { checked: false })}>{'Uncheck'}</button>
				<button onClick={() => (attributes.value = { checked: '' })}>{'Attribute'}</button>
				<button onClick={() => (attributes.value = {})}>{'Remove'}</button>
				<input type="checkbox" {...attributes.value} defaultChecked={default_checked.value} />
			</>
		}

		render(App);
		const input = container.querySelector('input');
		const [check, uncheck, attribute, remove] = container.querySelectorAll('button');
		expect(input.defaultChecked).toBe(true);
		expect(input.checked).toBe(false);

		check.click();
		flushSync();
		expect(input.checked).toBe(true);
		uncheck.click();
		flushSync();
		expect(input.checked).toBe(false);

		attribute.click();
		flushSync();
		expect(input.defaultChecked).toBe(true);
		expect(input.checked).toBe(false);
		remove.click();
		flushSync();
		expect(input.defaultChecked).toBe(true);
		expect(input.checked).toBe(false);
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
