// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('main');

function App_render(__anchor, __block, { label, onClick }) {
	var main = root();

	{
		var append_anchor = _$_.append_into(main);

		_$_.render_component(Body, append_anchor, { label, onClick });
		_$_.hydrating && _$_.pop(main);
	}

	_$_.append(__anchor, main);
}

App[_$_.$r] = App_render;

function Body_render(__anchor, __block, { label, onClick }) {
	_$_.render_component(Row, __anchor, { label, onClick });
}

Body[_$_.$r] = Body_render;

var root_1 = _$_.template_el('button', null, 'Press');

function consequent(__anchor, { a: label, b: onClick }) {
	var button = root_1();

	_$_.set_attribute_value(button, 'aria-label', label);
	_$_.event('Click', button, onClick);
	_$_.append(__anchor, button);
}

function if_1({ a: label }) {
	if (label) return consequent;
}

function Row_render(__anchor, __block, { label, onClick }) {
	_$_.if(__anchor, if_1, true, { a: label, b: onClick });
}

Row[_$_.$r] = Row_render;

function FragmentRoot_render(__anchor, __block, { Child, label, onClick }) {
	_$_.render_component(Child, __anchor, { label, onClick });
}

FragmentRoot[_$_.$r] = FragmentRoot_render;

var root_2 = _$_.template(`<!><button data-after>After`, 1, 2);

function FragmentWithSiblings_render(__anchor, __block, { Child, label, onClick }) {
	var fragment = root_2();
	var node = _$_.first_child_frag(fragment);

	_$_.render_component(Child, node, { label, onClick });

	var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;

	_$_.event('Click', button_1, onClick);
	_$_.append(__anchor, fragment);
}

FragmentWithSiblings[_$_.$r] = FragmentWithSiblings_render;

var root_3 = _$_.template_el('button', null, 'Press');

function LoopChild_render(__anchor, __block, { label, onClick }) {
	_$_.for(
		__anchor,
		() => label ? [1, 2] : [],
		(__anchor, item) => {
			var button_2 = root_3();

			_$_.set_attribute_value(button_2, 'data-item', item);
			_$_.set_attribute_value(button_2, 'aria-label', label);
			_$_.event('Click', button_2, onClick);
			_$_.append(__anchor, button_2);
		},
		16
	);
}

LoopChild[_$_.$r] = LoopChild_render;

var root_4 = _$_.template_el('button', null, 'Press');

function switch_case_0(__anchor, { a: label, b: onClick }) {
	var button_3 = root_4();

	_$_.set_attribute_value(button_3, 'aria-label', label);
	_$_.event('Click', button_3, onClick);
	_$_.append(__anchor, button_3);
}

function switch_case_default(__anchor) {}

switch_case_default.h = 1;

function switch_1({ a: label }) {
	switch (label) {
		case 'Click':
			return switch_case_0;

		default:
			return switch_case_default;
	}
}

function SwitchChild_render(__anchor, __block, { label, onClick }) {
	_$_.switch(__anchor, switch_1, true, { a: label, b: onClick });
}

SwitchChild[_$_.$r] = SwitchChild_render;

var root_5 = _$_.template_el('button', null, 'Press');
var root_6 = _$_.template_el('span', null, 'Failed');

function TryChild_render(__anchor, __block, { label, onClick }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var button_4 = root_5();

			_$_.set_attribute_value(button_4, 'aria-label', label);
			_$_.event('Click', button_4, onClick);
			_$_.append(__anchor, button_4);
		},
		(__anchor, error) => {
			var span = root_6();

			_$_.append(__anchor, span);
		},
		null,
		true
	);
}

TryChild[_$_.$r] = TryChild_render;

var root_7 = _$_.template_el('button', null, 'Press');

function PlainChild_render(__anchor, __block, { label, onClick }) {
	var button_5 = root_7();

	_$_.set_attribute_value(button_5, 'aria-label', label);
	_$_.event('Click', button_5, onClick);
	_$_.append(__anchor, button_5);
}

PlainChild[_$_.$r] = PlainChild_render;

var root_8 = _$_.template(`<!>`, 1, 1);

function EmptyChild_render(__anchor, __block) {
	var fragment_1 = root_8();
	var node_1 = _$_.first_child_frag(fragment_1);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {}));
	_$_.append(__anchor, fragment_1);
}

