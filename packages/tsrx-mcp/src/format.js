import { format } from 'prettier';
import * as tsrx_prettier_plugin from '@tsrx/prettier-plugin';

/**
 * @typedef {{
 *   message: string,
 *   name: string | null,
 *   loc: unknown,
 * }} NormalizedFormatError
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
 *   code: string,
 *   filename?: string,
 *   printWidth?: number,
 *   tabWidth?: number,
 *   useTabs?: boolean,
 *   singleQuote?: boolean,
 *   check?: boolean,
 * }} input
 */
export async function format_tsrx(input) {
	const filename = input.filename ?? 'Component.tsrx';
	try {
		const formatted = await format(input.code, {
			filepath: filename,
			parser: 'ripple',
			plugins: [tsrx_prettier_plugin],
			printWidth: input.printWidth ?? 100,
			tabWidth: input.tabWidth ?? 2,
			useTabs: input.useTabs ?? true,
			singleQuote: input.singleQuote ?? true,
		});

		return {
			ok: true,
			filename,
			formatted,
			changed: formatted !== input.code,
			errors: [],
			check: input.check ? formatted === input.code : null,
		};
	} catch (error) {
		return {
			ok: false,
			filename,
			formatted: null,
			changed: false,
			errors: [normalize_error(error)],
			check: input.check ? false : null,
		};
	}
}
