// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="count"> </div>`, 0);

function render(__prev) {
	var __a = __prev._lazy.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression, __prev.a = __a);
	}
}

function TrackedState_render(__anchor, __block) {
	let lazy = _$_.track(0, __block, 'c1818584');
	var div = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_text() : div.firstChild;
	}

	_$_.render(render, { a: ' ', _lazy: lazy, _expression: expression });
	_$_.append(__anchor, div);
}

TrackedState[_$_.$r] = TrackedState_render;

var root_1 = _$_.template(`<div><span class="count"> </span></div>`, 0);

function CounterWithInitial_render(__anchor, __block, props) {
	let lazy_1 = _$_.track(props.initial, __block, '03ea4348');
	var div_1 = root_1();

	{
		var span = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

			_$_.expression(expression_1, () => lazy_1.value);
			_$_.hydrating && _$_.pop(span);
		}
	}

	_$_.append(__anchor, div_1);
}

CounterWithInitial[_$_.$r] = CounterWithInitial_render;

function CounterWrapper_render(__anchor, __block) {
	_$_.render_component(CounterWithInitial, __anchor, { initial: 5 });
}

CounterWrapper[_$_.$r] = CounterWrapper_render;

var root_2 = _$_.template(`<div class="sum"> </div>`, 0);

function ComputedValues_render(__anchor, __block) {
	let lazy_2 = _$_.track(2, __block, 'b78281db');
	let lazy_3 = _$_.track(3, __block, 'a0cf6c6d');
	const sum = () => lazy_2.value + lazy_3.value;
	var div_2 = root_2();

	{
		var expression_2 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		_$_.expression(expression_2, sum);
		_$_.hydrating && _$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

ComputedValues[_$_.$r] = ComputedValues_render;

var root_3 = _$_.template(`<div class="multiple-tracked"><div class="x"> </div><div class="y"> </div><div class="z"> </div></div>`, 0);

function render_1(__prev) {
	var __a = __prev._lazy_4.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_3, __prev.a = __a);
	}

	var __b = __prev._lazy_5.value;

	if (__prev.b !== __b) {
		_$_.set_text(__prev._expression_4, __prev.b = __b);
	}

	var __c = __prev._lazy_6.value;

	if (__prev.c !== __c) {
		_$_.set_text(__prev._expression_5, __prev.c = __c);
	}
}

function MultipleTracked_render(__anchor, __block) {
	let lazy_4 = _$_.track(10, __block, '843522de');
	let lazy_5 = _$_.track(20, __block, '1308996d');
	let lazy_6 = _$_.track(30, __block, '048c3fd0');
	var div_3 = root_3();

	{
		var div_4 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_text() : div_4.firstChild;
		}

		var div_5 = _$_.hydrating ? _$_.hydrate_sibling() : div_4.nextSibling;

		{
			var expression_4 = _$_.hydrating ? _$_.hydrate_text() : div_5.firstChild;
		}

		var div_6 = _$_.hydrating ? _$_.hydrate_sibling() : div_5.nextSibling;

		{
			var expression_5 = _$_.hydrating ? _$_.hydrate_text() : div_6.firstChild;
		}
	}

	_$_.render(render_1, {
		a: ' ',
		b: ' ',
		c: ' ',
		_lazy_4: lazy_4,
		_expression_3: expression_3,
		_lazy_5: lazy_5,
		_expression_4: expression_4,
		_lazy_6: lazy_6,
		_expression_5: expression_5
	});

	_$_.append(__anchor, div_3);
}

MultipleTracked[_$_.$r] = MultipleTracked_render;

var root_4 = _$_.template(`<div class="name"> </div>`, 0);

function DerivedState_render(__anchor, __block) {
	let lazy_7 = _$_.track('John', __block, '6015eeca');
	let lazy_8 = _$_.track('Doe', __block, '4fa9a20e');
	const fullName = () => `${lazy_7.value} ${lazy_8.value}`;
	var div_7 = root_4();

	{
		var expression_6 = _$_.hydrating ? _$_.hydrate_child() : div_7.firstChild;

		_$_.expression(expression_6, fullName);
		_$_.hydrating && _$_.pop(div_7);
	}

	_$_.append(__anchor, div_7);
}

DerivedState[_$_.$r] = DerivedState_render;

import { track } from 'ripple';

export function TrackedState() {
	return _$_.tsrx_element(TrackedState_render);
}

export function CounterWithInitial(props) {
	return _$_.tsrx_element(CounterWithInitial_render, props);
}

export function CounterWrapper() {
	return _$_.tsrx_element(CounterWrapper_render);
}

export function ComputedValues() {
	return _$_.tsrx_element(ComputedValues_render);
}

export function MultipleTracked() {
	return _$_.tsrx_element(MultipleTracked_render);
}

export function DerivedState() {
	return _$_.tsrx_element(DerivedState_render);
}