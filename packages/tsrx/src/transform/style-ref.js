/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { ClassMapCollectionState, StyleRefOptions, TopScopedClasses, Visitors } from '../../types/index' */

import { walk } from 'zimmerframe';
import * as b from '../utils/builders.js';
import {
	child_nodes,
	is_function_or_class_node as is_function_or_class_boundary,
	is_style_element,
} from '../utils/ast.js';
import { clone_ast_node, clone_identifier } from './jsx/ast-builders.js';

const regex_backslash_and_following_character = /\\(.)/g;

/**
 * @param {AST.Node} component
 * @param {AST.CSS.StyleSheet} css
 * @returns {AST.ObjectExpression}
 */
export function create_style_class_map(component, css) {
	return build_style_class_map(
		component.metadata?.topScopedClasses ?? collect_style_class_map_entries(css),
		css.hash,
	);
}

/**
 * @param {AST.CSS.StyleSheet} css
 * @returns {AST.ObjectExpression}
 */
export function create_style_class_map_from_stylesheet(css) {
	return build_style_class_map(collect_style_class_map_entries(css), css.hash);
}

/**
 * `{ foo: 'hash foo', … }` for every class the style expression exposes.
 *
 * @param {TopScopedClasses} top_scoped_classes
 * @param {string | null} hash
 * @returns {AST.ObjectExpression}
 */
function build_style_class_map(top_scoped_classes, hash) {
	const class_names = [...top_scoped_classes.keys()].sort();

	return b.object(
		class_names.map((class_name) =>
			b.prop('init', b.literal(class_name), b.literal(hash ? `${hash} ${class_name}` : class_name)),
		),
	);
}

/**
 * @param {AST.JSXStyleElement} style_element
 * @returns {AST.CSS.StyleSheet | null}
 */
export function get_style_element_stylesheet(style_element) {
	return style_element.children?.find((child) => child.type === 'StyleSheet') ?? null;
}

/**
 * @param {AST.Node | AST.Node[]} node
 * @param {ESTreeJSX.JSXAttribute[]} [refs]
 * @returns {ESTreeJSX.JSXAttribute[]}
 */
export function collect_style_ref_attributes(node, refs = []) {
	if (Array.isArray(node)) {
		for (const child of node) collect_style_ref_attributes(child, refs);
		return refs;
	}

	if (!node || typeof node !== 'object') return refs;

	if (is_style_element(node)) {
		for (const attr of node.openingElement.attributes) {
			if (is_ref_attribute(attr) && attr.value) {
				refs.push(attr);
			}
		}
		return refs;
	}

	if (is_function_or_class_boundary(node)) {
		return refs;
	}

	for (const child of child_nodes(node, 'css')) {
		collect_style_ref_attributes(child, refs);
	}

	return refs;
}

/**
 * @param {ESTreeJSX.JSXAttribute[]} ref_attributes
 * @param {AST.Expression} style_map
 * @param {StyleRefOptions} [options]
 * @returns {AST.Statement[]}
 */
export function create_style_ref_setup_statements(ref_attributes, style_map, options = {}) {
	/** @type {AST.Statement[]} */
	const statements = [];
	for (const attr of ref_attributes) {
		const source = get_ref_attribute_expression(attr);
		if (!source) continue;
		statements.push(...create_style_ref_expression_statements(source, style_map, options));
	}
	return statements;
}

/**
 * @param {AST.Expression} source
 * @param {AST.Expression} style_map
 * @param {StyleRefOptions} options
 * @returns {AST.Statement[]}
 */
function create_style_ref_expression_statements(source, style_map, options) {
	if (source.type === 'ArrayExpression') {
		return source.elements.flatMap((element) => {
			if (!element) return [];
			const expression = element.type === 'SpreadElement' ? element.argument : element;
			return create_style_ref_expression_statements(
				/** @type {AST.Expression} */ (expression),
				style_map,
				options,
			);
		});
	}

	if (
		options.allowMutableRefTarget !== false &&
		(source.type === 'Identifier' || source.type === 'MemberExpression')
	) {
		const target = clone_ast_node(source, false);
		return [
			b.stmt(
				b.assignment('=', /** @type {AST.Pattern} */ (target), clone_ast_node(style_map, false)),
			),
		];
	}

	if (source.type === 'ArrowFunctionExpression' || source.type === 'FunctionExpression') {
		return [
			b.stmt(
				b.call(
					visit_expression(clone_ast_node(source, false), options),
					clone_ast_node(style_map, false),
				),
			),
		];
	}

	return create_dynamic_style_ref_statement(source, style_map, options);
}

/**
 * @param {AST.Expression} source
 * @param {AST.Expression} style_map
 * @param {StyleRefOptions} options
 * @returns {AST.Statement[]}
 */
