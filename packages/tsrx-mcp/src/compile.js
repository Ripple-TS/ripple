import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { detect_target, TARGET_CANDIDATES } from './target.js';

const VALID_TARGETS = new Set(TARGET_CANDIDATES.map((candidate) => candidate.target));

/**
 * @typedef {{
 *   message: string,
 *   code: string | null,
 *   type: string | null,
 *   fileName: string | null,
 *   pos: number | null,
 *   end: number | null,
 *   raisedAt: number | null,
 *   loc: unknown
 * }} NormalizedCompileError
 */

/**
 * @param {string | null | undefined} target
 */
function get_target_candidate(target) {
	if (!target) return null;
	return TARGET_CANDIDATES.find((candidate) => candidate.target === target) ?? null;
}

/**
 * @param {unknown} error
 * @param {string} filename
 * @returns {NormalizedCompileError}
 */
function normalize_error(error, filename) {
	if (error && typeof error === 'object') {
		const candidate = /** @type {Record<string, unknown>} */ (error);
		return {
			message: candidate.message ? String(candidate.message) : String(error),
			code: candidate.code ? String(candidate.code) : null,
			type: candidate.type ? String(candidate.type) : null,
			fileName: candidate.fileName ? String(candidate.fileName) : filename,
			pos: typeof candidate.pos === 'number' ? candidate.pos : null,
			end: typeof candidate.end === 'number' ? candidate.end : null,
			raisedAt: typeof candidate.raisedAt === 'number' ? candidate.raisedAt : null,
			loc: candidate.loc ?? null,
		};
	}
	return {
		message: String(error),
		code: null,
		type: null,
		fileName: filename,
		pos: null,
		end: null,
		raisedAt: null,
		loc: null,
	};
}

/**
 * @param {unknown} errors
 * @param {string} filename
 */
function normalize_errors(errors, filename) {
	return Array.isArray(errors) ? errors.map((error) => normalize_error(error, filename)) : [];
}

/**
 * @param {string} cwd
 * @param {string | null} package_json_path
 */
function create_project_require(cwd, package_json_path) {
	return createRequire(package_json_path ?? path.join(path.resolve(cwd), 'package.json'));
}

/**
 * @param {string} compiler_package
 * @param {string} cwd
 * @param {string | null} package_json_path
 */
async function import_compiler(compiler_package, cwd, package_json_path) {
	const project_require = create_project_require(cwd, package_json_path);
	const resolved = project_require.resolve(compiler_package);
	return import(pathToFileURL(resolved).href);
}

/**
 * @param {{ code: string }} result
 */
function get_generated_code(result) {
	if (!result || typeof result !== 'object') return null;
	return result.code || null;
}

/**
 * @param {{ css: string }} result
 */
function get_generated_css(result) {
	if (!result || typeof result !== 'object') return null;
	return result.css || null;
}

/**
 * @param {{
 *   code: string,
 *   filename?: string,
 *   target?: string,
 *   cwd?: string,
 *   collect?: boolean,
 *   loose?: boolean,
 *   includeCode?: boolean,
 *   mode?: 'client' | 'server'
 * }} input
 */
export async function compile_tsrx(input) {
	const filename = input.filename ?? 'Component.tsrx';
	const detection = detect_target(input.cwd);
	const cwd = detection.cwd;
	const target = input.target ?? detection.detectedTarget;

	if (!target) {
		return {
			ok: false,
			target: null,
			compilerPackage: null,
			filename,
			cwd,
			errors: [
				{
					message:
						detection.confidence === 'ambiguous'
							? detection.message
							: `Could not infer a TSRX target. Pass target explicitly. ${detection.message}`,
					code: null,
					type: null,
					fileName: filename,
					pos: null,
					end: null,
					raisedAt: null,
					loc: null,
				},
			],
			code: null,
			css: null,
		};
	}

	if (!VALID_TARGETS.has(target)) {
		return {
			ok: false,
			target,
			compilerPackage: null,
			filename,
			cwd,
			errors: [
				{
					message: `Unknown TSRX target "${target}".`,
					code: null,
					type: null,
					fileName: filename,
					pos: null,
					end: null,
					raisedAt: null,
					loc: null,
				},
			],
			code: null,
			css: null,
		};
	}

	const candidate = get_target_candidate(target);
	if (!candidate) {
		throw new Error(`Missing compiler candidate for target "${target}".`);
	}

	try {
		const compiler = await import_compiler(
			candidate.compilerPackage,
			cwd,
			detection.packageJsonPath,
		);
		if (typeof compiler.compile !== 'function') {
			throw new Error(`${candidate.compilerPackage} does not export a compile() function.`);
		}

		const result = compiler.compile(input.code, filename, {
			collect: input.collect ?? true,
			loose: input.loose,
			mode: input.mode,
		});
		const errors = normalize_errors(result?.errors, filename);
		const code = get_generated_code(result);
		const css = get_generated_css(result);

		return {
			ok: errors.length === 0,
			target,
			compilerPackage: candidate.compilerPackage,
			filename,
			cwd,
			errors,
			code: input.includeCode ? code : null,
			css: input.includeCode ? css : null,
		};
	} catch (error) {
		return {
			ok: false,
			target,
			compilerPackage: candidate.compilerPackage,
			filename,
			cwd,
			errors: [normalize_error(error, filename)],
			code: null,
			css: null,
		};
	}
}
