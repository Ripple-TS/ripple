/** @import { Block } from '#client' */

import { block, branch, destroy_block, ref } from './blocks.js';
import { DESTROYED, REF_PROP, RENDER_BLOCK, TRACKED_OBJECT } from './constants.js';
import { isRefProp as is_ref_prop } from '@tsrx/core/runtime/ref';
import { is_ripple_object } from './utils.js';
import {
	get_descriptors,
	get_own_property_symbols,
	get_prototype_of,
} from '@tsrx/core/runtime/language-helpers';
import { event_listener } from './events.js';
import { get_attribute_event_name, is_event_attribute } from '@tsrx/core/runtime/events';
import { get } from './runtime.js';
import { normalize_css_property_name } from '@tsrx/core/runtime/html';
import { set_class_value } from './render.js';

/**
 * Dynamic attributes, styles and spreads. Apart from `render.js`, so that an
 * app whose attributes are all static or class/text/value writes never loads
 * the attribute tables these helpers consult.
 */

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
 * @param {Record<string, string | number | null | undefined> | undefined} prev
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
 * @param {Record<string, string | number | null | undefined>} new_styles
 * @param {Record<string, string | number | null | undefined>} prev
 */
function apply_styles(element, new_styles, prev) {
	const style = element.style;

	// Apply new styles
	for (const key in new_styles) {
		const css_prop = normalize_css_property_name(key);
		const raw_value = new_styles[key];
		const value = raw_value == null ? null : String(raw_value);

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
 * @param {SpreadState} state
 */
function set_attribute_helper(element, key, value, state) {
	if (key === 'class') {
		const is_html = element.namespaceURI === 'http://www.w3.org/1999/xhtml';
		set_class_value(/** @type {HTMLElement} */ (element), value, undefined, is_html);
	} else if (key === 'innerHTML') {
		element.removeAttribute('innerhtml');
		/** @type {HTMLElement} */ (element).innerHTML = value == null ? '' : String(value);
	} else if (key === 'style') {
		set_style(element, value, state.p.style);
	} else if (key === '#class') {
		// Special case for the scope classes of an element that spreads props:
		// one token per scope hash and applied theme.
		element.classList.add(...String(value).split(' ').filter(Boolean));
	} else if (is_event_attribute(key)) {
		// Handle event handlers in spread props
		var listeners = (state.l ??= {});
		if (listeners[key]) {
			listeners[key]();
			listeners[key] = undefined;
		}
		if (value != null) {
			const event_name = get_attribute_event_name(key, value);
			listeners[key] = event_listener(event_name, element, value);
		}
	} else {
		set_attribute(element, key, value);
	}
}

/**
 * The state of one element spread: the object and values it last applied,
 * and the listeners and ref effects it owns. `spread()` creates it on its
 * first call and is handed it back by every later one, so the compiled render
 * function keeps it in its own state object, and a `render_spread` block in
 * its block state.
 */
export class SpreadState {
	/** @param {Element} element */
	constructor(element) {
		this.e = element;
		/** @type {Record<string | symbol, any> | null} the object last applied, compared by identity */
		this.n = null;
		/** @type {Record<string, any>} the values last applied, by key */
		this.p = {};
		/**
		 * The object last applied was a tracked object, or held a tracked value:
		 * the same object can carry new values, so it is never skipped on identity.
		 */
		this.t = false;
		/** @type {Record<string, (() => void) | undefined> | null} listeners by event key */
		this.l = null;
		/** @type {Record<string | symbol, any> | null} the ref props last applied */
		this.r = null;
		/** @type {Record<string | symbol, Block | undefined> | null} the effects of those ref props */
		this.b = null;
	}
}

/** What a nullish or primitive spread value applies. */
var EMPTY = {};

/**
 * Applies a spread of attributes to an element, diffing against what the
 * previous call applied: attributes, `class`, `style` objects, event
 * listeners and ref props. An object identical to the last one applied is
 * skipped outright, unless that object was a tracked object or held a
 * tracked value (its contents can change while its identity does not).
 * Called from a compiled render function with the state it returned before
 * (`undefined` the first time), which the render function stores.
 * @param {Element} element
 * @param {any} next
 * @param {SpreadState | undefined} state
 * @returns {SpreadState}
 */
export function spread(element, next, state) {
	if (next == null || (typeof next !== 'object' && typeof next !== 'function')) {
		next = EMPTY;
	}
	if (state === undefined) {
		return apply_spread(new SpreadState(element), next);
	}
	if (state.n === next && !state.t) {
		return state;
	}

	var prev = state.p;
	/** @type {Record<string, any>} */
	var current = {};
	/** @type {Record<string | symbol, any> | null} */
	var refs = null;
	var tracked = TRACKED_OBJECT in next;
	var key;

	// A parent's ref prop travels through a spread on a symbol key.
	var symbols = get_own_property_symbols(next);
	for (var i = 0; i < symbols.length; i++) {
		var symbol = symbols[i];
		if (symbol.description === REF_PROP) {
			refs = apply_ref_prop(state, symbol, next[symbol], refs);
		}
	}

	// Listeners and attributes that are gone, or now carry a ref prop, are
	// removed before anything is applied: removing `class` drops the scope
	// classes too, which `#class` then adds back.
	var listeners = state.l;
	if (listeners !== null) {
		for (key in listeners) {
			if (listeners[key] !== undefined && (!(key in next) || is_ref_prop(next[key]))) {
				/** @type {() => void} */ (listeners[key])();
				listeners[key] = undefined;
			}
		}
	}
	for (key in prev) {
		if (key !== '#class' && (!(key in next) || is_ref_prop(next[key]))) {
			set_attribute_helper(element, key, null, state);
		}
	}

	for (key in next) {
		if (key === 'children') continue;

		var value = next[key];
		if (typeof value === 'function' && is_ref_prop(value)) {
			refs = apply_ref_prop(state, key, value, refs);
			continue;
		}
		if (is_ripple_object(value)) {
			value = get(value);
			tracked = true;
		}
		current[key] = value;

		// The scope classes are added after every run: a `class` write may
		// have replaced them.
		if (key !== '#class' && key in prev && prev[key] === value) {
			continue;
		}
		set_attribute_helper(element, key, value, state);
	}

	if (state.r !== null) {
		release_ref_props(state, refs);
	}
	state.r = refs;
	state.p = current;
	state.n = next;
	state.t = tracked;
	return state;
}

/**
 * The first run of a spread: nothing to remove or compare, every value is
 * applied.
 * @param {SpreadState} state
 * @param {Record<string | symbol, any>} next
 * @returns {SpreadState}
 */
function apply_spread(state, next) {
	var element = state.e;
	/** @type {Record<string, any>} */
	var current = {};
	/** @type {Record<string | symbol, any> | null} */
	var refs = null;
	var tracked = TRACKED_OBJECT in next;

	var symbols = get_own_property_symbols(next);
	for (var i = 0; i < symbols.length; i++) {
		var symbol = symbols[i];
		if (symbol.description === REF_PROP) {
			refs = apply_ref_prop(state, symbol, next[symbol], refs);
		}
	}

	for (var key in next) {
		if (key === 'children') continue;

		var value = next[key];
		if (typeof value === 'function' && is_ref_prop(value)) {
			refs = apply_ref_prop(state, key, value, refs);
			continue;
		}
		if (is_ripple_object(value)) {
			value = get(value);
			tracked = true;
		}
		current[key] = value;
		set_attribute_helper(element, key, value, state);
	}

	state.r = refs;
	state.p = current;
	state.n = next;
	state.t = tracked;
	return state;
}

/**
 * Keeps the effect of a ref prop the spread carried before, or creates one
 * for a ref prop that is new or changed.
 * @param {SpreadState} state
 * @param {string | symbol} key
 * @param {any} ref_fn
 * @param {Record<string | symbol, any> | null} refs the ref props of this run
 * @returns {Record<string | symbol, any>}
 */
function apply_ref_prop(state, key, ref_fn, refs) {
	if (refs === null) {
		refs = {};
	}
	refs[key] = ref_fn;

	var previous = state.r;
	var blocks = (state.b ??= {});
	var block = blocks[key];
	if (
		previous === null ||
		!(key in previous) ||
		previous[key] !== ref_fn ||
		(block !== undefined && (block.f & DESTROYED) !== 0)
	) {
		if (block !== undefined && (block.f & DESTROYED) === 0) {
			destroy_block(block);
		}
		blocks[key] = create_spread_ref_effect(state.e, ref_fn);
	}
	return refs;
}

/**
 * Destroys the effects of the ref props a spread no longer carries.
 * @param {SpreadState} state
 * @param {Record<string | symbol, any> | null} refs the ref props of this run
 */
function release_ref_props(state, refs) {
	var previous = /** @type {Record<string | symbol, any>} */ (state.r);
	var blocks = /** @type {Record<string | symbol, Block | undefined>} */ (state.b);
	/** @type {(string | symbol)[]} */
	var keys = get_own_property_symbols(previous);
	for (var key in previous) {
		keys.push(key);
	}
	for (var i = 0; i < keys.length; i++) {
		var k = keys[i];
		var block = blocks[k];
		if ((refs === null || !(k in refs)) && block !== undefined) {
			destroy_block(block);
			blocks[k] = undefined;
		}
	}
}

/**
 * Keep spread refs in a branch block so ordinary spread updates do not destroy
 * and recreate the ref block before `spread` can compare the previous and
 * current ref values.
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

/**
 * @typedef {{ e: Element; f: () => any; s: SpreadState | undefined }} RenderSpreadState
 */

/**
 * @param {RenderSpreadState} s
 */
function run_spread(s) {
	s.s = spread(s.e, s.f(), s.s);
}

/**
 * A render block that applies a spread of attributes to an element: for a
 * dynamic element, whose attributes are its props literal. Compiled
 * elements apply their spread from their own render function instead.
 * @param {Element} element
 * @param {() => any} fn
 * @param {number} [flags]
 * @returns {Block}
 */
export function render_spread(element, fn, flags = 0) {
	return block(RENDER_BLOCK | flags, run_spread, { e: element, f: fn, s: undefined });
}
