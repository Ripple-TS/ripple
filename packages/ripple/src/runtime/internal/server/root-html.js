/** Map top-level HTML without wrappers. Quoted attributes, comments and raw
 * text are consumed as complete tokens. Shared by retained SSR boundaries.
 * @param {string} html
 * @param {(tag: string) => string} element
 * @param {(text: string) => string} [text]
 */
export function map_root_html(html, element, text) {
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
				if (depth === 0) token = element(token);
				if (
					!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(name) &&
					!token.endsWith('/>')
				) {
					depth++;
					if (/^(script|style|textarea|title)$/.test(name)) raw = name;
				}
			}
		} else if (depth === 0 && !token.startsWith('<!--') && text) {
			token = text(token);
		}
		result += token;
	}
	return result;
}
