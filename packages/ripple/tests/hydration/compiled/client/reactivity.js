import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="count"> </div>`, 0);
var root_1 = _$_.template(`<div><span class="count"> </span></div>`, 0);
var root_2 = _$_.template(`<!>`, 1);
var root_3 = _$_.template(`<div class="sum"> </div>`, 0);
var root_4 = _$_.template(`<div class="x"> </div><div class="y"> </div><div class="z"> </div>`, 1);
var root_5 = _$_.template(`<div class="name"> </div>`, 0);

import { track } from 'ripple';

export function TrackedState(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	var div_1 = root();

	{
		var text = _$_.child(div_1, true);

		_$_.pop(div_1);
	}

	_$_.render(() => {
		_$_.set_text(text, _$_.get(count));
	});

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function CounterWithInitial(__anchor, props, __block) {
	_$_.push_component();

	let count = track(props.initial, void 0, void 0, __block);
	var div_2 = root_1();

	{
		var span_1 = _$_.child(div_2);

		{
			var text_1 = _$_.child(span_1, true);

			_$_.pop(span_1);
		}
	}

	_$_.render(() => {
		_$_.set_text(text_1, _$_.get(count));
	});

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function CounterWrapper(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root_2();
	var node = _$_.first_child_frag(fragment);

	CounterWithInitial(node, { initial: 5 }, _$_.active_block);
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function ComputedValues(__anchor, _, __block) {
	_$_.push_component();

	let a = track(2, void 0, void 0, __block);
	let b = track(3, void 0, void 0, __block);
	const sum = () => _$_.get(a) + _$_.get(b);
	var div_3 = root_3();

	{
		var text_2 = _$_.child(div_3, true);

		_$_.pop(div_3);
	}

	_$_.render(() => {
		_$_.set_text(text_2, sum());
	});

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function MultipleTracked(__anchor, _, __block) {
	_$_.push_component();

	let x = track(10, void 0, void 0, __block);
	let y = track(20, void 0, void 0, __block);
	let z = track(30, void 0, void 0, __block);
	var fragment_1 = root_4();
	var div_4 = _$_.first_child_frag(fragment_1);

	{
		var text_3 = _$_.child(div_4, true);

		_$_.pop(div_4);
	}

	var div_5 = _$_.sibling(div_4);

	{
		var text_4 = _$_.child(div_5, true);

		_$_.pop(div_5);
	}

	var div_6 = _$_.sibling(div_5);

	{
		var text_5 = _$_.child(div_6, true);

		_$_.pop(div_6);
	}

	_$_.next(2);

	_$_.render(
		(__prev) => {
			var __a = _$_.get(x);

			if (__prev.a !== __a) {
				_$_.set_text(text_3, __prev.a = __a);
			}

			var __b = _$_.get(y);

			if (__prev.b !== __b) {
				_$_.set_text(text_4, __prev.b = __b);
			}

			var __c = _$_.get(z);

			if (__prev.c !== __c) {
				_$_.set_text(text_5, __prev.c = __c);
			}
		},
		{ a: ' ', b: ' ', c: ' ' }
	);

	_$_.append(__anchor, fragment_1, true);
	_$_.pop_component();
}

export function DerivedState(__anchor, _, __block) {
	_$_.push_component();

	let firstName = track('John', void 0, void 0, __block);
	let lastName = track('Doe', void 0, void 0, __block);
	const fullName = () => `${_$_.get(firstName)} ${_$_.get(lastName)}`;
	var div_7 = root_5();

	{
		var text_6 = _$_.child(div_7, true);

		_$_.pop(div_7);
	}

	_$_.render(() => {
		_$_.set_text(text_6, fullName());
	});

	_$_.append(__anchor, div_7);
	_$_.pop_component();
}