/**
@import * as AST from 'estree';
@import { AnalysisContext, CompileError } from '../../types/index';
 */

import { error } from '../errors.js';

export const COMPONENT_RETURN_VALUE_ERROR =
	'Return statements inside components cannot have a return value.';
export const COMPONENT_LOOP_RETURN_ERROR =
	'Return statements are not allowed inside component for...of loops. Use continue instead.';
export const COMPONENT_LOOP_BREAK_ERROR =
	'Break statements are not allowed inside component for...of loops.';
export const COMPONENT_FOR_STATEMENT_ERROR =
	'For loops are not supported in components. Use for...of instead.';
export const COMPONENT_FOR_IN_STATEMENT_ERROR =
	'For...in loops are not supported in components. Use for...of instead.';
export const COMPONENT_WHILE_STATEMENT_ERROR =
	'While loops are not supported in components. Move the while loop into a function.';
export const COMPONENT_DO_WHILE_STATEMENT_ERROR =
	'Do...while loops are not supported in components. Move the do...while loop into a function.';
export const CLASS_COMPONENT_AS_NON_ARROW_PROPERTY_ERROR =
	'Components declared inside a class must be defined as an arrow function class property (e.g. `Foo = component() => { ... }`). Non-arrow component property values are not allowed.';
export const COMPONENT_MULTIPLE_PARAMS_ERROR =
	'Components accept a single props parameter. Move additional inputs into the props object instead.';

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
 * @param {AST.Element} element
 * @returns {string | null}
 */
function get_element_tag(element) {
	return element.id.type === 'Identifier' ? element.id.name : null;
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
export function validate_component_return_statement(node, filename, errors, comments) {
	if (node.argument === null) {
		return;
	}

	error(
		COMPONENT_RETURN_VALUE_ERROR,
		filename ?? null,
		get_return_keyword_node(node),
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
export function validate_component_loop_return_statement(node, filename, errors, comments) {
	error(
		COMPONENT_LOOP_RETURN_ERROR,
		filename ?? null,
		get_return_keyword_node(node),
		errors,
		comments,
	);
}

/**
 * @param {AST.BreakStatement} node
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_component_loop_break_statement(node, filename, errors, comments) {
	error(
		COMPONENT_LOOP_BREAK_ERROR,
		filename ?? null,
		get_statement_keyword_node(node, 'break'),
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
export function validate_component_unsupported_loop_statement(node, filename, errors, comments) {
	let message;
	if (node.type === 'ForStatement') {
		message = COMPONENT_FOR_STATEMENT_ERROR;
	} else if (node.type === 'ForInStatement') {
		message = COMPONENT_FOR_IN_STATEMENT_ERROR;
	} else if (node.type === 'WhileStatement') {
		message = COMPONENT_WHILE_STATEMENT_ERROR;
	} else {
		message = COMPONENT_DO_WHILE_STATEMENT_ERROR;
	}

	error(message, filename ?? null, node, errors, comments);
}

/**
 * Validates that a component declares at most a single (props) parameter.
 * Components have one slot for props; additional positional parameters are
 * silently dropped or naively passed through depending on the target, so
 * reject them at analysis time. Reports one error per extra parameter so
 * every offending input gets its own TS diagnostic squiggle. In throwing
 * mode the first call raises and aborts before the loop continues.
 *
 * @param {AST.Component} component
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_component_params(component, filename, errors, comments) {
	const params = /** @type {AST.Pattern[] | undefined} */ (component.params);
	if (!params || params.length <= 1) {
		return;
	}

	for (let i = 1; i < params.length; i++) {
		error(COMPONENT_MULTIPLE_PARAMS_ERROR, filename ?? null, params[i], errors, comments);
	}
}

/**
 * Validates that components declared at the top level of a class body use the
 * only allowed form: an arrow function class property (regular or static).
 * Reports an error for non-arrow component property values such as
 * `Foo = component() { ... }`. The method form (`component foo() {}` inside
 * a class body) is rejected at parse time and never reaches this check.
 *
 * @param {AST.ClassBody} class_body
 * @param {string | null | undefined} filename
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 */
export function validate_class_component_declarations(class_body, filename, errors, comments) {
	for (const member of class_body.body) {
		if (member.type !== 'PropertyDefinition') {
			continue;
		}

		const value = /** @type {any} */ (member).value;
		if (value && value.type === 'Component' && !value.metadata?.arrow) {
			error(
				CLASS_COMPONENT_AS_NON_ARROW_PROPERTY_ERROR,
				filename ?? null,
				member,
				errors,
				comments,
			);
		}
	}
}

/**
 * @param {AST.Element} element
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
		if (parent.type === 'Element') {
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
