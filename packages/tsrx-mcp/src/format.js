import path from 'node:path';
import { format, resolveConfig, resolveConfigFile } from 'prettier';
import * as tsrx_prettier_plugin from '@tsrx/prettier-plugin';
import { resolve_cwd_context } from './target.js';

const BUILTIN_DEFAULTS = {
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	singleQuote: true,
};

/**
 * @typedef {{
 *   message: string,
 *   name: string | null,
 *   loc: unknown,
 * }} NormalizedFormatError
 *
 * @typedef {{
 *   ok: boolean,
 *   filename: string,
 *   cwd: string,
 *   message: string | null,
 *   configPath: string | null,
 *   formatted: string | null,
 *   changed: boolean,
 *   errors: NormalizedFormatError[],
 *   check: boolean | null,
 * }} FormatResult
 */

/**
 * @param {unknown} error
 * @returns {NormalizedFormatError}
 */
function normalize_error(error) {
	if (error && typeof error === 'object') {
		const candidate = /** @type {Record<string, unknown>} */ (error);
		return {
			message: candidate.message ? String(candidate.message) : String(error),
			name: candidate.name ? String(candidate.name) : null,
			loc: candidate.loc ?? null,
		};
	}
	return {
		message: String(error),
		name: null,
		loc: null,
	};
}

/**
 * @param {{
 *   printWidth?: number,
 *   tabWidth?: number,
 *   useTabs?: boolean,
 *   singleQuote?: boolean,
 * }} input
 */
function pick_user_overrides(input) {
	/** @type {Record<string, unknown>} */
	const overrides = {};
	if (input.printWidth !== undefined) overrides.printWidth = input.printWidth;
	if (input.tabWidth !== undefined) overrides.tabWidth = input.tabWidth;
	if (input.useTabs !== undefined) overrides.useTabs = input.useTabs;
	if (input.singleQuote !== undefined) overrides.singleQuote = input.singleQuote;
	return overrides;
}

/**
 * @param {{
 *   code: string,
 *   filename?: string,
 *   cwd?: string,
 *   printWidth?: number,
 *   tabWidth?: number,
 *   useTabs?: boolean,
 *   singleQuote?: boolean,
 *   check?: boolean,
 * }} input
 * @returns {Promise<FormatResult>}
 */
export async function format_tsrx(input) {
	const filename = input.filename ?? 'Component.tsrx';
	const cwd_context = resolve_cwd_context(input.cwd);
	const cwd = cwd_context.cwd;
	const resolved_filename = path.isAbsolute(filename)
		? path.resolve(filename)
		: path.resolve(cwd, filename);

	let project_config = /** @type {Record<string, unknown> | null} */ (null);
	let config_path = /** @type {string | null} */ (null);
	try {
		project_config = await resolveConfig(resolved_filename, { editorconfig: true });
		config_path = await resolveConfigFile(resolved_filename);
	} catch {
		// Treat unreadable Prettier config as "no project config" rather than failing.
	}

	const user_overrides = pick_user_overrides(input);
	const options = {
		...BUILTIN_DEFAULTS,
		...(project_config ?? {}),
		...user_overrides,
		filepath: resolved_filename,
		parser: 'ripple',
		plugins: [tsrx_prettier_plugin],
	};

	try {
		const formatted = await format(input.code, options);

		return {
			ok: true,
			filename,
			cwd,
			message: cwd_context.hint,
			configPath: config_path,
			formatted,
			changed: formatted !== input.code,
			errors: [],
			check: input.check ? formatted === input.code : null,
		};
	} catch (error) {
		return {
			ok: false,
			filename,
			cwd,
			message: cwd_context.hint,
			configPath: config_path,
			formatted: null,
			changed: false,
			errors: [normalize_error(error)],
			check: input.check ? false : null,
		};
	}
}
