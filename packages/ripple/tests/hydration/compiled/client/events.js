// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><button class="increment">Increment</button><span class="count"> </span></div>`, 0);
var root_1 = _$_.template(`<div><button class="decrement">-</button><span class="count"> </span><button class="increment">+</button></div>`, 0);
var root_2 = _$_.template(`<div><button class="target">Target</button><span class="clicks"> </span><span class="hovers"> </span></div>`, 0);
var root_3 = _$_.template(`<div><button class="btn">Click</button><span class="count"> </span><span class="action"> </span></div>`, 0);
var root_4 = _$_.template(`<div><button class="toggle"> </button></div>`, 0);
var root_5 = _$_.template(`<button class="child-btn"> </button>`, 0);
var root_6 = _$_.template(`<div><!><span class="count"> </span></div>`, 0);

import { track } from 'ripple';

export function ClickCounter() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(0, __block, 'a070e3a7');
		var div = root();

		{
			var button = _$_.child(div);

			button.__click = () => {
				_$_.update(lazy);
			};

			var span = _$_.sibling(button);

			{
				var expression = _$_.child(span);

				_$_.expression(expression, () => lazy.value);
				_$_.pop(span);
			}
		}

		_$_.append(__anchor, div);
	});
}

export function IncrementDecrement() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(0, __block, '87fcabdd');
		var div_1 = root_1();

		{
			var button_1 = _$_.child(div_1);

			button_1.__click = () => {
				_$_.update(lazy_1, -1);
			};

			var span_1 = _$_.sibling(button_1);

			{
				var expression_1 = _$_.child(span_1);

				_$_.expression(expression_1, () => lazy_1.value);
				_$_.pop(span_1);
			}

			var button_2 = _$_.sibling(span_1);

			button_2.__click = () => {
				_$_.update(lazy_1);
			};
		}

		_$_.append(__anchor, div_1);
	});
}

export function MultipleEvents() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track(0, __block, '41b9f0b0');
		let lazy_3 = _$_.track(0, __block, '72789f75');
		var div_2 = root_2();

		{
			var button_3 = _$_.child(div_2);

			button_3.__click = () => {
				_$_.update(lazy_2);
			};

			_$_.event('MouseEnter', button_3, () => {
				_$_.update(lazy_3);
			});

			var span_2 = _$_.sibling(button_3);

			{
				var expression_2 = _$_.child(span_2);

				_$_.expression(expression_2, () => lazy_2.value);
				_$_.pop(span_2);
			}

			var span_3 = _$_.sibling(span_2);

			{
				var expression_3 = _$_.child(span_3);

				_$_.expression(expression_3, () => lazy_3.value);
				_$_.pop(span_3);
			}
		}

		_$_.append(__anchor, div_2);
	});
}

export function MultiStateUpdate() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_4 = _$_.track(0, __block, '5a375160');
		let lazy_5 = _$_.track('none', __block, '3ceeb88c');

		const handleClick = () => {
			_$_.update(lazy_4);
			_$_.set(lazy_5, 'increment');
		};

		var div_3 = root_3();

		{
			var button_4 = _$_.child(div_3);

			button_4.__click = handleClick;

			var span_4 = _$_.sibling(button_4);

			{
				var expression_4 = _$_.child(span_4);

				_$_.expression(expression_4, () => lazy_4.value);
				_$_.pop(span_4);
			}

			var span_5 = _$_.sibling(span_4);

			{
				var expression_5 = _$_.child(span_5);

				_$_.expression(expression_5, () => lazy_5.value);
				_$_.pop(span_5);
			}
		}

		_$_.append(__anchor, div_3);
	});
}

export function ToggleButton() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_6 = _$_.track(false, __block, 'be823ec7');
		var div_4 = root_4();

		{
			var button_5 = _$_.child(div_4);

			button_5.__click = () => {
				_$_.set(lazy_6, !lazy_6.value);
			};

			{
				var expression_6 = _$_.child(button_5, true);

				_$_.pop(button_5);
			}
		}

		_$_.render(() => {
			_$_.set_text(expression_6, lazy_6.value ? 'ON' : 'OFF');
		});

		_$_.append(__anchor, div_4);
	});
}

export function ChildButton(props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var button_6 = root_5();

		_$_.render_event('Click', button_6, () => props.onClick);

		{
			var expression_7 = _$_.child(button_6, true);

			_$_.pop(button_6);
		}

		_$_.render(() => {
			_$_.set_text(expression_7, props.label);
		});

		_$_.append(__anchor, button_6);
	});
}

export function ParentWithChildButton() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_7 = _$_.track(0, __block, 'dcc2e0f9');
		var div_5 = root_6();

		{
			var node = _$_.child(div_5);

			_$_.render_component(ChildButton, node, {
				onClick: () => {
					_$_.update(lazy_7);
				},
				label: "Click me"
			});

			var span_6 = _$_.sibling(node);

			{
				var expression_8 = _$_.child(span_6);

				_$_.expression(expression_8, () => lazy_7.value);
				_$_.pop(span_6);
			}

			_$_.pop(div_5);
		}

		_$_.append(__anchor, div_5);
	});
}

_$_.delegate(['click']);