// Dark+ blue (#569cd6): storage, declarations, and word operators.
const KEYWORDS = new Set([
	'async',
	'class',
	'component',
	'const',
	'extends',
	'function',
	'in',
	'index',
	'instanceof',
	'interface',
	'key',
	'keyof',
	'let',
	'new',
	'of',
	'this',
	'type',
	'typeof',
	'var',
]);

// Dark+ purple (#c586c0): control flow and module keywords.
const CONTROL_KEYWORDS = new Set([
	'as',
	'await',
	'break',
	'case',
	'catch',
	'continue',
	'default',
	'do',
	'else',
	'empty',
	'finally',
	'for',
	'from',
	'if',
	'import',
	'pending',
	'return',
	'satisfies',
	'switch',
	'throw',
	'try',
	'while',
	'yield',
]);
// Dark+ colors literal constants the same blue as storage keywords.
const LITERALS = new Set(['false', 'null', 'true', 'undefined']);
const TEMPLATE_KEYWORDS = new Set(['html', 'ref', 'style']);
const TEMPLATE_CONTROL_DIRECTIVES = new Set([
	'@if',
	'@else',
	'@for',
	'@empty',
	'@switch',
	'@case',
	'@default',
	'@try',
	'@pending',
	'@catch',
]);

type TemplateBlockState = {
	brace_depth: number;
	restore_jsx_text_depth: number;
	statement_container?: boolean;
};

type CommentState = {
	in_block_comment: boolean;
};

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

