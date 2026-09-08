/** @import { AppendIntoAnchor, Block } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { DESTROYED, UNINITIALIZED } from './constants.js';
import { handle_root_events, release_root_events } from './events.js';
import { active_block } from './runtime.js';
import { hydrating, hydrate_node, set_hydrating, set_hydrate_node } from './hydration.js';
import { is_tsrx_element, tsrx_element } from '../../element.js';

/**
 * @typedef {(anchor: AppendIntoAnchor, block: Block) => void} PortalRender
 * @typedef {{
 *   g: () => Element;
 *   r: PortalRender | null;
 *   c: () => any;
 *   t: Element | typeof UNINITIALIZED;
 *   k: any;
 *   b: Block | null;
 *   e: import('./events.js').RootTargetRef | null;
 *   p: Block | null;
 * }} PortalState
 * @typedef {{
 *   start: Node | null;
 *   end: Node | null;
 *   r: PortalRender | null;
 *   c: any;
 *   a: AppendIntoAnchor;
 *   b: Block;
 * }} PortalBranchState
 */

/**
 * @param {PortalState} s
 */
function run_portal(s) {
	// The render block itself; lets the shared teardown tell destroy from re-run.
	s.p = /** @type {Block} */ (active_block);

	var next_target = s.g();
	var next_children = s.c();

	if (s.t === next_target && s.k === next_children) return;

	if (s.t !== next_target) {
		// The target's delegated root listeners are only released and
		// re-acquired when the target changes — a children-only update must not
		// touch them.
		if (s.e !== null) {
			release_root_events(s.e);
		}
		s.e = handle_root_events(next_target);
	}

	s.t = next_target;
	s.k = next_children;

	if (s.b !== null) {
		destroy_block(s.b);
	}

	// Portal content always appends at the end of its target, so an
	// append-into sentinel replaces a placeholder text anchor: no extra node to
	// create, insert before, or remove on teardown.
	s.b = branch(run_portal_children, 0, {
		start: null,
		end: null,
		r: s.r,
		c: next_children,
		a: { parent: next_target, into: true },
		b: /** @type {Block} */ (s.p),
	});

	return portal_teardown;
}

/**
 * @param {PortalBranchState} state
 */
function run_portal_children(state) {
	var render_children = state.r;
	if (render_children !== null) {
		render_children(state.a, state.b);
		return;
	}
	var children = state.c;
	if (is_tsrx_element(children)) {
		children.render(state.a, state.b);
	}
}

/**
 * Only the destroy path releases the target's listeners; a re-run diffs the
 * target itself in `run_portal`.
 * @this {null}
 * @param {PortalState} s
 */
function portal_teardown(s) {
	var block = /** @type {Block} */ (s.p);
	if ((block.f & DESTROYED) !== 0 && s.e !== null) {
		release_root_events(s.e);
		s.e = null;
	}
}

/**
 * @param {() => Element} get_target
 * @param {PortalRender | null} render_children
 * @param {() => any} get_children
 */
function create_portal(get_target, render_children, get_children) {
	/** @type {PortalState} */
	var state = {
		g: get_target,
		r: render_children,
		c: get_children,
		// current target
		t: UNINITIALIZED,
		// current children value (component form only)
		k: UNINITIALIZED,
		// branch rendering the content into the target
		b: null,
		// delegated root listener ref for the current target
		e: null,
		// the render block, assigned on its first run
		p: null,
	};

	if (!hydrating) {
		render(run_portal, state);
		return;
	}

	// Portals are client-only and don't participate in hydration; the
	// compiler-generated code already advanced past the SSR marker. Disable
	// hydration for the portal content and restore the cursor afterwards.
	var previous_hydrate_node = hydrate_node;
	set_hydrating(false);
	try {
		render(run_portal, state);
	} finally {
		set_hydrating(true);
		set_hydrate_node(/** @type {any} */ (previous_hydrate_node));
	}
}

function no_children() {
	return null;
}

/**
 * Compiler fast path for `<Portal target={...}>...</Portal>`: no props object,
 * component context, or element wrapper — the children render function is
 * fixed for the life of the portal.
 * @param {Node} _anchor
 * @param {() => Element} get_target
 * @param {PortalRender} render_children
 * @returns {void}
 */
export function portal(_anchor, get_target, render_children) {
	create_portal(get_target, render_children, no_children);
}

/**
 * @param {{ target: Element, children: import('../../element.js').TSRXElement }} props
 * @returns {import('../../element.js').TSRXElement}
 */
export function Portal(props) {
	return tsrx_element(function render_portal() {
		create_portal(
			() => props.target,
			null,
			() => props.children,
		);
	});
}
