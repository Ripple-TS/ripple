import { compile } from '../src/index.js';
import { describe, expect, it } from 'vitest';

/**
 * @param {string} template
 * @param {string} [setup]
 */
function client(template, setup = '') {
	const { code, errors } = compile(
		`export function App(props) @{ ${setup} ${template} }`,
		'App.tsrx',
		{ mode: 'client' },
	);
	expect(errors).toEqual([]);
	return code;
}

describe('@tsrx/ripple DOM-built templates', () => {
	it('builds one element with static attributes and a text child with DOM calls', () => {
		const code = client('<div class="c">99</div>');
		expect(code).toContain("_$_.template_el('div', ['class', 'c'], '99')");
		expect(code).not.toContain('_$_.template(');
	});

	it('omits absent attributes and text', () => {
		expect(client('<br />')).toContain("_$_.template_el('br')");
		expect(client('<span>x</span>')).toContain("_$_.template_el('span', null, 'x')");
		expect(client('<input type="text" />')).toContain(
			"_$_.template_el('input', ['type', 'text'], '', 1)",
		);
	});

	it('flags a tree holding an element that could load a resource', () => {
		expect(client('<figure><img src="a.png" /><figcaption>a</figcaption></figure>')).toContain(
			"_$_.template_el('figure', null, [['img', ['src', 'a.png']], ['figcaption', null, 'a']], 1)",
		);
		expect(client('<div class="c">x</div>')).toContain(
			"_$_.template_el('div', ['class', 'c'], 'x')",
		);
	});

	it('keeps the text placeholder of an expression child', () => {
		const code = client('<li>{props.label}</li>');
		expect(code).toContain("_$_.template_el('li', null, ' ')");
		expect(code).toContain('_$_.expression(');
	});

	it('leaves a dynamic attribute to the runtime', () => {
		const code = client('<div class={props.a}>x</div>');
		expect(code).toContain("_$_.template_el('div', null, 'x')");
		expect(code).not.toContain("'class'");
	});

	it('decodes the escaping the template would carry', () => {
		const code = client('<a title="Tom &amp; Jerry">{"a < b & \\"c\\""}</a>');
		expect(code).toContain("'title', 'Tom & Jerry'");
		expect(code).toContain(`'a < b & "c"'`);
	});

	it('emits a boolean attribute as an empty value', () => {
		expect(client('<button disabled>Go</button>')).toContain(
			"_$_.template_el('button', ['disabled', ''], 'Go')",
		);
	});

	it('builds nested elements, text nodes and placeholder comments', () => {
		expect(client('<div><span>a</span></div>')).toContain(
			"_$_.template_el('div', null, [['span', null, 'a']])",
		);
		expect(client('<div class="c"><span class="s">a</span><b></b></div>')).toContain(
			"_$_.template_el('div', ['class', 'c'], [['span', ['class', 's'], 'a'], ['b']])",
		);
		expect(client('<div>{props.a}<b>x</b></div>')).toContain(
			"_$_.template_el('div', null, [null, ['b', null, 'x']])",
		);
		expect(client('<ul><li>a<br />b</li></ul>')).toContain(
			"_$_.template_el('ul', null, [['li', null, ['a', ['br'], 'b']]])",
		);
		expect(client('<p>a <em>b</em> c</p>')).toContain(
			"_$_.template_el('p', null, ['a ', ['em', null, 'b'], ' c'])",
		);
	});

	it.each([
		['more than eight nodes', '<div><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i></div>'],
		['a list item inside a list item', '<li><span><li>x</li></span></li>'],
		['a description inside a description', '<dt><b><dd>x</dd></b></dt>'],
		['a block element inside a paragraph', '<p><span><dialog>x</dialog></span></p>'],
		['a list item inside a paragraph', '<p><li>x</li></p>'],
		['a table cell outside a table', '<div><td>x</td></div>'],
		['a caption outside a table', '<span><caption>x</caption></span>'],
		['a table body', '<tbody><tr><td>x</td></tr></tbody>'],
		['a select', '<select><option>x</option></select>'],
		['a fragment root', '<><div>a</div><div>b</div></>'],
		['a dropped leading newline', '<pre>\n  code</pre>'],
		['a raw text element', '<textarea>hello</textarea>'],
		['an svg root', '<svg viewBox="0 0 1 1" />'],
		['a custom element', '<my-widget>x</my-widget>'],
		['a customized built-in', '<button is="fancy-button">x</button>'],
		['text the parser foster-parents out of a table', '<table>hello</table>'],
		['text the parser foster-parents out of a row', '<tr>hello</tr>'],
	])('parses a template with %s', (_, template) => {
		const code = client(template);
		expect(code).toContain('_$_.template(');
		expect(code).not.toContain('_$_.template_el(');
	});

	it('builds an image with its source, which the runtime creates in the inert document', () => {
		expect(client('<img src="/logo.png" alt="Logo" />')).toContain(
			"_$_.template_el('img', ['src', '/logo.png', 'alt', 'Logo'], '', 1)",
		);
	});

	it('builds table-model elements whose text is whitespace, which the parser keeps', () => {
		expect(client('<tbody>{" "}</tbody>')).toContain("_$_.template_el('tbody', null, ' ')");
		expect(client('<td>x</td>')).toContain("_$_.template_el('td', null, 'x')");
		expect(client('<select>hello</select>')).toContain("_$_.template_el('select', null, 'hello')");
	});

	it('keeps the SVG namespace entry for namespaced content', () => {
		const code = client('<svg><circle r="1" /></svg>');
		expect(code).toContain('_$_.template(');
		expect(code).not.toContain('_$_.template_el(');
	});
});
