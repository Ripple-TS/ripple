/**
 * Framework-agnostic CSS scoping utilities shared between the `@tsrx/react`
 * and `@tsrx/solid` transforms. These walk the template AST and annotate
 * template nodes with a hash class so scope-qualified selectors (e.g.
 * `.foo.hash`) match after rendering.
 */

/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { Visitors } from '../../types/index' */

import { walk } from 'zimmerframe';
import * as b from '../utils/builders.js';
import { is_ast_node, is_style_element } from '../utils/ast.js';
import { mark_class_map_selectors } from './style-ref.js';

export { is_style_element };

/**
 * Mark selectors inside the stylesheet as "used" so `renderStylesheets` does
 * not comment them out.
 *
 * For a free-standing `<style>` block every selector is marked: we skip
 * selector-pruning because component boundaries can be dynamic — any selector
 * authored inside the component's `<style>` block is considered intentional.
 *
 * When the `<style>` block is assigned to a variable (`is_style_expression`),
 * the only selectors reachable through the generated class map are standalone
 * class selectors — scoped (`.x`) or global-wrapped (`:global(.x)`). Anything
 * else at the top level — element selectors, compound selectors, descendant
 * chains, global tag selectors — never ends up in the class map and is marked
 * unused for `renderStylesheets` to comment out. Selectors of nested rules ride
 * along with their parent: they apply where the parent's class matched, and the
 * whole rule is pruned when the parent itself is unreachable.
 *
 * @param {AST.CSS.StyleSheet} stylesheet
 * @param {boolean} [is_style_expression]
 * @returns {AST.CSS.StyleSheet}
 */
export function prepare_stylesheet_for_render(stylesheet, is_style_expression = false) {
	if (is_style_expression) {
		mark_class_map_selectors(stylesheet);
	}
	walk(
		/** @type {AST.CSS.Node} */ (stylesheet),
		null,
		/** @type {Visitors<AST.CSS.Node, null>} */ ({
			_(node, { next, path }) {
				if (node.type === 'ComplexSelector') {
					if (is_style_expression && is_unreachable_via_class_map(node, path)) {
						// Not in the generated class map. The analyzer pre-marks global
						// selectors as used, so reset, and leave the subtree untouched —
						// no `scoped` marks that would splice the hash into pruned output.
						node.metadata.used = false;
						return;
					}
					node.metadata.used = true;
				} else if (node.type === 'RelativeSelector' && !node.metadata.is_global) {
					node.metadata.scoped = true;
				}
				return next();
			},
		}),
	);
	return stylesheet;
}

/**
 * True when a selector of a style expression should be pruned because nothing
 * reachable through the generated class map can match it. The class map
 * collection in `style-ref.js` is the single decider of what the map exposes:
 * it marks the carrying prelude-level selectors with `class_map_selector`.
 * The remaining cases are structural, not class-shaped: selectors of nested
 * rules ride along with their parent (the whole rule is pruned when the parent
 * is unreachable), selectors inside another selector's arguments belong to
 * their enclosing prelude-level selector, and a bare `:global` block prelude
 * is kept because its contents render unscoped as authored and cannot be
 * pruned selector-by-selector.
 *
 * @param {AST.CSS.ComplexSelector} complex_selector
 * @param {AST.CSS.Node[]} path
 * @returns {boolean}
 */
function is_unreachable_via_class_map(complex_selector, path) {
	if (complex_selector.metadata.class_map_selector) return false;
	if (complex_selector.metadata.rule?.metadata?.parent_rule != null) return false;
	if (path.some((parent) => parent.type === 'ComplexSelector')) return false;

	if (complex_selector.children.length === 1) {
		const first = complex_selector.children[0].selectors[0];
		if (first?.type === 'PseudoClassSelector' && first.name === 'global' && first.args === null) {
			return false;
		}
	}

	return true;
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function is_composite_jsx_element(node) {
	if (node?.type !== 'JSXElement') {
		return false;
	}

	const name = node.openingElement?.name;
	if (!name) {
		return false;
	}

	if (name.type === 'JSXIdentifier') {
		return /^[A-Z]/.test(name.name);
	}

	return name.type === 'JSXMemberExpression';
}

/**
 * Recursively walk native JSX nodes within a TSRX fragment and add the hash
 * class name so scope-qualified selectors (e.g. `.foo.hash`) match.
 *
 * @param {AST.Node} node
 * @param {string} hash
 * @param {'class' | 'className'} [jsx_class_attr_name='class']
 * @param {boolean} [preserve_style_elements=false]
 * @returns {AST.Node | null}
 */
export function annotate_with_hash(
	node,
	hash,
	jsx_class_attr_name = 'class',
	preserve_style_elements = false,
) {
	if (!node || typeof node !== 'object') return node;
	if (
		(node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression') &&
		// Generated dynamic-tag wrappers are render-block closures, not user
		// component boundaries — the element inside still belongs to this
		// component's scoped CSS.
		node.metadata?.tsrx_dynamic_wrapper !== true
	) {
		return node;
	}

	if (node.type === 'JSXElement') {
		const element = /** @type {AST.TSRXJSXElement} */ (node);
		if (!is_composite_jsx_element(element) || element.metadata?.dynamicElement) {
			add_hash_class_to_jsx_element(element, hash, jsx_class_attr_name);
		}
		element.children = element.children
			.map((child) => annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements))
			.filter((child) => child !== null);
		return element;
	}

	if (is_style_element(node)) {
		if (preserve_style_elements) {
			node.children = [];
			return node;
		}
		return null;
	}

	const entries = /** @type {Record<string, unknown>} */ (node);
	for (const key of Object.keys(entries)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata' || key === 'css') {
			continue;
		}

		const value = entries[key];
		if (Array.isArray(value)) {
			entries[key] = value.map((child) =>
				is_ast_node(child)
					? annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements)
					: child,
			);
		} else if (is_ast_node(value)) {
			entries[key] = annotate_with_hash(value, hash, jsx_class_attr_name, preserve_style_elements);
		}
	}

	return node;
}

