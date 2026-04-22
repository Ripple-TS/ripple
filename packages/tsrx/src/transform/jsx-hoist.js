/** @import * as ESTreeJSX from 'estree-jsx' */

/**
 * Predicates that decide whether a JSX subtree can be safely hoisted out of a
 * component body into a module-level `const`. A subtree is hoist-safe only
 * when evaluating it at module-load time produces the same value as
 * evaluating it on every render — i.e. it contains no identifier references,
 * no calls, no spreads, and no other render-time expressions.
 */

/**
 * @param {import('estree').Literal} node
 * @returns {boolean}
 */
export function is_static_literal(node) {
	return (
		node.value === null ||
		typeof node.value === 'string' ||
		typeof node.value === 'number' ||
		typeof node.value === 'boolean' ||
		typeof node.value === 'bigint'
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_hoist_safe_expression(node) {
	if (!node || typeof node !== 'object') return false;

	switch (node.type) {
		case 'Literal':
			return is_static_literal(node);
		case 'TemplateLiteral':
			return node.expressions.length === 0;
		case 'UnaryExpression':
			return node.operator !== 'delete' && is_hoist_safe_expression(node.argument);
		case 'BinaryExpression':
		case 'LogicalExpression':
			return is_hoist_safe_expression(node.left) && is_hoist_safe_expression(node.right);
		case 'ConditionalExpression':
			return (
				is_hoist_safe_expression(node.test) &&
				is_hoist_safe_expression(node.consequent) &&
				is_hoist_safe_expression(node.alternate)
			);
		case 'SequenceExpression':
			return node.expressions.every(is_hoist_safe_expression);
		case 'ParenthesizedExpression':
			return is_hoist_safe_expression(node.expression);
		case 'JSXElement':
			return is_hoist_safe_jsx_node(node);
		case 'JSXFragment':
			return node.children.every(is_hoist_safe_jsx_child);
		default:
			return false;
	}
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_hoist_safe_jsx_child(node) {
	if (!node || typeof node !== 'object') return false;

	switch (node.type) {
		case 'JSXText':
			return true;
		case 'JSXElement':
			return is_hoist_safe_jsx_node(node);
		case 'JSXFragment':
			return node.children.every(is_hoist_safe_jsx_child);
		case 'JSXExpressionContainer':
			return (
				node.expression.type !== 'JSXEmptyExpression' && is_hoist_safe_expression(node.expression)
			);
		default:
			return false;
	}
}

/**
 * @param {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute} attribute
 * @returns {boolean}
 */
export function is_hoist_safe_jsx_attribute(attribute) {
	if (attribute.type === 'JSXSpreadAttribute') return false;
	if (attribute.value == null) return true;

	if (attribute.value.type === 'Literal') {
		return is_static_literal(attribute.value);
	}

	if (attribute.value.type === 'JSXExpressionContainer') {
		return (
			attribute.value.expression.type !== 'JSXEmptyExpression' &&
			is_hoist_safe_expression(attribute.value.expression)
		);
	}

	return false;
}

/**
 * @param {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} node
 * @returns {boolean}
 */
export function is_hoist_safe_jsx_node(node) {
	if (node.type === 'JSXFragment') {
		return node.children.every(is_hoist_safe_jsx_child);
	}

	return (
		node.openingElement.attributes.every(is_hoist_safe_jsx_attribute) &&
		node.children.every(is_hoist_safe_jsx_child)
	);
}
