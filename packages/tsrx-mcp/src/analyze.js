import {
	DIAGNOSTIC_CODES,
	TSRX_DO_WHILE_STATEMENT_ERROR,
	TSRX_FOR_IN_STATEMENT_ERROR,
	TSRX_FOR_STATEMENT_ERROR,
	TSRX_IF_BREAK_ERROR,
	TSRX_IF_CONTINUE_ERROR,
	TSRX_IF_RETURN_ERROR,
	TSRX_LOOP_BREAK_ERROR,
	TSRX_LOOP_CONTINUE_ERROR,
	TSRX_LOOP_RETURN_ERROR,
	TSRX_RETURN_STATEMENT_ERROR,
	TSRX_WHILE_STATEMENT_ERROR,
} from '@tsrx/core';
import { compile_tsrx } from './compile.js';

/**
 * @typedef {{
 *   kind: string,
 *   severity: 'error' | 'warning' | 'info',
 *   title: string,
 *   message: string,
 *   documentation: string[],
 * }} TSRXAdvice
 */

/**
 * @typedef {{
 *   ok: boolean,
 *   target: string | null,
 *   errors: Array<{ message: string, code?: string | null }>,
 * }} TSRXCompileSummary
 */

/**
 * @param {{ compileResult: TSRXCompileSummary }} input
 * @returns {TSRXAdvice[]}
 */
function create_advice(input) {
	const { compileResult } = input;
	/** @type {TSRXAdvice[]} */
	const advice = [];
	const error_codes = new Set(compileResult.errors.map((error) => error.code).filter(Boolean));
	const error_messages = new Set(compileResult.errors.map((error) => error.message));

	if (!compileResult.target) {
		advice.push({
			kind: 'missing-target',
			severity: 'error',
			title: 'Select a TSRX runtime target',
			message:
				'The compiler could not infer a runtime target. Call detect-target with a project cwd, or pass target as ripple, react, preact, solid, or vue.',
			documentation: ['tsrx://docs/target-integration.md'],
		});
	}

	if (error_codes.has(DIAGNOSTIC_CODES.UNCLOSED_TAG)) {
		advice.push({
			kind: 'unclosed-tag',
			severity: 'error',
			title: 'Close template tags',
			message:
				'The compiler found a template tag without a matching closing tag. Add the missing closing tag before changing target-specific code.',
			documentation: ['tsrx://docs/components.md'],
		});
	}

	if (error_codes.has(DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG)) {
		advice.push({
			kind: 'mismatched-closing-tag',
			severity: 'error',
			title: 'Match closing tags',
			message:
				'The compiler found a closing tag that does not match the current open template tag. Align the tag names or close the inner tag first.',
			documentation: ['tsrx://docs/components.md'],
		});
	}

	if (error_codes.has(DIAGNOSTIC_CODES.JSX_EXPRESSION_VALUE)) {
		advice.push({
			kind: 'jsx-expression-value',
			severity: 'info',
			title: 'Use JSX-shaped expression values',
			message:
				'TSRX expression values use JSX-shaped nodes. Use a JSXElement directly for one child, a JSXFragment when the value needs multiple children, or a JSX statement container when setup must produce one final output.',
			documentation: ['tsrx://docs/expression-values.md'],
		});
	}

	if (error_codes.has(DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER)) {
		advice.push({
			kind: 'forgotten-statement-container',
			severity: 'error',
			title: 'Add @ before statement-container braces',
			message:
				'A function body with TypeScript setup followed by bare TSRX output must use a JSX statement container. Change the opening `{` to `@{`, or use an ordinary `return` when the function only returns JSX.',
			documentation: ['tsrx://docs/components.md', 'tsrx://docs/expression-values.md'],
		});
	}

	if (
		error_messages.has(TSRX_LOOP_RETURN_ERROR) ||
		error_messages.has(TSRX_LOOP_BREAK_ERROR) ||
		error_messages.has(TSRX_LOOP_CONTINUE_ERROR)
	) {
		advice.push({
			kind: 'tsrx-loop-control-flow',
			severity: 'error',
			title: 'Filter before TSRX for...of loops',
			message:
				'Direct continue, break, and return statements are not valid inside TSRX @for loops. Filter the iterable before rendering, use @empty { ... } for the no-items fallback, and keep ordinary JavaScript control flow inside nested functions.',
			documentation: ['tsrx://docs/control-flow.md'],
		});
	}

	if (
		error_messages.has(TSRX_IF_RETURN_ERROR) ||
		error_messages.has(TSRX_IF_BREAK_ERROR) ||
		error_messages.has(TSRX_IF_CONTINUE_ERROR)
	) {
		advice.push({
			kind: 'tsrx-if-control-flow',
			severity: 'error',
			title: 'Keep @if branches render-only',
			message:
				'Direct return, continue, and break statements are not valid inside TSRX @if branches. Use an ordinary JavaScript if statement before template output for guard returns, or render the branch output conditionally.',
			documentation: ['tsrx://docs/control-flow.md'],
		});
	}

	if (error_messages.has(TSRX_RETURN_STATEMENT_ERROR)) {
		advice.push({
			kind: 'tsrx-template-return',
			severity: 'error',
			title: 'Put returns in TypeScript setup',
			message:
				'Return statements are ordinary JavaScript control flow for functions, not template output. Use guard clauses before a JSX statement container or return value, or render conditionally inside the template.',
			documentation: ['tsrx://docs/control-flow.md'],
		});
	}

	if (
		error_messages.has(TSRX_FOR_STATEMENT_ERROR) ||
		error_messages.has(TSRX_FOR_IN_STATEMENT_ERROR) ||
		error_messages.has(TSRX_WHILE_STATEMENT_ERROR) ||
		error_messages.has(TSRX_DO_WHILE_STATEMENT_ERROR)
	) {
		advice.push({
			kind: 'unsupported-component-loop',
			severity: 'error',
			title: 'Use for...of for component list rendering',
			message:
				'Component template scope supports for...of loops for rendering lists. Move regular for, for...in, while, and do...while loops into a nested function, event handler, effect, or helper.',
			documentation: ['tsrx://docs/control-flow.md'],
		});
	}

	if (advice.length === 0 && compileResult.ok) {
		advice.push({
			kind: 'compile-clean',
			severity: 'info',
			title: 'TSRX compiled successfully',
			message:
				'No target-neutral TSRX issues were found. For runtime API or bundler details, continue with the target-specific guidance for the detected target.',
			documentation: ['tsrx://docs/target-integration.md'],
		});
	}

	if (advice.length === 0) {
		advice.push({
			kind: 'compiler-diagnostic',
			severity: 'error',
			title: 'Compiler diagnostics need review',
			message:
				'The TSRX compiler returned diagnostics that do not match a known MCP hint yet. Use the normalized compiler errors and relevant docs sections to revise the source.',
			documentation: ['tsrx://docs/overview.md'],
		});
	}

	return advice;
}

