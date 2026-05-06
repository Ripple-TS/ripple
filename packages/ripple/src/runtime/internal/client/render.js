/** @import { Block } from '#client' */

import { branch, destroy_block, ref } from './blocks.js';
import { DESTROYED, REF_PROP } from './constants.js';
import { isRefProp as is_ref_prop } from '@tsrx/core/runtime/ref';
import { is_ripple_object } from './utils.js';
import {
	get_descriptors,
	get_own_property_symbols,
	get_prototype_of,
} from '@tsrx/core/runtime/language-helpers';
import { event } from './events.js';
import {
	getAttributeEventName as get_attribute_event_name,
	isEventAttribute as is_event_attribute,
} from '@tsrx/core';
import { get } from './runtime.js';
import { clsx } from 'clsx';
import { normalizeCssPropertyName as normalize_css_property_name } from '@tsrx/core';

/**
 * @param {Text} text
 * @param {any} value
 * @returns {void}
 */
export function set_text(text, value) {
	// For objects, we apply string coercion
	var str = value == null ? '' : typeof value === 'object' ? value + '' : value;
	if (str !== (text.__t ??= text.nodeValue)) {
		text.__t = str;
		text.nodeValue = str + '';
	}
}

/** @type {Map<string, string[]>} */
var setters_cache = new Map();

/**
 * @param {Element} element
 * @returns {string[]}
 */
function get_setters(element) {
	var setters = setters_cache.get(element.nodeName);
	if (setters) return setters;
	setters_cache.set(element.nodeName, (setters = []));

	var descriptors;
	var proto = element; // In the case of custom elements there might be setters on the instance
	var element_proto = Element.prototype;

	// Stop at Element, from there on there's only unnecessary setters we're not interested in
	// Do not use constructor.name here as that's unreliable in some browser environments
	while (element_proto !== proto) {
		descriptors = get_descriptors(proto);

		for (var key in descriptors) {
			if (descriptors[key].set) {
				setters.push(key);
			}
		}

		proto = get_prototype_of(proto);
	}

	return setters;
}

/**
 * @param {Element} element
 * @param {any} value
 * @param {Record<string, string> | undefined} prev
 * @returns {void}
 */
export function set_style(element, value, prev = {}) {
	if (value == null) {
		element.removeAttribute('style');
	} else if (typeof value !== 'string') {
		apply_styles(/** @type {HTMLElement} */ (element), value, prev);
	} else {
		// @ts-ignore
		element.style.cssText = value;
	}
}

/**
 * @param {Element} element
 * @param {string} attribute
 * @param {any} value
 * @returns {void}
 */
export function set_attribute(element, attribute, value) {
	if (value == null) {
		element.removeAttribute(attribute);
	} else if (typeof value !== 'string' && get_setters(element).includes(attribute)) {
		/** @type {any} */ (element)[attribute] = value;
	} else {
		element.setAttribute(attribute, value);
	}
}

/**
 * @param {HTMLElement} element
 * @param {Record<string, string | number>} new_styles
 * @param {Record<string, string>} prev
 */
function apply_styles(element, new_styles, prev) {
	const style = element.style;

	// Apply new styles
	for (const key in new_styles) {
		const css_prop = normalize_css_property_name(key);
		const value = String(new_styles[key]);

		if (!(key in prev) || prev[key] !== value) {
			style.setProperty(css_prop, value);
		}
	}

	// Remove properties that were in prev but not in new_styles
	for (const key in prev) {
		if (!(key in new_styles)) {
			const css_prop = normalize_css_property_name(key);
			style.removeProperty(css_prop);
		}
	}
}

/**
 * Helper function to set a single attribute
 * @param {Element} element
 * @param {string} key
 * @param {any} value
 * @param {Record<string, (() => void) | undefined>} remove_listeners
 * @param {Record<string | symbol, any>} prev
 */
function set_attribute_helper(element, key, value, remove_listeners, prev) {
	if (key === 'class') {
		const is_html = element.namespaceURI === 'http://www.w3.org/1999/xhtml';
		set_class(/** @type {HTMLElement} */ (element), value, undefined, is_html);
	} else if (key === 'style') {
		set_style(element, value, prev.style);
	} else if (key === '#class') {
		// Special case for static class when spreading props
		element.classList.add(value);
	} else if (typeof key === 'string' && is_event_attribute(key)) {
		// Handle event handlers in spread props
		if (remove_listeners[key]) {
			remove_listeners[key]();
			remove_listeners[key] = undefined;
		}
		if (value != null) {
			const event_name = get_attribute_event_name(key, value);
			remove_listeners[key] = event(event_name, element, value);
		}
	} else {
		set_attribute(element, key, value);
	}
}

