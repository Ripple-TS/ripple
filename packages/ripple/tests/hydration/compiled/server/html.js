import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticHtml(__output) {
	_$_.push_component();

	const html = '<p><strong>Bold</strong> text</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value = String(html ?? '');

		__output.push('<!--' + _$_.hash(html_value) + '-->');
		__output.push(html_value);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function DynamicHtml(__output) {
	_$_.push_component();

	const content = '<p>Dynamic <span>HTML</span> content</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_1 = String(content ?? '');

		__output.push('<!--' + _$_.hash(html_value_1) + '-->');
		__output.push(html_value_1);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function EmptyHtml(__output) {
	_$_.push_component();

	const html = '';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_2 = String(html ?? '');

		__output.push('<!--' + _$_.hash(html_value_2) + '-->');
		__output.push(html_value_2);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ComplexHtml(__output) {
	_$_.push_component();

	const html = '<div class="nested"><span>Nested <em>content</em></span></div>';

	__output.push('<section');
	__output.push('>');

	{
		const html_value_3 = String(html ?? '');

		__output.push('<!--' + _$_.hash(html_value_3) + '-->');
		__output.push(html_value_3);
		__output.push('<!---->');
	}

	__output.push('</section>');
	_$_.pop_component();
}

export function MultipleHtml(__output) {
	_$_.push_component();

	const html1 = '<p>First paragraph</p>';
	const html2 = '<p>Second paragraph</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_4 = String(html1 ?? '');

		__output.push('<!--' + _$_.hash(html_value_4) + '-->');
		__output.push(html_value_4);
		__output.push('<!---->');

		const html_value_5 = String(html2 ?? '');

		__output.push('<!--' + _$_.hash(html_value_5) + '-->');
		__output.push(html_value_5);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function HtmlWithReactivity(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('<!--1tb17hh-->');
		__output.push('<p>Count: 0</p>');
		__output.push('<!---->');
		__output.push('<button');
		__output.push('>');

		{
			__output.push('Increment');
		}

		__output.push('</button>');
	}

	__output.push('</div>');
	_$_.pop_component();
}