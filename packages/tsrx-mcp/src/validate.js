import fs from 'node:fs/promises';
import path from 'node:path';
import { analyze_tsrx_result } from './analyze.js';
import { compile_tsrx } from './compile.js';
import { format_tsrx } from './format.js';
import { resolve_cwd_context } from './target.js';

/**
 * @param {unknown} error
 */
function normalize_read_error(error) {
	if (error && typeof error === 'object') {
		const candidate = /** @type {Record<string, unknown>} */ (error);
		return {
			message: candidate.message ? String(candidate.message) : String(error),
			code: candidate.code ? String(candidate.code) : null,
		};
	}
	return {
		message: String(error),
		code: null,
	};
}

/**
 * @param {string} filePath
 * @param {string} cwd
 */
function resolve_file_path(filePath, cwd) {
	return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(cwd, filePath);
}

/**
 * @param {{
 *   filePath: string,
 *   cwd?: string,
 *   target?: string,
 *   collect?: boolean,
 *   loose?: boolean,
 *   mode?: 'client' | 'server',
 *   printWidth?: number,
 *   tabWidth?: number,
 *   useTabs?: boolean,
 *   singleQuote?: boolean,
 * }} input
 */
export async function validate_tsrx_file(input) {
	const cwd_context = resolve_cwd_context(input.cwd);
	const cwd = cwd_context.cwd;
	const filePath = resolve_file_path(input.filePath, cwd);
	const filename = filePath;

	let code;
	try {
		code = await fs.readFile(filePath, 'utf8');
	} catch (error) {
		return {
			ok: false,
			cwd,
			filePath,
			filename,
			message: cwd_context.hint,
			read: {
				ok: false,
				error: normalize_read_error(error),
			},
			format: null,
			compile: null,
			analysis: null,
		};
	}

	const formatResult = await format_tsrx({
		code,
		filename,
		cwd,
		printWidth: input.printWidth,
		tabWidth: input.tabWidth,
		useTabs: input.useTabs,
		singleQuote: input.singleQuote,
		check: true,
	});
	const compileResult = await compile_tsrx({
		code,
		filename,
		cwd,
		target: input.target,
		collect: input.collect,
		loose: input.loose,
		mode: input.mode,
		includeCode: false,
	});
	const analysisResult = analyze_tsrx_result({
		code,
		compileResult,
	});

	return {
		ok: formatResult.ok && formatResult.check === true && compileResult.ok,
		cwd,
		filePath,
		filename,
		message: cwd_context.hint,
		read: {
			ok: true,
			error: null,
		},
		format: formatResult,
		compile: compileResult,
		analysis: analysisResult,
	};
}
