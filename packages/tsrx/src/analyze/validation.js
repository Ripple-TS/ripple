/**
@import * as AST from 'estree';
@import { AnalysisContext, CompileError } from '../../types/index';
 */

import { error } from '../errors.js';
import { DIAGNOSTIC_CODES } from '../diagnostics.js';

export const TSRX_RETURN_STATEMENT_ERROR =
	'Return statements are not allowed inside TSRX templates. Move the return before the TSRX return value, or use conditional rendering instead.';
export const TSRX_LOOP_RETURN_ERROR =
	'Return statements are not allowed inside TSRX template for...of loops. Filter the iterable before rendering or use an @empty fallback for empty lists.';
export const TSRX_LOOP_BREAK_ERROR =
	'Break statements are not allowed inside TSRX template for...of loops.';
export const TSRX_LOOP_CONTINUE_ERROR =
	'Continue statements are not allowed inside TSRX template for...of loops. Filter the iterable before rendering.';
export const TSRX_IF_RETURN_ERROR =
	'Return statements are not allowed inside TSRX template @if blocks. Move the return before the template output or render conditionally instead.';
export const TSRX_IF_BREAK_ERROR =
	'Break statements are not allowed inside TSRX template @if blocks.';
export const TSRX_IF_CONTINUE_ERROR =
	'Continue statements are not allowed inside TSRX template @if blocks. Filter before rendering or use conditional output instead.';
export const TSRX_FOR_STATEMENT_ERROR =
	'For loops are not supported in TSRX templates. Use for...of instead.';
export const TSRX_FOR_IN_STATEMENT_ERROR =
	'For...in loops are not supported in TSRX templates. Use for...of instead.';
export const TSRX_WHILE_STATEMENT_ERROR =
	'While loops are not supported in TSRX templates. Move the while loop into a function.';
export const TSRX_DO_WHILE_STATEMENT_ERROR =
	'Do...while loops are not supported in TSRX templates. Move the do...while loop into a function.';
export const TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR =
	"This TSRX template output is unused. Return it, assign it to a value that is rendered, or make it part of the rendered output of a function '@{...}' body.";

const invalid_nestings = {
	// <p> cannot contain block-level elements
	p: new Set([
		'address',
		'article',
		'aside',
		'blockquote',
		'details',
		'div',
		'dl',
		'fieldset',
		'figcaption',
		'figure',
		'footer',
		'form',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'header',
		'hgroup',
		'hr',
		'main',
		'menu',
		'nav',
		'ol',
		'p',
		'pre',
		'section',
		'table',
		'ul',
	]),
	// <span> cannot contain block-level elements
	span: new Set([
		'address',
		'article',
		'aside',
		'blockquote',
		'details',
		'div',
		'dl',
		'fieldset',
		'figcaption',
		'figure',
		'footer',
		'form',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'header',
		'hgroup',
		'hr',
		'main',
		'menu',
		'nav',
		'ol',
		'p',
		'pre',
		'section',
		'table',
		'ul',
	]),
	// Interactive elements cannot be nested
	a: new Set(['a', 'button']),
	button: new Set(['a', 'button']),
	// Form elements
	label: new Set(['label']),
	form: new Set(['form']),
	// Headings cannot be nested within each other
	h1: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
	h2: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
	h3: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
	h4: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
	h5: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
	h6: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
	// Table structure
	table: new Set(['table', 'tr', 'td', 'th']), // Can only contain caption, colgroup, thead, tbody, tfoot
	thead: new Set(['caption', 'colgroup', 'thead', 'tbody', 'tfoot', 'td', 'th']), // Can only contain tr
	tbody: new Set(['caption', 'colgroup', 'thead', 'tbody', 'tfoot', 'td', 'th']), // Can only contain tr
	tfoot: new Set(['caption', 'colgroup', 'thead', 'tbody', 'tfoot', 'td', 'th']), // Can only contain tr
	tr: new Set(['caption', 'colgroup', 'thead', 'tbody', 'tfoot', 'tr']), // Can only contain td and th
	td: new Set(['td', 'th']), // Cannot nest td/th elements
	th: new Set(['td', 'th']), // Cannot nest td/th elements
	// Media elements
	picture: new Set(['picture']),
	// Main landmark - only one per document, cannot be nested
	main: new Set(['main']),
	// Other semantic restrictions
	figcaption: new Set(['figcaption']),
	dt: new Set([
		'header',
		'footer',
		'article',
		'aside',
		'nav',
		'section',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
	]),
	// No interactive content inside summary
	summary: new Set(['summary']),
};

/**
 * @param {any} element
 * @returns {string | null}
 */
function get_element_tag(element) {
	const name = element.openingElement?.name ?? element.id;
	return name?.type === 'JSXIdentifier' || name?.type === 'Identifier' ? name.name : null;
}

/**
 * @param {AST.ReturnStatement} node
 * @returns {AST.ReturnStatement}
 */
export function get_return_keyword_node(node) {
	return get_statement_keyword_node(node, 'return');
}

/**
 * @template {AST.Node} T
 * @param {T} node
 * @param {string} keyword
 * @returns {T}
 */
export function get_statement_keyword_node(node, keyword) {
	const keyword_length = keyword.length;
	const start = /** @type {AST.NodeWithLocation} */ (node).start ?? 0;
	const loc = /** @type {AST.NodeWithLocation} */ (node).loc;

	return /** @type {T} */ ({
		...node,
		end: start + keyword_length,
		loc: loc
			? {
					start: loc.start,
					end: {
						line: loc.start.line,
						column: loc.start.column + keyword_length,
					},
				}
			: undefined,
	});
}

