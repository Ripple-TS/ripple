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

describe('@tsrx/ripple flat element templates', () => {
	it('builds one element with static attributes and a text child with DOM calls', () => {
		const code = client('<div class="c">99</div>');
		expect(code).toContain("_$_.template_el('div', ['class', 'c'], '99')");
		expect(code).not.toContain('_$_.template(');
	});

	it('omits absent attributes and text', () => {
		expect(client('<br />')).toContain("_$_.template_el('br')");
		expect(client('<span>x</span>')).toContain("_$_.template_el('span', null, 'x')");
		expect(client('<input type="text" />')).toContain("_$_.template_el('input', ['type', 'text'])");
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

	it.each([
		['nested elements', '<div><span>a</span></div>'],
		['a placeholder comment', '<div>{props.a}<b>x</b></div>'],
		['a fragment root', '<><div>a</div><div>b</div></>'],
		['a dropped leading newline', '<pre>\n  code</pre>'],
		['a raw text element', '<textarea>hello</textarea>'],
		['an svg root', '<svg viewBox="0 0 1 1" />'],
		['a custom element', '<my-widget>x</my-widget>'],
		['a customized built-in', '<button is="fancy-button">x</button>'],
	])('parses a template with %s', (_, template) => {
		const code = client(template);
		expect(code).toContain('_$_.template(');
		expect(code).not.toContain('_$_.template_el(');
	});

	it('keeps the SVG namespace entry for namespaced content', () => {
		const code = client('<svg><circle r="1" /></svg>');
		expect(code).toContain('_$_.template(');
		expect(code).not.toContain('_$_.template_el(');
	});
});
