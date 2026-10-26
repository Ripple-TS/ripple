// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('div', ['data-editor', '', 'contenteditable', 'true']);
var root_1 = _$_.template(`<div data-editor contentEditable>server &amp; text`);
var root_2 = _$_.template(`<div data-editor contentEditable><b>server</b><i>text`);
var root_3 = _$_.template_el('div', ['data-editor', '']);
var root_4 = _$_.template_el('div', ['data-editor', ''], ' ');
var root_5 = _$_.template(`<div data-editor contentEditable><b> </b><i>tail`);
var root_6 = _$_.template(`<div contentEditable>`);
var root_8 = _$_.template(` `, 1, 1);
var root_7 = _$_.template(`<!>`, 1, 1);
var root_9 = _$_.template_el('div');

function render(__prev) {
	__prev.a = _$_.spread(
		__prev._a,
		{
			'data-editor': '',
			...{ contentEditable: __prev._b, innerHTML: __prev._c }
		},
		__prev.a
	);
}

function switch_case_0(__anchor, { b: binding }) {
	var div = root();

	_$_.ref(div, () => binding.v, (v) => binding.v = v);
	_$_.append(__anchor, div);
}

function switch_case_1(__anchor, { b: binding }) {
	var div_1 = root_1();

	_$_.ref(div_1, () => binding.v, (v) => binding.v = v);
	_$_.append(__anchor, div_1);
}

function switch_case_2(__anchor, { b: binding }) {
	var div_2 = root_2();

	_$_.ref(div_2, () => binding.v, (v) => binding.v = v);
	_$_.append(__anchor, div_2);
}

function switch_case_3(__anchor, { b: binding, c: editable, d: seed }) {
	var div_3 = root_3();

	_$_.set_property_value(div_3, 'contentEditable', editable);
	_$_.set_inner_html(div_3, seed ?? div_3.innerHTML);
	_$_.ref(div_3, () => binding.v, (v) => binding.v = v);
	_$_.append(__anchor, div_3);
}

function switch_case_4(__anchor, { b: binding, c: editable, d: seed }) {
	var div_4 = root_4();

	_$_.set_property_value(div_4, 'contentEditable', editable);
	_$_.ref(div_4, () => binding.v, (v) => binding.v = v);

	{
		if (!_$_.hydrating || !_$_.content_editable_changed(div_4)) {
			var expression = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

			_$_.expression(expression, () => seed);
			_$_.hydrating && _$_.pop(div_4);
		}
	}

	_$_.append(__anchor, div_4);
}

function switch_case_5(__anchor, { b: binding, d: seed }) {
	var div_5 = root_5();

	_$_.ref(div_5, () => binding.v, (v) => binding.v = v);

	{
		if (!_$_.hydrating || !_$_.content_editable_changed(div_5)) {
			var b = _$_.hydrating ? _$_.hydrate_child() : div_5.firstChild;

			{
				var expression_1 = _$_.hydrating ? _$_.hydrate_child() : b.firstChild;

				_$_.expression(expression_1, () => seed);
				_$_.hydrating && _$_.pop(b);
			}
		}
	}

	_$_.append(__anchor, div_5);
}

function switch_case_6(__anchor, { b: binding, d: seed }) {
	var div_6 = root_6();

	{
		var append_anchor = _$_.append_into(div_6);

		_$_.render_component(Inherited, append_anchor, { binding: binding.v, seed });
		_$_.hydrating && _$_.pop(div_6);
	}

	_$_.append(__anchor, div_6);
}

function switch_case_7(__anchor, { b: binding, d: seed }) {
	const tag = 'div';
	var fragment = root_7();
	var node = _$_.first_child_frag(fragment);

	_$_.composite(() => tag, node, () => ({
		'data-editor': true,
		contentEditable: true,
		ref: _$_.create_ref_prop(() => binding.v, (v) => binding.v = v),
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_8();
			var expression_2 = _$_.first_child_frag(fragment_1);

			_$_.expression(expression_2, () => seed);
			_$_.append(__anchor, fragment_1);
		})
	}));

	_$_.append(__anchor, fragment);
}

function switch_case_8(__anchor, { b: binding, c: editable, d: seed }) {
	var div_7 = root_9();

	_$_.ref(div_7, () => binding.v, (v) => binding.v = v);
	_$_.render(render, { a: void 0, _a: div_7, _b: editable, _c: seed });
	_$_.append(__anchor, div_7);
}

