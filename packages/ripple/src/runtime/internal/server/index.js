/**
@import { Component, Dependency, Derived, Tracked } from '#server';
@import { SSRComponent } from 'ripple/server';
*/

import { Readable } from 'stream';
import { DERIVED, UNINITIALIZED, TRACKED } from '../client/constants.js';
import { is_tracked_object, get_descriptor, define_property, is_array } from '../client/utils.js';
import { escape } from '../../../utils/escaping.js';
import { is_boolean_attribute } from '../../../compiler/utils.js';
import { clsx } from 'clsx';
import { normalize_css_property_name } from '../../../utils/normalize_css_property_name.js';
import { BLOCK_CLOSE, BLOCK_OPEN } from '../../../constants.js';
import {
	is_tag_valid_with_parent,
	is_tag_valid_with_ancestor,
} from '../../../html-tree-validation.js';

export { escape };
export { register_component_css as register_css } from './css-registry.js';
export { hash } from '../../../utils/hashing.js';

/** @type {null | Component} */
export let active_component = null;

/** @type {number} */
let clock = 0;

/** @type {null | Dependency} */
let active_dependency = null;

export let tracking = false;

/**
 * @returns {number}
 */
function increment_clock() {
	return ++clock;
}

/**
 * @param {Tracked | Derived} tracked
 * @returns {Dependency}
 */
function create_dependency(tracked) {
	return {
		c: tracked.c,
		t: tracked,
		n: null,
	};
}

/**
 * @param {Tracked | Derived} tracked
 */
function register_dependency(tracked) {
	var dependency = active_dependency;

	if (dependency === null) {
		dependency = create_dependency(tracked);
		active_dependency = dependency;
	} else {
		var current = dependency;

		while (current !== null) {
			if (current.t === tracked) {
				current.c = tracked.c;
				return;
			}
			var next = current.n;
			if (next === null) {
				break;
			}
			current = next;
		}

		dependency = create_dependency(tracked);
		current.n = dependency;
	}
}

/**
 * @param {Dependency | null} tracking
 */
function is_tracking_dirty(tracking) {
	if (tracking === null) {
		return false;
	}
	while (tracking !== null) {
		var tracked = tracking.t;

		if ((tracked.f & DERIVED) !== 0) {
			update_derived(/** @type {Derived} **/ (tracked));
		}

		if (tracked.c > tracking.c) {
			return true;
		}
		tracking = tracking.n;
	}

	return false;
}

/**
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack(fn) {
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	tracking = false;
	active_dependency = null;
	try {
		return fn();
	} finally {
		tracking = previous_tracking;
		active_dependency = previous_dependency;
	}
}

/**
 * @param {Derived} computed
 */
function update_derived(computed) {
	var value = computed.v;

	if (value === UNINITIALIZED || is_tracking_dirty(computed.d)) {
		value = run_derived(computed);

		if (value !== computed.v) {
			computed.v = value;
			computed.c = increment_clock();
		}
	}
}

/**
 * @param {Derived} computed
 */
function run_derived(computed) {
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;

	try {
		active_component = computed.co;
		tracking = true;
		active_dependency = null;

		var value = computed.fn();

		computed.d = active_dependency;

		return value;
	} finally {
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		active_component = previous_component;
	}
}

/**
 * `<div translate={false}>` should be rendered as `<div translate="no">` and _not_
 * `<div translate="false">`, which is equivalent to `<div translate="yes">`. There
 * may be other odd cases that need to be added to this list in future
 * @type {Record<string, Map<any, string>>}
 */
const replacements = {
	translate: new Map([
		[true, 'yes'],
		[false, 'no'],
	]),
};

class Output {
	head = '';
	body = '';
	/** @type {Set<string>} */
	css = new Set();
	/** @type {Promise<any>[]} */
	promises = [];
	/** @type {Output | null} */
	#parent = null;
	/** @type {import('stream').Readable | null} */
	#stream = null;
	/** @type {null | 'head'} */
	target = null;

	/**
	 * @param {Output | null} parent
	 * @param {import('stream').Readable | null} stream
	 */
	constructor(parent, stream = null) {
		this.#parent = parent;
		this.#stream = stream;
	}

	/**
	 * @param {string} str
	 * @returns {void}
	 */
	push(str) {
		if (this.target === 'head') {
			this.head += str;
			return;
		}

		if (this.#stream) {
			this.#stream.push(str);
		} else {
			this.body += str;
		}
	}

	/**
	 * @param {string} hash
	 * @returns {void}
	 */
	register_css(hash) {
		this.css.add(hash);
	}
}

/** @type {render} */
export async function render(component) {
	const output = new Output(null, null);
	let head = '';
	let body = '';
	let css = new Set();

	// Reset dev-mode element tracking state at the start of each render
	reset_element_state();

	try {
		if (component.async) {
			await component(output, {});
		} else {
			component(output, {});
		}
		if (output.promises.length > 0) {
			await Promise.all(output.promises);
		}

		head = output.head;
		body = BLOCK_OPEN + output.body + BLOCK_CLOSE;
		css = output.css;
	} catch (error) {
		console.log(error);
	} finally {
		reset_element_state();
	}
	return { head, body, css };
}

