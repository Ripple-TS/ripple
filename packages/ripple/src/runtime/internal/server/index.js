/**
 * @import { Component, Dependency, Block, TryBlockWithCatch } from '#server';
 * @import { NestedArray } from '@tsrx/core/types/helpers';
 * @import { Props } from '#public';
 * @import { RenderResult, BaseRenderOptions, RenderStreamResult, Stream, StreamSink } from 'ripple/server';
 */

// Export-only Types
/** @typedef {Output} OutputInterface */

// Internal Types
/** @typedef {(props?: Props) => void} RenderComponent */
/** @typedef {{ tag: string; parent: undefined | ElementContext; filename: undefined | string; line: number; column: number; }} ElementContext */
/** @typedef {{ cancel: () => void }} RegisteredAsyncOperation */

// Both
/** @typedef {TrackedValue} Tracked */
/** @typedef {DerivedValue} Derived */

/**
 * A streaming flush unit: a try boundary whose body suspended during
 * rendering. Its slot (wrapper markers + pending fallback) ships with the
 * enclosing region while the real body — kept as a detached buffer tree whose
 * holes async re-runs fill in place — streams later as a framed chunk once
 * every async operation registered on the boundary settles.
 * @typedef {{
 *   id: number;
 *   block: Block;
 *   output: Output;
 *   content: NestedArray<string>;
 *   head: NestedArray<string>;
 *   css: Set<string>;
 *   scripts: string[];
 *   settled: boolean;
 *   flushed: boolean;
 *   slot_sent: boolean;
 *   sealed: boolean;
 *   errored: boolean;
 *   error: string | null;
 * }} FlushUnit
 */

/** @typedef {{ css: Set<string>, scripts: string[], head: string }} StreamChunk */

import {
	DERIVED,
	UNINITIALIZED,
	TRACKED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	ASYNC_DERIVED_READ_THROWN,
	TRACKED_UPDATED,
} from '../client/constants.js';
import { DEV } from 'esm-env';
import { is_ripple_object } from '../client/utils.js';
import { iterable_array_from, array_slice, is_array } from '@tsrx/core/runtime/language-helpers';
import {
	escape,
	escape_script,
	is_boolean_attribute,
	normalize_css_property_name,
} from '@tsrx/core/runtime/html';
import { clsx } from 'clsx';
import { create_ref_prop } from '@tsrx/core/runtime/ref';
import {
	BLOCK_CLOSE,
	BLOCK_OPEN,
	HYDRATION_START_PENDING,
	HYDRATION_START_ERRORED,
	STREAM_CHUNK_ATTR,
	STREAM_HEAD_ATTR,
	STREAM_ERROR_SCRIPT_PREFIX,
} from '../../../constants.js';
import { get_css_text } from './css-registry.js';
import { STREAM_RUNTIME_SCRIPT } from './stream-runtime.js';
import { is_tsrx_element, normalize_children, tsrx_element } from '../../element.js';
import {
	is_tag_valid_with_parent,
	is_tag_valid_with_ancestor,
} from '../../../html-tree-validation.js';
import { get_async_track_result } from '../../../utils/async.js';
import {
	throw_tracked_index_reference_error,
	throw_tracked_index_value_error,
} from '../../../utils/errors.js';
import { get_track_async_script_id } from '../../../utils/track-async-serialization.js';
import * as devalue from 'devalue';
import {
	cancel_async_operations,
	component_block,
	get_closest_catch_block,
	get_closest_try_block,
	try_block,
} from './blocks.js';
import { COMPONENT_BLOCK, ROOT_BLOCK, TRY_BLOCK } from './constants.js';

export { escape };
export { register_component_css as register_css } from './css-registry.js';
export { simple_hash, strong_hash } from '@tsrx/core/runtime/hash';
export { context } from './context.js';
export { try_block, component_block, regular_block } from './blocks.js';
export { array_slice };
export { is_tsrx_element, tsrx_element, normalize_children };
export { create_ref_prop };

/** @extends Error */
export class TrackAsyncRunError extends Error {
	/** @type {Tracked} */
	tracked;
	/** @type {Error} */
	cause;
	/**
	 * @param {string} message
	 * @param {{tracked: Tracked, cause: Error}} options
	 */
	constructor(message, options) {
		super(message);
		this.name = 'TrackAsyncRunError';
		this.tracked = options.tracked;
		this.cause = options.cause;
	}
}

export function noop() {}

/**
 * @param {any[]} value
 * @returns {void}
 */
function render_tsrx_collection(value) {
	for (var i = 0; i < value.length; i++) {
		var item = value[i];

		if (is_tsrx_element(item)) {
			render_tsrx_element(item);
		} else if (is_array(item)) {
			render_tsrx_collection(item);
		} else if (item != null) {
			output_push(escape(item));
		}
	}
}

/**
 * @param {import('../../element.js').TSRXElement} value
 * @returns {void}
 */