function create_dynamic_style_ref_statement(source, style_map, options) {
	const ref_id = options.createTempIdentifier?.() ?? b.id('__tsrx_style_ref');
	const ref_read = () => clone_identifier(ref_id);
	const current_write = b.stmt(
		b.assignment('=', b.member(ref_read(), 'current'), clone_ast_node(style_map, false)),
	);
	const value_write = b.stmt(
		b.assignment('=', b.member(ref_read(), 'value'), clone_ast_node(style_map, false)),
	);

	return [
		b.let(ref_id, visit_expression(clone_ast_node(source, false), options)),
		b.if(
			b.binary('===', b.unary('typeof', ref_read()), b.literal('function')),
			b.block([b.stmt(b.call(ref_read(), clone_ast_node(style_map, false)))]),
			b.if(
				b.logical(
					'&&',
					ref_read(),
					b.binary('===', b.unary('typeof', ref_read()), b.literal('object')),
				),
				b.block([
					b.if(
						b.binary('in', b.literal('current'), ref_read()),
						b.block([current_write]),
						b.if(b.binary('in', b.literal('value'), ref_read()), b.block([value_write]), null),
					),
				]),
				null,
			),
		),
	];
}

/**
 * @param {AST.Expression} expression
 * @param {StyleRefOptions} options
 * @returns {AST.Expression}
 */
function visit_expression(expression, options) {
	return options.visitExpression ? options.visitExpression(expression) : expression;
}

/**
 * @param {ESTreeJSX.JSXAttribute} attr
 * @returns {AST.Expression | null}
 */
function get_ref_attribute_expression(attr) {
	const value = attr.value;
	if (!value) return null;
	if (value.type === 'JSXExpressionContainer') {
		return value.expression.type === 'JSXEmptyExpression' ? null : value.expression;
	}
	return value;
}

/**
 * @param {ESTreeJSX.JSXAttributeNode} attr
 * @returns {attr is ESTreeJSX.JSXAttribute}
 */
function is_ref_attribute(attr) {
	return (
		attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === 'ref'
	);
}

/**
 * @param {AST.CSS.StyleSheet} css
 * @returns {TopScopedClasses}
 */
function collect_style_class_map_entries(css) {
	/** @type {TopScopedClasses} */
	const entries = new Map();
	collect_rule_class_map_entries(css, entries);
	return entries;
}

/**
 * Stamp `class_map_selector` on the prelude-level selectors whose classes the
 * class map exposes, without building the map. Runs the same collection as
 * `create_style_class_map_from_stylesheet`, so marking and the generated map
 * always agree; calling both is harmless.
 *
 * @param {AST.CSS.StyleSheet} css
 * @returns {void}
 */
export function mark_class_map_selectors(css) {
	collect_rule_class_map_entries(css, new Map());
}

/**
 * The state threaded through the class-map collection walk: the nearest
 * prelude-level selector. Classes found inside another selector (e.g. in
 * `:global(...)` args) mark it as the selector that carries their class map
 * entry.
 *
 * @param {AST.CSS.StyleSheet} css
 * @param {TopScopedClasses} entries
 * @returns {void}
 */
function collect_rule_class_map_entries(css, entries) {
	walk(
		/** @type {AST.CSS.Node} */ (css),
		/** @type {ClassMapCollectionState} */ ({ enclosing_selector: null }),
		/** @type {Visitors<AST.CSS.Node, ClassMapCollectionState>} */ ({
			ComplexSelector(node, context) {
				const enclosing_selector = context.state.enclosing_selector ?? node;
				const class_selector = get_standalone_class_selector(node);

				if (class_selector) {
					// Mark the prelude-level selector for every occurrence (not just the
					// deduped first) so the render preparation of style expressions keeps
					// exactly the selectors whose classes the map exposes.
					enclosing_selector.metadata.class_map_selector = true;
					const name = class_selector.name.replace(regex_backslash_and_following_character, '$1');
					if (!entries.has(name)) {
						entries.set(name, {
							start: class_selector.start,
							end: class_selector.end,
							selector: class_selector,
						});
					}
				}

				context.next({ enclosing_selector });
			},
		}),
	);
}

/**
 * @param {AST.CSS.ComplexSelector} complex_selector
 * @returns {AST.CSS.ClassSelector | null}
 */
function get_standalone_class_selector(complex_selector) {
	if (complex_selector.children.length !== 1) return null;
	const relative_selector = complex_selector.children[0];
	if (
		relative_selector.metadata.is_global ||
		relative_selector.metadata.is_global_like ||
		relative_selector.selectors.length !== 1
	) {
		return null;
	}
	const selector = relative_selector.selectors[0];
	return selector.type === 'ClassSelector' ? selector : null;
}
