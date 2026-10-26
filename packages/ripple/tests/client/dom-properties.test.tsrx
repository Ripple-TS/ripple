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

	it('keeps an explicit binding authoritative over a spread HTML alias', () => {
		function App() @{
			const attributes = track({
				for: 'spread-for',
				maxlength: 2,
				class: 'spread',
				value: 'spread-value',
				'accept-charset': 'iso-8859-1',
				'http-equiv': 'content-type',
				checked: '',
				id: 'first',
			});
			const label_for = track('bound-for');
			const max = track(9);
			const class_name = track('bound');
			const initial = track('bound-value');
			const charset = track('utf-8');
			const equiv = track('refresh');
			const checked = track(true);
			<>
				<button
					id="spread"
					onClick={() => (attributes.value = {
						for: 'next-for',
						'max-length': 4,
						class: 'next',
						value: 'next-value',
						'accept-charset': 'us-ascii',
						'http-equiv': 'expires',
						id: 'second',
					})}
				>{'Spread'}</button>
				<button id="clear" onClick={() => (attributes.value = { id: 'cleared' })}>{'Clear'}</button>
				<label {...attributes.value} htmlFor={label_for.value} />
				<input {...attributes.value} maxLength={max.value} defaultValue={initial.value} />
				<input type="checkbox" {...attributes.value} defaultChecked={checked.value} />
				<div {...attributes.value} className={class_name.value} />
				<form {...attributes.value} acceptCharset={charset.value} />
				<meta {...attributes.value} httpEquiv={equiv.value} />
			</>
		}

		render(App);
		const label = container.querySelector('label');
		const [text, box] = container.querySelectorAll('input');
		const div = container.querySelector('div');
		const form = container.querySelector('form');
		const meta = container.querySelector('meta');

		expect(label.htmlFor).toBe('bound-for');
		expect(text.maxLength).toBe(9);
		expect(text.defaultValue).toBe('bound-value');
		expect(box.defaultChecked).toBe(true);
		expect(div.className).toBe('bound');
		expect(form.acceptCharset).toBe('utf-8');
		expect(meta.httpEquiv).toBe('refresh');
		expect(div.id).toBe('first');

		container.querySelector('#spread').click();
		flushSync();

		expect(label.htmlFor).toBe('bound-for');
		expect(text.maxLength).toBe(9);
		expect(text.defaultValue).toBe('bound-value');
		expect(box.defaultChecked).toBe(true);
		expect(div.className).toBe('bound');
		expect(form.acceptCharset).toBe('utf-8');
		expect(meta.httpEquiv).toBe('refresh');
		expect(div.id).toBe('second');

		container.querySelector('#clear').click();
		flushSync();

		expect(label.htmlFor).toBe('bound-for');
		expect(text.maxLength).toBe(9);
		expect(text.defaultValue).toBe('bound-value');
		expect(box.defaultChecked).toBe(true);
		expect(div.className).toBe('bound');
		expect(form.acceptCharset).toBe('utf-8');
		expect(meta.httpEquiv).toBe('refresh');
		expect(div.id).toBe('cleared');
	});
});