/**
 * @param {{
 *   code: string,
 *   compileResult: {
 *     ok: boolean,
 *     target: string | null,
 *     compilerPackage: string | null,
 *     filename: string,
 *     cwd: string,
 *     errors: Array<{
 *       message: string,
 *       code: string | null,
 *       type: string | null,
 *       fileName: string | null,
 *       pos: number | null,
 *       end: number | null,
 *       raisedAt: number | null,
 *       loc: unknown
 *     }>
 *   }
 * }} input
 */
export function analyze_tsrx_result(input) {
	const { compileResult } = input;
	const advice = create_advice({
		compileResult,
	});

	return {
		ok: compileResult.ok,
		target: compileResult.target,
		compilerPackage: compileResult.compilerPackage,
		filename: compileResult.filename,
		cwd: compileResult.cwd,
		errors: compileResult.errors,
		advice,
		nextSteps: compileResult.ok
			? [
					'Use target-specific resources for runtime semantics.',
					'Compile again after changing generated TSRX.',
				]
			: [
					'Apply the highest-severity advice first.',
					'Fetch the linked docs resources for syntax details.',
					'Run compile-tsrx again after revising the source.',
				],
	};
}

/**
 * @param {{
 *   code: string,
 *   filename?: string,
 *   target?: string,
 *   cwd?: string,
 *   collect?: boolean,
 *   loose?: boolean,
 *   mode?: 'client' | 'server'
 * }} input
 */
export async function analyze_tsrx(input) {
	const compileResult = await compile_tsrx({
		...input,
		includeCode: false,
	});
	return analyze_tsrx_result({
		code: input.code,
		compileResult,
	});
}