EmptyChild[_$_.$r] = EmptyChild_render;

function NestedChild_render(__anchor, __block, { label, onClick }) {
	_$_.render_component(Body, __anchor, { label, onClick });
}

NestedChild[_$_.$r] = NestedChild_render;

var root_9 = _$_.template(`<!>`, 1, 1);

function consequent_1(__anchor, { a: label, b: onClick }) {
	function Local() {
		return _$_.tsrx_element((__anchor, __block) => {
			var fragment_2 = root_9();
			var node_2 = _$_.first_child_frag(fragment_2);

			_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Row, __anchor, { label, onClick });
			}));

			_$_.append(__anchor, fragment_2);
		});
	}

	_$_.render_component(Local, __anchor, {});
}

function if_2({ a: label }) {
	if (label) return consequent_1;
}

function BranchLocalChild_render(__anchor, __block, { label, onClick }) {
	_$_.if(__anchor, if_2, true, { a: label, b: onClick });
}

BranchLocalChild[_$_.$r] = BranchLocalChild_render;

var root_10 = _$_.template_el('main', null, [['button', ['data-after', ''], 'Restore']]);

function ToggleChild_render(__anchor, __block) {
	const visible = _$_.track(true, __block, '69xkvl');
	var main_1 = root_10();

	{
		var node_3 = _$_.hydrating ? _$_.hydrate_child() : main_1.firstChild;

		_$_.render_component(ReactiveBody, node_3, { visible });

		var button_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_3;

		button_6.__click = () => visible.value = true;
		_$_.hydrating && _$_.pop(main_1);
	}

	_$_.append(__anchor, main_1);
}

ToggleChild[_$_.$r] = ToggleChild_render;

function ReactiveBody_render(__anchor, __block, { visible }) {
	_$_.render_component(ReactiveRow, __anchor, { visible });
}

ReactiveBody[_$_.$r] = ReactiveBody_render;

var root_11 = _$_.template_el('button', ['aria-label', 'Click'], 'Press');

function consequent_2(__anchor, visible) {
	var button_7 = root_11();

	button_7.__click = () => visible.value = false;
	_$_.append(__anchor, button_7);
}

function if_3(visible) {
	if (visible.value) return consequent_2;
}

function render(__prev) {
	var __a = if_3(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

function ReactiveRow_render(__anchor, __block, { visible }) {
	var ifs = _$_.if_static(__anchor, if_3, 1, visible);

	_$_.render(render, { a: _$_.UNINITIALIZED, _a: visible, _b: ifs });
}

ReactiveRow[_$_.$r] = ReactiveRow_render;

import { track } from 'ripple';

export function App(__props) {
	return _$_.tsrx_element(App_render, __props);
}

function Body(__props) {
	return _$_.tsrx_element(Body_render, __props);
}

export function Row(__props) {
	return _$_.tsrx_element(Row_render, __props);
}

export function FragmentRoot(__props) {
	return _$_.tsrx_element(FragmentRoot_render, __props);
}

export function FragmentWithSiblings(__props) {
	return _$_.tsrx_element(FragmentWithSiblings_render, __props);
}

export function LoopChild(__props) {
	return _$_.tsrx_element(LoopChild_render, __props);
}

export function SwitchChild(__props) {
	return _$_.tsrx_element(SwitchChild_render, __props);
}

export function TryChild(__props) {
	return _$_.tsrx_element(TryChild_render, __props);
}

export function PlainChild(__props) {
	return _$_.tsrx_element(PlainChild_render, __props);
}

export function EmptyChild() {
	return _$_.tsrx_element(EmptyChild_render);
}

export function NestedChild(__props) {
	return _$_.tsrx_element(NestedChild_render, __props);
}

export function BranchLocalChild(__props) {
	return _$_.tsrx_element(BranchLocalChild_render, __props);
}

export function ToggleChild() {
	return _$_.tsrx_element(ToggleChild_render);
}

function ReactiveBody(__props) {
	return _$_.tsrx_element(ReactiveBody_render, __props);
}

function ReactiveRow(__props) {
	return _$_.tsrx_element(ReactiveRow_render, __props);
}

_$_.delegate(['click']);