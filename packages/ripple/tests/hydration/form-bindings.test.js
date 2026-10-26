import { describe, expect, it } from 'vitest';
import { flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/form-bindings.js';
import * as client from './compiled/client/form-bindings.js';

async function prepare(name, props) {
	const { body } = await render(() => server[name](props));
	container.innerHTML = body;
}

function model() {
	return JSON.parse(container.querySelector('output').textContent);
}

function checked_values() {
	return Array.from(container.querySelectorAll('input:checked'), (input) => input.value);
}

function selected_values() {
	return Array.from(container.querySelector('select').selectedOptions, (option) => option.value);
}

// jsdom has no DataTransfer. Keep FileList identity and instanceof behavior
// while mocking the file input's files property, as in the client binding tests.
function files(...names) {
	return Object.setPrototypeOf(
		names.map((name) => new File(['content'], name)),
		FileList.prototype,
	);
}

describe('form binding hydration', () => {
	for (const accessors of [false, true]) {
		describe(accessors ? 'getter/setter bindings' : 'tracked bindings', () => {
			it.each([false, true])('preserves checkbox toggles (server checked: %s)', async (seeded) => {
				const props = { initial: seeded, seeded, accessors };
				await prepare('Checkbox', props);
				const input = container.querySelector('input');
				input.focus();
				input.click();
				const unmount = hydrate(client.Checkbox, { target: container, props });
				try {
					flushSync();
					expect(container.querySelector('input')).toBe(input);
					expect(document.activeElement).toBe(input);
					expect(input.checked).toBe(!seeded);
					expect(model()).toBe(!seeded);
					input.click();
					flushSync();
					expect(model()).toBe(seeded);
					container.querySelector('button').click();
					flushSync();
					expect(input.checked).toBe(!seeded);
				} finally {
					unmount();
				}
			});

			it('keeps an early checkbox click from restoring the indeterminate model', async () => {
				const props = { accessors };
				await prepare('MixedCheckbox', props);
				const input = container.querySelector('input');
				input.click();
				const unmount = hydrate(client.MixedCheckbox, { target: container, props });
				try {
					flushSync();
					expect(model()).toEqual([true, false]);
					expect(input.indeterminate).toBe(false);
					container.querySelector('button').click();
					flushSync();
					expect(input.indeterminate).toBe(true);
					input.click();
					flushSync();
					expect(model()).toEqual([false, false]);
				} finally {
					unmount();
				}
			});

			it('adopts a live indeterminate state set before hydration', async () => {
				const props = { initial: false, accessors };
				await prepare('MixedCheckbox', props);
				const input = container.querySelector('input');
				input.indeterminate = true;
				const unmount = hydrate(client.MixedCheckbox, { target: container, props });
				try {
					flushSync();
					expect(input.indeterminate).toBe(true);
					expect(model()).toEqual([false, true]);
				} finally {
					unmount();
				}
			});

			it('applies all early checkbox group additions and removals across components', async () => {
				const props = { accessors };
				await prepare('CheckboxGroup', props);
				const inputs = container.querySelectorAll('input');
				for (const input of inputs) input.click();
				const unmount = hydrate(client.CheckboxGroup, { target: container, props });
				try {
					flushSync();
					expect(model()).toEqual(['b']);
					expect(checked_values()).toEqual(['b']);
					inputs[0].click();
					flushSync();
					expect(model()).toEqual(['b', 'a']);
					container.querySelector('button').click();
					flushSync();
					expect(checked_values()).toEqual(['a', 'c']);
				} finally {
					unmount();
				}
			});

			it.each(['a', 'c'])('preserves an early radio selection of %s', async (selected) => {
				const props = { accessors };
				await prepare('RadioGroup', props);
				container.querySelector(`input[value="${selected}"]`).click();
				const unmount = hydrate(client.RadioGroup, { target: container, props });
				try {
					flushSync();
					expect(model()).toBe(selected);
					expect(checked_values()).toEqual([selected]);
					container.querySelector('input[value="b"]').click();
					flushSync();
					expect(model()).toBe('b');
					container.querySelector(`input[value="${selected}"]`).click();
					flushSync();
					container.querySelector('button').click();
					flushSync();
					expect(checked_values()).toEqual(['b']);
				} finally {
					unmount();
				}
			});

			it.each([
				['Select', '3', 3],
				['SeededSelect', 'c', 'c'],
			])(
				'adopts early %s selections with their original value type',
				async (name, edited, expected) => {
					const props = { accessors };
					await prepare(name, props);
					const select = container.querySelector('select');
					select.value = edited;
					const unmount = hydrate(client[name], { target: container, props });
					try {
						flushSync();
						expect(model()).toBe(expected);
						expect(select.value).toBe(edited);
						select.selectedIndex = 0;
						select.dispatchEvent(new Event('change', { bubbles: true }));
						flushSync();
						expect(model()).toBe(name === 'Select' ? 0 : 'a');
						container.querySelector('button').click();
						flushSync();
						expect(select.value).toBe(name === 'Select' ? '2' : 'b');
					} finally {
						unmount();
					}
				},
			);

			it.each([[[]], [['b']]])(
				'adopts multiple selections %j, including clearing defaults',
				async (selected) => {
					const props = { accessors };
					await prepare('MultiSelect', props);
					const select = container.querySelector('select');
					for (const option of select.options) option.selected = selected.includes(option.value);
					const unmount = hydrate(client.MultiSelect, { target: container, props });
					try {
						flushSync();
						expect(model()).toEqual(selected);
						expect(selected_values()).toEqual(selected);
						select.options[0].selected = true;
						select.dispatchEvent(new Event('change', { bubbles: true }));
						flushSync();
						expect(model()).toEqual(['a', ...selected]);
						container.querySelector('button').click();
						flushSync();
						expect(selected_values()).toEqual(['a', 'c']);
					} finally {
						unmount();
					}
				},
			);

			it('adopts files selected before hydration, then supports changes and clearing', async () => {
				const props = { initial: files(), next: files(), accessors };
				await prepare('Files', props);
				const input = container.querySelector('input');
				const early = files('early.txt', 'second.txt');
				Object.defineProperty(input, 'files', { value: early, writable: true });
				const unmount = hydrate(client.Files, { target: container, props });
				try {
					flushSync();
					expect(input.files).toBe(early);
					expect(container.querySelector('output').textContent).toBe('early.txt,second.txt');
					input.files = files('later.txt');
					input.dispatchEvent(new Event('change', { bubbles: true }));
					flushSync();
					expect(container.querySelector('output').textContent).toBe('later.txt');
					container.querySelector('button').click();
					flushSync();
					expect(input.files).toBe(props.next);
					expect(container.querySelector('output').textContent).toBe('');
				} finally {
					unmount();
				}
			});
		});
	}

	it.each([
		['Checkbox', { initial: true }, true],
		['CheckboxGroup', { initial: ['b'] }, ['b']],
		['RadioGroup', { initial: 'c' }, 'c'],
		['MixedCheckbox', { initial: true }, [false, true]],
		['Select', { initial: 3 }, 3],
		['Select', { initial: 3, size: 3 }, 3],
		['SeededSelect', { initial: 'a' }, 'a'],
		['MultiSelect', { initial: ['b'] }, ['b']],
	])(
		'%s initializes untouched controls from the model on hydration and mount',
		async (name, props, expected) => {
			await prepare(name, props);
			for (const attach of [hydrate, mount]) {
				const unmount = attach(client[name], { target: container, props });
				try {
					flushSync();
					expect(model()).toEqual(expected);
					if (name.includes('Select')) {
						expect(selected_values()).toEqual(
							(Array.isArray(expected) ? expected : [expected]).map(String),
						);
					} else if (name.includes('Group')) {
						expect(checked_values()).toEqual(Array.isArray(expected) ? expected : [expected]);
					} else if (name === 'Checkbox') {
						expect(container.querySelector('input').checked).toBe(expected);
					} else {
						expect(container.querySelector('input').indeterminate).toBe(true);
					}
				} finally {
					unmount();
				}
			}
		},
	);

	it('keeps a cleared single selection instead of choosing the fallback option', async () => {
		await prepare('SeededSelect', {});
		const select = container.querySelector('select');
		select.selectedIndex = -1;
		const unmount = hydrate(client.SeededSelect, { target: container, props: {} });
		try {
			flushSync();
			expect(select.selectedIndex).toBe(-1);
			expect(model()).toBeNull();
		} finally {
			unmount();
		}
	});

	it('does not replace an untouched file model with the empty DOM FileList', async () => {
		await prepare('Files', {});
		const unmount = hydrate(client.Files, { target: container, props: {} });
		try {
			flushSync();
			expect(container.querySelector('output').textContent).toBe('none');
		} finally {
			unmount();
		}
	});
});