function read_template_expression_end(line: string, start: number): number {
	let index = start;
	let brace_depth = 1;

	while (index < line.length) {
		const char = line[index];

		if (char === '"' || char === "'" || char === '`') {
			index = read_string(line, index);
			continue;
		}

		if (char === '{') {
			brace_depth++;
		} else if (char === '}') {
			brace_depth--;
			if (brace_depth === 0) {
				return index;
			}
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

function read_jsx_tag_end(line: string, start: number): number {
	let index = start + 1;
	let expression_depth = 0;

	while (index < line.length) {
		const char = line[index];
		if (char === '"' || char === "'" || char === '`') {
			index = read_string(line, index);
			continue;
		}
		if (char === '{') {
			expression_depth++;
		} else if (char === '}') {
			expression_depth = Math.max(expression_depth - 1, 0);
		} else if (char === '>' && expression_depth === 0) {
			return index + 1;
		}
		index++;
	}

	return line.length;
}

function is_jsx_tag_start(next: string | undefined): boolean {
	return (
		next === '/' || next === '>' || next === '@' || next === '{' || /[A-Za-z]/.test(next ?? '')
	);
}

function highlight_jsx_expression(expression: string): string {
	let index = 0;
	let html = '';

	while (index < expression.length) {
		const char = expression[index];
		const next = expression[index + 1];

		if (char === '"' || char === "'" || char === '`') {
			const string_end = read_string(expression, index);
			html += span('str', expression.slice(index, string_end));
			index = string_end;
			continue;
		}

		if (/[0-9]/.test(char)) {
			let number_end = index + 1;
			while (number_end < expression.length && /[\d.]/.test(expression[number_end])) {
				number_end++;
			}
			html += span('val', expression.slice(index, number_end));
			index = number_end;
			continue;
		}

		if (char === '=' && next === '>') {
			html += span('kw', '=>');
			index += 2;
			continue;
		}

		if (/[A-Za-z_$]/.test(char)) {
			const ident_end = read_identifier(expression, index);
			const ident = expression.slice(index, ident_end);
			let class_name = 'prop';

			if (CONTROL_KEYWORDS.has(ident)) {
				class_name = 'kw-ctrl';
			} else if (LITERALS.has(ident) || KEYWORDS.has(ident) || TEMPLATE_KEYWORDS.has(ident)) {
				class_name = 'kw';
			} else if (/^[A-Z]/.test(ident)) {
				class_name = 'type';
			}

			html += span(class_name, ident);
			index = ident_end;
			continue;
		}

		if ('{}()[]'.includes(char)) {
			html += span('br', char);
			index++;
			continue;
		}

		if (char === '/' && next === '/') {
			html += span('cmt', expression.slice(index));
			break;
		}

		html += escape_html(char);
		index++;
	}

	return html;
}

function jsx_tag_depth_delta(tag: string): number {
	const trimmed = tag.trim();
	if (!trimmed.startsWith('<')) return 0;
	if (trimmed.startsWith('</')) return -1;
	if (trimmed.endsWith('/>')) return 0;
	return 1;
}

function read_jsx_tag(
	line: string,
	start: number,
): { html: string; next: number; depth_delta: number } {
	const next = read_jsx_tag_end(line, start);
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
		if (char === '>' && expression_depth === 0) {
			html += span('tag', '>');
			index++;
		} else if (char === '/' && tag[index + 1] === '>' && expression_depth === 0) {
			html += span('tag', '/>');
			index += 2;
		} else if (char === '"' || char === "'" || char === '`') {
			const string_end = read_string(tag, index);
			html += span('str', tag.slice(index, string_end));
			index = string_end;
		} else if (char === '{') {
			const expression_end = read_template_expression_end(tag, index + 1);
			html += span('tbr', '{');
			html += highlight_jsx_expression(tag.slice(index + 1, expression_end));
			if (expression_end < tag.length) {
				html += span('tbr', '}');
				index = expression_end + 1;
			} else {
				index = expression_end;
			}
		} else if (/[A-Za-z_@]/.test(char)) {
			const ident_end = read_identifier(tag, index);
			const ident = tag.slice(index, ident_end);
			const previous = tag.slice(0, index);
			let class_name = 'attr';

			if (expression_depth > 0) {
				if (TEMPLATE_KEYWORDS.has(ident) || LITERALS.has(ident)) {
					class_name = 'kw';
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

	return { html, next, depth_delta: jsx_tag_depth_delta(tag) };
}

function highlight_css_line(line: string): string {
	if (line.includes('<style') || line.includes('</style')) {
		return highlight_code_line(line).html;
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

function highlight_template_string(line: string, start: number): { html: string; next: number } {
	let index = start + 1;
	let string_start = start;
	let html = '';

	while (index < line.length) {
		if (line[index] === '\\') {
			index += 2;
			continue;
		}

		if (line[index] === '`') {
			html += span('str', line.slice(string_start, index + 1));
			return { html, next: index + 1 };
		}

		if (line[index] === '$' && line[index + 1] === '{') {
			if (string_start < index) {
				html += span('str', line.slice(string_start, index));
			}

			const expression_start = index + 2;
			const expression_end = read_template_expression_end(line, expression_start);
			html += span('br', '${');
			html += highlight_code_line(line.slice(expression_start, expression_end)).html;

			if (expression_end < line.length) {
				html += span('br', '}');
				index = expression_end + 1;
				string_start = index;
			} else {
				index = expression_end;
				string_start = index;
			}
			continue;
		}

		index++;
	}

	if (string_start < line.length) {
		html += span('str', line.slice(string_start));
	}
	return { html, next: line.length };
}

function highlight_code_line(
	line: string,
	initial_jsx_text_depth = 0,
	template_block_stack: TemplateBlockState[] = [],
	comment_state: CommentState = { in_block_comment: false },
): { html: string; jsx_text_depth: number } {
	let index = 0;
	let html = '';
	let previous_keyword = '';
	let jsx_text_depth = initial_jsx_text_depth;
	let jsx_expression_depth = 0;

	// Pre-@ statement syntax: a line in template-children position that starts
	// like a statement (optionally after a closing brace) renders as code, not
	// template text. The lookaheads keep prose lines unaffected.
	const code_statement_line =
		initial_jsx_text_depth > 0 &&
		/^[\t ]*\}?[\t ]*(?:(?:if|for|while|switch|catch)[\t ]*\(|else[\t ]+if[\t ]*\(|(?:try|else|do|finally|pending|empty)[\t ]*\{|(?:const|let|var)[\t ]+[A-Za-z_$])/.test(
			line,
		);

	while (index < line.length) {
		const char = line[index];
		const next = line[index + 1];
		const in_jsx_text = jsx_expression_depth === 0 && jsx_text_depth > 0 && !code_statement_line;

		if (comment_state.in_block_comment) {
			const comment_end = line.indexOf('*/', index);
			if (comment_end === -1) {
				html += span('cmt', line.slice(index));
				break;
			}

			html += span('cmt', line.slice(index, comment_end + 2));
			index = comment_end + 2;
			comment_state.in_block_comment = false;
			continue;
		}

		if (char === '/' && next === '/') {
			html += span('cmt', line.slice(index));
			break;
		}

		if (char === '/' && next === '*') {
			const comment_end = line.indexOf('*/', index + 2);
			if (comment_end === -1) {
				html += span('cmt', line.slice(index));
				comment_state.in_block_comment = true;
				break;
			}

			html += span('cmt', line.slice(index, comment_end + 2));
			index = comment_end + 2;
			continue;
		}

		if (in_jsx_text) {
			if (char === '@' && /[A-Za-z_]/.test(next ?? '')) {
				const directive_end = read_identifier(line, index + 1);
				const directive = line.slice(index, directive_end);

				if (TEMPLATE_CONTROL_DIRECTIVES.has(directive)) {
					html += span('kw-ctrl', directive);
					index = directive_end;
					template_block_stack.push({
						brace_depth: 0,
						restore_jsx_text_depth: jsx_text_depth,
					});
					jsx_text_depth = 0;
					previous_keyword = directive.slice(1);
					continue;
				}
			}

			if (char === '@' && next === '{') {
				html += span('kw-ctrl', '@');
				html += span('kw-ctrl', '{');
				index += 2;
				template_block_stack.push({
					brace_depth: 1,
					restore_jsx_text_depth: jsx_text_depth,
					statement_container: true,
				});
				jsx_text_depth = 0;
				jsx_expression_depth = 0;
				previous_keyword = '';
				continue;
			}

			if (char === '<' && is_jsx_tag_start(next)) {
				const tag = read_jsx_tag(line, index);
				html += tag.html;
				index = tag.next;
				jsx_text_depth = Math.max(0, jsx_text_depth + tag.depth_delta);
				previous_keyword = '';
				continue;
			}

			if (char === '{') {
				html += span('tbr', char);
				index++;
				jsx_expression_depth = 1;
				previous_keyword = '';
				continue;
			}

			let text_end = index + 1;
			while (
				text_end < line.length &&
				line[text_end] !== '<' &&
				line[text_end] !== '{' &&
				line[text_end] !== '@' &&
				line[text_end] !== '/'
			) {
				text_end++;
			}
			html += escape_html(line.slice(index, text_end));
			index = text_end;
			previous_keyword = '';
			continue;
		}

		if (char === '<' && is_jsx_tag_start(next)) {
			const tag = read_jsx_tag(line, index);
			html += tag.html;
			index = tag.next;
			jsx_text_depth = Math.max(0, jsx_text_depth + tag.depth_delta);
			previous_keyword = '';
			continue;
		}

		if (char === '`') {
			const template = highlight_template_string(line, index);
			html += template.html;
			index = template.next;
			previous_keyword = '';
			continue;
		}

		if (char === '"' || char === "'") {
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

		if (jsx_expression_depth > 0 && char === '{') {
			html += span('tbr', char);
			index++;
			jsx_expression_depth++;
			previous_keyword = '';
			continue;
		}

		if (jsx_expression_depth > 0 && char === '}') {
			html += span('tbr', char);
			index++;
			jsx_expression_depth--;
			previous_keyword = '';
			continue;
		}

		if (char === '@' && /[A-Za-z_]/.test(next ?? '')) {
			const directive_end = read_identifier(line, index + 1);
			const directive = line.slice(index, directive_end);

			if (TEMPLATE_CONTROL_DIRECTIVES.has(directive)) {
				html += span('kw-ctrl', directive);
				index = directive_end;
				previous_keyword = directive.slice(1);
				continue;
			}
		}

		if (char === '@' && next === '{') {
			html += span('kw-ctrl', '@');
			html += span('kw-ctrl', '{');
			index += 2;
			template_block_stack.push({
				brace_depth: 1,
				restore_jsx_text_depth: jsx_text_depth,
				statement_container: true,
			});
			previous_keyword = '';
			continue;
		}

		if (char === '=' && next === '>') {
			html += span('kw', '=>');
			index += 2;
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
			} else if (ident === 'export') {
				class_name = 'kw-export';
			} else if (KEYWORDS.has(ident) || LITERALS.has(ident)) {
				class_name = 'kw';
			} else if (TEMPLATE_KEYWORDS.has(ident)) {
				class_name = 'kw';
			} else if (
				previous_keyword === 'function' ||
				previous_keyword === 'component' ||
				/^\s*\(/.test(rest)
			) {
				class_name = 'fn';
			} else if (/^[A-Z]/.test(ident)) {
				class_name = 'type';
			}

			html += span(class_name, ident);
			previous_keyword = ident;
			index = ident_end;
			continue;
		}

		if (char === '{' && template_block_stack.length > 0) {
			template_block_stack[template_block_stack.length - 1].brace_depth++;
		} else if (char === '}' && template_block_stack.length > 0) {
			const template_block = template_block_stack[template_block_stack.length - 1];
			template_block.brace_depth--;
			if (template_block.brace_depth === 0 && template_block.statement_container) {
				html += span('kw-ctrl', char);
				index++;
				previous_keyword = '';
				const finished_block = template_block_stack.pop()!;
				jsx_text_depth = finished_block.restore_jsx_text_depth;
				continue;
			}
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

	while (
		template_block_stack.length > 0 &&
		template_block_stack[template_block_stack.length - 1].brace_depth === 0
	) {
		const template_block = template_block_stack.pop()!;
		jsx_text_depth = template_block.restore_jsx_text_depth;
	}

	return { html, jsx_text_depth };
}

export function highlight_tsrx(source: string): string {
	let in_style = false;
	let jsx_text_depth = 0;
	const template_block_stack: TemplateBlockState[] = [];
	const comment_state: CommentState = { in_block_comment: false };
	const lines = source.split('\n');
	const width = String(lines.length).length;

	return lines
		.map((line, index) => {
			const entering_style = line.includes('<style');
			const leaving_style = line.includes('</style');
			let html;

			if (in_style || entering_style) {
				html = highlight_css_line(line);
			} else {
				const highlighted = highlight_code_line(
					line,
					jsx_text_depth,
					template_block_stack,
					comment_state,
				);
				html = highlighted.html;
				jsx_text_depth = highlighted.jsx_text_depth;
			}

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
