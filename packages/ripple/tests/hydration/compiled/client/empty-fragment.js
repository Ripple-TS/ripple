// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('span', ['data-row', ''], 'first');

function Row_render(__anchor, __block) {
	var span = root();

	_$_.append(__anchor, span);
}

Row[_$_.$r] = Row_render;

var root_1 = _$_.template(`<!>`, 1, 1);

function Empty_render(__anchor, __block) {
	var fragment = root_1();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {}));
	_$_.append(__anchor, fragment);
}

Empty[_$_.$r] = Empty_render;

var root_2 = _$_.template_el('div');

function TrailingInElement_render(__anchor, __block) {
	var div = root_2();

	{
		var append_anchor = _$_.append_into(div);

		_$_.render_component(Row, append_anchor, {});
		_$_.render_component(Empty, append_anchor, {});
		_$_.hydrating && _$_.pop(div);
	}

	_$_.append(__anchor, div);
}

TrailingInElement[_$_.$r] = TrailingInElement_render;

var root_3 = _$_.template(`<!><!>`, 1, 2);

function TrailingInFragment_render(__anchor, __block) {
	var fragment_1 = root_3();
	var node_1 = _$_.first_child_frag(fragment_1);

	_$_.render_component(Row, node_1, {});

	var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1.nextSibling;

	_$_.render_component(Empty, node_2, {});
	_$_.append(__anchor, fragment_1);
}

TrailingInFragment[_$_.$r] = TrailingInFragment_render;

var root_4 = _$_.template_el('div');

function LeadingInElement_render(__anchor, __block) {
	var div_1 = root_4();

	{
		var append_anchor_1 = _$_.append_into(div_1);

		_$_.render_component(Empty, append_anchor_1, {});
		_$_.render_component(Row, append_anchor_1, {});
		_$_.hydrating && _$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
}

LeadingInElement[_$_.$r] = LeadingInElement_render;

var root_5 = _$_.template(`<!><!>`, 1, 2);

function LeadingInFragment_render(__anchor, __block) {
	var fragment_2 = root_5();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.render_component(Empty, node_3, {});

	var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : node_3.nextSibling;

	_$_.render_component(Row, node_4, {});
	_$_.append(__anchor, fragment_2);
}

LeadingInFragment[_$_.$r] = LeadingInFragment_render;

var root_6 = _$_.template_el('div');

function ConsecutiveInElement_render(__anchor, __block) {
	var div_2 = root_6();

	{
		var append_anchor_2 = _$_.append_into(div_2);

		_$_.render_component(Empty, append_anchor_2, {});
		_$_.render_component(Empty, append_anchor_2, {});
		_$_.render_component(Row, append_anchor_2, {});
		_$_.render_component(Empty, append_anchor_2, {});
		_$_.render_component(Empty, append_anchor_2, {});
		_$_.hydrating && _$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

ConsecutiveInElement[_$_.$r] = ConsecutiveInElement_render;

var root_7 = _$_.template(`<!><!><!><!><!>`, 1, 5);

function ConsecutiveInFragment_render(__anchor, __block) {
	var fragment_3 = root_7();
	var node_5 = _$_.first_child_frag(fragment_3);

	_$_.render_component(Empty, node_5, {});

	var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_5.nextSibling;

	_$_.render_component(Empty, node_6, {});

	var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : node_6.nextSibling;

	_$_.render_component(Row, node_7, {});

	var node_8 = _$_.hydrating ? _$_.hydrate_sibling() : node_7.nextSibling;

	_$_.render_component(Empty, node_8, {});

	var node_9 = _$_.hydrating ? _$_.hydrate_sibling() : node_8.nextSibling;

	_$_.render_component(Empty, node_9, {});
	_$_.append(__anchor, fragment_3);
}

ConsecutiveInFragment[_$_.$r] = ConsecutiveInFragment_render;

var root_8 = _$_.template_el('div', null, [['span', ['data-row', ''], 'first'], ['b', null, 'last']]);

function BetweenStaticSiblings_render(__anchor, __block) {
	var div_3 = root_8();

	{
		var span_1 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;
		var node_10 = _$_.hydrating ? _$_.hydrate_sibling() : span_1.nextSibling;

		_$_.render_component(Empty, node_10, {});
		_$_.hydrating && _$_.pop(div_3);
	}

	_$_.append(__anchor, div_3);
}

BetweenStaticSiblings[_$_.$r] = BetweenStaticSiblings_render;

var root_10 = _$_.template(`<!>`, 1, 1);
var root_9 = _$_.template(`<!>`, 1, 1);

function NestedEmpty_render(__anchor, __block) {
	var fragment_4 = root_9();
	var node_12 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_12, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_10();
		var node_11 = _$_.first_child_frag(fragment_5);

		_$_.expression(node_11, () => _$_.tsrx_element((__anchor, __block) => {}));
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

NestedEmpty[_$_.$r] = NestedEmpty_render;

var root_13 = _$_.template_el('b', null, 'child');

function consequent(__anchor) {
	_$_.render_component(Empty, __anchor, {});
}

function alternate(__anchor) {
	var b = root_13();

	_$_.append(__anchor, b);
}

alternate.h = 1;

function if_1(show) {
	if (show.value) return consequent; else return alternate;
}

var root_12 = _$_.template(`<button>toggle</button><!><!>`, 1, 3);

function render(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_11 = _$_.template(`<!>`, 1, 1);

function ToggleEmpty_render(__anchor, __block) {
	const show = _$_.track(true, __block, '49n4iv');
	var fragment_6 = root_11();
	var node_15 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_15, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_12();
		var button = _$_.first_child_frag(fragment_7);

		button.__click = () => show.value = !show.value;

		var node_13 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.render_component(Row, node_13, {});

		var node_14 = _$_.hydrating ? _$_.hydrate_sibling() : node_13.nextSibling;
		var ifs = _$_.if_static(node_14, if_1, 0, show);

		_$_.render(render, { a: _$_.UNINITIALIZED, _a: show, _b: ifs });
		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

ToggleEmpty[_$_.$r] = ToggleEmpty_render;

import { track } from 'ripple';

function Row() {
	return _$_.tsrx_element(Row_render);
}

export function Empty() {
	return _$_.tsrx_element(Empty_render);
}

export function TrailingInElement() {
	return _$_.tsrx_element(TrailingInElement_render);
}

export function TrailingInFragment() {
	return _$_.tsrx_element(TrailingInFragment_render);
}

export function LeadingInElement() {
	return _$_.tsrx_element(LeadingInElement_render);
}

export function LeadingInFragment() {
	return _$_.tsrx_element(LeadingInFragment_render);
}

export function ConsecutiveInElement() {
	return _$_.tsrx_element(ConsecutiveInElement_render);
}

export function ConsecutiveInFragment() {
	return _$_.tsrx_element(ConsecutiveInFragment_render);
}

export function BetweenStaticSiblings() {
	return _$_.tsrx_element(BetweenStaticSiblings_render);
}

export function NestedEmpty() {
	return _$_.tsrx_element(NestedEmpty_render);
}

export function ToggleEmpty() {
	return _$_.tsrx_element(ToggleEmpty_render);
}

_$_.delegate(['click']);