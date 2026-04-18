/**
 * @import { Component, Dependency, Derived, Tracked, Block, TryBlockWithCatch } from '#server';
 * @import { NestedArray } from '#helpers';
 * @import { Props } from '#public';
 * @import { RenderResult, BaseRenderOptions, RenderStreamResult, Stream, StreamSink } from 'ripple/server';
 */

// Export-only Types
/** @typedef {Output} OutputInterface */

// Internal Types
/** @typedef {(props?: Props) => void} RenderComponent */
/** @typedef {{ tag: string; parent: undefined | ElementContext; filename: undefined | string; line: number; column: number; }} ElementContext */
/** @typedef {{ cancel: () => void }} RegisteredAsyncOperation */

import {
	DERIVED,
	UNINITIALIZED,
	TRACKED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	ASYNC_DERIVED_READ_THROWN,
	DERIVED_UPDATED,
} from '../client/constants.js';
import { is_ripple_object, array_slice } from '../client/utils.js';
import { escape } from '../../../utils/escaping.js';
import { is_boolean_attribute } from '../../../utils/attributes.js';
import { clsx } from 'clsx';
import { normalize_css_property_name } from '../../../utils/normalize_css_property_name.js';
import { BLOCK_CLOSE, BLOCK_OPEN } from '../../../constants.js';
import { is_ripple_element, normalize_children, ripple_element } from '../../element.js';
import {
	is_tag_valid_with_parent,
	is_tag_valid_with_ancestor,
} from '../../../html-tree-validation.js';
import { get_async_track_result } from '../../../utils/async.js';
import {
	cancel_async_operations,
	component_block,
	get_closest_catch_block,
	try_block,
} from './blocks.js';
import { COMPONENT_BLOCK, TRY_BLOCK } from './constants.js';

export { escape };
export { register_component_css as register_css } from './css-registry.js';
export { hash } from '../../../utils/hashing.js';
export { context } from './context.js';
export { try_block, component_block, regular_block } from './blocks.js';
export { array_slice };
export { ripple_element, normalize_children };

export function noop() {}

/**
 * @param {any} value
 * @returns {void}
 */
export function render_expression(value) {
	output_push(BLOCK_OPEN);

	if (is_ripple_element(value)) {
		value.render({});
	} else {
		output_push(escape(value ?? ''));
	}

	output_push(BLOCK_CLOSE);
}

/**
 * @returns {Stream}
 */
export function create_ssr_stream() {
	/** @type {ReadableStreamDefaultController<Uint8Array> | null} */
	var c = null;
	/** @type {ReadableStream<Uint8Array>} */
	var stream = new ReadableStream({
		start(controller) {
			// this runs synchronously
			c = controller;
		},
	});
	var encoder = new TextEncoder();
	var is_closed = false;
	var controller = /** @type {ReadableStreamDefaultController<Uint8Array>} */ (
		/** @type {unknown} */ (c)
	);

	var close = controller.close;
	var error = controller.error;

	controller.close = function (...args) {
		is_closed = true;
		close.call(controller, ...args);
	};

	controller.error = function (...args) {
		is_closed = true;
		error.call(controller, ...args);
	};

	return {
		controller,
		textEncoder: encoder,
		stream,
		sink: {
			push(chunk) {
				if (is_closed) {
					return;
				}
				controller.enqueue(encoder.encode(chunk));
			},
			close() {
				controller.close();
			},
			error(reason) {
				controller.error(reason);
			},
		},
	};
}

/** @type {null | Component} */
export let active_component = null;
/** @type {null | Block} */
export let active_block = null;
export let tracking = false;
/** @type {null | Dependency} */
let active_dependency = null;
let inside_async_track = false;
/** @type {ElementContext | undefined} */
let current_element;
/** @type {Set<string>} */
let seen_warnings = new Set();

/**
 * @returns {void}
 */
