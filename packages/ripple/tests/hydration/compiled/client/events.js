// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><button class="increment">Increment</button><span class="count"> </span></div>`, 0);

function ClickCounter_render(__anchor, __block) {
	let lazy = _$_.track(0, __block, 'a070e3a7');
	var div = root();

	{
		var button = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		button.__click = () => {
			_$_.update(lazy);
		};

		var span = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		{
			var expression = _$_.hydrating ? _$_.hydrate_text() : span.firstChild;
		}
	}

	_$_.render(
		(__prev) => {
			var __a = lazy.value;

			if (__prev.a !== __a) {
				_$_.set_text(expression, __prev.a = __a);
			}
		},
		{ a: ' ' }
	);

	_$_.append(__anchor, div);
}

ClickCounter.$r = ClickCounter_render;

var root_1 = _$_.template(`<div><button class="decrement">-</button><span class="count"> </span><button class="increment">+</button></div>`, 0);

function IncrementDecrement_render(__anchor, __block) {
	let lazy_1 = _$_.track(0, __block, '87fcabdd');
	var div_1 = root_1();

	{
		var button_1 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		button_1.__click = () => {
			_$_.update(lazy_1, -1);
		};

		var span_1 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_text() : span_1.firstChild;
		}

		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : span_1.nextSibling;

		button_2.__click = () => {
			_$_.update(lazy_1);
		};
	}

	_$_.render(
		(__prev) => {
			var __a = lazy_1.value;

			if (__prev.a !== __a) {
				_$_.set_text(expression_1, __prev.a = __a);
			}
		},
		{ a: ' ' }
	);

	_$_.append(__anchor, div_1);
}

IncrementDecrement.$r = IncrementDecrement_render;

var root_2 = _$_.template(`<div><button class="target">Target</button><span class="clicks"> </span><span class="hovers"> </span></div>`, 0);

function MultipleEvents_render(__anchor, __block) {
	let lazy_2 = _$_.track(0, __block, '41b9f0b0');
	let lazy_3 = _$_.track(0, __block, '72789f75');
	var div_2 = root_2();

	{
		var button_3 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		button_3.__click = () => {
			_$_.update(lazy_2);
		};

		_$_.event('MouseEnter', button_3, () => {
			_$_.update(lazy_3);
		});

		var span_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_text() : span_2.firstChild;
		}

		var span_3 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_text() : span_3.firstChild;
		}
	}

	_$_.render(
		(__prev) => {
			var __a = lazy_2.value;

			if (__prev.a !== __a) {
				_$_.set_text(expression_2, __prev.a = __a);
			}

			var __b = lazy_3.value;

			if (__prev.b !== __b) {
				_$_.set_text(expression_3, __prev.b = __b);
			}
		},
		{ a: ' ', b: ' ' }
	);

	_$_.append(__anchor, div_2);
}

MultipleEvents.$r = MultipleEvents_render;

var root_3 = _$_.template(`<div><button class="btn">Click</button><span class="count"> </span><span class="action"> </span></div>`, 0);

function MultiStateUpdate_render(__anchor, __block) {
	let lazy_4 = _$_.track(0, __block, '5a375160');
	let lazy_5 = _$_.track('none', __block, '3ceeb88c');

	const handleClick = () => {
		_$_.update(lazy_4);
		_$_.set(lazy_5, 'increment');
	};

	var div_3 = root_3();

	{
		var button_4 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;

		button_4.__click = handleClick;

		var span_4 = _$_.hydrating ? _$_.hydrate_sibling() : button_4.nextSibling;

		{
			var expression_4 = _$_.hydrating ? _$_.hydrate_text() : span_4.firstChild;
		}

		var span_5 = _$_.hydrating ? _$_.hydrate_sibling() : span_4.nextSibling;

		{
			var expression_5 = _$_.hydrating ? _$_.hydrate_child() : span_5.firstChild;

			_$_.expression(expression_5, () => lazy_5.value);
			_$_.pop(span_5);
		}
	}

	_$_.render(
		(__prev) => {
			var __a = lazy_4.value;

			if (__prev.a !== __a) {
				_$_.set_text(expression_4, __prev.a = __a);
			}
		},
		{ a: ' ' }
	);

	_$_.append(__anchor, div_3);
}

MultiStateUpdate.$r = MultiStateUpdate_render;

var root_4 = _$_.template(`<div><button class="toggle"> </button></div>`, 0);

function ToggleButton_render(__anchor, __block) {
	let lazy_6 = _$_.track(false, __block, 'be823ec7');
	var div_4 = root_4();

	{
		var button_5 = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

		button_5.__click = () => {
			_$_.set(lazy_6, !lazy_6.value);
		};

		{
			var expression_6 = _$_.hydrating ? _$_.hydrate_text() : button_5.firstChild;
		}
	}

	_$_.render(
		(__prev) => {
			var __a = lazy_6.value ? 'ON' : 'OFF';

			if (__prev.a !== __a) {
				_$_.set_text(expression_6, __prev.a = __a);
			}
		},
		{ a: ' ' }
	);

	_$_.append(__anchor, div_4);
}

ToggleButton.$r = ToggleButton_render;

var root_5 = _$_.template(`<button class="child-btn"> </button>`, 0);

function ChildButton_render(__anchor, __block, props) {
	var button_6 = root_5();

	_$_.render_event('Click', button_6, () => props.onClick);

	{
		var expression_7 = _$_.hydrating ? _$_.hydrate_text() : button_6.firstChild;
	}

	_$_.render(
		(__prev) => {
			var __a = props.label;

			if (__prev.a !== __a) {
				_$_.set_text(expression_7, __prev.a = __a);
			}
		},
		{ a: ' ' }
	);

	_$_.append(__anchor, button_6);
}

ChildButton.$r = ChildButton_render;

var root_6 = _$_.template(`<div><!><span class="count"> </span></div>`, 0);

function ParentWithChildButton_render(__anchor, __block) {
	let lazy_7 = _$_.track(0, __block, 'dcc2e0f9');
	var div_5 = root_6();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div_5.firstChild;

		_$_.render_component(ChildButton, node, {
			onClick: () => {
				_$_.update(lazy_7);
			},
			label: "Click me"
		});

		var span_6 = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;

		{
			var expression_8 = _$_.hydrating ? _$_.hydrate_text() : span_6.firstChild;
		}

		_$_.pop(div_5);
	}

	_$_.render(
		(__prev) => {
			var __a = lazy_7.value;

			if (__prev.a !== __a) {
				_$_.set_text(expression_8, __prev.a = __a);
			}
		},
		{ a: ' ' }
	);

	_$_.append(__anchor, div_5);
}

ParentWithChildButton.$r = ParentWithChildButton_render;

import { track } from 'ripple';

export function ClickCounter() {
	return _$_.tsrx_element(ClickCounter_render);
}

export function IncrementDecrement() {
	return _$_.tsrx_element(IncrementDecrement_render);
}

export function MultipleEvents() {
	return _$_.tsrx_element(MultipleEvents_render);
}

export function MultiStateUpdate() {
	return _$_.tsrx_element(MultiStateUpdate_render);
}

export function ToggleButton() {
	return _$_.tsrx_element(ToggleButton_render);
}

export function ChildButton(props) {
	return _$_.tsrx_element(ChildButton_render, props);
}

export function ParentWithChildButton() {
	return _$_.tsrx_element(ParentWithChildButton_render);
}

_$_.delegate(['click']);