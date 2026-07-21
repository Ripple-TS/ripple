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

import { builders, isTemplateDirective as is_template_directive } from '@tsrx/core';
const b = builders;

export { is_template_directive };

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
 * @returns {node is ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer}
 */
export function is_template_text_or_expression(node) {
	return node.type === 'JSXText' || node.type === 'JSXExpressionContainer';
}

/**
 * The rendered expression of a text/expression template child. A `JSXText`
 * lowers to its (whitespace-collapsed) string literal; a container yields its
 * expression.
 * @param {ESTreeJSX.JSXText | ESTreeJSX.JSXExpressionContainer} node
 * @param {boolean} to_ts
 * @returns {AST.Expression}
 */
export function get_template_expression(node, to_ts) {
	if (node.type === 'JSXText') {
		const value = get_template_text_value(node, to_ts);
		return b.literal(value, JSON.stringify(value), /** @type {AST.NodeWithLocation} */ (node));
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
	return node.type === 'JSXExpressionContainer' && node.expression?.type === 'JSXEmptyExpression';
}

/**
 * An `@else if` chain link: the parser emits a plain `IfStatement` for each
 * `@else if` in an `@if` directive's `alternate`, so directive-ness is
 * positional — consecutive `IfStatement` alternates rooted at a
 * `JSXIfExpression`.
 * @param {AST.Node} node
 * @param {AST.Node[]} path — ancestor chain, innermost last
 * @returns {boolean}
 */
export function is_template_else_if(node, path) {
	if (node.type !== 'IfStatement') {
		return false;
	}
	let child = /** @type {AST.Node} */ (node);
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const parent = path[i];
		if (parent.type === 'JSXIfExpression' && parent.alternate === child) {
			return true;
		}
		if (parent.type === 'IfStatement' && parent.alternate === child) {
			child = parent;
			continue;
		}
		return false;
	}
	return false;
}

/**
 * A `<> … </>` fragment that is part of the template: an authored native
 * fragment (`metadata.native_tsrx`, which the parser stamps on template and
 * value-position fragments but not on fragments inside attribute values), or
 * a synthesized render-body fragment (`tsrx_render_fragment` — deliberately
 * NOT `native_tsrx`, so to_ts unwraps it instead of keeping it as authored).
 * Compiler-generated directive wrappers and code-block chain wrappers set
 * `native_tsrx` themselves. Raw JSX fragments (attribute values) are NOT
 * template fragments — they lower through the raw-JSX value path.
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.TSRXJSXFragment}
 */
export function is_template_fragment(node) {
	return (
		node?.type === 'JSXFragment' &&
		(node.metadata?.native_tsrx === true || node.metadata?.tsrx_render_fragment === true)
	);
}

/**
 * Converts a JSXMemberExpression to a plain MemberExpression.
 * e.g., `<Foo.Bar.Baz>` → MemberExpression(MemberExpression(Foo, Bar), Baz)
 * @param {ESTreeJSX.JSXMemberExpression} jsx_member
 * @returns {AST.MemberExpression}
 */
export function jsx_member_expression_to_member_expression(jsx_member) {
	const object =
		jsx_member.object.type === 'JSXMemberExpression'
			? jsx_member_expression_to_member_expression(jsx_member.object)
			: b.id(jsx_member.object.name, /** @type {AST.NodeWithLocation} */ (jsx_member.object));

	return b.member(
		object,
		b.id(jsx_member.property.name, /** @type {AST.NodeWithLocation} */ (jsx_member.property)),
		false,
		false,
		/** @type {AST.NodeWithLocation} */ (jsx_member),
	);
}

/**
 * The element's tag as a plain expression: an `Identifier` for
 * `JSXIdentifier`/`JSXNamespacedName` names, a `MemberExpression` for
 * `<Foo.Bar>` (or one planted directly in the name slot by a tag rewrite,
 * e.g. `lower_dynamic_element`'s server component reference), or the tag
 * expression itself for a dynamic `<{expr}>` element.
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node
 * @returns {AST.Identifier | AST.MemberExpression | AST.Expression}
 */
export function get_element_id(node) {
	const name = node.openingElement.name;
	if (name.type === 'JSXIdentifier') {
		return b.id(name.name, /** @type {AST.NodeWithLocation} */ (name));
	}
	if (name.type === 'JSXMemberExpression') {
		return jsx_member_expression_to_member_expression(name);
	}
	if (name.type === 'JSXNamespacedName') {
		return b.id(
			name.namespace.name + ':' + name.name.name,
			/** @type {AST.NodeWithLocation} */ (name),
		);
	}
	if (name.type === 'MemberExpression') {
		return name;
	}
	if (name.type === 'JSXExpressionContainer' && name.isDynamic === true) {
		return /** @type {AST.Expression} */ (name.expression);
	}
	// Fallback - should not reach here
	return b.id('unknown', /** @type {AST.NodeWithLocation} */ (name));
}