export function reset_state() {
	active_component = null;
	active_block = null;
	active_dependency = null;
	inside_async_track = false;
	tracking = false;
	seen_warnings = new Set();
	current_element = undefined;
}

/** @type {number} */
let clock = 0;

/**
 * @returns {number}
 */
function increment_clock() {
	return ++clock;
}

/**
 * @param {Block} block
 */
export function set_active_block(block) {
	active_block = block;
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
 * @param {Tracked} computed
 * @param {any} value
 */
function update_tracked_value_clock(computed, value) {
	computed.v = value;
	computed.c = increment_clock();
}

/**
 * @param {Derived} computed
 */
function run_derived(computed) {
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;

	try {
		tracking = true;
		active_dependency = null;
		active_component = computed.co;

		var value = computed.fn();

		computed.d = active_dependency;

		return value;
	} catch (error) {
		computed.d = active_dependency;
		if (error === ASYNC_DERIVED_READ_THROWN) {
			// Check if any dependency is rejected — if so, propagate rejection
			var dep = active_dependency;
			while (dep !== null) {
				if (dep.t.v === SUSPENSE_REJECTED) {
					return SUSPENSE_REJECTED;
				}
				dep = dep.n;
			}
			return SUSPENSE_PENDING;
		}
		throw error;
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

export class Output {
	/** @type {Output} */
	#root;
	/** @type {NestedArray<string>} */
	#head = [];
	/** @type {NestedArray<string>} */
	#body = [];
	/** @type {Set<string>} */
	#css = new Set();
	/** @type {null | Output} */
	#parent = null;
	/** @type {StreamSink | null} */
	#streamOutput = null;
	#stream_started = false;
	#stream_finished = false;
	/** @type {null | number} */
	#pending_count = null;
	/** @type {null | Promise<void>} */
	#promise = null;
	/** @type {null | (() => void)} */
	#promise_resolve = null;
	/** @type {null | ((reason?: any) => void)} */
	#promise_reject = null;
	#is_root = false;
	#sync_run = false;
	/** @type {Set<RegisteredAsyncOperation>} */
	#async_operations = new Set();
	/** @type {null | 'head'} */
	target = null;

	get root() {
		return this.#root;
	}

	get body() {
		return this.#body;
	}

	get head() {
		return this.#head;
	}

	get css() {
		return this.#css;
	}

	get promise() {
		if (this.#is_root) {
			return /** @type {Promise<void>} */ (this.#promise);
		}

		throw new Error('getPromise() can only be called on the root Output');
	}

	/**
	 * @param {Output | null} parent
	 */
	constructor(parent) {
		if (!parent) {
			this.#root = this;
			this.#is_root = true;
			this.#promise = new Promise((resolve, reject) => {
				this.#promise_resolve = resolve;
				this.#promise_reject = reject;
			});
			this.#pending_count = 1;
			this.#sync_run = true;
		} else {
			this.#root = parent.root;
			this.#parent = parent;
			this.#parent.body.push(this.body);
			this.#parent.head.push(this.head);
		}
	}

	/**
	 * @param {string} str
	 * @returns {void}
	 */
	push(str) {
		if (this.isStreamMode() && !this.isSyncRun()) {
			// TODO - we need to wrap the resulting block output into something that
			// the client-side can understand and append them appropriately,
			// or actually, first append and hydrate when the full block is finished
			// without waiting for the all blocks to finish streaming to make hydration faster
			/** @type {StreamSink} */
			(this.#root.#streamOutput).push(str);
			return;
		}

		if (this.target === 'head') {
			this.#head.push(str);
			return;
		}

		this.#body.push(str);
	}

	clear() {
		this.#head.length = 0;
		this.#body.length = 0;
		this.#css.clear();
	}

	/**
	 * @param {string} hash
	 * @returns {void}
	 */
	register_css(hash) {
		if (this.isStreamMode() && !this.isSyncRun()) {
			// TODO - when we're in the streaming mode and finished the sync render,
			// We should wrap the css into something that the client-side can understand
			// and append them into the head immediately
			return;
		}
		this.#css.add(hash);
	}

	/**
	 * @param {RegisteredAsyncOperation} operation
	 * @return {void}
	 */
	registerAsync(operation) {
		this.#async_operations.add(operation);
		this.#root._incrementPending();
	}

	/**
	 * @param {RegisteredAsyncOperation} operation
	 * @returns {void}
	 */
	resolveAsync(operation) {
		this.#async_operations.delete(operation);
		this.#root._decrementPending();
	}

	cancelAsyncOperations() {
		for (const operation of this.#async_operations) {
			operation.cancel();
			this.#async_operations.delete(operation);
			this.clear();
			this.#root._decrementPending();
		}
	}

	_incrementPending() {
		if (this.#is_root) {
			/** @type {number} */ (this.#pending_count)++;
			return;
		}
		throw new Error('_incrementPending() is an internal method.');
	}

	_decrementPending() {
		if (this.#is_root) {
			/** @type {number} */ (this.#pending_count)--;

			if (this.#pending_count === 0) {
				this.#promise_resolve?.();
			}
			return;
		}
		throw new Error('_decrementPending() is an internal method.');
	}

	_finishSyncRun() {
		if (this.#is_root) {
			this.#sync_run = false;
			return;
		}

		throw new Error('_finishSyncRun() is an internal method.');
	}

	/**
	 * @param {StreamSink} stream
	 */
	_setStream(stream) {
		if (this.#is_root) {
			this.#streamOutput = stream;
			return;
		}

		throw new Error('_setStream() is an internal method.');
	}

	_startStream() {
		if (this.#is_root) {
			this.#stream_started = true;
			return;
		}

		throw new Error('_startStream() is an internal method.');
	}

	_closeStream() {
		if (this.#is_root) {
			if (this.#streamOutput && this.#stream_started && !this.#stream_finished) {
				this.#stream_finished = true;
				this.#streamOutput.close();
			}
			return;
		}

		throw new Error('_closeStream() is an internal method.');
	}

	/**
	 * @param {unknown} reason
	 * @returns {void}
	 */
	_errorStream(reason) {
		if (this.#is_root) {
			if (this.#streamOutput && this.#stream_started && !this.#stream_finished) {
				this.#stream_finished = true;
				this.#streamOutput.error(reason);
			}
			return;
		}

		throw new Error('_errorStream() is an internal method.');
	}

	isStreamMode() {
		return this.#root.#streamOutput !== null;
	}

	isSyncRun() {
		return this.#root.#sync_run;
	}

	branch() {
		return new Output(this);
	}
}

/**
 * @param {RenderComponent} component
 * @param {BaseRenderOptions} [passed_in_options]
 * @returns {Promise<RenderResult | RenderStreamResult>}
 */
export async function render(component, passed_in_options = {}) {
	/** @type {BaseRenderOptions} */
	var options = {
		...(passed_in_options.stream ? { closeStream: true } : {}),
		...passed_in_options,
	};
	/** @type {Error | null } */
	var top_level_error = null;
	var head = '';
	var body = '';
	/** @type {Set<string>} */
	var css = new Set();
	/** @type {Block | null} */
	var root_block = null;

	// Reset dev-mode element tracking state at the start of each render
	reset_state();

	try_block(
		// since there is no `active_block` yet, the usual automatic block run will be skipped
		() => {
			// this will run only once and immediately when we call the `try_block`
			root_block = /** @type {Block} */ (active_block);
			const output = root_block.o;
			if (options.stream) {
				output._setStream(options.stream);
			}
			component({});
			output._decrementPending();
			output._finishSyncRun();

			if (output.isStreamMode()) {
				sync_buffers_to_string(output);
				output._startStream();
				output.push(head);
				output.push(body);
				// TODO - how do we handle css?, in needs to be inside the head
				// We probably can allocate a buffer inside the head for this
				// We should have the same order of insertion as for the full async render
			}
		},
		(error) => {
			// TODO - allow a global error template in ripple.config.ts
			// We're not going to send the error in the stream stream.error()
			// as we should send sent the error template

			// store the error to be returned
			top_level_error = error;
			console.error(error);
		},
		() => {
			// TODO - allow a global pending in ripple.config.ts
			// pending would be implemented as part of the streaming rendering support
		},
	);

	await /** @type {Block} */ (/** @type {unknown} */ (root_block)).o.promise;
	reset_state();

	const output = /** @type {Block} */ (/** @type {unknown} */ (root_block)).o;
	if (output.isStreamMode() && options.closeStream) {
		output._closeStream();
	}

	if (!output.isStreamMode()) {
		sync_buffers_to_string(output);
	}

	return options.stream
		? { stream: options.stream, topLevelError: top_level_error }
		: { head, body, css, topLevelError: top_level_error };

	/**
	 * @param {Output} output
	 * @returns {void}
	 */
	function sync_buffers_to_string(output) {
		head = /** @type {string[]} */ (output.head).flat(Infinity).join('');
		body = BLOCK_OPEN + /** @type {string[]} */ (output.body).flat(Infinity).join('') + BLOCK_CLOSE;
		css = output.css;
	}
}

/**
 * @returns {void}
 */
export function push_component() {
	active_component = {
		c: null,
		p: active_component,
	};
	active_block = component_block(() => {});
}

/**
 * @returns {void}
 */
export function pop_component() {
	active_component = /** @type {Component} */ (active_component).p;
	active_block = /** @type {Block} */ (active_block).p;
}

/**
 * @param {string} str
 * @returns {void}
 */
export function output_push(str) {
	/** @type {Block} */ (active_block).o.push(str);
}

/**
 * @param {Output['target']} target
 */
export function set_output_target(target) {
	/** @type {Block} */ (active_block).o.target = target;
}

/**
 * @param {string} hash
 * @returns {void}
 */
export function output_register_css(hash) {
	/** @type {Block} */ (active_block).o.register_css(hash);
}

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
 * @param {any} tracked
 * @returns {any}
 */
export function get(tracked) {
	if (!is_ripple_object(tracked)) {
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

	if (tracked.v === SUSPENSE_PENDING || tracked.v === SUSPENSE_REJECTED) {
		var is_try_block = false;
		if (
			!inside_async_track &&
			(!active_block ||
				active_block.f & COMPONENT_BLOCK ||
				(is_try_block = (active_block.f & TRY_BLOCK) !== 0))
		) {
			throw new Error(
				`Reads on pending tracked or derived values directly inside ${is_try_block ? 'try' : 'component'} body are prohibited. Use trackPending() test for safe access or create another derived instead.`,
			);
		}

		// this will be caught by the run_block and the block will be re-run
		// once the async tracked dependency's promise resolves
		throw ASYNC_DERIVED_READ_THROWN;
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

		if (name === 'children' || typeof value === 'function' || is_ripple_element(value)) continue;

		if (is_ripple_object(value)) {
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

/** @type {Tracked} */
class TrackedValue {
	/**
	 * @param {any} v
	 * @param {{ get?: Function; set?: Function }} a
	 */
	constructor(v, a) {
		this.a = a;
		/** @type {AbortController | null} */
		this.aa = null;
		/** @type {PromiseLike<any> | null} */
		this.ap = null;
		this.c = 0;
		this.f = TRACKED;
		this.v = v;
	}
	get [0]() {
		return get(/** @type {Tracked} */ (this));
	}
	set [0](v) {
		set(/** @type {Tracked} */ (this), v);
	}
	get [1]() {
		return this;
	}
	get value() {
		return get(/** @type {Tracked} */ (this));
	}
	/** @param {any} v */
	set value(v) {
		set(/** @type {Tracked} */ (this), v);
	}
	/** @returns {2} */
	get length() {
		return 2;
	}
	*[Symbol.iterator]() {
		yield get(/** @type {Tracked} */ (this));
		yield this;
	}
}

/** @type {Derived} */
class DerivedValue {
	/**
	 * @param {Function} fn
	 * @param {{ get?: Function; set?: Function }} a
	 */
	constructor(fn, a) {
		this.a = a;
		// we always should have an active block
		// even in async we rerun blocks so we can rely on this
		this.b = /** @type {Block} */ (active_block);
		this.c = 0;
		this.co = active_component;
		/** @type {Dependency | null} */
		this.d = null;
		this.f = DERIVED;
		this.fn = fn;
		this.v = UNINITIALIZED;
	}
	get [0]() {
		return get(/** @type {Derived} */ (this));
	}
	set [0](v) {
		set(/** @type {Derived} */ (this), v);
	}
	get [1]() {
		return this;
	}
	get value() {
		return get(/** @type {Derived} */ (this));
	}
	/** @param {any} v */
	set value(v) {
		set(/** @type {Derived} */ (this), v);
	}
	/** @returns {2} */
	get length() {
		return 2;
	}
	*[Symbol.iterator]() {
		yield get(/** @type {Derived} */ (this));
		yield this;
	}
}

/**
 * @param {any} v
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked}
 */
function tracked(v, get, set) {
	return /** @type {Tracked} */ (new TrackedValue(v, get || set ? { get, set } : empty_get_set));
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string[]} exclude_keys
 * @returns {Record<string, unknown>}
 */
export function exclude_from_object(obj, exclude_keys) {
	/** @type {Record<string, unknown>} */
	var new_obj = {};

	for (const key of Object.keys(obj)) {
		if (!exclude_keys.includes(key)) {
			new_obj[key] = obj[key];
		}
	}

	return new_obj;
}

/**
 * @param {any} v
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Derived}
 */
function derived(v, get, set) {
	return /** @type {Derived} */ (new DerivedValue(v, get || set ? { get, set } : empty_get_set));
}

/**
 * @param {any} v
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked | Derived}
 */
export function track(v, get, set) {
	var is_tracked = is_ripple_object(v);

	if (is_tracked) {
		return v;
	}

	if (typeof v === 'function') {
		return derived(v, get, set);
	}

	return tracked(v, get, set);
}

/**
 * Runs the async tracked function, handling sync results, async results,
 * and chained cases where fn() reads a pending dependency.
 * @param {Tracked} t
 * @param {() => any} fn
 * @param {Block} block
 * @param {((value?: any) => void) | null} dr
 * @param {((reason?: any) => void) | null} dj
 */
function run_track_async(t, fn, block, dr, dj) {
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_inside = inside_async_track;
	tracking = true;
	active_dependency = null;
	inside_async_track = true;

	var result;
	/** @type {Dependency | null} */
	var caught_dep = null;
	var caught = false;

	try {
		result = fn();
	} catch (error) {
		caught_dep = active_dependency;
		caught = true;

		if (error !== ASYNC_DERIVED_READ_THROWN) {
			throw error;
		}
	} finally {
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		inside_async_track = previous_inside;
	}

	if (caught) {
		// Chained case: fn() read a pending tracked/derived dependency
		// Check if any dependency is rejected
		var dep = /** @type {Dependency | null} */ (caught_dep);
		while (dep !== null) {
			if (dep.t.v === SUSPENSE_REJECTED) {
				update_tracked_value_clock(t, SUSPENSE_REJECTED);
				if (dj) {
					dj(new Error('Upstream dependency rejected'));
				}
				return;
			}
			dep = dep.n;
		}

		// Create synthetic promise if first time (for downstream chaining)
		if (!dr) {
			t.ap = new Promise((resolve, reject) => {
				dr = resolve;
				dj = reject;
			});
		}

		// Find the pending dependency with a promise and chain on it
		dep = /** @type {Dependency | null} */ (caught_dep);
		while (dep !== null) {
			var dep_tracked = /** @type {Tracked} */ (dep.t);
			if ((dep_tracked.f & TRACKED) !== 0 && dep_tracked.v === SUSPENSE_PENDING && dep_tracked.ap) {
				/** @type {PromiseLike<any>} */ (dep_tracked.ap).then(
					() => run_track_async(t, fn, block, dr, dj),
					(error) => {
						update_tracked_value_clock(t, SUSPENSE_REJECTED);
						if (dj) {
							dj(error);
						}
						route_error_to_catch_block(get_closest_catch_block(block), error);
					},
				);
				return;
			}
			dep = dep.n;
		}
		return;
	}

	// Handle the result
	var async_result = get_async_track_result(result);

	if (async_result === null) {
		// Sync result
		update_tracked_value_clock(t, result);
		if (dr) {
			dr(result);
		}
		return;
	}

	t.aa = async_result.abort_controller;

	if (!dr) {
		// First run, no chaining — set real promise directly
		t.ap = async_result.promise;
	}

	async_result.promise.then(
		(resolved) => {
			update_tracked_value_clock(t, resolved);
			if (dr) {
				dr(resolved);
			}
		},
		(error) => {
			update_tracked_value_clock(t, SUSPENSE_REJECTED);
			if (dj) {
				dj(error);
			}
			route_error_to_catch_block(get_closest_catch_block(block), error);
		},
	);
}

/**
 * @param {any} v
 * @returns {Tracked | void}
 */
export function track_async(v) {
	if (is_ripple_object(v)) {
		return v;
	}

	if (typeof v !== 'function') {
		throw new TypeError(
			'trackAsync() only accepts function arguments that return a promise or an object with a promise property',
		);
	}

	var t = tracked(SUSPENSE_PENDING);
	var block = /** @type {Block} */ (active_block);
	run_track_async(t, v, block, null, null);
	return t;
}

/**
 * @param {(Derived | Tracked) | (() => any)} tracked
 * @returns {boolean}
 */
export function is_tracked_pending(tracked) {
	try {
		if (typeof tracked === 'function') {
			tracked();
		} else {
			get(tracked);
		}
		return false;
	} catch (error) {
		if (error === ASYNC_DERIVED_READ_THROWN) {
			return true;
		}
		throw error;
	}
}

/**
 * @param {Tracked | Derived} tracked
 * @return {any}
 */
export function peek_tracked(tracked) {
	if (!is_ripple_object(tracked)) {
		return tracked;
	}

	return tracked.v;
}

/**
 * Routes an error to the nearest catch boundary: clears output, cancels
 * pending async work, and invokes the catch handler if one exists.
 * @param {TryBlockWithCatch} catch_block
 * @param {any} error
 */
function route_error_to_catch_block(catch_block, error) {
	// cancel async should also clear the output
	// for this block and all its children
	cancel_async_operations(catch_block);
	reset_state();
	set_active_block(catch_block);
	catch_block.s.c(error);
}

/**
 * @param {Block} block
 * @returns {void}
 */
function register_block_rerun(block) {
	// Find the pending dependency with a promise in the dependency chain.
	var dep_entry = active_dependency;
	// tracked async must exist as otherwise we wouldn't have thrown the ASYNC_DERIVED_READ_THROWN
	/** @type {Tracked | null} */
	var t = null;
	while (dep_entry !== null) {
		var d = /** @type {Tracked} */ (dep_entry.t);
		if ((d.f & TRACKED) !== 0 && d.v === SUSPENSE_PENDING && d.ap) {
			t = d;
			break;
		}
		dep_entry = dep_entry.n;
	}

	var cancelled = false;
	var try_catch_block = get_closest_catch_block(block);
	var operation = {
		cancel: () => {
			cancelled = true;
			if (t && t.aa) {
				t.aa.abort(DERIVED_UPDATED);
				t.aa = null;
				t.ap = null;
			}
		},
	};

	try_catch_block.o.registerAsync(operation);
	/** @type {PromiseLike<any>} */ (/** @type {Tracked} */ (t).ap).then(
		() => {
			if (cancelled) {
				return;
			}
			reset_state();
			try {
				run_block(block);
				try_catch_block.o.resolveAsync(operation);
			} catch (error) {
				route_error_to_catch_block(try_catch_block, error);
			}
		},
		(error) => {
			if (cancelled) {
				return;
			}
			route_error_to_catch_block(try_catch_block, error);
		},
	);
	// clear all output buffers as we'll rerun the block rendering
	block.o.clear();
}

/**
 * @param {Block} block
 */
export function run_block(block) {
	var previous_block = active_block;
	var previous_component = active_component;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_element = current_element;
	try {
		active_block = block;
		active_component = block.co;
		tracking = true;
		active_dependency = null;
		block.fn(block.o);
	} catch (error) {
		var output = block.o;
		if (error === ASYNC_DERIVED_READ_THROWN) {
			// regardless of the render mode (stream, etc.)
			// we need to rerun the block when the dependency's promise resolves
			register_block_rerun(block);

			if (output.isStreamMode() && output.isSyncRun()) {
				// rethrowing so that the pending block catches it
				// we should only render fallback/pending in the streaming mode
				// when in the synchronous phase
				throw error;
			}
		} else {
			// always re-throw real errors
			// during sync, try_block's catch handles it;
			// during async, the register_block_rerun() try/catch handles it
			throw error;
		}
	} finally {
		active_block = previous_block;
		active_component = previous_component;
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		current_element = previous_element;
	}
}

/**
 * @param {any} _
 * @param {ConstructorParameters<typeof URL>} params
 * @returns {URL}
 */
export function ripple_url(_, ...params) {
	return new URL(...params);
}

/**
 * @param {any} _
 * @param {ConstructorParameters<typeof URLSearchParams>} params
 * @returns {URLSearchParams}
 */
export function ripple_url_search_params(_, ...params) {
	return new URLSearchParams(...params);
}

/**
 * @param {ConstructorParameters<typeof Date>} params
 * @returns {Date}
 */
export function ripple_date(...params) {
	return new Date(...params);
}

/**
 * @param {string} query
 * @param {boolean} [matches]
 * @returns {boolean}
 */
export function media_query(query, matches = false) {
	void query;
	return matches;
}

/**
 * @param {() => void} _fn
 * @returns {void}
 */
export function effect(_fn) {
	return;
}

/**
 * @template T
 * @param  {...T} elements
 * @returns {T[]}
 */
export function ripple_array(...elements) {
	return new Array(...elements);
}

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [map_fn]
 * @param {any} [thisArg]
 * @returns {T[]}
 */
ripple_array.from = function (arrayLike, map_fn, thisArg) {
	return map_fn ? Array.from(arrayLike, map_fn, thisArg) : Array.from(arrayLike);
};

/**
 * @template T
 * @param  {...T} items
 * @returns {T[]}
 */
ripple_array.of = function (...items) {
	return Array.of(...items);
};

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [map_fn]
 * @param {any} [thisArg]
 * @returns {Promise<T[]>}
 */
ripple_array.from_async = async function (arrayLike, map_fn, thisArg) {
	return map_fn ? Array.fromAsync(arrayLike, map_fn, thisArg) : Array.fromAsync(arrayLike);
};

/**
 * @param {object} obj
 * @returns {object}
 */
export function ripple_object(obj) {
	return obj;
}

/**
 * @template K, V
 * @param {Iterable<readonly [K, V]>} [iterable]
 * @returns {Map<K, V>}
 */
export function ripple_map(iterable) {
	return new Map(iterable);
}

/**
 * Returns the fallback value if the given value is undefined.
 * @template T
 * @param {T | undefined} value
 * @param {T} fallback
 * @returns {T}
 */
export function fallback(value, fallback) {
	return value === undefined ? fallback : value;
}
