const KEYWORDS = new Set([
	'as',
	'async',
	'await',
	'case',
	'catch',
	'class',
	'const',
	'default',
	'else',
	'export',
	'extends',
	'for',
	'from',
	'function',
	'if',
	'in',
	'import',
	'index',
	'instanceof',
	'interface',
	'key',
	'let',
	'new',
	'of',
	'pending',
	'return',
	'satisfies',
	'switch',
	'this',
	'throw',
	'try',
	'type',
	'typeof',
	'var',
]);

const CONTROL_KEYWORDS = new Set(['break', 'continue', 'return']);
const LITERALS = new Set(['false', 'null', 'true', 'undefined']);
const TEMPLATE_KEYWORDS = new Set(['ref']);

function escape_html(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(class_name: string, value: string): string {
	return `<span class="${class_name}">${escape_html(value)}</span>`;
}

function read_string(line: string, start: number): number {
	const quote = line[start];
	let index = start + 1;
	while (index < line.length) {
		if (line[index] === '\\') {
			index += 2;
			continue;
		}
		if (line[index] === quote) {
			return index + 1;
		}
		index++;
	}
	return line.length;
}

function read_identifier(line: string, start: number): number {
	let index = start + 1;
	while (index < line.length && /[\w$-]/.test(line[index])) {
		index++;
	}
	return index;
}

function read_jsx_tag(line: string, start: number): { html: string; next: number } {
	const end = line.indexOf('>', start + 1);
	const next = end === -1 ? line.length : end + 1;
	const tag = line.slice(start, next);
	let index = 0;
	let html = '';
	let expression_depth = 0;

	if (tag.startsWith('</')) {
		html += span('tag', '</');
		index = 2;
	} else {
		html += span('tag', '<');
		index = 1;
	}

	while (index < tag.length) {
		const char = tag[index];
		if (char === '>') {
			html += span('tag', '>');
			index++;
		} else if (char === '/' && tag[index + 1] === '>') {
			html += span('tag', '/>');
			index += 2;
		} else if (char === '"' || char === "'" || char === '`') {
			const string_end = read_string(tag, index);
			html += span('str', tag.slice(index, string_end));
			index = string_end;
		} else if (char === '{') {
			html += span('tbr', char);
			expression_depth++;
			index++;
		} else if (char === '}') {
			html += span('tbr', char);
			expression_depth = Math.max(expression_depth - 1, 0);
			index++;
		} else if (/[A-Za-z_@]/.test(char)) {
			const ident_end = read_identifier(tag, index);
			const ident = tag.slice(index, ident_end);
			const previous = tag.slice(0, index);
			let class_name = 'attr';

			if (expression_depth > 0) {
				if (TEMPLATE_KEYWORDS.has(ident)) {
					class_name = 'kw';
				} else if (LITERALS.has(ident)) {
					class_name = 'val';
				} else if (/^[A-Z]/.test(ident)) {
					class_name = 'type';
				} else {
					class_name = 'prop';
				}
			} else if (previous.trim().endsWith('<') || previous.trim().endsWith('</')) {
				class_name = 'el';
			}

			html += span(class_name, ident);
			index = ident_end;
		} else {
			html += escape_html(char);
			index++;
		}
	}

	return { html, next };
}

function highlight_css_line(line: string): string {
	if (line.includes('<style') || line.includes('</style')) {
		return highlight_code_line(line);
	}

	const trimmed = line.trimStart();
	if (trimmed.startsWith('//')) {
		return span('cmt', line);
	}

	let html = escape_html(line).replace(/([{}])/g, (_match, brace) => span('css-br', brace));
	html = html.replace(
		/([.#]?[A-Za-z_][\w.-]*)(\s*)<span class="css-br">\{<\/span>/g,
		(_match, selector, space) => {
			return `${span('css-sel', selector)}${escape_html(space)}${span('css-br', '{')}`;
		},
	);
	html = html.replace(/([A-Za-z-]+)(\s*:)([^;]+)(;?)/g, (_match, name, colon, value, semi) => {
		return `${span('attr', name)}${escape_html(colon)}${span('val', value)}${escape_html(semi)}`;
	});
	return html;
}

function highlight_code_line(line: string): string {
	let index = 0;
	let html = '';
	let previous_keyword = '';

	while (index < line.length) {
		const char = line[index];
		const next = line[index + 1];

		if (char === '/' && next === '/') {
			html += span('cmt', line.slice(index));
			break;
		}

		if (
			char === '<' &&
			(next === '/' || next === '>' || next === '@' || /[A-Za-z]/.test(next ?? ''))
		) {
			const tag = read_jsx_tag(line, index);
			html += tag.html;
			index = tag.next;
			previous_keyword = '';
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			const string_end = read_string(line, index);
			html += span('str', line.slice(index, string_end));
			index = string_end;
			previous_keyword = '';
			continue;
		}

		if (/[0-9]/.test(char)) {
			let number_end = index + 1;
			while (number_end < line.length && /[\d.]/.test(line[number_end])) {
				number_end++;
			}
			html += span('val', line.slice(index, number_end));
			index = number_end;
			previous_keyword = '';
			continue;
		}

		if (/[A-Za-z_$]/.test(char)) {
			const ident_end = read_identifier(line, index);
			const ident = line.slice(index, ident_end);
			const rest = line.slice(ident_end);
			let class_name = 'prop';

			if (CONTROL_KEYWORDS.has(ident)) {
				class_name = 'kw-ctrl';
			} else if (KEYWORDS.has(ident)) {
				class_name = ident === 'export' ? 'kw-export' : 'kw';
			} else if (LITERALS.has(ident)) {
				class_name = 'val';
			} else if (TEMPLATE_KEYWORDS.has(ident)) {
				class_name = 'kw';
			} else if (previous_keyword === 'function' || /^\s*\(/.test(rest)) {
				class_name = 'fn';
			} else if (/^[A-Z]/.test(ident)) {
				class_name = 'type';
			}

			html += span(class_name, ident);
			previous_keyword = ident;
			index = ident_end;
			continue;
		}

		if ('{}()[]'.includes(char)) {
			html += span('br', char);
			index++;
			previous_keyword = '';
			continue;
		}

		html += escape_html(char);
		index++;
		if (!/\s/.test(char)) {
			previous_keyword = '';
		}
	}

	return html;
}

export function highlight_tsrx(source: string): string {
	let in_style = false;
	const lines = source.split('\n');
	const width = String(lines.length).length;

	return lines
		.map((line, index) => {
			const entering_style = line.includes('<style');
			const leaving_style = line.includes('</style');
			const html =
				in_style || entering_style ? highlight_css_line(line) : highlight_code_line(line);

			if (entering_style && !leaving_style) {
				in_style = true;
			}
			if (leaving_style) {
				in_style = false;
			}

			const line_number = String(index + 1).padStart(width, ' ');
			return `${span('ln', line_number)} ${html}`;
		})
		.join('\n');
}