function switch_1({ a: kind }) {
	switch (kind) {
		case 'empty':
			return switch_case_0;

		case 'static':
			return switch_case_1;

		case 'rich':
			return switch_case_2;

		case 'html':
			return switch_case_3;

		case 'text':
			return switch_case_4;

		case 'nested':
			return switch_case_5;

		case 'inherited':
			return switch_case_6;

		case 'dynamic':
			return switch_case_7;

		case 'spread':
			return switch_case_8;
	}
}

function Content_render(__anchor, __block, { kind, binding, seed, editable = true }) {
	binding = { v: binding };
	_$_.switch(__anchor, switch_1, true, { a: kind, b: binding, c: editable, d: seed });
}

Content[_$_.$r] = Content_render;

var root_10 = _$_.template_el('section', null, [['output', null, ' '], ['button', null, 'update']]);

function Editor_render(
	__anchor,
	__block,
	{
		property = 'textContent',
		initial = '',
		next = 'updated',
		accessors = false,
		kind = 'empty',
		seed = '',
		editable = true,
		transform
	}
) {
	const value = _$_.track(initial, __block, 'ldw9fy');
	const bind = bindings[property];

	const binding = accessors
		? _$_.with_scope(__block, () => bind(() => value.value, (next) => value.value = transform ? _$_.with_scope(__block, () => transform(next)) : next))
		: _$_.with_scope(__block, () => bind(value));

	var section = root_10();

	{
		var node_1 = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;

		_$_.render_component(Content, node_1, { kind, binding, seed, editable });

		var output = _$_.hydrating ? _$_.hydrate_sibling() : node_1;

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_child() : output.firstChild;

			_$_.expression(expression_3, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : output.nextSibling;

		button.__click = () => value.value = next;
		_$_.hydrating && _$_.pop(section);
	}

	_$_.append(__anchor, section);
}

Editor[_$_.$r] = Editor_render;

var root_11 = _$_.template_el('div', null, 'unbound');

function render_1(__prev) {
	__prev.a = _$_.spread(__prev._a, { 'data-editor': '', ...{ id: 'plain' } }, __prev.a);
}

var root_13 = _$_.template(`<div data-editor contentEditable>`);

function render_2(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_inner_html(__prev._b, (__prev.a = __a) ?? __prev._b.innerHTML);
	}
}

var root_14 = _$_.template(`<div data-editor contentEditable> `);

function consequent(__anchor, { b: binding, c: value }) {
	var div_9 = root_13();

	_$_.ref(div_9, () => binding);
	_$_.render(render_2, { a: div_9.innerHTML, _a: value, _b: div_9 });
	_$_.append(__anchor, div_9);
}

function alternate(__anchor, { b: binding, c: value }) {
	var div_10 = root_14();

	_$_.ref(div_10, () => binding);

	{
		if (!_$_.hydrating || !_$_.content_editable_changed(div_10)) {
			var expression_4 = _$_.hydrating ? _$_.hydrate_child() : div_10.firstChild;

			_$_.expression(expression_4, () => value.value);
			_$_.hydrating && _$_.pop(div_10);
		}
	}

	_$_.append(__anchor, div_10);
}

function if_1({ a: property }) {
	if (property === 'innerHTML') return consequent; else return alternate;
}

var root_12 = _$_.template_el('section', null, [['output', null, ' '], ['button', null, 'update']]);

function ReactiveEditor_render(__anchor, __block, { property = 'innerHTML' }) {
	const value = _$_.track('server', __block, 'o65qvu');
	const binding = _$_.with_scope(__block, () => _$_.call_property(bindings, property, void 0, void 0, value));
	var section_1 = root_12();

	{
		var node_2 = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;

		_$_.if(node_2, if_1, false, { a: property, b: binding, c: value });

		var output_1 = _$_.hydrating ? _$_.hydrate_sibling() : node_2;

		{
			var expression_5 = _$_.hydrating ? _$_.hydrate_child() : output_1.firstChild;

			_$_.expression(expression_5, () => value.value);
			_$_.hydrating && _$_.pop(output_1);
		}

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : output_1.nextSibling;

		button_1.__click = () => value.value = 'updated';
		_$_.hydrating && _$_.pop(section_1);
	}

	_$_.append(__anchor, section_1);
}

ReactiveEditor[_$_.$r] = ReactiveEditor_render;

var root_15 = _$_.template_el('div', ['data-editor', ''], ' ');
var root_16 = _$_.template(`<section><div data-editor contentEditable> </div><output> `);

