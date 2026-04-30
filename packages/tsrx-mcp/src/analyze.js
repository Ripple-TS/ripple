import { DIAGNOSTIC_CODES } from '@tsrx/core';
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

	const has_function_component_syntax = error_codes.has(DIAGNOSTIC_CODES.FUNCTION_COMPONENT_SYNTAX);
	if (has_function_component_syntax) {
		advice.push({
			kind: 'function-component-syntax',
			severity: 'warning',
			title: 'Use TSRX component declarations',
			message:
				'.tsrx component files should use the component keyword. A React-style function returning JSX is usually the wrong authoring shape for TSRX.',
			documentation: ['tsrx://docs/components.md'],
		});
	}

	const fired_jsx_return = error_codes.has(DIAGNOSTIC_CODES.JSX_RETURN_IN_COMPONENT);

	if (fired_jsx_return) {
		advice.push({
			kind: 'jsx-return-in-component',
			severity: 'error',
			title: 'Do not return JSX from component bodies',
			message:
				'Inside a TSRX component body, template elements are statements. Replace `return <div />` with a template statement like `<div />`; use bare `return;` only for guard exits.',
			documentation: ['tsrx://docs/components.md', 'tsrx://docs/tsx-expression-values.md'],
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
			title: 'Wrap expression-position JSX',
			message:
				'When JSX is needed as a value, wrap it in a fragment `<>...</>` or `<tsx>...</tsx>` so TSRX knows it is an expression rather than a template statement.',
			documentation: ['tsrx://docs/tsx-expression-values.md'],
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
