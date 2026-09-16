// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><button class="increment">Increment</button><span class="count"></span></div>`, 0);

function render(__prev) {
	var __a = __prev._count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._span, __a, __prev.a);
		__prev.a = __a;
	}
}

function ClickCounter_render(__anchor, __block) {
	const count = _$_.track(0, __block, 'a070e3a7');
	var div = root();

	{
		var button = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		button.__click = () => {
			count.value++;
		};

		var span = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;
	}

	_$_.render(render, { a: '', _count: count, _span: span });
	_$_.append(__anchor, div);
}

ClickCounter[_$_.$r] = ClickCounter_render;

var root_1 = _$_.template(`<div><button class="decrement">-</button><span class="count"></span><button class="increment">+</button></div>`, 0);

function render_1(__prev) {
	var __a = __prev._count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._span_1, __a, __prev.a);
		__prev.a = __a;
	}
}

function IncrementDecrement_render(__anchor, __block) {
	const count = _$_.track(0, __block, '87fcabdd');
	var div_1 = root_1();

	{
		var button_1 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		button_1.__click = () => {
			count.value--;
		};

		var span_1 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;
		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : span_1.nextSibling;

		button_2.__click = () => {
			count.value++;
		};
	}

	_$_.render(render_1, { a: '', _count: count, _span_1: span_1 });
	_$_.append(__anchor, div_1);
}

IncrementDecrement[_$_.$r] = IncrementDecrement_render;

var root_2 = _$_.template(`<div><button class="target">Target</button><span class="clicks"></span><span class="hovers"></span></div>`, 0);

function render_2(__prev) {
	var __a = __prev._clicks.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._span_2, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = __prev._hovers.value;

	if (__prev.b !== __b) {
		_$_.set_text_content(__prev._span_3, __b, __prev.b);
		__prev.b = __b;
	}
}

function MultipleEvents_render(__anchor, __block) {
	const clicks = _$_.track(0, __block, '41b9f0b0');
	const hovers = _$_.track(0, __block, '72789f75');
	var div_2 = root_2();

	{
		var button_3 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		button_3.__click = () => {
			clicks.value++;
		};

		_$_.event('MouseEnter', button_3, () => {
			hovers.value++;
		});

		var span_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;
		var span_3 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;
	}

	_$_.render(render_2, {
		a: '',
		b: '',
		_clicks: clicks,
		_span_2: span_2,
		_hovers: hovers,
		_span_3: span_3
	});

	_$_.append(__anchor, div_2);
}

MultipleEvents[_$_.$r] = MultipleEvents_render;

var root_3 = _$_.template(`<div><button class="btn">Click</button><span class="count"></span><span class="action"> </span></div>`, 0);

function render_3(__prev) {
	var __a = __prev._count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._span_4, __a, __prev.a);
		__prev.a = __a;
	}
}

function MultiStateUpdate_render(__anchor, __block) {
	const count = _$_.track(0, __block, '5a375160');
	const lastAction = _$_.track('none', __block, '3ceeb88c');

	const handleClick = () => {
		count.value++;
		lastAction.value = 'increment';
	};

	var div_3 = root_3();

	{
		var button_4 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;

		button_4.__click = handleClick;

		var span_4 = _$_.hydrating ? _$_.hydrate_sibling() : button_4.nextSibling;
		var span_5 = _$_.hydrating ? _$_.hydrate_sibling() : span_4.nextSibling;

		{
			var expression_5 = _$_.hydrating ? _$_.hydrate_child() : span_5.firstChild;

			_$_.expression(expression_5, () => lastAction.value);
			_$_.hydrating && _$_.pop(span_5);
		}
	}

	_$_.render(render_3, { a: '', _count: count, _span_4: span_4 });
	_$_.append(__anchor, div_3);
}

MultiStateUpdate[_$_.$r] = MultiStateUpdate_render;

var root_4 = _$_.template(`<div><button class="toggle"></button></div>`, 0);

function render_4(__prev) {
	var __a = __prev._isOn.value ? 'ON' : 'OFF';

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._button_5, __a, __prev.a);
		__prev.a = __a;
	}
}

function ToggleButton_render(__anchor, __block) {
	const isOn = _$_.track(false, __block, 'be823ec7');
	var div_4 = root_4();

	{
		var button_5 = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

		button_5.__click = () => {
			isOn.value = !isOn.value;
		};
	}

	_$_.render(render_4, { a: '', _isOn: isOn, _button_5: button_5 });
	_$_.append(__anchor, div_4);
}

ToggleButton[_$_.$r] = ToggleButton_render;

var root_5 = _$_.template(`<button class="child-btn"></button>`, 0);

function render_5(__prev) {
	var __a = __prev._props.label;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._button_6, __a, __prev.a);
		__prev.a = __a;
	}
}

function ChildButton_render(__anchor, __block, props) {
	var button_6 = root_5();

	_$_.render_event('Click', button_6, () => props.onClick);
	_$_.render(render_5, { a: '', _props: props, _button_6: button_6 });
	_$_.append(__anchor, button_6);
}

ChildButton[_$_.$r] = ChildButton_render;

var root_6 = _$_.template(`<div><span class="count"></span></div>`, 0);

function render_6(__prev) {
	var __a = __prev._count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._span_6, __a, __prev.a);
		__prev.a = __a;
	}
}

function ParentWithChildButton_render(__anchor, __block) {
	const count = _$_.track(0, __block, 'dcc2e0f9');
	var div_5 = root_6();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div_5.firstChild;

		_$_.render_component(ChildButton, node, {
			onClick: () => {
				count.value++;
			},
			label: "Click me"
		});

		var span_6 = _$_.hydrating ? _$_.hydrate_sibling() : node;

		_$_.hydrating && _$_.pop(div_5);
	}

	_$_.render(render_6, { a: '', _count: count, _span_6: span_6 });
	_$_.append(__anchor, div_5);
}

ParentWithChildButton[_$_.$r] = ParentWithChildButton_render;

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