/**
 * @param {{ body: AST.Node[] }} component a node whose `body` holds the
 *   component's template children
 * @param {string} hash
 * @param {'class' | 'className'} [jsx_class_attr_name='class']
 * @param {boolean} [preserve_style_elements=false]
 * @returns {void}
 */
export function annotate_component_with_hash(
	component,
	hash,
	jsx_class_attr_name = 'class',
	preserve_style_elements = false,
) {
	component.body = component.body
		.filter((child) => preserve_style_elements || !is_style_element(child))
		.map((child) => annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements))
		.filter((child) => child !== null);
}

/**
 * The element's `class`/`className` attribute, if it has a static-named one.
 *
 * @param {ESTreeJSX.JSXAttributeNode} attr
 * @returns {attr is ESTreeJSX.JSXAttribute}
 */
function is_class_attribute(attr) {
	return (
		attr.type === 'JSXAttribute' &&
		attr.name.type === 'JSXIdentifier' &&
		(attr.name.name === 'class' || attr.name.name === 'className')
	);
}

/**
 * Merge the hash into an existing class attribute value. Returns `false` when
 * the value is not a string literal, so the caller must wrap it instead.
 *
 * @param {ESTreeJSX.JSXAttribute['value'] | AST.Expression | ESTreeJSX.JSXEmptyExpression} value
 * @param {string} hash
 * @returns {boolean} whether the hash was merged into the literal in place
 */
function merge_hash_into_literal(value, hash) {
	if (value?.type !== 'Literal' || typeof value.value !== 'string') return false;
	const merged = `${value.value} ${hash}`;
	value.value = merged;
	value.raw = JSON.stringify(merged);
	return true;
}

/**
 * Ensure the element carries a class attribute containing the scoping hash.
 *
 * @param {AST.TSRXJSXElement} element
 * @param {string} hash
 * @param {'class' | 'className'} [class_attr_name='class']
 * @returns {void}
 */
export function add_hash_class(element, hash, class_attr_name = 'class') {
	const attrs = element.openingElement.attributes;
	const existing = attrs.find(is_class_attribute);

	if (!existing) {
		attrs.push(b.jsx_attribute(b.jsx_id(class_attr_name), b.literal(hash)));
		return;
	}

	const value =
		existing.value?.type === 'JSXExpressionContainer' ? existing.value.expression : existing.value;
	if (!value || value.type === 'JSXEmptyExpression') {
		existing.value = b.literal(hash, JSON.stringify(hash));
		return;
	}

	if (merge_hash_into_literal(value, hash)) return;

	// Dynamic expression. Concatenate at runtime via template literal.
	existing.value = b.jsx_expression_container(
		b.template([b.quasi('', false), b.quasi(` ${hash}`, true)], [value]),
	);
}

/**
 * @param {AST.TSRXJSXElement} element
 * @param {string} hash
 * @param {'class' | 'className'} jsx_class_attr_name
 * @returns {void}
 */
function add_hash_class_to_jsx_element(element, hash, jsx_class_attr_name) {
	const attrs = (element.openingElement.attributes ??= []);
	const existing = attrs.find(is_class_attribute);

	if (!existing) {
		attrs.push(
			b.jsx_attribute(b.jsx_id(jsx_class_attr_name), b.literal(hash, JSON.stringify(hash))),
		);
		return;
	}

	const value = existing.value;
	if (!value) {
		existing.value = b.literal(hash, JSON.stringify(hash));
		return;
	}

	if (merge_hash_into_literal(value, hash)) return;

	const expression = value.type === 'JSXExpressionContainer' ? value.expression : value;
	if (expression.type === 'JSXEmptyExpression') {
		existing.value = b.literal(hash, JSON.stringify(hash));
		return;
	}

	existing.value = b.jsx_expression_container(
		b.template([b.quasi('', false), b.quasi(` ${hash}`, true)], [expression]),
	);
}