/**
 * @param {AST.ReturnStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_return_statement(node, filename, errors, comments) {
	error(
		TSRX_RETURN_STATEMENT_ERROR,
		filename ?? null,
		get_return_keyword_node(node),
		errors,
		comments,
		DIAGNOSTIC_CODES.TEMPLATE_RETURN_STATEMENT,
	);
}

/**
 * @param {AST.Node} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_forgotten_statement_container(node, filename, errors, comments) {
	error(
		TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR,
		filename ?? null,
		node,
		errors,
		comments,
		DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER,
	);
}

/**
 * @param {AST.ReturnStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_loop_return_statement(node, filename, errors, comments) {
	error(TSRX_LOOP_RETURN_ERROR, filename ?? null, get_return_keyword_node(node), errors, comments);
}

/**
 * @param {AST.BreakStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_loop_break_statement(node, filename, errors, comments) {
	error(
		TSRX_LOOP_BREAK_ERROR,
		filename ?? null,
		get_statement_keyword_node(node, 'break'),
		errors,
		comments,
	);
}

/**
 * @param {AST.ContinueStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_loop_continue_statement(node, filename, errors, comments) {
	error(
		TSRX_LOOP_CONTINUE_ERROR,
		filename ?? null,
		get_statement_keyword_node(node, 'continue'),
		errors,
		comments,
	);
}

/**
 * @param {AST.ReturnStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_if_return_statement(node, filename, errors, comments) {
	error(TSRX_IF_RETURN_ERROR, filename ?? null, get_return_keyword_node(node), errors, comments);
}

/**
 * @param {AST.BreakStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_if_break_statement(node, filename, errors, comments) {
	error(
		TSRX_IF_BREAK_ERROR,
		filename ?? null,
		get_statement_keyword_node(node, 'break'),
		errors,
		comments,
	);
}

/**
 * @param {AST.ContinueStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_if_continue_statement(node, filename, errors, comments) {
	error(
		TSRX_IF_CONTINUE_ERROR,
		filename ?? null,
		get_statement_keyword_node(node, 'continue'),
		errors,
		comments,
	);
}

/**
 * @param {AST.ForStatement | AST.ForInStatement | AST.WhileStatement | AST.DoWhileStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_tsrx_unsupported_loop_statement(node, filename, errors, comments) {
	let message;
	if (node.type === 'ForStatement') {
		message = TSRX_FOR_STATEMENT_ERROR;
	} else if (node.type === 'ForInStatement') {
		message = TSRX_FOR_IN_STATEMENT_ERROR;
	} else if (node.type === 'WhileStatement') {
		message = TSRX_WHILE_STATEMENT_ERROR;
	} else {
		message = TSRX_DO_WHILE_STATEMENT_ERROR;
	}

	error(message, filename ?? null, node, errors, comments);
}

/**
 * Returns `true` when `child` occupies a value slot of `parent` — i.e. it is
 * being captured as a value (assigned to a binding, pushed into an array,
 * passed as an argument, used as an operand, …) rather than rendered as a
 * statement-position template child.
 *
 * Target analyzers use this to tell apart direct template output from a TSRX
 * element that merely happens to be a value, so that a value-position element
 * nested inside plain JavaScript control flow does not get mistaken for direct
 * output that would require a `@for`/`@if`/`@switch`/`@try` directive.
 * @param {AST.Node} parent
 * @param {AST.Node} child
 * @returns {boolean}
 */
export function is_template_value_position(parent, child) {
	switch (parent.type) {
		case 'VariableDeclarator':
			return parent.init === child;
		case 'AssignmentExpression':
			return parent.right === child;
		case 'Property':
		case 'PropertyDefinition':
			return parent.value === child;
		case 'ArrayExpression':
			return /** @type {any[]} */ (parent.elements).includes(child);
		case 'CallExpression':
		case 'NewExpression':
			return parent.callee === child || /** @type {any[]} */ (parent.arguments).includes(child);
		case 'ConditionalExpression':
			return parent.test === child || parent.consequent === child || parent.alternate === child;
		case 'LogicalExpression':
		case 'BinaryExpression':
			return parent.left === child || parent.right === child;
		case 'UnaryExpression':
		case 'AwaitExpression':
		case 'SpreadElement':
		case 'YieldExpression':
			return parent.argument === child;
		case 'TemplateLiteral':
		case 'SequenceExpression':
			return /** @type {any[]} */ (parent.expressions).includes(child);
		case 'TSAsExpression':
		case 'TSNonNullExpression':
		case 'TSSatisfiesExpression':
			return parent.expression === child;
		default:
			return false;
	}
}

/**
 * @param {any} element
 * @param {AnalysisContext} context
 * @param {CompileError[]} [errors]
 */
export function validate_nesting(element, context, errors) {
	const tag = get_element_tag(element);

	if (tag === null) {
		return;
	}

	for (let i = context.path.length - 1; i >= 0; i--) {
		const parent = context.path[i];
		if (parent.type === 'JSXElement' || parent.type === 'JSXStyleElement') {
			const parent_tag = get_element_tag(parent);
			if (parent_tag === null) {
				continue;
			}

			if (parent_tag in invalid_nestings) {
				const validation_set =
					invalid_nestings[/** @type {keyof typeof invalid_nestings} */ (parent_tag)];
				if (validation_set.has(tag)) {
					error(
						`Invalid HTML nesting: <${tag}> cannot be a descendant of <${parent_tag}>.`,
						context.state.analysis.module.filename,
						element,
						errors,
						context.state.analysis.comments,
					);
				} else {
					// if my parent has a set of invalid children
					// and i'm not in it, then i'm valid
					return;
				}
			}
		}
	}
}
