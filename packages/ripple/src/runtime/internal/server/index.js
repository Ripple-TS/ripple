/**
@import { Component, Dependency, Derived, Tracked, Block } from '#server';
@import { NestedArray } from '#helpers';
@import { Props } from '#public';
@import { SSRRenderResult } from 'ripple/server';
// TODO: Add back renderToStream to the import above when renderToStream is supported again
*/

// Export-only Types
/**
@typedef {Output} OutputInterface
 */

// Internal Types
/**
@typedef {(output: Output, props?: Props) => void} SSRComponent
@typedef {{
	tag: string;
	parent: undefined | ElementContext;
	filename: undefined | string;
	line: number;
	column: number;
}} ElementContext
@typedef {{
	cancel: () => void,
}} RegisteredAsyncOperation
 */

// import { Readable } from 'stream';
import {
	DERIVED,
	UNINITIALIZED,
	TRACKED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	ASYNC_DERIVED_READ_THROWN,
} from '../client/constants.js';
import { is_ripple_object, get_descriptor, define_property, is_array } from '../client/utils.js';
import { escape } from '../../../utils/escaping.js';
import { is_boolean_attribute } from '../../../compiler/utils.js';
import { clsx } from 'clsx';
import { normalize_css_property_name } from '../../../utils/normalize_css_property_name.js';
import { BLOCK_CLOSE, BLOCK_OPEN } from '../../../constants.js';
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

/** @type {null | Component} */
export let active_component = null;
/** @type {null | Block} */
export let active_block = null;
export let tracking = false;
/** @type {null | Dependency} */
let active_dependency = null;
/** @type {null | Derived} */
let active_derived_run = null;
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
	active_derived_run = null;
	current_element = undefined;
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
 * @param {Derived} computed
 * @param {any} value
 */
function update_derived_value(computed, value) {
	computed.v = value;
}

/**
 * @param {Derived} computed
 * @param {any} value
 */