export function render_tsrx_element(value) {
	const result = value.render({});

	if (is_tsrx_element(result)) {
		render_tsrx_element(result);
	} else if (is_array(result)) {
		render_tsrx_collection(result);
	} else if (result != null) {
		output_push(escape(result));
	}
}

/**
 * @param {any} value
 * @returns {void}
 */
export function render_expression(value) {
	output_push(BLOCK_OPEN);

	if (is_tsrx_element(value)) {
		render_tsrx_element(value);
	} else if (is_array(value)) {
		render_tsrx_collection(value);
	} else {
		output_push(escape(value ?? ''));
	}

	output_push(BLOCK_CLOSE);
}

/**
 * @param {Function} fn
 * @param {Props} props
 * @returns {void}
 */
export function render_component(fn, props) {
	if (typeof fn !== 'function' || is_tsrx_element(fn)) {
		throw_invalid_component_type(fn);
	}

	run_component(fn, props);
}

/**
 * @param {Function} fn
 * @param {Props} props
 * @returns {void}
 */
function run_component(fn, props) {
	push_component();
	try {
		const value = fn(props);
		if (is_tsrx_element(value)) {
			render_tsrx_element(value);
		} else {
			render_expression(value);
		}
	} finally {
		pop_component();
	}
}

/**
 * @param {any} value
 * @returns {never}
 */
