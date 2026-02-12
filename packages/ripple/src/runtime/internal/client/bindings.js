/** @import { Tracked } from '#client' */

/**
@typedef {(v: unknown) => void} SetFunction
@typedef {() => any} BindGetter
@typedef {(v: unknown) => void} BindSetter
@typedef {{getter: BindGetter, setter: BindSetter}} BindGetSet
*/

import { effect, render } from './blocks.js';
import { on } from './events.js';
import { get, set } from './runtime.js';
import { is_array, is_tracked_object } from './utils.js';

/**
 * @param {string} name
 * @returns {TypeError}
 */
function not_tracked_type_error(name) {
	return new TypeError(`${name} argument is not a tracked object`);
}

/**
 * @param {string} name
 * @returns {TypeError}
 */
function not_set_function_type_error(name) {
	return new TypeError(
		`${name} second argument must be a set function when first argument is a get function`,
	);
}

/**
 * @param {string} name
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {BindGetSet}
 */
function get_bind_get_set(name, maybe_tracked, set_func) {
	if (typeof maybe_tracked === 'function') {
		if (typeof set_func !== 'function') {
			throw not_set_function_type_error(name);
		}

		return {
			getter: /** @type {BindGetter} */ (maybe_tracked),
			setter: set_func,
		};
	} else {
		if (!is_tracked_object(maybe_tracked)) {
			throw not_tracked_type_error(name);
		}

		return {
			getter: () => get(/** @type {Tracked} */ (maybe_tracked)),
			setter: (value) => set(/** @type {Tracked} */ (maybe_tracked), value),
		};
	}
}

/**
 * Resize observer singleton.
 * One listener per element only!
 * https://groups.google.com/a/chromium.org/g/blink-dev/c/z6ienONUb5A/m/F5-VcUZtBAAJ
 */
class ResizeObserverSingleton {
	/** */
	#listeners = new WeakMap();

	/** @type {ResizeObserver | undefined} */
	#observer;

	/** @type {ResizeObserverOptions} */
	#options;

	/** @static */
	static entries = new WeakMap();

	/** @param {ResizeObserverOptions} options */
	constructor(options) {
		this.#options = options;
	}

	/**
	 * @param {Element} element
	 * @param {(entry: ResizeObserverEntry) => any} listener
	 */
	observe(element, listener) {
		var listeners = this.#listeners.get(element) || new Set();
		listeners.add(listener);

		this.#listeners.set(element, listeners);
		this.#getObserver().observe(element, this.#options);

		return () => {
			var listeners = this.#listeners.get(element);
			listeners.delete(listener);

			if (listeners.size === 0) {
				this.#listeners.delete(element);
				/** @type {ResizeObserver} */ (this.#observer).unobserve(element);
			}
		};
	}

	#getObserver() {
		return (
			this.#observer ??
			(this.#observer = new ResizeObserver(
				/** @param {any} entries */ (entries) => {
					for (var entry of entries) {
						ResizeObserverSingleton.entries.set(entry.target, entry);
						for (var listener of this.#listeners.get(entry.target) || []) {
							listener(entry);
						}
					}
				},
			))
		);
	}
}

var resize_observer_content_box = /* @__PURE__ */ new ResizeObserverSingleton({
	box: 'content-box',
});

var resize_observer_border_box = /* @__PURE__ */ new ResizeObserverSingleton({
	box: 'border-box',
});

var resize_observer_device_pixel_content_box = /* @__PURE__ */ new ResizeObserverSingleton({
	box: 'device-pixel-content-box',
});

/**
 * @param {string} value
 */
function to_number(value) {
	return value === '' ? null : +value;
}

/**
 * @param {HTMLInputElement} input
 */
function is_numberlike_input(input) {
	var type = input.type;
	return type === 'number' || type === 'range';
}

/** @param {HTMLOptionElement} option */
function get_option_value(option) {
	return option.value;
}

/**
 * Selects the correct option(s) (depending on whether this is a multiple select)
 * @template V
 * @param {HTMLSelectElement} select
 * @param {V} value
 * @param {boolean} mounting
 */
function select_option(select, value, mounting = false) {
	if (select.multiple) {
		// If value is null or undefined, keep the selection as is
		if (value == undefined) {
			return;
		}

		// If not an array, warn and keep the selection as is
		if (!is_array(value)) {
			// TODO
		}

		// Otherwise, update the selection
		for (var option of select.options) {
			option.selected = /** @type {string[]} */ (value).includes(get_option_value(option));
		}

		return;
	}

	for (option of select.options) {
		var option_value = get_option_value(option);
		if (option_value === value) {
			option.selected = true;
			return;
		}
	}

	if (!mounting || value !== undefined) {
		select.selectedIndex = -1; // no option should be selected
	}
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLInputElement | HTMLSelectElement) => void}
 */