/** @type {renderToStream} */
export function renderToStream(component) {
	const stream = new Readable({
		read() {},
	});
	const output = new Output(null, stream);
	render_in_chunks(component, stream, output);
	return stream;
}
/**
 *
 * @param {SSRComponent} component
 * @param {Readable} stream
 * @param {Output} output
 */
async function render_in_chunks(component, stream, output) {
	// Reset dev-mode element tracking state at the start of each render
	reset_element_state();

	try {
		if (component.async) {
			await component(output, {});
		} else {
			component(output, {});
		}
		if (output.promises.length > 0) {
			await Promise.all(output.promises);
		}
		stream.push(null);
	} catch (error) {
		console.error(error);
		stream.emit('error', error);
	} finally {
		reset_element_state();
	}
}
/**
 * @returns {void}
 */
export function push_component() {
	var component = {
		c: null,
		p: active_component,
	};
	active_component = component;
}

/**
 * @returns {void}
 */
export function pop_component() {
	var component = /** @type {Component} */ (active_component);
	active_component = component.p;
}

/**
 * @typedef {{
 * 	tag: string;
 * 	parent: undefined | ElementContext;
 *  filename: undefined | string;
 *  line: number;
 *  column: number;
 * }} ElementContext
 */

/** @type {ElementContext | undefined} */
let current_element;

/**
 * @type {Set<string>}
 */
let seen_warnings = new Set();

/**
 * @param {string} message
 */
function print_nesting_error(message) {
	message =
		`node_invalid_placement_ssr: ${message}\n\n` +
		'This can cause content to shift around as the browser repairs the HTML, and will likely result in a hydration mismatch.';

	if (seen_warnings.has(message)) return;
	seen_warnings.add(message);

	// eslint-disable-next-line no-console
	console.error(message);
}

/**
 * Pushes an element onto the element stack and validates its nesting.
 * Used during DEV mode SSR to detect invalid HTML nesting that would cause
 * the browser to repair the HTML, breaking hydration.
 * @param {string} tag
 * @param {string} filename
 * @param {number} line
 * @param {number} column
 * @returns {void}
 */
export function push_element(tag, filename, line, column) {
	var parent = current_element;
	var element = { tag, parent, filename, line, column };

	if (parent !== undefined) {
		var ancestor = parent.parent;
		var ancestors = [parent.tag];

		const child_loc = filename ? `${filename}:${line}:${column}` : undefined;
		const parent_loc = parent.filename
			? `${parent.filename}:${parent.line}:${parent.column}`
			: undefined;

		const message = is_tag_valid_with_parent(tag, parent.tag, child_loc, parent_loc);
		if (message) print_nesting_error(message);

		while (ancestor != null) {
			ancestors.push(ancestor.tag);
			const ancestor_loc = ancestor.filename
				? `${ancestor.filename}:${ancestor.line}:${ancestor.column}`
				: undefined;

			const ancestor_message = is_tag_valid_with_ancestor(tag, ancestors, child_loc, ancestor_loc);
			if (ancestor_message) print_nesting_error(ancestor_message);

			ancestor = ancestor.parent;
		}
	}

	current_element = element;
}

/**
 * Pops the current element from the element stack.
 * @returns {void}
 */
export function pop_element() {
	if (current_element !== undefined) {
		current_element = current_element.parent;
	}
}

/**
 * Resets the dev-mode element tracking state.
 * Called automatically at the start/end of each render to prevent
 * state from leaking between renders (e.g., if a render throws).
 * Also exported for testing purposes.
 * @returns {void}
 */
export function reset_element_state() {
	seen_warnings = new Set();
	current_element = undefined;
}

/**
 * @param {() => any} fn
 * @returns {Promise<void>}
 */
export async function async(fn) {
	await fn();
}

/**
 * @returns {boolean}
 */
export function aborted() {
	// For SSR, we don't abort rendering
	return false;
}

/**
 * @param {any} tracked
 * @returns {any}
 */
export function get(tracked) {
	if (!is_tracked_object(tracked)) {
		return tracked;
	}

	if ((tracked.f & DERIVED) !== 0) {
		update_derived(/** @type {Derived} **/ (tracked));
		if (tracking) {
			register_dependency(tracked);
		}
	} else if (tracking) {
		register_dependency(tracked);
	}

	var g = tracked.a.get;
	return g ? g(tracked.v) : tracked.v;
}

/**
 * @param {Derived | Tracked} tracked
 * @param {any} value
 */
export function set(tracked, value) {
	var old_value = tracked.v;

	if (value !== old_value) {
		var s = tracked.a.set;
		tracked.v = s ? s(value, tracked.v) : value;
		tracked.c = increment_clock();
	}
}

/**
 * @param {Tracked} tracked
 * @param {number} [d]
 * @returns {number}
 */
export function update(tracked, d = 1) {
	var value = get(tracked);
	var result = d === 1 ? value++ : value--;
	set(tracked, value);
	return result;
}