function throw_invalid_component_type(value) {
	if (is_tsrx_element(value)) {
		throw new TypeError('Invalid component type: received a TSRXElement value.');
	}

	throw new TypeError('Invalid component type: expected a component function.');
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
	/** @type {{ before: string, between: string, after: string } | null} */
	#stream_template = null;
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
	/** @type {null | FlushUnit} */
	unit = null;
	/** @type {NestedArray<string> | null} */
	#content_redirect = null;
	/** @type {NestedArray<string> | null} */
	#head_redirect = null;
	// streaming state, only used on the root instance
	#next_unit_id = 1;
	/** @type {FlushUnit[]} */
	#units = [];
	/** @type {WeakMap<NestedArray<string>, FlushUnit>} */
	#unit_slots = new WeakMap();
	/** @type {Set<string>} */
	#sent_css = new Set();
	#shell_flushed = false;

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
			// branches created after a flush unit sealed its slot belong to the
			// unit's detached content tree, not to the already-shaped slot
			(parent.#content_redirect ?? parent.#body).push(this.#body);
			(parent.#head_redirect ?? parent.#head).push(this.#head);
		}
	}

	/**
	 * @param {string} str
	 * @param {boolean} [is_root=false]
	 * @param {boolean} [is_prepend=false]
	 * @returns {void}
	 */
	#push(str, is_root = false, is_prepend = false) {
		var instance = is_root ? this.#root : this;

		// we never write to `head` in the root instance
		if (instance !== this.#root && instance.target === 'head') {
			var head = instance.#head_redirect ?? instance.#head;
			if (is_prepend) {
				head.unshift(str);
			} else {
				head.push(str);
			}
			return;
		}

		var body = instance.#content_redirect ?? instance.#body;
		if (is_prepend) {
			body.unshift(str);
		} else {
			body.push(str);
		}
	}

	/**
	 * @param {string} str
	 * @returns {void}
	 */
	push(str) {
		this.#push(str);
	}

	/**
	 * @param {string} str
	 * @returns {void}
	 */
	push_serialized_error(str) {
		var root = this.#root;
		if (root.#streamOutput !== null && root.#shell_flushed) {
			// past the shell the root buffer is already on the wire — emit the
			// envelope directly so it reaches the document before any chunk
			// whose hydration depends on it
			root.#streamOutput.push(str);
			return;
		}
		// prepend to the root block to avoid messing up the hydration markers
		// writing to the root to avoid being cleared in the local instance when an error occurs
		this.#push(str, true, true);
	}

	/**
	 * @param {string} str
	 * @returns {void}
	 */
	push_serialized_result(str) {
		var root = this.#root;
		if (root.#streamOutput !== null && !root.#sync_run) {
			var unit = this.#nearest_unflushed_unit();
			if (unit !== null) {
				// ships with the unit's chunk, ahead of the template, so the
				// boundary can hydrate from it synchronously
				unit.scripts.push(str);
				return;
			}
			if (root.#shell_flushed) {
				root.#streamOutput.push(str);
				return;
			}
		}
		this.#push(str);
	}

	clear() {
		if (this.#content_redirect !== null) {
			// a sealed flush unit clears its detached content, never the slot
			this.#content_redirect.length = 0;
			/** @type {NestedArray<string>} */ (this.#head_redirect).length = 0;
			/** @type {FlushUnit} */ (this.unit).scripts.length = 0;
			return;
		}
		this.#head.length = 0;
		this.#body.length = 0;
		this.#css.clear();
	}

	/**
	 * @param {string} hash
	 * @returns {void}
	 */
	register_css(hash) {
		var root = this.#root;
		if (root.#streamOutput !== null && !root.#sync_run) {
			var unit = this.#nearest_unflushed_unit();
			if (unit !== null) {
				unit.css.add(hash);
				return;
			}
			if (root.#shell_flushed) {
				if (!root.#sent_css.has(hash)) {
					root.#sent_css.add(hash);
					var css_text = get_css_text(new Set([hash]));
					if (css_text) {
						root.#streamOutput.push('<style data-ripple-ssr>' + css_text + '</style>');
					}
				}
				return;
			}
		}
		root.#css.add(hash);
	}

	/**
	 * @returns {FlushUnit | null}
	 */
	#nearest_unflushed_unit() {
		/** @type {Output | null} */
		var output = this;
		while (output !== null) {
			var unit = output.unit;
			// an unsealed unit is still rendering its slot (wrapper + fallback),
			// which ships with the enclosing region — keep walking up
			if (unit !== null && !unit.flushed && unit.sealed) {
				return unit;
			}
			output = output.#parent;
		}
		return null;
	}

	/**
	 * @returns {FlushUnit | null}
	 */
	nearestUnflushedUnit() {
		return this.#nearest_unflushed_unit();
	}

	/**
	 * Whether the region this output writes into has already been streamed —
	 * its bytes are on the wire and can no longer be replaced server-side.
	 * @returns {boolean}
	 */
	isRegionSent() {
		/** @type {Output | null} */
		var output = this;
		while (output !== null) {
			if (output.unit !== null) {
				return output.unit.flushed;
			}
			output = output.#parent;
		}
		return this.#root.#shell_flushed;
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
		var unit = this.unit;
		if (unit !== null && !unit.flushed && !unit.settled && this.#async_operations.size === 0) {
			unit.settled = true;
			this.#root._maybeFlushUnit(unit);
		}
	}

	cancelAsyncOperations() {
		for (const operation of this.#async_operations) {
			operation.cancel();
			this.#async_operations.delete(operation);
			this.clear();
			this.#root._decrementPending();
		}
	}

	/**
	 * @returns {boolean}
	 */
	hasPendingAsyncOperations() {
		return this.#async_operations.size > 0;
	}

	/**
	 * Marks the flush unit of a boundary abandoned by an ancestor error as
	 * done so it can never stream a stale chunk.
	 * @returns {void}
	 */
	abandonUnit() {
		var unit = this.unit;
		if (unit !== null && !unit.flushed) {
			unit.settled = true;
			unit.flushed = true;
		}
	}

	/**
	 * Converts this try-block output into a streaming flush unit: the
	 * partially-rendered body (whose holes async re-runs fill in place) is
	 * detached as the unit's content tree, and the now-empty live buffer
	 * becomes the slot that receives the wrapper markers and fallback.
	 * @param {Block} block
	 * @returns {FlushUnit}
	 */
	_createFlushUnit(block) {
		var root = this.#root;
		/** @type {FlushUnit} */
		var unit = {
			id: root.#next_unit_id++,
			block,
			output: this,
			content: this.#body.splice(0, this.#body.length),
			head: this.#head.splice(0, this.#head.length),
			css: new Set(),
			scripts: [],
			settled: false,
			flushed: false,
			slot_sent: false,
			sealed: false,
			errored: false,
			error: null,
		};
		this.unit = unit;
		root.#unit_slots.set(this.#body, unit);
		root.#units.push(unit);
		return unit;
	}

	/**
	 * Called once the slot (wrapper markers + fallback) is fully rendered:
	 * from here on, direct writes to this output (e.g. a late catch render)
	 * belong to the unit's content, not to the already-shaped slot.
	 * @returns {void}
	 */
	_sealSlot() {
		var unit = /** @type {FlushUnit} */ (this.unit);
		unit.sealed = true;
		this.#content_redirect = unit.content;
		this.#head_redirect = unit.head;
	}

	/**
	 * Flattens a buffer tree to HTML. A nested array that is the slot of a
	 * flush unit gets special treatment: a settled, unflushed, non-errored
	 * unit is inlined (coalesced into the current chunk, merging its css,
	 * scripts and head); anything else emits the slot as-is (wrapper +
	 * fallback) and is marked sent so the unit may flush itself later.
	 * @param {NestedArray<string>} tree
	 * @param {StreamChunk} chunk
	 * @returns {string}
	 */
	#serialize(tree, chunk) {
		var out = '';
		for (var i = 0; i < tree.length; i++) {
			var item = tree[i];
			if (typeof item === 'string') {
				out += item;
				continue;
			}
			var unit = this.#unit_slots.get(item);
			if (unit !== undefined && !unit.flushed) {
				if (unit.settled && !unit.errored) {
					out += this.#collect_unit(unit, chunk);
					continue;
				}
				unit.slot_sent = true;
			}
			out += this.#serialize(item, chunk);
		}
		return out;
	}

	/**
	 * @param {FlushUnit} unit
	 * @param {StreamChunk} chunk
	 * @returns {string} the unit's content HTML
	 */
	#collect_unit(unit, chunk) {
		unit.flushed = true;
		for (var hash of unit.css) {
			chunk.css.add(hash);
		}
		for (var i = 0; i < unit.scripts.length; i++) {
			chunk.scripts.push(unit.scripts[i]);
		}
		chunk.head += this.#serialize(unit.head, chunk);
		return this.#serialize(unit.content, chunk);
	}

	/**
	 * @param {Set<string>} hashes
	 * @returns {string}
	 */
	#chunk_css(hashes) {
		/** @type {Set<string>} */
		var fresh = new Set();
		for (var hash of hashes) {
			if (!this.#sent_css.has(hash)) {
				this.#sent_css.add(hash);
				fresh.add(hash);
			}
		}
		if (fresh.size === 0) {
			return '';
		}
		var css_text = get_css_text(fresh);
		return css_text ? '<style data-ripple-ssr>' + css_text + '</style>' : '';
	}

	/**
	 * @param {FlushUnit} unit
	 * @returns {void}
	 */
	_maybeFlushUnit(unit) {
		if (!this.#is_root) {
			throw new Error('_maybeFlushUnit() is an internal method.');
		}
		if (this.#streamOutput === null || this.#stream_finished || !this.#shell_flushed) {
			return;
		}
		if (!unit.settled || unit.flushed || !unit.slot_sent) {
			return;
		}
		this.#flush_unit(unit);
		this.#sweep_units();
	}

	/**
	 * @param {FlushUnit} unit
	 * @returns {void}
	 */
	#flush_unit(unit) {
		var sink = /** @type {StreamSink} */ (this.#streamOutput);
		if (unit.errored) {
			unit.flushed = true;
			sink.push(
				'<script id="' +
					STREAM_ERROR_SCRIPT_PREFIX +
					unit.id +
					'" type="application/json">' +
					escape_script(JSON.stringify({ message: unit.error })) +
					'</script>' +
					'<script>__RIPPLE_S__(' +
					unit.id +
					',1)</script>',
			);
			return;
		}
		/** @type {StreamChunk} */
		var chunk = { css: new Set(), scripts: [], head: '' };
		var html = this.#collect_unit(unit, chunk);
		var out = this.#chunk_css(chunk.css);
		if (chunk.head !== '') {
			out += '<template ' + STREAM_HEAD_ATTR + '="' + unit.id + '">' + chunk.head + '</template>';
		}
		out += chunk.scripts.join('');
		out += '<template ' + STREAM_CHUNK_ATTR + '="' + unit.id + '">' + html + '</template>';
		out += '<script>__RIPPLE_S__(' + unit.id + ')</script>';
		sink.push(out);
	}

	/**
	 * Flushes every unit whose slot has been sent and whose async work has
	 * settled. Flushing a parent chunk marks nested unsettled slots as sent,
	 * which can make further units eligible — loop until a fixpoint.
	 * @returns {void}
	 */
	#sweep_units() {
		var units = this.#units;
		var progressed = true;
		while (progressed) {
			progressed = false;
			for (var i = 0; i < units.length; i++) {
				var unit = units[i];
				if (unit.settled && !unit.flushed && unit.slot_sent) {
					this.#flush_unit(unit);
					progressed = true;
				}
			}
		}
	}

	/**
	 * Emits the shell: everything rendered synchronously (suspended
	 * boundaries show their fallback inside `<!--[?N-->…<!--]-->` slots), all
	 * CSS registered so far, and — when unresolved slots remain — the inline
	 * swap runtime that later chunks call into.
	 * @returns {void}
	 */
	_streamShell() {
		if (!this.#is_root) {
			throw new Error('_streamShell() is an internal method.');
		}
		var sink = /** @type {StreamSink} */ (this.#streamOutput);
		this._startStream();
		/** @type {StreamChunk} */
		var chunk = { css: new Set(), scripts: [], head: '' };
		var head_html = this.#serialize(this.#head, chunk);
		var body = this.#serialize(this.#body, chunk);
		if (this.unit !== null && !this.unit.flushed) {
			// the root boundary's slot is the shell body itself
			this.unit.slot_sent = true;
		}
		for (var hash of this.#css) {
			chunk.css.add(hash);
		}
		var template = this.#stream_template;
		var out = template !== null ? template.before : '';
		out += head_html + chunk.head + this.#chunk_css(chunk.css) + chunk.scripts.join('');
		if (template !== null) {
			out += template.between;
		}
		if (this.unit !== null) {
			// the root boundary suspended: its slot IS the body (the body
			// markers travel with the unit's content instead), so the slot
			// marker doubles as the hydration anchor and is unambiguously
			// root-owned
			out += body;
		} else {
			out += BLOCK_OPEN + body + BLOCK_CLOSE;
		}
		var has_open_units = false;
		for (var i = 0; i < this.#units.length; i++) {
			if (!this.#units[i].flushed) {
				has_open_units = true;
				break;
			}
		}
		if (has_open_units) {
			out += STREAM_RUNTIME_SCRIPT;
		}
		sink.push(out);
		this.#shell_flushed = true;
		this.#sweep_units();
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
	 * @param {{ before: string, between: string, after: string } | null} [template]
	 */
	_setStream(stream, template = null) {
		if (this.#is_root) {
			this.#streamOutput = stream;
			this.#stream_template = template;
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
				if (this.#stream_template !== null && this.#stream_template.after !== '') {
					this.#streamOutput.push(this.#stream_template.after);
				}
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
				output._setStream(options.stream, options.streamTemplate ?? null);
			}
			render_component(component, {});
			output._decrementPending();
			output._finishSyncRun();
		},
		(error) => {
			// We're not going to send the error in the stream via stream.error()
			// as we should send the error template

			// store the error to be returned
			top_level_error = error;
			const output = /** @type {Block | null} */ (root_block)?.o;
			if (output?.isSyncRun()) {
				output._decrementPending();
				output._finishSyncRun();
			}
			if (options.rootBoundary?.catch) {
				render_component(options.rootBoundary.catch, { error, reset: noop });
			} else {
				console.error(error);
			}
		},
		() => {
			if (options.rootBoundary?.pending) {
				render_component(options.rootBoundary.pending, {});
			}
		},
	);

	const output = /** @type {Block} */ (/** @type {unknown} */ (root_block)).o;
	if (output.isStreamMode()) {
		// shell: sync content + fallbacks in open slots + css + swap runtime
		output._streamShell();
	}

	await output.promise;
	reset_state();

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
 * @param {string} str
 * @returns {void}
 */
export function output_push_serialized_error(str) {
	/** @type {Block} */ (active_block).o.push_serialized_error(str);
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

	return (tracked.f & DERIVED) !== 0
		? get_derived(/** @type {Derived} */ (tracked))
		: get_tracked(/** @type {Tracked} */ (tracked));
}

/**
 * @param {Tracked} tracked
 * @returns {any}
 */
export function get_tracked(tracked) {
	if (tracking) {
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
 * @param {Derived} tracked
 * @returns {any}
 */
export function get_derived(tracked) {
	update_derived(tracked);
	if (tracking) {
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
 * @param {any} lazy
 * @param {number} [index]
 * @returns {any}
 */
export function lazy_array_get(lazy, index = 0) {
	if (is_array(lazy)) {
		return lazy[index];
	}
	var flags = lazy.f;
	if (flags === TRACKED) {
		return index === 0
			? get_tracked(/** @type {Tracked} */ (lazy))
			: index === 1
				? lazy
				: undefined;
	}
	if (flags === DERIVED) {
		return index === 0
			? get_derived(/** @type {Derived} */ (lazy))
			: index === 1
				? lazy
				: undefined;
	}
	return iterable_array_from(lazy, index)[0];
}

/**
 * @param {any} lazy
 * @param {number} [index]
 * @returns {any[]}
 */
export function lazy_array_rest(lazy, index = 0) {
	if (is_array(lazy)) {
		return lazy.slice(index);
	}
	var flags = lazy.f;
	if (flags === TRACKED) {
		return index === 0
			? [get_tracked(/** @type {Tracked} */ (lazy)), lazy]
			: index === 1
				? [lazy]
				: [];
	}
	if (flags === DERIVED) {
		return index === 0
			? [get_derived(/** @type {Derived} */ (lazy)), lazy]
			: index === 1
				? [lazy]
				: [];
	}
	return iterable_array_from(lazy, index);
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
 * @param {any} lazy
 * @param {any} value
 * @param {number} [index]
 * @returns {void}
 */
export function lazy_array_set(lazy, value, index = 0) {
	if (is_array(lazy)) {
		lazy[index] = value;
		return;
	}
	var flags = lazy.f;
	if (flags === TRACKED || flags === DERIVED) {
		if (index === 0) {
			set(/** @type {Derived | Tracked} */ (lazy), value);
			return;
		}
		if (index === 1) {
			throw_tracked_index_reference_error();
		}
		return;
	}
	lazy[index] = value;
}

/**
 * @param {any} lazy
 * @param {number} [index]
 * @param {number} [d]
 * @returns {number}
 */
export function lazy_array_update(lazy, index = 0, d = 1) {
	var value = lazy_array_get(lazy, index);
	var result = d === 1 ? value++ : value--;
	lazy_array_set(lazy, value, index);
	return result;
}

/**
 * @param {any} lazy
 * @param {number} [index]
 * @param {number} [d]
 * @returns {number}
 */
export function lazy_array_update_pre(lazy, index = 0, d = 1) {
	var value = lazy_array_get(lazy, index);
	var new_value = d === 1 ? ++value : --value;
	lazy_array_set(lazy, new_value, index);
	return new_value;
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
 * @param {string} [exclude_prop]
 * @returns {string}
 */
export function spread_attrs(attrs, css_hash, exclude_prop) {
	let attr_str = '';
	let name;

	if (css_hash === undefined && Object.prototype.hasOwnProperty.call(attrs, '#class')) {
		css_hash = attrs['#class'];
	}

	for (name in attrs) {
		var value = attrs[name];

		if (
			name === 'children' ||
			name === 'innerHTML' ||
			name === '#class' ||
			name === exclude_prop ||
			typeof value === 'function' ||
			is_tsrx_element(value)
		)
			continue;

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

/**
 * @param {Record<string, any>} attrs
 * @returns {string | undefined}
 */
export function spread_inner_html(attrs) {
	if (!Object.prototype.hasOwnProperty.call(attrs, 'innerHTML')) {
		return undefined;
	}

	var value = attrs.innerHTML;

	if (is_ripple_object(value)) {
		value = get(value);
	}

	return String(value ?? '');
}

var empty_get_set = { get: undefined, set: undefined };

class TrackedValue {
	/**
	 * @param {any} v
	 * @param {{ get?: Function; set?: Function }} a
	 * @param {string} hash
	 */
	constructor(v, a, hash) {
		/** @type {{ get?: Function; set?: Function }} */
		this.a = a;
		/** @type {AbortController | null} */
		this.aa = null;
		/** @type {PromiseLike<any> | null} */
		this.ap = null;
		/** @type {Block} */
		this.b = /** @type {Block} */ (active_block);
		/** @type {number} */
		this.c = 0;
		/** @type {number} */
		this.f = TRACKED;
		/** @type {string} */
		this.h = hash;
		/** @type {any} */
		this.v = v;
	}
	/** @returns {any} */
	get [0]() {
		return throw_tracked_index_value_error();
	}
	/** @param {any} v */
	set [0](v) {
		throw_tracked_index_value_error();
	}
	/** @returns {Tracked} */
	get [1]() {
		return throw_tracked_index_reference_error();
	}
	/** @returns {any} */
	get value() {
		return get_tracked(/** @type {Tracked} */ (this));
	}
	/** @param {any} v */
	set value(v) {
		set(/** @type {Tracked} */ (this), v);
	}
	/** @returns {2} */
	get length() {
		return 2;
	}
	/** @returns {Iterator<any | Tracked>} */
	*[Symbol.iterator]() {
		yield get_tracked(/** @type {Tracked} */ (this));
		yield this;
	}
}

class DerivedValue {
	/**
	 * @param {Function} fn
	 * @param {{ get?: Function; set?: Function }} a
	 * @param {string} hash
	 */
	constructor(fn, a, hash) {
		/** @type {{ get?: Function; set?: Function }} */
		this.a = a;
		// we always should have an active block
		/** @type {Block} */
		this.b = /** @type {Block} */ (active_block);
		/** @type {number} */
		this.c = 0;
		/** @type {Component | null} */
		this.co = active_component;
		/** @type {Dependency | null} */
		this.d = null;
		/** @type {number} */
		this.f = DERIVED;
		/** @type {Function} */
		this.fn = fn;
		/** @type {string} */
		this.h = hash;
		/** @type {any} */
		this.v = UNINITIALIZED;
	}
	/** @returns {any} */
	get [0]() {
		return throw_tracked_index_value_error();
	}
	/** @param {any} v */
	set [0](v) {
		throw_tracked_index_value_error();
	}
	/** @returns {Derived} */
	get [1]() {
		return throw_tracked_index_reference_error();
	}
	/** @returns {any} */
	get value() {
		return get_derived(/** @type {Derived} */ (this));
	}
	/** @param {any} v */
	set value(v) {
		set(/** @type {Derived} */ (this), v);
	}
	/** @returns {2} */
	get length() {
		return 2;
	}
	/** @returns {Iterator<any | Derived>} */
	*[Symbol.iterator]() {
		yield get_derived(/** @type {Derived} */ (this));
		yield this;
	}
}

/**
 * @param {any} v
 * @param {string} hash
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked}
 */
function tracked(v, hash, get, set) {
	return /** @type {Tracked} */ (
		new TrackedValue(v, get || set ? { get, set } : empty_get_set, hash)
	);
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
 * @param {string} hash
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Derived}
 */
function derived(v, hash, get, set) {
	return /** @type {Derived} */ (
		new DerivedValue(v, get || set ? { get, set } : empty_get_set, hash)
	);
}

/**
 * @param {any} v
 * @param {string} hash
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked | Derived}
 */
export function track(v, hash, get, set) {
	var is_tracked = is_ripple_object(v);

	if (is_tracked) {
		return v;
	}

	if (typeof v === 'function') {
		return derived(v, hash, get, set);
	}

	return tracked(v, hash, get, set);
}

/**
 * Serializes a resolved trackAsync result as a script tag for hydration.
 * @param {OutputInterface} output - The output push function captured at call time
 * @param {string} hash - The unique hash for this trackAsync call
 * @param {any} value - The resolved value
 * @param {string[] | null} [deps] - Hashes of direct reactive dependencies read by fn()
 * @returns {void}
 */
function serialize_track_async_result(output, hash, value, deps) {
	/** @type {{ ok: true, payload: string, deps?: string[] }} */
	var envelope = { ok: true, payload: devalue.stringify(value) };
	if (deps && deps.length > 0) {
		envelope.deps = deps;
	}
	push_script_for_hydration((str) => output.push_serialized_result(str), hash, envelope);
}

/**
 * Serializes a rejected trackAsync error as a script tag for hydration.
 * Must be called after route_error_to_catch_block so active_block is the catch block.
 * @param {string} hash
 * @param {any} error
 * @returns {void}
 */
export function serialize_track_async_error(hash, error) {
	var error_message = get_public_track_async_error_message(error);

	// we can just use the output_push_serialized directly so it's added to the root block
	// if we here then the try's block failed to render and the output was cleared
	// so we're writing to the root otherwise it will be cleared in the local output
	push_script_for_hydration(output_push_serialized_error, hash, {
		ok: false,
		error: { message: error_message },
	});
}

/**
 * @param {string} hash
 * @param {any} error
 * @returns {void}
 */
export function route_track_async_error_to_catch_block(hash, error) {
	route_track_async_error_to_catch_block_with_boundary(
		get_closest_catch_block(/** @type {Block} */ (active_block)),
		hash,
		error,
	);
}

/**
 * @param {any} error
 * @returns {any}
 */
export function create_public_track_async_error(error) {
	if (DEV) {
		return error;
	}

	return new Error(get_public_track_async_error_message(error));
}

/**
 * We avoid leaking arbitrary server errors in production while still keeping
 * rich error messages in development and tests.
 * @param {any} error
 * @returns {string}
 */
function get_public_track_async_error_message(error) {
	if (DEV) {
		return error?.message ?? String(error);
	}
	return 'An error occurred during async rendering';
}

/**
 * Routes trackAsync errors to a catch boundary and serializes the same
 * public error for hydration, preventing SSR/hydration message mismatches.
 * @param {TryBlockWithCatch} catch_block
 * @param {string} hash
 * @param {any} error
 * @returns {void}
 */
function route_track_async_error_to_catch_block_with_boundary(catch_block, hash, error) {
	var public_error = create_public_track_async_error(error);
	route_error_to_catch_block(catch_block, public_error);
	// has to run after routing as it sets the active_block to the catch block
	serialize_track_async_error(hash, public_error);
}

/**
 * Turns a try boundary whose body suspended into a streaming flush unit:
 * the partially-rendered body is detached (async re-runs keep filling its
 * holes in place) and the live slot receives the `<!--[?N-->` wrapper with
 * the pending fallback (nothing for catch-only boundaries).
 * @param {Block} block
 * @param {(() => void) | null} pending_fn
 * @returns {void}
 */
export function begin_stream_unit(block, pending_fn) {
	var output = block.o;
	var unit = output._createFlushUnit(block);
	if (block.f & ROOT_BLOCK) {
		// a user try body carries its own compiled <!--[-->…<!--]--> markers;
		// the root boundary's content does not — add them so every unit's
		// content hydrates (and swaps) through the same shape
		unit.content.unshift(BLOCK_OPEN);
		unit.content.push(BLOCK_CLOSE);
	}
	output.push('<!--' + HYDRATION_START_PENDING + unit.id + '-->');
	if (pending_fn !== null) {
		pending_fn();
	}
	output.push(BLOCK_CLOSE);
	output._sealSlot();
}

/**
 * Handles an error surfaced by async rendering work after the initial sync
 * pass: routes it to the nearest catch boundary when that boundary's region
 * can still be rendered server-side, otherwise marks the nearest unflushed
 * flush unit as errored so the client resolves the boundary at hydration.
 * @param {Block} origin_block
 * @param {Block} op_block
 * @param {string | null} hash
 * @param {any} error
 * @returns {void}
 */
function handle_async_render_error(origin_block, op_block, hash, error) {
	var catch_block = get_closest_catch_block(origin_block);

	if (catch_block.o.isStreamMode() && catch_block.o.isRegionSent()) {
		fail_stream_unit(op_block, error);
		return;
	}

	if (hash !== null) {
		route_track_async_error_to_catch_block_with_boundary(catch_block, hash, error);
	} else {
		route_error_to_catch_block(catch_block, error);
	}
	settle_unit_after_catch(catch_block);
}

/**
 * The nearest catch boundary's bytes are already on the wire — emit a
 * unit-level error envelope instead, so the client routes the error into the
 * live boundary during hydration.
 * @param {Block} op_block
 * @param {any} error
 * @returns {void}
 */
function fail_stream_unit(op_block, error) {
	var unit = op_block.o.nearestUnflushedUnit();
	if (unit === null) {
		// everything around the failure is already streamed — nothing the
		// server can do beyond reporting it
		console.error(error);
		return;
	}
	cancel_async_operations(unit.block);
	unit.errored = true;
	unit.error = get_public_track_async_error_message(error);
	unit.settled = true;
	unit.output.root._maybeFlushUnit(unit);
}

/**
 * After a catch branch rendered into a boundary's buffers, the enclosing
 * flush unit may have no outstanding async work left (it was cancelled) —
 * settle and flush it.
 * @param {Block} catch_block
 * @returns {void}
 */
function settle_unit_after_catch(catch_block) {
	var output = catch_block.o;
	if (!output.isStreamMode()) {
		return;
	}
	var unit = output.nearestUnflushedUnit();
	if (unit !== null && !unit.settled && !unit.output.hasPendingAsyncOperations()) {
		unit.settled = true;
		unit.output.root._maybeFlushUnit(unit);
	}
}

/**
 * @param {(str: string) => void} push_fn
 * @param {string} hash
 * @param {object} envelope - The envelope containing the serialized data
 * @envelope {ok: boolean, payload?: any, error?: { message: string } }
 * @returns {void}
 */
function push_script_for_hydration(push_fn, hash, envelope) {
	var serialized_envelope = escape_script(JSON.stringify(envelope));

	push_fn(
		'<script id="' +
			get_track_async_script_id(hash) +
			'" type="application/json">' +
			serialized_envelope +
			'</script>',
	);
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
	/** @type {Dependency | null} */
	var direct_deps = null;
	var caught = false;

	try {
		result = fn();
		direct_deps = active_dependency;
	} catch (error) {
		caught_dep = active_dependency;
		caught = true;

		if (error !== ASYNC_DERIVED_READ_THROWN) {
			throw new TrackAsyncRunError('Error thrown during trackAsync execution', {
				cause: /** @type {Error} */ (error),
				tracked: t,
			});
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
						handle_async_render_error(block, get_closest_try_block(block), t.h, error);
					},
				);
				return;
			}
			dep = dep.n;
		}
		return;
	}

	var dep_hashes = collect_dep_hashes(direct_deps);

	// Handle the result
	var async_result = get_async_track_result(result);

	if (async_result === null) {
		// Sync result
		update_tracked_value_clock(t, result);
		serialize_track_async_result(t.b.o, t.h, result, dep_hashes);
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
			serialize_track_async_result(t.b.o, t.h, resolved, dep_hashes);
			if (dr) {
				dr(resolved);
			}
		},
		(error) => {
			update_tracked_value_clock(t, SUSPENSE_REJECTED);
			if (dj) {
				dj(error);
			}
			handle_async_render_error(block, get_closest_try_block(block), t.h, error);
		},
	);
}

/**
 * Walks a dependency chain and collects the hashes of dependencies that have
 * one (i.e. were created from a compile-time track/trackAsync call).
 * @param {Dependency | null} head
 * @returns {string[] | null}
 */
function collect_dep_hashes(head) {
	/** @type {string[] | null} */
	var hashes = null;
	var dep = head;
	while (dep !== null) {
		var h = /** @type {{ h?: string }} */ (dep.t).h;
		if (h !== undefined) {
			if (hashes === null) hashes = [];
			hashes.push(h);
		}
		dep = dep.n;
	}
	return hashes;
}

/**
 * @param {any} v
 * @param {string} hash - Unique hash for SSR serialization/hydration
 * @returns {Tracked | void}
 */
export function track_async(v, hash) {
	if (is_ripple_object(v)) {
		return v;
	}

	if (typeof v !== 'function') {
		throw new TypeError(
			'trackAsync() only accepts function arguments that return a promise or an object with a promise property',
		);
	}

	var t = tracked(SUSPENSE_PENDING, hash);
	run_track_async(t, v, t.b, null, null);
	return t;
}

/**
 * @param {(Derived | Tracked) | (() => any)} t
 * @returns {boolean}
 */
export function is_tracked_pending(t) {
	try {
		if (typeof t === 'function') {
			t();
		} else {
			get(t);
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
	// async work is accounted on the nearest try boundary (in stream mode
	// that boundary becomes the flush unit); errors still route to the
	// nearest catch boundary separately
	var op_block = get_closest_try_block(block);
	var operation = {
		cancel: () => {
			cancelled = true;
			if (t && t.aa) {
				t.aa.abort(TRACKED_UPDATED);
				t.aa = null;
				t.ap = null;
			}
		},
	};

	op_block.o.registerAsync(operation);
	/** @type {PromiseLike<any>} */ (/** @type {Tracked} */ (t).ap).then(
		() => {
			if (cancelled) {
				return;
			}
			reset_state();
			try {
				run_block(block);
				op_block.o.resolveAsync(operation);
			} catch (error) {
				if (error instanceof TrackAsyncRunError) {
					var {
						cause,
						tracked: { h: hash },
					} = /** @type {InstanceType<typeof TrackAsyncRunError>} */ (error);
					handle_async_render_error(block, op_block, hash, cause);
				} else {
					handle_async_render_error(block, op_block, null, error);
				}
			}
		},
		(error) => {
			if (cancelled) {
				return;
			}
			handle_async_render_error(block, op_block, /** @type {Tracked} */ (t).h, error);
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
		if (error === ASYNC_DERIVED_READ_THROWN) {
			// regardless of the render mode we re-run the block when the
			// dependency's promise resolves; the block's buffer keeps its place
			// in the output tree, so the surrounding markup renders on with a
			// hole here. In stream mode the enclosing try boundary checks after
			// its body ran whether async work registered on it and becomes a
			// flush unit if so.
			register_block_rerun(block);
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

export { dynamic_element } from './dynamic.js';