export function bindValue(maybe_tracked, set_func = undefined) {
	var { getter, setter } = get_bind_get_set('bindValue()', maybe_tracked, set_func);

	return (node) => {
		var clear_event;

		if (node.tagName === 'SELECT') {
			var select = /** @type {HTMLSelectElement} */ (node);
			var mounting = true;

			clear_event = on(select, 'change', async () => {
				var query = ':checked';
				/** @type {unknown} */
				var value;

				if (select.multiple) {
					value = [].map.call(select.querySelectorAll(query), get_option_value);
				} else {
					/** @type {HTMLOptionElement | null} */
					var selected_option =
						/** @type {HTMLOptionElement | null} */ (select.querySelector(query)) ??
						// will fall back to first non-disabled option if no option is selected
						/** @type {HTMLOptionElement | null} */ (
							select.querySelector('option:not([disabled])')
						);
					value = selected_option && get_option_value(selected_option);
				}

				setter(value);
			});

			effect(() => {
				var value = getter();
				select_option(select, value, mounting);

				// Mounting and value undefined -> take selection from dom
				if (mounting && value === undefined) {
					/** @type {HTMLOptionElement | null} */
					var selected_option = /** @type {HTMLOptionElement | null} */ (
						select.querySelector(':checked')
					);
					if (selected_option !== null) {
						value = get_option_value(selected_option);
						setter(value);
					}
				}

				mounting = false;
			});
		} else {
			var input = /** @type {HTMLInputElement} */ (node);

			clear_event = on(input, 'input', () => {
				/** @type {any} */
				var value = input.value;
				value = is_numberlike_input(input) ? to_number(value) : value;
				setter(value);
				const getter_value = getter();

				// Check the getter to see if it's different from the input.value
				// The setter may have decided not to update its track value or update it to something else
				// We treat the getter as the source of truth since we cannot verify the change otherwise
				// If getter() !== input.value, we set the input value right away
				// the `render` block may be scheduled only if the tracked value has changed
				// but it will not do anything if getter() === input.value
				// The result is: the `render` block will ALWAYS exit early if the microtask
				// came from this event handler
				if (value !== getter_value) {
					var start = input.selectionStart;
					var end = input.selectionEnd;

					input.value = getter_value ?? '';

					if (end !== null && start !== null) {
						end = Math.min(end, input.value.length);
						start = Math.min(start, end);
						input.selectionStart = start;
						input.selectionEnd = end;
					}
				}
			});

			render(() => {
				var value = getter();

				if (is_numberlike_input(input) && value === to_number(input.value)) {
					return;
				}

				if (input.type === 'date' && !value && !input.value) {
					return;
				}

				if (value !== input.value) {
					// this can only get here if the tracked value was changed directly,
					// and not via the input event
					input.value = value ?? '';
				}
			});

			return clear_event;
		}
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLInputElement) => void}
 */
export function bindChecked(maybe_tracked, set_func = undefined) {
	var { getter, setter } = get_bind_get_set('bindChecked()', maybe_tracked, set_func);

	return (input) => {
		var clear_event = on(input, 'change', () => {
			setter(input.checked);
		});

		effect(() => {
			var value = getter();
			input.checked = Boolean(value);
		});

		return clear_event;
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLInputElement) => void}
 */
export function bindIndeterminate(maybe_tracked, set_func = undefined) {
	var { getter, setter } = get_bind_get_set('bindIndeterminate()', maybe_tracked, set_func);

	return (input) => {
		var clear_event = on(input, 'change', () => {
			setter(input.indeterminate);
		});

		effect(() => {
			var value = getter();
			input.indeterminate = Boolean(value);
		});

		return clear_event;
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLInputElement) => void}
 */
