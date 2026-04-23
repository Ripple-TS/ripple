const ATTR_REGEX = /[&"<]/g;
const CONTENT_REGEX = /[&<]/g;
const OPEN_TAG_REGEX = /</g;
const CLOSE_TAG_REGEX = />/g;

/**
 * @template V
 * @param {V} value
 * @param {boolean} [is_attr]
 */
export function escape(value, is_attr) {
	const str = String(value ?? '');

	const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
	pattern.lastIndex = 0;

	let escaped = '';
	let last = 0;

	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
		last = i + 1;
	}

	return escaped + str.substring(last);
}

/**
 * Escapes characters that can prematurely terminate inline script tags.
 * @param {string} str
 * @returns {string}
 */
export function escape_script(str) {
	return str.replace(OPEN_TAG_REGEX, '\\u003c').replace(CLOSE_TAG_REGEX, '\\u003e');
}
