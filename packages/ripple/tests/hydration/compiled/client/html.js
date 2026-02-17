import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><!></div>`, 0);
var root_1 = _$_.template(`<div><!></div>`, 0);
var root_2 = _$_.template(`<div><!></div>`, 0);
var root_3 = _$_.template(`<section><!></section>`, 0);
var root_4 = _$_.template(`<div><!><!></div>`, 0);
var root_5 = _$_.template(`<div><!><button>Increment</button></div>`, 0);

import { track } from 'ripple';

export function StaticHtml(__anchor, _, __block) {
	_$_.push_component();

	const html = '<p><strong>Bold</strong> text</p>';
	var div_1 = root();

	{
		var node = _$_.child(div_1);

		_$_.pop(div_1);
	}

	_$_.render(() => {
		_$_.html(node, () => html);
	});

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function DynamicHtml(__anchor, _, __block) {
	_$_.push_component();

	const content = '<p>Dynamic <span>HTML</span> content</p>';
	var div_2 = root_1();

	{
		var node_1 = _$_.child(div_2);

		_$_.pop(div_2);
	}

	_$_.render(() => {
		_$_.html(node_1, () => content);
	});

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function EmptyHtml(__anchor, _, __block) {
	_$_.push_component();

	const html = '';
	var div_3 = root_2();

	{
		var node_2 = _$_.child(div_3);

		_$_.pop(div_3);
	}

	_$_.render(() => {
		_$_.html(node_2, () => html);
	});

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function ComplexHtml(__anchor, _, __block) {
	_$_.push_component();

	const html = '<div class="nested"><span>Nested <em>content</em></span></div>';
	var section_1 = root_3();

	{
		var node_3 = _$_.child(section_1);

		_$_.pop(section_1);
	}

	_$_.render(() => {
		_$_.html(node_3, () => html);
	});

	_$_.append(__anchor, section_1);
	_$_.pop_component();
}

export function MultipleHtml(__anchor, _, __block) {
	_$_.push_component();

	const html1 = '<p>First paragraph</p>';
	const html2 = '<p>Second paragraph</p>';
	var div_4 = root_4();

	{
		var node_4 = _$_.child(div_4);
		var node_5 = _$_.sibling(node_4);

		_$_.pop(div_4);
	}

	_$_.render(
		(__prev) => {
			_$_.html(node_4, () => html1);
			_$_.html(node_5, () => html2);
		},
		{}
	);

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function HtmlWithReactivity(__anchor, _, __block) {
	_$_.push_component();

	var div_5 = root_5();

	{
		var node_6 = _$_.child(div_5);

		_$_.pop(div_5);
	}

	_$_.render(() => {
		_$_.html(node_6, () => '<p>Count: 0</p>');
	});

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}