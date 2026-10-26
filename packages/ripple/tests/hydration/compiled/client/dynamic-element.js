// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('section', null, [null]);

function render(__prev) {
	__prev.a = _$_.dynamic(__prev.a, __prev._a, __prev._b, { id: "record", ...__prev._c });
}

function Nested_render(__anchor, __block, { tag, ...attrs }) {
	var section = root();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;
		var dynamic = _$_.dynamic_init(node, () => tag, () => ({ id: "record", ...attrs }));

		_$_.hydrating && _$_.pop(section);
	}

	_$_.render(render, { a: dynamic, _a: node, _b: tag, _c: attrs });
	_$_.append(__anchor, section);
}

Nested[_$_.$r] = Nested_render;

var root_1 = _$_.template(`<section><b>before</b><!><!><button>update</button><button>replace</button><p>after`);

function render_1(__prev) {
	var __count_value = __prev._a.value;

	__prev.a = _$_.dynamic(__prev.a, __prev._b, __prev._c.value, {
		id: "record",
		'data-count': __count_value,
		innerHTML: `<em>${__count_value}</em>`
	});

	__prev.b = _$_.dynamic(__prev.b, __prev._d, __prev._e, { id: "field", value: `value-${__count_value}` });
}

function Siblings_render(__anchor, __block) {
	const tag = _$_.track('div', __block, '14vn3vw');
	const count = _$_.track(0, __block, 'srt8pa');
	const input = 'input';
	var section_1 = root_1();

	{
		var b = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;
		var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : b.nextSibling;

		var dynamic_1 = _$_.dynamic_init(node_1, () => tag.value, () => ({
			id: "record",
			'data-count': count.value,
			innerHTML: `<em>${count.value}</em>`
		}));

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1.nextSibling;
		var dynamic_2 = _$_.dynamic_init(node_2, () => input, () => ({ id: "field", value: `value-${count.value}` }));
		var button = _$_.hydrating ? _$_.hydrate_sibling() : node_2.nextSibling;

		button.__click = () => count.value++;

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = () => tag.value = 'article';
		_$_.hydrating && _$_.pop(section_1);
	}

	_$_.render(render_1, {
		a: dynamic_1,
		b: dynamic_2,
		_a: count,
		_b: node_1,
		_c: tag,
		_d: node_2,
		_e: input
	});

	_$_.append(__anchor, section_1);
}

Siblings[_$_.$r] = Siblings_render;

var root_3 = _$_.template(`<span> </span><strong>child`, 1, 2);
var root_2 = _$_.template(`<!>`, 1, 1);

function Child_render(__anchor, __block, { value }) {
	var fragment = root_2();
	var node_3 = _$_.first_child_frag(fragment);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_3();
		var span = _$_.first_child_frag(fragment_1);

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

			_$_.expression(expression, () => value);
			_$_.hydrating && _$_.pop(span);
		}

		_$_.next();
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

Child[_$_.$r] = Child_render;

var root_4 = _$_.template_el('section', null, [null, ['p', null, 'after']]);

function render_2(__prev) {
	__prev.a = _$_.dynamic(__prev.a, __prev._a, __prev._b, { value: "component" });
}

function ComponentTarget_render(__anchor, __block) {
	const tag = Child;
	var section_2 = root_4();

	{
		var node_4 = _$_.hydrating ? _$_.hydrate_child() : section_2.firstChild;
		var dynamic_3 = _$_.dynamic_init(node_4, () => tag, () => ({ value: "component" }));

		_$_.hydrating && _$_.pop(section_2);
	}

	_$_.render(render_2, { a: dynamic_3, _a: node_4, _b: tag });
	_$_.append(__anchor, section_2);
}

ComponentTarget[_$_.$r] = ComponentTarget_render;

var root_5 = _$_.template(`<!><p>after`, 1, 2);

function render_3(__prev) {
	__prev.a = _$_.dynamic(__prev.a, __prev._a, __prev._b, { id: "record", innerHTML: "root" });
}

function Root_render(__anchor, __block) {
	const tag = 'div';
	var fragment_2 = root_5();
	var node_5 = _$_.first_child_frag(fragment_2);
	var dynamic_4 = _$_.dynamic_init(node_5, () => tag, () => ({ id: "record", innerHTML: "root" }));

	_$_.next();
	_$_.render(render_3, { a: dynamic_4, _a: node_5, _b: tag });
	_$_.append(__anchor, fragment_2);
}

Root[_$_.$r] = Root_render;

var root_6 = _$_.template(`<svg><!><rect width=10 height=10>`);

function render_4(__prev) {
	__prev.a = _$_.dynamic(__prev.a, __prev._a, __prev._b, { id: "record", r: "5" }, 'svg');
}

function Svg_render(__anchor, __block) {
	const tag = 'circle';
	var svg = root_6();

	{
		var node_6 = _$_.hydrating ? _$_.hydrate_child() : svg.firstChild;
		var dynamic_5 = _$_.dynamic_init(node_6, () => tag, () => ({ id: "record", r: "5" }), 'svg');

		_$_.hydrating && _$_.pop(svg);
	}

	_$_.render(render_4, { a: dynamic_5, _a: node_6, _b: tag });
	_$_.append(__anchor, svg);
}

Svg[_$_.$r] = Svg_render;

import { track } from 'ripple';

export function Nested(__props) {
	return _$_.tsrx_element(Nested_render, __props);
}

export function Siblings() {
	return _$_.tsrx_element(Siblings_render);
}

function Child(__props) {
	return _$_.tsrx_element(Child_render, __props);
}

export function ComponentTarget() {
	return _$_.tsrx_element(ComponentTarget_render);
}

export function Root() {
	return _$_.tsrx_element(Root_render);
}

export function Svg() {
	return _$_.tsrx_element(Svg_render);
}

_$_.delegate(['click']);