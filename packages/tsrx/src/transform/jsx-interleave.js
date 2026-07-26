/**
 * Helpers for preserving source-order semantics when non-JSX statements are
 * interleaved with JSX children inside a component or element body.
 *
 * Without these, targets like React and Solid would hoist all statements
 * before any JSX is constructed, so mutations between sibling JSX children
 * would be observed by every sibling instead of only the ones that appear
 * textually after the mutation.
 */

/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import * as b from '../utils/builders.js';

/**
 * A JSX child that evaluates to a single expression, so it can be captured
 * into a `const` at its source position.
 * @typedef {ESTreeJSX.JSXElement
 *   | ESTreeJSX.JSXFragment
 *   | (ESTreeJSX.JSXExpressionContainer & { expression: AST.Expression })} CapturableJsxChild
 */

/**
 * Returns true when the body contains a non-JSX statement that appears
 * after a JSX child. In that case JSX children must be captured at their
 * source position so mutations in following statements do not retroactively
 * change what earlier children rendered.
 *
 * The `is_jsx_child` predicate is target-specific — each target recognizes
 * its JSX-bearing child nodes and template-control expressions.
 *
 * @param {AST.Node[]} body_nodes
 * @param {(node: AST.Node) => boolean} is_jsx_child
 * @returns {boolean}
 */
export function is_interleaved_body(body_nodes, is_jsx_child) {
	let seen_jsx = false;
	for (const child of body_nodes) {
		if (is_jsx_child(child)) {
			seen_jsx = true;
		} else if (seen_jsx) {
			return true;
		}
	}
	return false;
}

/**
 * Only JSX nodes that evaluate to a single expression can be hoisted into a
 * `const`. Static text children (`JSXText`) and comment-only containers
 * (`{/* … *\/}`) are inert and don't need capturing — their position relative
 * to mutations doesn't change output, and neither has an expression to bind.
 *
 * @param {AST.Node | null | undefined} jsx
 * @returns {jsx is CapturableJsxChild}
 */
export function is_capturable_jsx_child(jsx) {
	if (!jsx) return false;
	// Reactive-block containers (dynamic tags) must stay expression children
	// so the host JSX compiler wraps them in a render block; capturing them
	// into a const would evaluate them once.
	if (jsx.metadata?.tsrx_reactive_block === true) return false;
	const t = jsx.type;
	if (t === 'JSXExpressionContainer') return jsx.expression.type !== 'JSXEmptyExpression';
	return t === 'JSXElement' || t === 'JSXFragment';
}

/**
 * Build a `VariableDeclaration` that captures a JSX child into a const at
 * its source position, along with a JSXExpressionContainer referencing the
 * capture. The caller inserts the declaration into the enclosing block's
 * statements in source order and uses the reference in place of the JSX
 * child inside the returned fragment.
 *
 * @param {CapturableJsxChild} jsx
 * @param {number} capture_index
 * @param {(id: AST.Identifier, init: AST.Expression) => AST.Identifier} [anchor_id] gives the
 *   capture's NAME an authored origin — the only anchorable token when the captured
 *   expression itself starts with punctuation
 * @returns {{ declaration: AST.VariableDeclaration, reference: ESTreeJSX.JSXExpressionContainer }}
 */
export function capture_jsx_child(jsx, capture_index, anchor_id) {
	const name = `_tsrx_child_${capture_index}`;
	const init = jsx.type === 'JSXExpressionContainer' ? jsx.expression : jsx;

	const declaration = b.const(anchor_id ? anchor_id(b.id(name), init) : b.id(name), init);

	// NOTE: JSXExpressionContainer nodes are intentionally created without
	// loc — they're synthetic wrappers whose source positions don't
	// correspond to source-map entries and adding loc causes Volar mapping
	// failures.
	const reference = b.jsx_expression_container(b.id(name));

	return { declaration, reference };
}