/**
 * @param {Tracked} tracked
 * @param {number} [d]
 * @returns {number}
 */
export function update_pre(tracked, d = 1) {
	var value = get(tracked);
	var new_value = d === 1 ? ++value : --value;
	set(tracked, new_value);
	return new_value;
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {any} value
 * @returns {void}
 */
export function set_property(obj, property, value) {
	var tracked = obj[property];
	set(tracked, value);
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {boolean} [chain=false]
 * @returns {any}
 */
export function get_property(obj, property, chain = false) {
	if (chain && obj == null) {
		return undefined;
	}
	var tracked = obj[property];
	if (tracked == null) {
		return tracked;
	}
	return get(tracked);
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {number} [d=1]
 * @returns {number}
 */
export function update_property(obj, property, d = 1) {
	var tracked = obj[property];
	var value = get(tracked);
	var new_value = d === 1 ? value++ : value--;
	set(tracked, value);
	return new_value;
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {number} [d=1]
 * @returns {number}
 */
export function update_pre_property(obj, property, d = 1) {
	var tracked = obj[property];
	var value = get(tracked);
	var new_value = d === 1 ? ++value : --value;
	set(tracked, new_value);
	return new_value;
}

/**
 * @template V
 * @param {string} name
 * @param {V} value
 * @param {boolean} [is_boolean]
 * @returns {string}
 */
export function attr(name, value, is_boolean = false) {
	if (name === 'hidden' && value !== 'until-found') {
		is_boolean = true;
	}
	if (value == null || (!value && is_boolean)) return '';
	const normalized = (name in replacements && replacements[name].get(value)) || value;
	let value_to_escape = name === 'class' ? clsx(normalized) : normalized;
	value_to_escape =
		name === 'style'
			? typeof value !== 'string'
				? get_styles(value)
				: String(normalized).trim()
			: value_to_escape;
	const assignment = is_boolean ? '' : `="${escape(value_to_escape, true)}"`;
	return ` ${name}${assignment}`;
}

/**
 * @param {Record<string, string | number>} styles
 * @returns {string}
 */
function get_styles(styles) {
	var result = '';
	for (const key in styles) {
		const css_prop = normalize_css_property_name(key);
		const value = String(styles[key]).trim();
		result += `${css_prop}: ${value}; `;
	}
	return result.trim();
}

/**
 * @param {Record<string, any>} attrs
 * @param {string | undefined} css_hash
 * @returns {string}
 */
export function spread_attrs(attrs, css_hash) {
	let attr_str = '';
	let name;

	for (name in attrs) {
		var value = attrs[name];

		if (typeof value === 'function') continue;

		if (is_tracked_object(value)) {
			value = get(value);
		}

		if (name === 'class' && css_hash) {
			value = value == null || value === css_hash ? css_hash : [value, css_hash];
		}

		attr_str += attr(name, value, is_boolean_attribute(name));
	}

	return attr_str;
}

var empty_get_set = { get: undefined, set: undefined };

/**
 * @param {any} v
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked}
 */
function tracked(v, get, set) {
	return {
		a: get || set ? { get, set } : empty_get_set,
		c: 0,
		f: TRACKED,
		v,
	};
}

/**
 * @param {any} v
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked | Derived}
 */
export function track(v, get, set) {
	var is_tracked = is_tracked_object(v);

	if (is_tracked) {
		return v;
	}

	if (typeof v === 'function') {
		return {
			a: get || set ? { get, set } : empty_get_set,
			c: 0,
			co: active_component,
			d: null,
			f: TRACKED | DERIVED,
			fn: v,
			v: UNINITIALIZED,
		};
	}

	return tracked(v, get, set);
}

/**
 * @param {Record<string|symbol, any>} v
 * @param {(symbol | string)[]} l
 * @returns {Tracked[]}
 */
export function track_split(v, l) {
	var is_tracked = is_tracked_object(v);

	if (is_tracked || typeof v !== 'object' || v === null || is_array(v)) {
		throw new TypeError('Invalid value: expected a non-tracked object');
	}

	/** @type {Tracked[]} */
	var out = [];
	/** @type {Record<string|symbol, any>} */
	var rest = {};
	/** @type {Record<PropertyKey, 1>} */
	var done = {};
	var props = Reflect.ownKeys(v);

	for (let i = 0, key, t; i < l.length; i++) {
		key = l[i];

		if (props.includes(key)) {
			if (is_tracked_object(v[key])) {
				t = v[key];
			} else {
				t = tracked(undefined);
				t = define_property(t, '__v', /** @type {PropertyDescriptor} */ (get_descriptor(v, key)));
			}
		} else {
			t = tracked(undefined);
		}

		out[i] = t;
		done[key] = 1;
	}

	for (let i = 0, key; i < props.length; i++) {
		key = props[i];
		if (done[key]) {
			continue;
		}
		define_property(rest, key, /** @type {PropertyDescriptor} */ (get_descriptor(v, key)));
	}

	out.push(tracked(rest));

	return out;
}
