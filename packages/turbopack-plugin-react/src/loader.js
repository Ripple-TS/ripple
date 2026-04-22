import { compile } from '@tsrx/react';

const CSS_QUERY = '?tsrx-css&lang.css';

/**
 * @param {string} source
 * @param {number} index
 * @returns {number}
 */
function skip_whitespace_and_comments(source, index) {
	while (index < source.length) {
		const char = source[index];
		if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
			index++;
			continue;
		}
		if (char === '/' && source[index + 1] === '/') {
			index += 2;
			while (index < source.length && source[index] !== '\n') {
				index++;
			}
			continue;
		}
		if (char === '/' && source[index + 1] === '*') {
			index += 2;
			while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
				index++;
			}
			index = Math.min(index + 2, source.length);
			continue;
		}
		break;
	}
	return index;
}

/**
 * @param {string} source
 * @param {number} index
 * @returns {number}
 */
function read_directive_statement(source, index) {
	const quote = source[index];
	if (quote !== '"' && quote !== "'") {
		return -1;
	}

	let cursor = index + 1;
	let value = '';
	while (cursor < source.length) {
		const char = source[cursor];
		if (char === '\\') {
			value += source.slice(cursor, cursor + 2);
			cursor += 2;
			continue;
		}
		if (char === quote) {
			cursor++;
			break;
		}
		value += char;
		cursor++;
	}

	if (cursor > source.length || !value.startsWith('use ')) {
		return -1;
	}

	cursor = skip_whitespace_and_comments(source, cursor);
	if (source[cursor] === ';') {
		cursor++;
	}
	return skip_whitespace_and_comments(source, cursor);
}

/**
 * @param {string} code
 * @param {string} resource_path
 * @returns {string}
 */
function prepend_css_import(code, resource_path) {
	const css_import = `import ${JSON.stringify(resource_path + CSS_QUERY)};\n`;
	const initial_index = skip_whitespace_and_comments(code, 0);
	let insertion_index = initial_index;
	let scan_index = initial_index;

	while (scan_index < code.length) {
		const next_index = read_directive_statement(code, scan_index);
		if (next_index === -1) {
			break;
		}
		insertion_index = next_index;
		scan_index = next_index;
	}

	return `${code.slice(0, insertion_index)}${css_import}${code.slice(insertion_index)}`;
}

/**
 * @typedef {{
 * 	resourcePath: string,
 * 	async: () => (err: unknown, output?: string | null, map?: unknown) => void,
 * }} LoaderContext
 */

/**
 * Compile `.tsrx` files to TSX for consumption by Turbopack's built-in
 * TypeScript/React pipeline. When a component-local `<style>` block is
 * present, prepend an import to a sibling virtual CSS resource that is handled
 * by the Turbopack config helper's query-targeted CSS rule.
 *
 * @this {LoaderContext}
 * @param {string} source
 * @returns {void}
 */
export default function tsrx_react_turbopack_loader(source) {
	const callback = this.async();

	try {
		const { code, map, css } = compile(source, this.resourcePath);
		const output = css ? prepend_css_import(code, this.resourcePath) : code;
		const output_map = css ? null : map;

		callback(null, output, /** @type {any} */ (output_map ?? undefined));
	} catch (/** @type {any} */ err) {
		callback(err);
	}
}
