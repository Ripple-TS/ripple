import {
	defer_hydration,
	get,
	output_push,
	regular_block,
	render_expression,
	transform_output,
	tsrx_element,
} from './index.js';

/**
 * Hide top-level elements without adding a layout wrapper. The output buffer
 * is complete before this runs, including async holes. Quoted attributes,
 * comments and raw-text elements are consumed as whole tokens.
 * @param {string} html
 */
export function hide_activity_html(html) {
	var depth = 0;
	var raw = '';
	var result = '';
	var tokens = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|[^<]+|</g;
	for (var match of html.matchAll(tokens)) {
		var token = match[0];
		var tag = /^<(\/)?([\w:-]+)/.exec(token);
		if (raw !== '') {
			result += token;
			if (tag?.[1] && tag[2].toLowerCase() === raw) {
				raw = '';
				depth--;
			}
			continue;
		}
		if (tag !== null) {
			var name = tag[2].toLowerCase();
			if (tag[1]) depth--;
			else {
				if (depth === 0) token = hide_element(token);
				if (
					!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(name) &&
					!token.endsWith('/>')
				) {
					depth++;
					if (/^(script|style|textarea|title)$/.test(name)) raw = name;
				}
			}
		} else if (depth === 0 && !token.startsWith('<!--')) {
			// Escaped text remains HTML until restoration, so entities roundtrip.
			token = '<!--ripple-text:' + encodeURIComponent(token).replace(/-/g, '%2D') + '-->';
		}
		result += token;
	}
	return result;
}

/** @param {string} token */
function hide_element(token) {
	var saved = false;
	var has_style = false;
	var result = token.replace(
		/(\s+)([^\s=/>]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g,
		(attribute, space, name, value) => {
			if (name.toLowerCase() === 'data-ripple-activity-style') saved = true;
			if (name.toLowerCase() !== 'style') return attribute;
			has_style = true;
			return space + 'data-ripple-activity-style' + (value ?? '=""');
		},
	);
	if (saved) return token;
	return result.replace(
		/^<[\w:-]+/,
		'$& style="display:none!important"' + (has_style ? '' : ' data-ripple-activity-style=""'),
	);
}

/** @param {import('#public').ActivityProps} props */
export function Activity(props) {
	return tsrx_element(() => {
		output_push('<!--[a-->');
		regular_block(() => {
			defer_hydration();
			if (get(props.mode) === 'hidden') transform_output(hide_activity_html);
			render_expression(props.children);
		});
		output_push('<!--]-->');
	});
}
