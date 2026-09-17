/** @import { AppendIntoAnchor, Block } from '#client' */
/** @import { SpreadState } from './attributes.js' */
import { component_invalid } from './errors.js';

import { branch, destroy_block_children, render } from './blocks.js';
import { spread } from './attributes.js';
import { COMPOSITE_BLOCK, DEFAULT_NAMESPACE, NAMESPACE_URI, UNINITIALIZED } from './constants.js';
import { hydrate_node, hydrate_next, hydrating, set_hydrate_node } from './hydration.js';
import { first_child } from './operations.js';
import { active_block, active_namespace, get, set_ns, set_tracking, untrack } from './runtime.js';
import { top_element_to_ns } from './utils.js';
import { push_ns, with_ns } from './template-ns.js';
import { append } from './template.js';
import { is_tsrx_element } from '../../element.js';
import { render_component } from './component.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';

/**
 * @typedef {Function | string | null | undefined | false} CompositeTarget
 * The state of a composite block. A tag target is the block's own DOM range
 * (`start`/`end`, the element) and its attributes the block's own spread; a
 * component target renders in a branch, a child of the block.
 * @typedef {{
 *   start: Element | null;
 *   end: Element | null;
 *   g: () => CompositeTarget;
 *   a: Node | AppendIntoAnchor;
 *   p: () => Record<string, any>;
 *   c: CompositeTarget | typeof UNINITIALIZED;
 *   s: SpreadState | undefined;
 * }} CompositeState
 */

/**
 * @param {CompositeState} state
 */
function run_composite(state) {
	var block = /** @type {Block} */ (active_block);
	// @ts-ignore — get() handles non-tracked values via is_ripple_object() check
	var component = get(state.g());
	var current = state.c;
	var old = state.start;

	if (component === current && typeof component === 'string') {
		// The same tag keeps its element: only the attributes follow the props.
		state.s = spread(/** @type {Element} */ (old), state.p(), state.s);
		return;
	}

	if (current !== UNINITIALIZED) {
		// The previous target's blocks: the children rendered into the element,
		// whose DOM goes with it, or a component's branch, which removes its own.
		destroy_block_children(block, old === null);
		state.s = undefined;
	}
	state.c = component;

	if (typeof component === 'function') {
		if (old !== null) {
			old.remove();
			state.start = state.end = null;
		}
		var anchor = state.a;
		var get_props = state.p;
		// Handle as regular component
		branch(() => {
			var props = untrack(get_props);
			render_component(component, /** @type {Node} */ (anchor), props);
		});
		return;
	}
	if (is_tsrx_element(component)) {
		component_invalid(true);
	}
	if (component == null) {
		if (old !== null) {
			old.remove();
			state.start = state.end = null;
		}
		return;
	}

	// A tag: the element is created in the namespace the tag resolves to.
	var ns = top_element_to_ns(component, active_namespace);
	/** @type {Element} */
	var element;
	if (HYDRATION && hydrating) {
		// Claim the SSR-rendered element instead of creating a new one.
		element = /** @type {Element} */ (hydrate_node);
	} else {
		element =
			ns !== DEFAULT_NAMESPACE
				? document.createElementNS(
						NAMESPACE_URI[ns],
						/** @type {keyof HTMLElementTagNameMap} */ (component),
					)
				: document.createElement(/** @type {keyof HTMLElementTagNameMap} */ (component));
		if (old !== null) {
			// A tag change takes the previous element's place.
			old.before(element);
			old.remove();
		} else {
			append(/** @type {ChildNode | AppendIntoAnchor} */ (state.a), element);
		}
	}
	state.start = state.end = element;

	// The spread reads the props once, tracked: a props change re-runs the
	// block, which diffs the attributes above. The children come from that
	// same read.
	var spread_state = (state.s = spread(element, state.p(), undefined));
	var props = /** @type {Record<string, any>} */ (spread_state.n);
	if (is_tsrx_element(props.children)) {
		/** @type {Node} */
		var child_anchor;
		if (HYDRATION && hydrating) {
			// The server renders children directly inside the element with no
			// extra markers; descend the cursor so they claim those nodes.
			child_anchor = /** @type {Node} */ (first_child(element));
		} else {
			child_anchor = document.createComment('');
			element.appendChild(child_anchor);
		}

		// The children render untracked, as a branch renders its content. The
		// children of a `foreignObject` are HTML whatever namespace the element
		// itself takes.
		var child_ns = component === 'foreignObject' ? DEFAULT_NAMESPACE : ns;
		set_tracking(false);
		if (child_ns !== active_namespace) {
			with_ns(child_ns, () => props.children.render(child_anchor, block, props.children.p));
		} else {
			props.children.render(child_anchor, block, props.children.p);
		}
		set_tracking(true);

		if (HYDRATION && hydrating) {
			// Reset the cursor to the claimed element so sibling traversal
			// continues after it.
			set_hydrate_node(element);
		}
	}
}

/**
 * Renders a dynamic element or component (`<{expr}>`): the block re-runs
 * when the expression or the props change. A tag that stays the same keeps
 * its element and diffs the attributes; a new tag or component replaces the
 * content in place.
 * @param {() => CompositeTarget} get_component
 * @param {Node | AppendIntoAnchor} node
 * @param {() => Record<string, any>} get_props the props literal of the call
 *   site: read once per rendered component (props are plain values), and
 *   re-read as element attributes when the target is a tag
 * @param {keyof typeof NAMESPACE_URI} [namespace] the namespace of the
 *   template the call site sits in, when it is not HTML
 * @returns {void}
 */
export function composite(get_component, node, get_props, namespace) {
	if (HYDRATION && hydrating) {
		// During hydration, `node` may already point at the first real SSR node
		// (e.g. layout children). Only skip forward when we are on an empty
		// comment anchor from a client template placeholder.
		if (/** @type {Node} */ (node).nodeType === 8 && /** @type {Comment} */ (node).data === '') {
			hydrate_next();
		}
	}

	/** @type {CompositeState} */
	var state = {
		start: null,
		end: null,
		g: get_component,
		a: node,
		p: get_props,
		c: UNINITIALIZED,
		s: undefined,
	};
	if (namespace === undefined) {
		render(run_composite, state, COMPOSITE_BLOCK);
		return;
	}
	var previous = push_ns(namespace);
	try {
		render(run_composite, state, COMPOSITE_BLOCK);
	} finally {
		set_ns(previous);
	}
}