/**
 * @param {HTMLElement} dom
 * @param {string} value
 * @param {string} [hash]
 * @param {boolean} [is_html]
 * @returns {void}
 */
export function set_class(dom, value, hash, is_html = true) {
	var class_value =
		value == null
			? (hash ?? '')
			: // Fast-path for string values
				typeof value === 'string'
				? value + (hash ? ' ' + hash : '')
				: clsx([value, hash]);

	// Removing the attribute when the value is only an empty string causes
	// performance issues vs simply making the className an empty string. So
	// we should only remove the class if the the value is nullish.
	if (value == null && hash === undefined) {
		dom.removeAttribute('class');
	} else {
		if (is_html) {
			dom.className = class_value;
		} else {
			dom.setAttribute('class', class_value);
		}
	}
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
	var attributes = (element.__attributes ??= {});

	if (
		attributes.checked ===
		(attributes.checked =
			// treat null and undefined the same for the initial value
			checked ?? undefined)
	) {
		return;
	}

	element.checked = checked;
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

/**
 * @param {Element} element
 * @param {() => Record<string | symbol, any>} fn
 * @returns {() => void}
 */
export function apply_element_spread(element, fn) {
	/** @type {Record<string | symbol, any>} */
	var prev = {};
	/** @type {Record<string | symbol, Block | undefined>} */
	var effects = {};
	/** @type {Record<string | symbol, (() => void) | undefined>} */
	var remove_listeners = {};

	/** @type {Record<symbol, any>} */
	var prev_symbols = {};
	/** @type {Record<string, any>} */
	var prev_ref_props = {};

	return () => {
		var next = fn();
		var current_symbols = /** @type {Record<symbol, any>} */ ({});

		for (const symbol of get_own_property_symbols(next)) {
			if (symbol.description !== REF_PROP) {
				continue;
			}
			const ref_fn = next[symbol];
			current_symbols[symbol] = ref_fn;

			if (
				!(symbol in prev_symbols) ||
				ref_fn !== prev_symbols[symbol] ||
				(effects[symbol] && (effects[symbol].f & DESTROYED) !== 0)
			) {
				if (effects[symbol] && (effects[symbol].f & DESTROYED) === 0) {
					destroy_block(effects[symbol]);
				}
				effects[symbol] = create_spread_ref_effect(element, ref_fn);
			}
		}

		for (const symbol of get_own_property_symbols(prev_symbols)) {
			if (!(symbol in current_symbols) && effects[symbol]) {
				destroy_block(/** @type {Block} */ (effects[symbol]));
				effects[symbol] = undefined;
			}
		}

		prev_symbols = current_symbols;

		/** @type {Record<string, any>} */
		var current_ref_props = {};

		for (const key in next) {
			const ref_fn = next[key];
			if (!is_ref_prop(ref_fn)) {
				continue;
			}

			current_ref_props[key] = ref_fn;

			if (
				!(key in prev_ref_props) ||
				ref_fn !== prev_ref_props[key] ||
				(effects[key] && (effects[key].f & DESTROYED) !== 0)
			) {
				if (effects[key] && (effects[key].f & DESTROYED) === 0) {
					destroy_block(effects[key]);
				}
				effects[key] = create_spread_ref_effect(element, ref_fn);
			}
		}

		for (const key in prev_ref_props) {
			if (!(key in current_ref_props) && effects[key]) {
				destroy_block(/** @type {Block} */ (effects[key]));
				effects[key] = undefined;
			}
		}

		prev_ref_props = current_ref_props;

		for (let key in remove_listeners) {
			// Remove event listeners that are no longer present
			if ((!(key in next) || is_ref_prop(next[key])) && remove_listeners[key]) {
				remove_listeners[key]();
				remove_listeners[key] = undefined;
			}
		}

		for (const key in prev) {
			if (!(key in next) || is_ref_prop(next[key])) {
				if (key === '#class') {
					continue;
				}
				set_attribute_helper(element, key, null, remove_listeners, prev);
			}
		}

		/** @type {typeof prev} */
		const current = {};
		for (const key in next) {
			if (key === 'children') continue;

			let value = next[key];
			if (is_ref_prop(value)) {
				continue;
			}
			if (is_ripple_object(value)) {
				value = get(value);
			}
			current[key] = value;

			if (key in prev && prev[key] === value && key !== '#class') {
				continue;
			}

			set_attribute_helper(element, key, value, remove_listeners, prev);
		}
		prev = current;
	};
}

/**
 * Keep spread refs in a branch block so ordinary spread updates do not destroy
 * and recreate the ref block before `apply_element_spread` can compare the
 * previous and current ref values.
 *
 * @param {Element} element
 * @param {any} ref_fn
 * @returns {Block}
 */
function create_spread_ref_effect(element, ref_fn) {
	return branch(() => {
		ref(element, () => ref_fn);
	});
}
