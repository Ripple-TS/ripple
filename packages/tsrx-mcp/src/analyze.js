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
 *   errors: Array<{ message: string }>,
 * }} TSRXCompileSummary
 */

/**
 * @param {string} code
 * @param {number} open_brace_index
 */
function find_matching_brace(code, open_brace_index) {
	let depth = 1;
	for (let i = open_brace_index + 1; i < code.length; i++) {
		const character = code[i];
		if (character === '{') depth++;
		else if (character === '}') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/**
 * @param {string} code
 * @param {RegExp} header_re
 */
function find_block_bodies(code, header_re) {
	const bodies = [];
	let match;
	while ((match = header_re.exec(code)) !== null) {
		const open_brace_index = match.index + match[0].length - 1;
		const close_brace_index = find_matching_brace(code, open_brace_index);
		if (close_brace_index === -1) continue;
		bodies.push(code.slice(open_brace_index + 1, close_brace_index));
	}
	return bodies;
}

/**
 * @param {string} code
 */
function has_function_component_shape(code) {
	const header_re =
		/\b(?:export\s+default\s+)?(?:export\s+)?function\s+[A-Z][\w$]*\s*\([^)]*\)\s*\{/g;
	return find_block_bodies(code, header_re).some((body) => /<[A-Za-z]/.test(body));
}

/**
 * @param {string} code
 */
function has_jsx_return_in_component(code) {
	const header_re = /\bcomponent\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/g;
	return find_block_bodies(code, header_re).some((body) => /\breturn\s*<[^>]+>/.test(body));
}

/**
 * @param {string} message
 */
function is_jsx_expression_error(message) {
	return message.includes('JSX elements cannot be used as expressions');
}

/**
 * @param {{ code: string, compileResult: TSRXCompileSummary }} input
 * @returns {TSRXAdvice[]}
 */
function create_advice(input) {
	const { code, compileResult } = input;
	/** @type {TSRXAdvice[]} */
	const advice = [];
	const diagnostic_messages = compileResult.errors.map((error) => error.message).join('\n');

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

	if (has_function_component_shape(code)) {
		advice.push({
			kind: 'function-component-syntax',
			severity: 'warning',
			title: 'Use TSRX component declarations',
			message:
				'.tsrx component files should use the component keyword. A React-style function returning JSX is usually the wrong authoring shape for TSRX.',
			documentation: ['tsrx://docs/components.md'],
		});
	}

	const fired_jsx_return =
		has_jsx_return_in_component(code) || is_jsx_expression_error(diagnostic_messages);

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

	// Negative lookahead skips `<tsx>` and `<tsx:Foo>` — those are the
	// canonical TSRX expression-position wrappers, so flagging them as
	// "needs wrapping" would tell the user to wrap what is already wrapped.
	const unwrapped_jsx_open = /<(?!tsx(?:[:>\s/]|$))[A-Za-z]/;
	if (
		new RegExp(`\\b(?:const|let|var)\\s+[\\w$]+\\s*=\\s*${unwrapped_jsx_open.source}`).test(code) ||
		(!fired_jsx_return && new RegExp(`\\breturn\\s*${unwrapped_jsx_open.source}`).test(code))
	) {
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
		code: input.code,
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
