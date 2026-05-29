// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="count"> </div>`, 0);
var root_1 = _$_.template(`<div><span class="count"> </span></div>`, 0);
var root_2 = _$_.template(`<!>`, 1, 1);
var root_3 = _$_.template(`<div class="sum"> </div>`, 0);
var root_4 = _$_.template(`<div class="x"> </div><div class="y"> </div><div class="z"> </div>`, 1, 3);
var root_5 = _$_.template(`<div class="name"> </div>`, 0);

import { track } from 'ripple';

export function TrackedState() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(0, __block, 'c1818584');
		var div_1 = root();

		{
			var expression = _$_.child(div_1);

			_$_.expression(expression, () => lazy.value);
			_$_.pop(div_1);
		}

		_$_.append(__anchor, div_1);
	});
}

export function CounterWithInitial(props) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(props.initial, __block, '03ea4348');
		var div_2 = root_1();

		{
			var span_1 = _$_.child(div_2);

			{
				var expression_1 = _$_.child(span_1);

				_$_.expression(expression_1, () => lazy_1.value);
				_$_.pop(span_1);
			}
		}

		_$_.append(__anchor, div_2);
	});
}

export function CounterWrapper() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment = root_2();
		var node = _$_.first_child_frag(fragment);

		_$_.render_component(CounterWithInitial, node, { initial: 5 });
		_$_.append(__anchor, fragment);
	});
}

export function ComputedValues() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track(2, __block, 'b78281db');
		let lazy_3 = _$_.track(3, __block, 'a0cf6c6d');
		const sum = () => lazy_2.value + lazy_3.value;
		var div_3 = root_3();

		{
			var expression_2 = _$_.child(div_3);

			_$_.expression(expression_2, sum);
			_$_.pop(div_3);
		}

		_$_.append(__anchor, div_3);
	});
}

export function MultipleTracked() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_4 = _$_.track(10, __block, '843522de');
		let lazy_5 = _$_.track(20, __block, '1308996d');
		let lazy_6 = _$_.track(30, __block, '048c3fd0');
		var fragment_1 = root_4();
		var div_4 = _$_.first_child_frag(fragment_1);

		{
			var expression_3 = _$_.child(div_4);

			_$_.expression(expression_3, () => lazy_4.value);
			_$_.pop(div_4);
		}

		var div_5 = _$_.sibling(div_4);

		{
			var expression_4 = _$_.child(div_5);

			_$_.expression(expression_4, () => lazy_5.value);
			_$_.pop(div_5);
		}

		var div_6 = _$_.sibling(div_5);

		{
			var expression_5 = _$_.child(div_6);

			_$_.expression(expression_5, () => lazy_6.value);
			_$_.pop(div_6);
		}

		_$_.next(2);
		_$_.append(__anchor, fragment_1, true);
	});
}

export function DerivedState() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_7 = _$_.track('John', __block, '6015eeca');
		let lazy_8 = _$_.track('Doe', __block, '4fa9a20e');
		const fullName = () => `${lazy_7.value} ${lazy_8.value}`;
		var div_7 = root_5();

		{
			var expression_6 = _$_.child(div_7);

			_$_.expression(expression_6, fullName);
			_$_.pop(div_7);
		}

		_$_.append(__anchor, div_7);
	});
}