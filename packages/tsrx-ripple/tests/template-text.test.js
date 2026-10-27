import { describe, expect, it } from 'vitest';
import { compile_to_volar_mappings } from '../src/index.js';
import { get_template_text_value, is_droppable_template_text } from '../src/template-ast.js';

describe('template text whitespace', () => {
	it.each([
		['leading indentation', '\n\t\tRun the ', 'Run the '],
		['trailing indentation', ' again.\n\t', ' again.'],
		['interior line break', ' script\n\t\tbefore ', ' script before '],
		['blank lines', '\n\tfirst  \n\t\n  second\n', 'first second'],
		['CRLF', '\r\n\tfirst\r\n\tsecond \r\n', 'first second'],
		['CR', ' first\r\tsecond ', ' first second '],
		['inline whitespace', ' \t first  second \t ', ' \t first  second \t '],
		['inline space only', ' ', ' '],
		['indentation only', ' \t\r\n\t \n ', ''],
		['empty text', '', ''],
		['encoded edge spaces', '\n\t&#32;first&#x20;\n', ' first '],
		['encoded newline', '\n\tfirst&#10;second\n', 'first\nsecond'],
		['entities', '\n\tRock &amp;\n\t&quot;Roll&quot;\n', 'Rock & "Roll"'],
	])('normalizes %s at runtime', (_name, value, expected) => {
		const node = { type: 'JSXText', value };
		expect(get_template_text_value(node, false)).toBe(expected);
		expect(is_droppable_template_text(node, false)).toBe(expected === '');
	});

	it('preserves multiline whitespace in the editor view', () => {
		const text = '\n\t\tRun the ';
		const source = `export function App() @{ <p>${text}<code>build</code></p> }`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain(`<p>${text}<code>`);
		expect(get_template_text_value({ type: 'JSXText', value: text }, true)).toBe(text);
		expect(is_droppable_template_text({ type: 'JSXText', value: '\n\t' }, true)).toBe(false);
	});
});