function update_derived_value_clock(computed, value) {
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
	var previous_active_derived_run = active_derived_run;

	try {
		tracking = true;
		active_dependency = null;
		active_component = computed.co;
		active_derived_run = computed;

		var value = computed.fn();

		computed.d = active_dependency;

		return normalize_derived_value(computed, value, undefined);
	} catch (error) {
		computed.d = active_dependency;
		if (error === ASYNC_DERIVED_READ_THROWN) {
			var { ap: promise } = get_active_derived();
			if (computed.ia) {
				// This must've been thrown by a pending async derived inside a track.async callback.
				// We're not going to attach any cleanup logic to promises if they fail
				// as this should be handled by the block logic since something needs to read
				// these computed/derived values inside blocks
				// Otherwise, if they're never read, then it really doesn't matter if these promises error out,
				// or resolve for that matter, since it would mean that they're not being used.
				if (!computed.ap) {
					// create and attach a new promise that will resolve once all of its
					// async derived dependencies have resolved
					// It's important to create a promise because this async derived might be a dependency
					// of another sync or async derived, and they would also have to be rerun
					// once this derived's promise resolves
					var deferred_promise = new Promise((resolve, reject) => {
						computed.dr = resolve;
						computed.dj = (error) => {
							update_derived_value(computed, SUSPENSE_REJECTED);
							computed.dr = null;
							computed.dj = null;
							reject(error);
						};
						computed.ap = deferred_promise;
					});
				}

				/** @type {PromiseLike<any>} */ (promise).then(
					// rerun the derived once the dependent promise resolves
					() => {
						run_derived(computed);
					},
					(error) => {
						if (computed.dj) {
							computed.dj(error);
						} else {
							// this is a regular derived that has an async derived dependency
							update_derived_value(computed, SUSPENSE_REJECTED);
						}
					},
				);
			}
			return SUSPENSE_PENDING;
		}
		throw error;
	} finally {
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		active_component = previous_component;
		active_derived_run = previous_active_derived_run;
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
	/** @type {import('stream').Readable | null} */
	#stream = null;
	/** @type {null | number} */
	#pending_count = null;
	/** @type {null | Promise<void>} */
	#promise = null;
	/** @type {null | (() => void)} */
	#promise_resolve = null;
	/** @type {null | ((reason?: any) => void)} */
	#promise_reject = null;
	#is_root = false;
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
	 * @param {import('stream').Readable | null} stream
	 */
	constructor(parent, stream = null) {
		if (!parent) {
			this.#root = this;
			this.#is_root = true;
			this.#promise = new Promise((resolve, reject) => {
				this.#promise_resolve = resolve;
				this.#promise_reject = reject;
			});
			this.#pending_count = 1;
		} else {
			this.#root = parent.root;
			this.#parent = parent;
			this.#parent.body.push(this.body);
			this.#parent.head.push(this.head);
		}
		this.#stream = stream;
	}

	/**
	 * @param {string} str
	 * @returns {void}
	 */
	push(str) {
		if (this.target === 'head') {
			this.#head.push(str);
			return;
		}

		if (this.#stream) {
			this.#stream.push(str);
		} else {
			this.#body.push(str);
		}
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

	branch() {
		return new Output(this, this.#stream);
	}
}

/**
 * @param {SSRComponent} component
 * @returns {Promise<SSRRenderResult>}
 */
export async function render(component) {
	var head = '';
	var body = '';
	var css = new Set();
	/** @type {Block | null} */
	var root_block = null;

	// Reset dev-mode element tracking state at the start of each render
	reset_state();

	try_block(
		// since there is no `active_block` yet, the usual automatic block run will be skipped
		async () => {
			// this will run only once and immediately when we call the `try_block`
			root_block = /** @type {Block} */ (active_block);
			const output = root_block.o;
			component(output, {});
			output._decrementPending();
			await output.promise;

			head = /** @type {string[]} */ (output.head).flat(Infinity).join('');
			body =
				BLOCK_OPEN + /** @type {string[]} */ (output.body).flat(Infinity).join('') + BLOCK_CLOSE;
			css = output.css;
		},
		(error) => {
			const output = /** @type {Block} */ (root_block).o;
			output.clear();
			console.error(error);
		},
		() => {
			// TODO - allow a global pending in ripple.config.ts
			// pending would be implemented as part of the streaming rendering support
		},
	);

	// Run the block here manually now that we have `active_block` set up
	// Normally it's run right away when a block is created but because
	// the `active_block` was not set, it skipped the automatic run

	await /** @type {Block} */ (/** @type {unknown} */ (root_block)).o.promise;
	reset_state();

	return { head, body, css };
}

// /** @type {renderToStream} */
// export function renderToStream(component) {
// 	const stream = new Readable({
// 		read() {},
// 	});
// 	const output = new Output(null, stream);
// 	render_in_chunks(component, stream, output);
// 	return stream;
// }
// /**
//  *
//  * @param {SSRComponent} component
//  * @param {Readable} stream
//  * @param {Output} output
//  */
// async function render_in_chunks(component, stream, output) {
// 	// Reset dev-mode element tracking state at the start of each render
// 	reset_state();

// 	try {
// 		if (component.async) {
// 			await component(output, {});
// 		} else {
// 			component(output, {});
// 		}
// 		if (output.promises.length > 0) {
// 			await Promise.all(output.promises);
// 		}
// 		stream.push(null);
// 	} catch (error) {
// 		console.error(error);
// 		stream.emit('error', error);
// 	} finally {
// 		reset_state();
// 	}
// }
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
	if (!is_ripple_object(tracked)) {
		return tracked;
	}

	if ((tracked.f & DERIVED) !== 0) {
		update_derived(/** @type {Derived} **/ (tracked));
		if (tracking) {
			register_dependency(tracked);

			// When the derived is still pending or rejected, throw to bail out of the
			// current block so the rest of the component tree can continue processing
			// (avoiding waterfalls). We check `v === SUSPENSE_PENDING` rather than `aq`
			// because users can temporarily overwrite `v` on a derived, in which case
			// the processing should continue without throwing since we assume that the values
			// are consistent with the code's logic.
			if (tracked.v === SUSPENSE_PENDING || tracked.v === SUSPENSE_REJECTED) {
				if (
					!active_derived_run &&
					(!active_block || active_block.f & COMPONENT_BLOCK || active_block.f & TRY_BLOCK)
				) {
					// if reading directly inside a component or try block,
					// or not inside a derived function execution
					// throw a fatal error as this is prohibited
					throw new Error(
						'Reads on pending tracked values directly inside component body are prohibited. Use trackPending() test for safe access or create another derived instead.',
					);
				}

				throw ASYNC_DERIVED_READ_THROWN;
			}
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
 * @returns {Derived}
 */
function derived(v, get, set) {
	return {
		a: get || set ? { get, set } : empty_get_set,
		c: 0,
		co: active_component,
		d: null,
		f: TRACKED | DERIVED,
		fn: v,
		v: UNINITIALIZED,
		ia: false,
		aa: null,
		ap: null,
		dr: null,
		dj: null,
	};
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
 * @param {any} v
 * @param {{ lazy?: boolean } | undefined} options
 * @param {boolean} force_eager
 * @returns {Derived | void}
 */
export function track_async(v, options = {}, force_eager) {
	if (is_ripple_object(v)) {
		return v;
	}

	if (typeof v !== 'function') {
		throw new TypeError(
			'trackAsync() only accepts function arguments that return a promise or an object with a promise property',
		);
	}

	var d = derived(v, undefined, undefined);
	d.ia = true;
	if (options.lazy && !force_eager) {
		return d;
	}
	update_derived(d);
	return d;
}

/**
 * @returns {Derived}
 */
function get_active_derived() {
	// this should always be a derived with a promise when ASYNC_DERIVED_READ_THROWN is thrown
	return /** @type {Derived} */ (active_dependency?.t);
}

/**
 * @param {Block} block
 * @returns {void}
 */
function register_block_rerun(block) {
	var computed = get_active_derived();

	var cancelled = false;
	var try_catch_block = get_closest_catch_block(block);
	var operation = {
		cancel: () => {
			cancelled = true;
			if (computed.aa) {
				computed.aa.abort();
				computed.aa = null;
				computed.ap = null;
			}
			if (computed.dj) {
				computed.dj();
				computed.dr = null;
				computed.dj = null;
			}
		},
	};
	try_catch_block.o.registerAsync(operation);
	/** @type {PromiseLike<any>} */ (computed.ap).then(
		() => {
			if (cancelled) {
				return;
			}
			reset_state();
			run_block(block);
			try_catch_block.o.resolveAsync(operation);
		},
		(reason) => {
			cancel_async_operations(try_catch_block);
			// should set body, head and css to empty for the try block's output
			// should render the catch template
			// remove the registered async operation
			// all further processing sync or async should stop (maybe throw on sync to trigger the catch)
			// but only for this try block and downstream, other branches should continue processing as normal
			// decrement pending count
			// if we reach the root try block, we need to cancel all other branches with try/catch blocks
			// maybe we just resolve the main promise and let the rendering finish
			// looks like we need to check upstream try/catch blocks to make sure they've not already triggered their catch,
			// or maybe have to go from the top down to identify try/catch blocks and cancel any pending block reruns
			// we should store the child blocks on blocks, so we can traverse down and find all try/catch blocks to cancel their pending reruns,
			// -- that is if the upstream try/catch catches an error
		},
	);
	block.o.clear();
}

/**
 * @param {Block} block
 */
export function run_block(block) {
	var previous_block = active_block;
	var previous_component = active_component;
	try {
		active_block = block;
		active_component = block.co;
		block.fn(block.o);
	} catch (error) {
		if (error === ASYNC_DERIVED_READ_THROWN) {
			register_block_rerun(block);
			// var promise = get_active_derived_promise();

			// var cancelled = false;
			// var try_catch_block = get_closest_catch_block(block);
			// try_catch_block.o.registerAsync({ promise, cancel: () => (cancelled = true) });
			// promise.then(() => {
			// 	if (cancelled) {
			// 		return;
			// 	}
			// 	reset_state();
			// 	run_block(block);
			// 	// block.o.decrementPending();
			// });
			// block.o.clear();
		} else {
			var try_catch_block = get_closest_catch_block(block);
			cancel_async_operations(try_catch_block);
			// TODO - if we're still in sync code, should we throw instead?
			// throw error;
		}
	} finally {
		active_block = previous_block;
		active_component = previous_component;
	}
}

/**
 * @param {Derived} computed
 * @param {any} value
 * @param {'deferred' | undefined} type
 * @returns {any}
 */
function normalize_derived_value(computed, value, type) {
	var async_result = get_async_track_result(value, type);

	// TODO: need a test where a regular track (not derived) attempts to use a pending async derived
	// this should throw an error

	// TODO: if we're inside a try / resolving block, and we read the async track directly inside but
	// outside of a derived function, should we also throw error that you cannot read pending async
	// since we'd have to rerun the try/resolving block which would have to rerun the derived
	// so we don't want to do this.  Same for the client side.
	// We can set the try/resolving block with a special type and throw error if it's the active_block
	// currently, for the server-side, we check this in `update_derived()`
	// This is also assuming that trackAsync is only allowed directly in components and inside try / resolving blocks
	// So, need to create tests for this

	if (!computed.ia || async_result === null) {
		// This means it's a regular derived, so we just return the value
		return value;
	}

	computed.aa = async_result.abort_controller;
	// if computed.ap was a synthetic deferred promise, it's fine to replace it,
	// as the already attached then-ables would still fire because we attach then() on the real
	// and call .dr or .dj of the synthetic promise when the real one resolves/rejects
	// see the logic below for the `!== 'deferred'` check
	computed.ap = async_result.promise;

	// the updates for the derived value must run first, so that SUSPENSE_PENDING
	// is replaced by the real value, before any other thenable can run
	// and read the derived's value
	async_result.promise.then(
		(resolved) => {
			update_derived_value_clock(computed, resolved);
		},
		(error) => {
			update_derived_value(computed, SUSPENSE_REJECTED);
		},
	);

	// This thenable for the synthetic promise has to be chained after the one
	// that replaces SUSPENSE_PENDING with the real resolved value,
	// so that all those derived dependencies and blocks rerun only when
	// the synthetic contains the real values
	if (computed.dr !== null && async_result?.type !== 'deferred') {
		// This is the real promise result vs the synthetic `deferred`
		// This means that the derived's callback was finally able to run without throwing
		// as its async derived dependencies have now resolved.
		if (async_result !== null) {
			// the function passed to trackAsync returned a promise
			async_result.promise.then(computed.dr, computed.dj);
		} else {
			// regular derived that previously threw ASYNC_DERIVED_READ_THROWN
			computed.dr(value);
		}
		computed.dr = null;
		computed.dj = null;
	}

	return SUSPENSE_PENDING;
}

/**
 * @param {Record<string|symbol, any>} v
 * @param {(symbol | string)[]} l
 * @returns {Tracked[]}
 */
export function track_split(v, l) {
	var is_tracked = is_ripple_object(v);

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
			if (is_ripple_object(v[key])) {
				t = v[key];
			} else {
				t = tracked(undefined);
				t = define_property(t, 'v', /** @type {PropertyDescriptor} */ (get_descriptor(v, key)));
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
