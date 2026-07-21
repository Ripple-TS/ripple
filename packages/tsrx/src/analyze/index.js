/**
@import * as AST from 'estree';
@import { TSRXAnalysisOptions, TSRXAnalysisResult, TSRXAnalysisState } from '../../types/index';
 */

import { walk } from 'zimmerframe';
import {
	is_code_block_function_body,
	is_statement_position,
	is_tsrx_render_output_node,
} from '../utils/ast.js';
import { validate_forgotten_statement_container } from './validation.js';

/**
 * Wrappers that preserve an expression's value and therefore do not turn a
 * template into a used value on their own. Looking through them keeps strict
 * builds and `preserveParens` type-only builds on the same diagnostic path.
 *
 * @param {AST.Node} parent
 * @param {AST.Node} child
 * @returns {boolean}
 */
function is_transparent_expression_wrapper(parent, child) {
	return (
		(parent.type === 'ParenthesizedExpression' ||
			parent.type === 'TSAsExpression' ||
			parent.type === 'TSSatisfiesExpression' ||
			parent.type === 'TSNonNullExpression' ||
			parent.type === 'TSInstantiationExpression' ||
			parent.type === 'TSTypeAssertion' ||
			parent.type === 'ChainExpression') &&
		/** @type {{ expression?: AST.Node }} */ (parent).expression === child
	);
}

/**
 * A template is unused only when it is itself the statement being executed.
 * Templates nested in assignments, returns, arguments, operands, or other
 * value-producing expressions may be consumed later and are valid.
 *
 * @param {AST.Node} node
 * @param {AST.Node[]} path
 * @returns {boolean}
 */
function is_free_floating_template(node, path) {
	let child = node;

	for (let i = path.length - 1; i >= 0; i -= 1) {
		const parent = path[i];

		if (is_transparent_expression_wrapper(parent, child)) {
			child = parent;
			continue;
		}

		if (parent.type === 'ExpressionStatement' && parent.expression === child) {
			return true;
		}

		if (is_statement_position(parent, child)) {
			return true;
		}

		return false;
	}

	return false;
}

/**
 * @param {AST.Function} node
 * @param {{ next: (state?: TSRXAnalysisState) => unknown, state: TSRXAnalysisState }} context
 */
function visit_function(node, { next, state }) {
	next({
		...state,
		function: node,
		function_body_is_code_block: is_code_block_function_body(node.body, node),
		inside_template_output: false,
	});
}

/**
 * @param {AST.Node} node
 * @param {{ next: (state?: TSRXAnalysisState) => unknown, path: AST.Node[], state: TSRXAnalysisState }} context
 */
function visit_render_output(node, { next, path, state }) {
	if (!is_tsrx_render_output_node(node)) {
		next();
		return;
	}

	if (
		state.function &&
		!(state.function_body_is_code_block && state.function.body === node) &&
		!state.inside_template_output &&
		is_free_floating_template(node, path)
	) {
		validate_forgotten_statement_container(
			node,
			state.filename,
			state.collect ? state.errors : undefined,
			state.comments,
		);
	}

	// A JSXCodeBlock contains ordinary setup statements in `body` as well as
	// the retained output in `render`. Reset the template context while walking
	// both fields so free-floating output in setup is still diagnosed. The
	// render node itself is retained by the code block, and establishes template
	// context for its own descendants when this visitor reaches it.
	next({ ...state, inside_template_output: node.type !== 'JSXCodeBlock' });
}

/**
 * @param {AST.ClassDeclaration | AST.ClassExpression} _node
 * @param {{ next: (state?: TSRXAnalysisState) => unknown, state: TSRXAnalysisState }} context
 */
function visit_class(_node, { next, state }) {
	next({
		...state,
		function: null,
		function_body_is_code_block: false,
		inside_template_output: false,
	});
}

const visitors = {
	FunctionDeclaration: visit_function,
	FunctionExpression: visit_function,
	ArrowFunctionExpression: visit_function,

	// A class body is not part of the surrounding function's execution context.
	// Method/function nodes establish their own context when reached.
	ClassDeclaration: visit_class,
	ClassExpression: visit_class,

	JSXElement: visit_render_output,
	JSXFragment: visit_render_output,
	JSXStyleElement: visit_render_output,
	JSXCodeBlock: visit_render_output,
	JSXIfExpression: visit_render_output,
	JSXForExpression: visit_render_output,
	JSXSwitchExpression: visit_render_output,
	JSXTryExpression: visit_render_output,
};

/**
 * Run target-neutral semantic validation over a parsed TSRX module. Parsing
 * remains syntax-only; every target invokes this pass before target analysis or
 * transformation. Type-only/Volar callers collect diagnostics and continue.
 *
 * @param {AST.Program} ast
 * @param {string | null | undefined} filename
 * @param {TSRXAnalysisOptions} [options]
 * @returns {TSRXAnalysisResult}
 */
export function analyze_tsrx(ast, filename, options = {}) {
	const errors = options.errors ?? [];
	const comments = options.comments ?? [];
	const collect = !!(options.collect || options.loose || options.typeOnly || options.to_ts);

	/** @type {TSRXAnalysisState} */
	const state = {
		filename: filename ?? null,
		collect,
		errors,
		comments,
		function: null,
		function_body_is_code_block: false,
		inside_template_output: false,
	};

	walk(ast, state, visitors);

	return { ast, errors, comments };
}
