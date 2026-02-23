import { TEXT_NODE } from '../../../constants.js';
import { hydrate_node, hydrating, set_hydrate_node } from './hydration.js';
import { get_descriptor } from './utils.js';

/** @type {(() => Node | null)} */
var first_child_getter;
/** @type {(() => Node | null)} */
var next_sibling_getter;
/** @type {(() => Node | null)} */
var last_child_getter;

/** @type {Document} */
export var document;

/** @type {boolean} */
export var is_firefox;

export function init_operations() {
	var node_prototype = Node.prototype;
	var element_prototype = Element.prototype;
	var event_target_prototype = Event.prototype;

	is_firefox = /Firefox/.test(navigator.userAgent);
	document = window.document;

	first_child_getter = /** @type {(() => Node | null)} */ (
		get_descriptor(node_prototype, 'firstChild')?.get
	);
	next_sibling_getter = /** @type {(() => Node | null)} */ (
		get_descriptor(node_prototype, 'nextSibling')?.get
	);
	last_child_getter = /** @type {(() => Node | null)} */ (
		get_descriptor(node_prototype, 'lastChild')?.get
	);

	// the following assignments improve perf of lookups on DOM nodes
	element_prototype.__click = undefined;
	event_target_prototype.__root = undefined;
}

/**
 * @template {Node} N
 * @param {N} node
 * @returns {Node | null}
 */
export function get_first_child(node) {
	return first_child_getter.call(node);
}

/**
 * @template {Node} N
 * @param {N} node
 * @returns {Node | null}
 */
export function get_last_child(node) {
	return last_child_getter.call(node);
}

/**
 * @template {Node} N
 * @param {N} node
 * @param {boolean} [is_text]
 * @returns {Node | null}
 */
export function first_child(node, is_text) {
	if (!hydrating) {
		return get_first_child(node);
	}
	var child = get_first_child(/** @type {Node} */ (hydrate_node));

	// Handles the case where we have `<p>{text}</p>`, where `text` is empty
	if (child === null) {
		child = /** @type {Node} */ (hydrate_node).appendChild(create_text());
	} else if (is_text && child.nodeType !== TEXT_NODE) {
		var text = create_text();
		/** @type {Element | Text | Comment} */ (child)?.before(text);
		set_hydrate_node(text);
		return text;
	}

	set_hydrate_node(child);

	return child;
}

/**
 * @template {Node} N
 * @param {N} node
 * @param {boolean} [is_text]
 * @returns {Node | null}
 */
export function first_child_frag(node, is_text) {
	// During hydration, for fragment templates, hydrate_node is already
	// pointing to the first element of the fragment. Don't descend into it.
	if (hydrating) {
		return hydrate_node;
	}
	var child = /** @type {Text} */ (first_child(node, is_text));

	if (child.nodeType === Node.COMMENT_NODE && child.data === '') {
		return next_sibling(child);
	}
	return child;
}

/**
 * @template {Node} N
 * @param {N} node
 * @returns {Node | null}
 */
export function get_next_sibling(node) {
	return next_sibling_getter.call(node);
}

/**
 * @template {Node} N
 * @param {N} node
 * @param {boolean} [is_text]
 * @returns {Node | null}
 */
export function next_sibling(node, is_text) {
	let next_sibling = hydrating ? hydrate_node : node;
	var last_sibling;

	next_sibling = /** @type {ChildNode | null} */ (
		get_next_sibling(/** @type {ChildNode} */ (next_sibling))
	);
	last_sibling = next_sibling;

	if (!hydrating) {
		return next_sibling;
	}

	// if a sibling {expression} is empty during SSR, there might be no
	// text node to hydrate — we must therefore create one
	if (is_text && next_sibling?.nodeType !== TEXT_NODE) {
		var text = create_text();
		// If the next sibling is `null` and we're handling text then it's because
		// the SSR content was empty for the text, so we need to generate a new text
		// node and insert it after the last sibling
		if (next_sibling === null) {
			/** @type {ChildNode} */ (last_sibling).after(text);
		} else {
			/** @type {ChildNode} */ (next_sibling).before(text);
		}
		set_hydrate_node(text);
		return text;
	}

	set_hydrate_node(next_sibling);

	return next_sibling;
}

export function create_text(value = '') {
	return document.createTextNode(value);
}
