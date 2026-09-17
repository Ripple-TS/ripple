// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('div', ['class', 'count']);

function render(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function TrackedState_render(__anchor, __block) {
	const count = _$_.track(0, __block, '1hovkhw');
	var div = root();

	_$_.render(render, { a: '', _a: count, _b: div });
	_$_.append(__anchor, div);
}

TrackedState[_$_.$r] = TrackedState_render;

var root_1 = _$_.template(`<div><span class=count> `);

function CounterWithInitial_render(__anchor, __block, props) {
	const count = _$_.track(props.initial, __block, '133ubs');
	var div_1 = root_1();

	{
		var span = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

			_$_.expression(expression_1, () => count.value);
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

var root_2 = _$_.template_el('div', ['class', 'sum'], ' ');

function ComputedValues_render(__anchor, __block) {
	const a = _$_.track(2, __block, '1ex10ij');
	const b = _$_.track(3, __block, '18mae7h');
	const sum = () => a.value + b.value;
	var div_2 = root_2();

	{
		var expression_2 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		_$_.expression(expression_2, sum);
		_$_.hydrating && _$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

ComputedValues[_$_.$r] = ComputedValues_render;

var root_3 = _$_.template(`<div class=multiple-tracked><div class=x></div><div class=y></div><div class=z>`);

function render_1(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = __prev._c.value;

	if (__prev.b !== __b) {
		_$_.set_text_content(__prev._d, __b, __prev.b);
		__prev.b = __b;
	}

	var __c = __prev._e.value;

	if (__prev.c !== __c) {
		_$_.set_text_content(__prev._f, __c, __prev.c);
		__prev.c = __c;
	}
}

function MultipleTracked_render(__anchor, __block) {
	const x = _$_.track(10, __block, '10ol1i6');
	const y = _$_.track(20, __block, '5a4d4d');
	const z = _$_.track(30, __block, '19fdn4');
	var div_3 = root_3();

	{
		var div_4 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;
		var div_5 = _$_.hydrating ? _$_.hydrate_sibling() : div_4.nextSibling;
		var div_6 = _$_.hydrating ? _$_.hydrate_sibling() : div_5.nextSibling;
	}

	_$_.render(render_1, {
		a: '',
		b: '',
		c: '',
		_a: x,
		_b: div_4,
		_c: y,
		_d: div_5,
		_e: z,
		_f: div_6
	});

	_$_.append(__anchor, div_3);
}

MultipleTracked[_$_.$r] = MultipleTracked_render;

var root_4 = _$_.template_el('div', ['class', 'name'], ' ');

function DerivedState_render(__anchor, __block) {
	const firstName = _$_.track('John', __block, 'qnrtu2');
	const lastName = _$_.track('Doe', __block, 'm3q77y');
	const fullName = () => `${firstName.value} ${lastName.value}`;
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