export function bindGroup(maybe_tracked, set_func = undefined) {
	var { getter, setter } = get_bind_get_set('bindGroup()', maybe_tracked, set_func);

	return (input) => {
		var is_checkbox = input.getAttribute('type') === 'checkbox';

		var clear_event = on(input, 'change', () => {
			var value = input.value;
			var result;

			if (is_checkbox) {
				/** @type {Array<any>} */
				var list = getter() || [];

				if (input.checked) {
					if (!list.includes(value)) {
						result = [...list, value];
					} else {
						result = list;
					}
				} else {
					result = list.filter((v) => v !== value);
				}
			} else {
				result = input.value;
			}

			setter(result);
		});

		effect(() => {
			var value = getter();
			if (is_checkbox) {
				value = value || [];
				input.checked = value.includes(input.value);
			} else {
				input.checked = value === input.value;
			}
		});

		return clear_event;
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {'clientWidth' | 'clientHeight' | 'offsetWidth' | 'offsetHeight'} type
 * @param {SetFunction | undefined} set_func
 */
function bind_element_size(maybe_tracked, type, set_func = undefined) {
	var { setter } = get_bind_get_set(
		`bind${type.charAt(0).toUpperCase() + type.slice(1)}()`,
		maybe_tracked,
		set_func,
	);

	return (/** @type {HTMLElement} */ element) => {
		var unsubscribe = resize_observer_border_box.observe(element, () => setter(element[type]));

		effect(() => {
			setter(element[type]);
			return unsubscribe;
		});
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindClientWidth(maybe_tracked, set_func = undefined) {
	return bind_element_size(maybe_tracked, 'clientWidth', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindClientHeight(maybe_tracked, set_func = undefined) {
	return bind_element_size(maybe_tracked, 'clientHeight', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindOffsetWidth(maybe_tracked, set_func = undefined) {
	return bind_element_size(maybe_tracked, 'offsetWidth', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindOffsetHeight(maybe_tracked, set_func = undefined) {
	return bind_element_size(maybe_tracked, 'offsetHeight', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {'contentRect' | 'contentBoxSize' | 'borderBoxSize' | 'devicePixelContentBoxSize'} type
 * @param {SetFunction | undefined} set_func
 */
function bind_element_rect(maybe_tracked, type, set_func = undefined) {
	var { setter } = get_bind_get_set(
		`bind${type.charAt(0).toUpperCase() + type.slice(1)}()`,
		maybe_tracked,
		set_func,
	);

	var observer =
		type === 'contentRect' || type === 'contentBoxSize'
			? resize_observer_content_box
			: type === 'borderBoxSize'
				? resize_observer_border_box
				: resize_observer_device_pixel_content_box;

	return (/** @type {HTMLElement} */ element) => {
		var unsubscribe = observer.observe(
			element,
			/** @param {any} entry */ (entry) => setter(entry[type]),
		);

		effect(() => unsubscribe);
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindContentRect(maybe_tracked, set_func = undefined) {
	return bind_element_rect(maybe_tracked, 'contentRect', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindContentBoxSize(maybe_tracked, set_func = undefined) {
	return bind_element_rect(maybe_tracked, 'contentBoxSize', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindBorderBoxSize(maybe_tracked, set_func = undefined) {
	return bind_element_rect(maybe_tracked, 'borderBoxSize', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindDevicePixelContentBoxSize(maybe_tracked, set_func = undefined) {
	return bind_element_rect(maybe_tracked, 'devicePixelContentBoxSize', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {'innerHTML' | 'innerText' | 'textContent'} property
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bind_content_editable(maybe_tracked, property, set_func = undefined) {
	var { getter, setter } = get_bind_get_set(
		`bind${property.charAt(0).toUpperCase() + property.slice(1)}()`,
		maybe_tracked,
		set_func,
	);

	return (element) => {
		var clear_event = on(element, 'input', () => {
			setter(element[property]);
		});

		render(() => {
			var value = getter();
			if (element[property] !== value) {
				if (value == null) {
					var non_null_value = element[property];
					setter(non_null_value);
				} else {
					element[property] = value + '';
				}
			}
		});

		return clear_event;
	};
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindInnerHTML(maybe_tracked, set_func = undefined) {
	return bind_content_editable(maybe_tracked, 'innerHTML', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindInnerText(maybe_tracked, set_func = undefined) {
	return bind_content_editable(maybe_tracked, 'innerText', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindTextContent(maybe_tracked, set_func = undefined) {
	return bind_content_editable(maybe_tracked, 'textContent', set_func);
}

/**
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLInputElement) => void}
 */
export function bindFiles(maybe_tracked, set_func = undefined) {
	var { getter, setter } = get_bind_get_set('bindFiles()', maybe_tracked, set_func);

	return (input) => {
		var clear_event = on(input, 'change', () => {
			setter(input.files);
		});

		effect(() => {
			var value = getter();

			if (value !== input.files && value instanceof FileList) {
				input.files = value;
			}
		});

		return clear_event;
	};
}

/**
 * Syntactic sugar for binding a HTMLElement with {ref fn}
 * @param {unknown} maybe_tracked
 * @param {SetFunction | undefined} set_func
 * @returns {(node: HTMLElement) => void}
 */
export function bindNode(maybe_tracked, set_func = undefined) {
	var { setter } = get_bind_get_set('bindNode()', maybe_tracked, set_func);

	/** @param {HTMLElement} node */
	return (node) => {
		setter(node);
	};
}
