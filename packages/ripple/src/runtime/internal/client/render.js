/** @import { Block } from '#client' */

import { hydrating } from './hydration.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import { TEXT_NODE } from '../../../constants.js';
import { class_name } from '../../../utils/class-name.js';

/**
 * Sets the text of an element whose only child is that text. The template
 * leaves such an element empty, so the first write creates the text node and
 * later writes update it in place; server-rendered text is adopted as is.
 * The element has a text node exactly when the value last written did not
 * read as empty (an empty write drops the node again), so `prev`, the value
 * the render block wrote before, says whether one exists without a DOM read.
 * @param {Element} element
 * @param {any} value
 * @param {any} prev the value of the previous write (`''` before the first)
 * @returns {void}
 */
export function set_text_content(element, value, prev) {
	var str = value == null ? '' : value + '';
	if (HYDRATION && hydrating) {
		var text = element.firstChild;
		if (text === null) {
			if (str !== '') {
				element.textContent = str;
			}
		} else if (text.nodeType !== TEXT_NODE || str === '') {
			element.textContent = str;
		} else if (text.nodeValue !== str) {
			text.nodeValue = str;
		}
	} else if (prev == null || prev === '') {
		if (str !== '') {
			element.textContent = str;
		}
	} else if (str === '') {
		element.textContent = '';
	} else {
		/** @type {Text} */ (element.firstChild).nodeValue = str;
	}
}

/**
 * @param {Text} text
 * @param {any} value
 * @returns {void}
 */
export function set_text(text, value) {
	var str = value == null ? '' : value + '';
	// The compiled render block compares against the value it last wrote, so
	// nothing is cached on the node. Only server-rendered text can already
	// hold the value; a fresh template text node never does.
	if (HYDRATION && hydrating && text.nodeValue === str) {
		return;
	}
	text.nodeValue = str;
}

/**
 * Writes a class the compiler proved to be a string (or nullish). The
 * compiled render block compares against the class it last applied, so
 * nothing is cached on the element. Removing the attribute when the value is
 * only an empty string costs more than an empty className, so the class is
 * removed only for a nullish value; an element that has no class does not
 * receive an empty one either (the server omits an empty class attribute as
 * well).
 * @param {HTMLElement} dom
 * @param {string | null | undefined} value
 * @param {string} [hash]
 * @param {boolean} [is_html]
 * @returns {void}
 */
export function set_class(dom, value, hash, is_html = true) {
	/** @type {string | null} */
	var class_value;
	if (value == null) {
		class_value = hash === undefined ? null : hash;
	} else {
		class_value = hash ? (value === '' ? hash : value + ' ' + hash) : value;
	}

	if (class_value === null) {
		dom.removeAttribute('class');
	} else if (is_html) {
		if (class_value !== '' || dom.className !== '') {
			dom.className = class_value;
		}
	} else if (class_value !== '' || dom.getAttribute('class')) {
		dom.setAttribute('class', class_value);
	}
}

/**
 * `set_class` for a value of any shape: arrays, objects and numbers compose
 * as clsx does. Only a bundle with such a class expression carries the joiner.
 * @param {HTMLElement} dom
 * @param {any} value
 * @param {string} [hash]
 * @param {boolean} [is_html]
 * @returns {void}
 */
export function set_class_value(dom, value, hash, is_html = true) {
	set_class(
		dom,
		value == null || typeof value === 'string' ? value : class_name(value),
		hash,
		is_html,
	);
}

/**
 * @param {HTMLInputElement | HTMLProgressElement | HTMLOptionElement} element
 * @param {any} value
 * @returns {void}
 */
export function set_value(element, value) {
	var attributes = (element.__attributes ??= {});

	if (element.nodeName === 'OPTION') {
		/** @type {HTMLOptionElement & { __value?: any }} */ (element).__value = value;
	}

	if (
		attributes.value ===
			(attributes.value =
				// treat null and undefined the same for the initial value
				value ?? undefined) ||
		// `progress` elements always need their value set when it's `0`
		(element.value === value && (value !== 0 || element.nodeName !== 'PROGRESS'))
	) {
		return;
	}

	element.value = value ?? '';
}

/**
 * @param {HTMLInputElement} element
 * @param {boolean} checked
 * @returns {void}
 */
export function set_checked(element, checked) {
	// Compared against the element itself rather than a record of the last
	// write: no expando per checkbox, and a box the user just toggled to the
	// value being set needs no write at all.
	if (element.checked !== (checked = !!checked)) {
		element.checked = checked;
	}
}

/**
 * @param {HTMLOptionElement} element
 * @param {boolean} selected
 * @returns {void}
 */
export function set_selected(element, selected) {
	if (selected) {
		// The selected option could've changed via user selection, and
		// setting the value without this check would set it back.
		if (!element.hasAttribute('selected')) {
			element.setAttribute('selected', '');
		}
	} else {
		element.removeAttribute('selected');
	}
}