/**
 * A template element: an authored native element, or a raw JSX element that
 * `build_jsx_to_tsrx_element` marked native when pulling it into the template
 * machinery.
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.TSRXJSXElement}
 */
export function is_template_element(node) {
	return node?.type === 'JSXElement' && node.metadata?.native_tsrx === true;
}

/**
 * The element's tag as a plain `Identifier` — `null` for member-expression,
 * namespaced, or dynamic tags.
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node
 * @returns {AST.Identifier | null}
 */
export function get_element_identifier(node) {
	const id = get_element_id(node);
	return id.type === 'Identifier' ? id : null;
}

/**
 * The element's attributes (raw `JSXAttribute`/`JSXSpreadAttribute` nodes).
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node
 * @returns {Array<ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute>}
 */
export function get_element_attributes(node) {
	return node.openingElement?.attributes ?? [];
}

/**
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node
 * @returns {boolean}
 */
export function is_self_closing(node) {
	return node.openingElement?.selfClosing === true;
}

/**
 * Whether the element has a dynamic `<{expr}>` tag that has not (yet) been
 * lowered to the `TsrxDynamic` component by `lower_dynamic_element` (which
 * clears these markers).
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node
 * @returns {boolean}
 */
export function is_dynamic_element(node) {
	const name = node.openingElement?.name;
	return (
		node.isDynamic === true ||
		node.openingElement?.isDynamic === true ||
		(name?.type === 'JSXExpressionContainer' && name.isDynamic === true)
	);
}

/**
 * The CSS source of a `<style>` template element.
 * @param {AST.JSXStyleElement} node
 * @returns {string}
 */
export function get_style_css(node) {
	return node.css ?? node.children?.find((child) => child?.type === 'StyleSheet')?.source ?? '';
}

/**
 * The attribute's name as a string, flattening `<ns:name>` namespaced names.
 * @param {ESTreeJSX.JSXAttribute} attr
 * @returns {string}
 */
export function get_attribute_name(attr) {
	return attr.name.type === 'JSXIdentifier'
		? attr.name.name
		: attr.name.namespace.name + ':' + attr.name.name.name;
}

/**
 * The attribute's name as a plain `Identifier` spanning the name node (for a
 * shorthand attribute, the name inside the braces — the parser always gives
 * it a real span, even in loose mode).
 * @param {ESTreeJSX.JSXAttribute} attr
 * @returns {AST.Identifier}
 */
export function get_attribute_name_node(attr) {
	return b.id(get_attribute_name(attr), /** @type {AST.NodeWithLocation} */ (attr.name));
}

/**
 * The attribute's value expression: `null` for a valueless attribute
 * (`<div attr>`), the expression for a `{ … }` container value, a synthesized
 * `Identifier` for a shorthand attribute (`<div {foo}>`), and the literal
 * itself for a quoted value.
 * @param {ESTreeJSX.JSXAttribute} attr
 * @returns {AST.Expression | null}
 */
export function get_attribute_value(attr) {
	if (attr.shorthand === true) {
		return get_attribute_name_node(attr);
	}
	if (attr.value == null) {
		return null;
	}
	return attr.value.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value;
}

/**
 * Whether the attribute's value was authored as a `{ … }` expression container
 * (as opposed to a quoted literal). Replaces the old `value.was_expression`
 * marker the normalizer stamped on unwrapped values.
 * @param {ESTreeJSX.JSXAttribute} attr
 * @returns {boolean}
 */
export function is_expression_attribute(attr) {
	return attr.value?.type === 'JSXExpressionContainer';
}

/**
 * Whether a `@{ … }` code block lowers to anything at all — setup statements
 * or (possibly chained) render output. An empty-all-the-way-down block lowers
 * to nothing and renders nothing.
 * @param {AST.JSXCodeBlock} block
 * @returns {boolean}
 */
export function code_block_renders_or_runs(block) {
	if ((block.body || []).some((statement) => statement.type !== 'EmptyStatement')) {
		return true;
	}
	const render = block.render;
	if (render == null) return false;
	return render.type !== 'JSXCodeBlock'
		? true
		: code_block_renders_or_runs(/** @type {AST.JSXCodeBlock} */ (render));
}

/**
 * The children that actually render: everything except empty statements,
 * insignificant whitespace text, `{/* comment *​/}` containers, and `@{ … }`
 * blocks that lower to nothing.
 * @param {AST.Node[]} children
 * @param {boolean} to_ts
 * @returns {AST.Node[]}
 */
export function rendered_template_children(children, to_ts) {
	return children.filter((child) => {
		if (child == null || child.type === 'EmptyStatement') return false;
		if (child.type === 'JSXCodeBlock') {
			return code_block_renders_or_runs(/** @type {AST.JSXCodeBlock} */ (child));
		}
		return !is_droppable_template_text(child, to_ts) && !is_empty_expression_container(child);
	});
}
