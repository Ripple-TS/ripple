/** @import * as AST from 'estree' */

import * as b from '../utils/builders.js';
import { clone_expression_node, clone_identifier } from './jsx/ast-builders.js';

/**
 * @typedef {{
 *   allowMutableRefTarget?: boolean;
 *   createTempIdentifier?: () => AST.Identifier;
 *   visitExpression?: (expression: AST.Expression) => AST.Expression;
 * }} StyleRefOptions
 */

/**
 * @param {any} component
 * @param {any} css
 * @returns {AST.ObjectExpression}
 */
export function create_style_class_map(component, css) {
	const hash = css?.hash ?? null;
	const top_scoped_classes = /** @type {Map<string, any>} */ (
		component?.metadata?.topScopedClasses ?? new Map()
	);
	const class_names = [...top_scoped_classes.keys()].sort();

	return b.object(
		class_names.map((class_name) =>
			b.prop('init', b.literal(class_name), b.literal(hash ? `${hash} ${class_name}` : class_name)),
		),
	);
}

/**
 * @param {any} node
 * @param {any[]} [refs]
 * @returns {any[]}
 */
export function collect_style_ref_attributes(node, refs = []) {
	if (!node || typeof node !== 'object') return refs;

	if (Array.isArray(node)) {
		for (const child of node) collect_style_ref_attributes(child, refs);
		return refs;
	}

	if (is_style_element(node)) {
		for (const attr of node.attributes || []) {
			if (is_ref_attribute(attr) && attr.value) {
				refs.push(attr);
			}
		}
		return refs;
	}

	if (is_function_or_class_boundary(node)) {
		return refs;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata' || key === 'css') {
			continue;
		}
		collect_style_ref_attributes(node[key], refs);
	}

	return refs;
}

/**
 * @param {any[]} ref_attributes
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
		const target = clone_expression_node(source, false);
		return [
			b.stmt(
				b.assignment(
					'=',
					/** @type {AST.Pattern} */ (target),
					clone_expression_node(style_map, false),
				),
			),
		];
	}

	if (source.type === 'ArrowFunctionExpression' || source.type === 'FunctionExpression') {
		return [
			b.stmt(
				b.call(
					visit_expression(clone_expression_node(source, false), options),
					clone_expression_node(style_map, false),
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
		b.assignment('=', b.member(ref_read(), 'current'), clone_expression_node(style_map, false)),
	);
	const value_write = b.stmt(
		b.assignment('=', b.member(ref_read(), 'value'), clone_expression_node(style_map, false)),
	);

	return [
		b.let(ref_id, visit_expression(clone_expression_node(source, false), options)),
		b.if(
			b.binary('===', b.unary('typeof', ref_read()), b.literal('function')),
			b.block([b.stmt(b.call(ref_read(), clone_expression_node(style_map, false)))]),
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
 * @param {any} attr
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
 * @param {any} attr
 * @returns {boolean}
 */
function is_ref_attribute(attr) {
	return (
		(attr?.type === 'Attribute' && attr.name?.type === 'Identifier' && attr.name.name === 'ref') ||
		(attr?.type === 'JSXAttribute' &&
			attr.name?.type === 'JSXIdentifier' &&
			attr.name.name === 'ref')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_style_element(node) {
	return !!(
		node &&
		node.type === 'Element' &&
		node.id?.type === 'Identifier' &&
		node.id.name === 'style'
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_function_or_class_boundary(node) {
	return (
		node?.type === 'FunctionDeclaration' ||
		node?.type === 'FunctionExpression' ||
		node?.type === 'ArrowFunctionExpression' ||
		node?.type === 'ClassDeclaration' ||
		node?.type === 'ClassExpression'
	);
}