function AsyncEditor_render(__anchor, __block, { promise }) {
	const seed = _$_.track_async(() => promise, __block, '1m0fmqg');
	const value = _$_.track('model', __block, '65w90x');
	var section_2 = root_16();

	{
		var div_12 = _$_.hydrating ? _$_.hydrate_child() : section_2.firstChild;

		_$_.ref(div_12, () => _$_.with_scope(__block, () => bindTextContent(value)));

		{
			if (!_$_.hydrating || !_$_.content_editable_changed(div_12)) {
				var expression_7 = _$_.hydrating ? _$_.hydrate_child() : div_12.firstChild;

				_$_.expression(expression_7, () => seed.value);
				_$_.hydrating && _$_.pop(div_12);
			}
		}

		var output_2 = _$_.hydrating ? _$_.hydrate_sibling() : div_12.nextSibling;

		{
			var expression_8 = _$_.hydrating ? _$_.hydrate_child() : output_2.firstChild;

			_$_.expression(expression_8, () => value.value);
			_$_.hydrating && _$_.pop(output_2);
		}
	}

	_$_.append(__anchor, section_2);
}

AsyncEditor[_$_.$r] = AsyncEditor_render;

var root_17 = _$_.template_el('span', null, ' ');

function StreamContent_render(__anchor, __block, { promise }) {
	const value = _$_.track_async(() => promise, __block, '2e2vau');
	var span = root_17();

	{
		var expression_9 = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

		_$_.expression(expression_9, () => value.value);
		_$_.hydrating && _$_.pop(span);
	}

	_$_.append(__anchor, span);
}

StreamContent[_$_.$r] = StreamContent_render;

var root_19 = _$_.template_el('i', null, 'loading');
var root_18 = _$_.template(`<section><article contentEditable><div data-editor contentEditable><b>before</b><!></div></article><output> `);

function NestedStreamEditor_render(__anchor, __block, { promise, property = 'textContent' }) {
	const value = _$_.track('model', __block, '15fvgx0');
	var section_3 = root_18();

	{
		var article = _$_.hydrating ? _$_.hydrate_child() : section_3.firstChild;

		{
			var div_13 = _$_.hydrating ? _$_.hydrate_child() : article.firstChild;

			_$_.ref(div_13, () => _$_.with_scope(__block, () => _$_.call_property(bindings, property, void 0, void 0, value)));

			{
				if (!_$_.hydrating || !_$_.content_editable_changed(div_13)) {
					var b_1 = _$_.hydrating ? _$_.hydrate_child() : div_13.firstChild;
					var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : b_1.nextSibling;

					_$_.try(
						node_3,
						(__anchor) => {
							_$_.render_component(StreamContent, __anchor, { promise });
						},
						null,
						(__anchor) => {
							var i = root_19();

							_$_.append(__anchor, i);
						}
					);

					_$_.hydrating && _$_.pop(div_13);
				}
			}
		}

		_$_.hydrating && _$_.pop(article);

		var output_3 = _$_.hydrating ? _$_.hydrate_sibling() : article.nextSibling;

		{
			var expression_10 = _$_.hydrating ? _$_.hydrate_child() : output_3.firstChild;

			_$_.expression(expression_10, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_3);
		}
	}

	_$_.append(__anchor, section_3);
}

NestedStreamEditor[_$_.$r] = NestedStreamEditor_render;

import {
	bindInnerHTML,
	bindInnerText,
	bindTextContent,
	track,
	trackAsync
} from 'ripple';

const bindings = {
	innerHTML: bindInnerHTML,
	innerText: bindInnerText,
	textContent: bindTextContent
};

function Content(__props) {
	return _$_.tsrx_element(Content_render, __props);
}

export function Editor(__props) {
	return _$_.tsrx_element(Editor_render, __props);
}

export function PlainSpread() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_8 = root_11();

		_$_.render(render_1, { a: void 0, _a: div_8 });
		_$_.append(__anchor, div_8);
	});
}

export function ReactiveEditor(__props) {
	return _$_.tsrx_element(ReactiveEditor_render, __props);
}

function Inherited({ binding, seed }) {
	binding = { v: binding };

	return _$_.tsrx_element((__anchor, __block) => {
		var div_11 = root_15();

		_$_.ref(div_11, () => binding.v, (v) => binding.v = v);

		{
			if (!_$_.hydrating || !_$_.content_editable_changed(div_11)) {
				var expression_6 = _$_.hydrating ? _$_.hydrate_child() : div_11.firstChild;

				_$_.expression(expression_6, () => seed);
				_$_.hydrating && _$_.pop(div_11);
			}
		}

		_$_.append(__anchor, div_11);
	});
}

export function AsyncEditor(__props) {
	return _$_.tsrx_element(AsyncEditor_render, __props);
}

function StreamContent(__props) {
	return _$_.tsrx_element(StreamContent_render, __props);
}

export function NestedStreamEditor(__props) {
	return _$_.tsrx_element(NestedStreamEditor_render, __props);
}

_$_.delegate(['click']);