/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
 */

/**
 * Accessors over the parser's JSX-shaped template AST. Ripple's analyzer and
 * client/server transforms consume the parser AST directly; these helpers keep
 * the JSX node-shape unwrapping (text values, expression children) in one
 * place. Synthesized nodes are memoized on `node.metadata` so the analyzer and
 * transforms — which walk the same tree — always agree on node identity.
 */

import { builders } from '@tsrx/core';
const b = builders;

/**
 * @param {string} value
 * @returns {string}
 */
function decode_jsx_text_entities(value) {
	return value.replace(
		/&(#x[0-9a-fA-F]+|#[0-9]+|amp|quot|apos|lt|gt);/g,
		(/** @type {string} */ match, /** @type {string} */ entity) => {
			if (entity === 'amp') return '&';
			if (entity === 'quot') return '"';
			if (entity === 'apos') return "'";
			if (entity === 'lt') return '<';
			if (entity === 'gt') return '>';
			if (entity.startsWith('#x')) {
				const code_point = Number.parseInt(entity.slice(2), 16);
				return Number.isNaN(code_point) ? match : String.fromCodePoint(code_point);
			}
			if (entity.startsWith('#')) {
				const code_point = Number.parseInt(entity.slice(1), 10);
				return Number.isNaN(code_point) ? match : String.fromCodePoint(code_point);
			}
			return match;
		},
	);
}

/**
 * The rendered text value of a `JSXText` template child. The whitespace
 * collapse is a runtime-only concern: Ripple lowers text to explicit
 * `_$_.text(...)` calls, so insignificant JSX whitespace (runs containing a
 * newline) is trimmed or it would render as literal text. The type-only
 * (`to_ts`) view keeps text verbatim — like the other targets — so it stays
 * faithful to the source and its location; trimming there would leave the node
 * lying about its size, producing a mismatched-length source mapping.
 * @param {ESTreeJSX.JSXText} node
 * @param {boolean} to_ts
 * @returns {string}
 */
export function get_template_text_value(node, to_ts) {
	const value = node.value;
	const normalized = to_ts ? value : /[\r\n]/.test(value) ? value.trim() : value;
	return decode_jsx_text_entities(normalized);
}

/**
 * Whether a template child is insignificant whitespace that renders nothing
 * (a `JSXText` run containing a newline that collapses to ''). Nothing is
 * droppable in the `to_ts` view — text is kept verbatim there.
 * @param {AST.Node} node
 * @param {boolean} to_ts
 * @returns {boolean}
 */
export function is_droppable_template_text(node, to_ts) {
	return (
		node.type === 'JSXText' &&
		get_template_text_value(/** @type {ESTreeJSX.JSXText} */ (node), to_ts) === ''
	);
}

/**
 * A template child rendered through the text path (`_$_.text`/`set_text`):
 * a raw `JSXText`, or a merged text run — a `JSXExpressionContainer` marked
 * `metadata.tsrx_text` produced by `normalize_children` when adjacent
 * text/expression children collapse into one text node.
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_template_text(node) {
	return (
		node.type === 'JSXText' ||
		(node.type === 'JSXExpressionContainer' && node.metadata?.tsrx_text === true)
	);
}

/**
 * A `{ … }` template child rendered through the expression path (not a merged
 * text run).
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_template_expression(node) {
	return node.type === 'JSXExpressionContainer' && node.metadata?.tsrx_text !== true;
}

/**
 * Any text or expression template child (`JSXText` or `JSXExpressionContainer`,
 * merged or not).
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_template_text_or_expression(node) {
	return node.type === 'JSXText' || node.type === 'JSXExpressionContainer';
}

/**
 * The rendered expression of a text/expression template child. A `JSXText`
 * lowers to its (whitespace-collapsed) string literal, memoized on the node so
 * every consumer shares one literal; a container yields its expression.
 * @param {ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer} node
 * @param {boolean} to_ts
 * @returns {AST.Expression}
 */
export function get_template_expression(node, to_ts) {
	if (node.type === 'JSXText') {
		node.metadata ??= { path: [] };
		const metadata = /** @type {{ template_expression?: AST.Literal }} */ (node.metadata);
		if (metadata.template_expression === undefined) {
			const value = get_template_text_value(node, to_ts);
			metadata.template_expression = b.literal(
				value,
				JSON.stringify(value),
				/** @type {AST.NodeWithLocation} */ (/** @type {unknown} */ (node)),
			);
		}
		return metadata.template_expression;
	}
	return /** @type {AST.Expression} */ (node.expression);
}

/**
 * A `{/* comment *​/}` template child — a container holding only a
 * `JSXEmptyExpression`. Renders nothing.
 * @param {AST.Node} node
 * @returns {boolean}
 */
export function is_empty_expression_container(node) {
	return (
		node.type === 'JSXExpressionContainer' && node.expression?.type === 'JSXEmptyExpression'
	);
}

/**
 * The children that actually render: everything except empty statements,
 * insignificant whitespace text, and `{/* comment *​/}` containers.
 * @param {AST.Node[]} children
 * @param {boolean} to_ts
 * @returns {AST.Node[]}
 */
export function rendered_template_children(children, to_ts) {
	return children.filter(
		(child) =>
			child != null &&
			child.type !== 'EmptyStatement' &&
			!is_droppable_template_text(child, to_ts) &&
			!is_empty_expression_container(child),
	);
}
