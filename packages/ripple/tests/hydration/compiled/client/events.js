import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><button class="increment">Increment</button><span class="count"> </span></div>`, 0);
var root_1 = _$_.template(`<div><button class="decrement">-</button><span class="count"> </span><button class="increment">+</button></div>`, 0);
var root_2 = _$_.template(`<div><button class="target">Target</button><span class="clicks"> </span><span class="hovers"> </span></div>`, 0);
var root_3 = _$_.template(`<div><button class="btn">Click</button><span class="count"> </span><span class="action"> </span></div>`, 0);
var root_4 = _$_.template(`<div><button class="toggle"> </button></div>`, 0);
var root_5 = _$_.template(`<button class="child-btn"> </button>`, 0);
var root_6 = _$_.template(`<div><!><span class="count"> </span></div>`, 0);

import { track } from 'ripple';

export function ClickCounter(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	var div_1 = root();

	{
		var button_1 = _$_.child(div_1);

		button_1.__click = () => {
			_$_.update(count);
		};

		var span_1 = _$_.sibling(button_1);

		{
			var text = _$_.child(span_1, true);

			_$_.pop(span_1);
		}
	}

	_$_.render(() => {
		_$_.set_text(text, _$_.get(count));
	});

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function IncrementDecrement(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	var div_2 = root_1();

	{
		var button_2 = _$_.child(div_2);

		button_2.__click = () => {
			_$_.update(count, -1);
		};

		var span_2 = _$_.sibling(button_2);

		{
			var text_1 = _$_.child(span_2, true);

			_$_.pop(span_2);
		}

		var button_3 = _$_.sibling(span_2);

		button_3.__click = () => {
			_$_.update(count);
		};
	}

	_$_.render(() => {
		_$_.set_text(text_1, _$_.get(count));
	});

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function MultipleEvents(__anchor, _, __block) {
	_$_.push_component();

	let clicks = track(0, void 0, void 0, __block);
	let hovers = track(0, void 0, void 0, __block);
	var div_3 = root_2();

	{
		var button_4 = _$_.child(div_3);

		button_4.__click = () => {
			_$_.update(clicks);
		};

		_$_.event('MouseEnter', button_4, () => {
			_$_.update(hovers);
		});

		var span_3 = _$_.sibling(button_4);

		{
			var text_2 = _$_.child(span_3, true);

			_$_.pop(span_3);
		}

		var span_4 = _$_.sibling(span_3);

		{
			var text_3 = _$_.child(span_4, true);

			_$_.pop(span_4);
		}
	}

	_$_.render(
		(__prev) => {
			var __a = _$_.get(clicks);

			if (__prev.a !== __a) {
				_$_.set_text(text_2, __prev.a = __a);
			}

			var __b = _$_.get(hovers);

			if (__prev.b !== __b) {
				_$_.set_text(text_3, __prev.b = __b);
			}
		},
		{ a: ' ', b: ' ' }
	);

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function MultiStateUpdate(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	let lastAction = track('none', void 0, void 0, __block);

	const handleClick = () => {
		_$_.update(count);
		_$_.set(lastAction, 'increment');
	};

	var div_4 = root_3();

	{
		var button_5 = _$_.child(div_4);

		button_5.__click = handleClick;

		var span_5 = _$_.sibling(button_5);

		{
			var text_4 = _$_.child(span_5, true);

			_$_.pop(span_5);
		}

		var span_6 = _$_.sibling(span_5);

		{
			var text_5 = _$_.child(span_6, true);

			_$_.pop(span_6);
		}
	}

	_$_.render(
		(__prev) => {
			var __a = _$_.get(count);

			if (__prev.a !== __a) {
				_$_.set_text(text_4, __prev.a = __a);
			}

			var __b = _$_.get(lastAction);

			if (__prev.b !== __b) {
				_$_.set_text(text_5, __prev.b = __b);
			}
		},
		{ a: ' ', b: ' ' }
	);

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function ToggleButton(__anchor, _, __block) {
	_$_.push_component();

	let isOn = track(false, void 0, void 0, __block);
	var div_5 = root_4();

	{
		var button_6 = _$_.child(div_5);

		button_6.__click = () => {
			_$_.set(isOn, !_$_.get(isOn));
		};

		{
			var text_6 = _$_.child(button_6, true);

			_$_.pop(button_6);
		}
	}

	_$_.render(() => {
		_$_.set_text(text_6, _$_.get(isOn) ? 'ON' : 'OFF');
	});

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function ChildButton(__anchor, props, __block) {
	_$_.push_component();

	var button_7 = root_5();

	_$_.render_event('Click', button_7, () => props.onClick);

	{
		var text_7 = _$_.child(button_7, true);

		_$_.pop(button_7);
	}

	_$_.render(() => {
		_$_.set_text(text_7, props.label);
	});

	_$_.append(__anchor, button_7);
	_$_.pop_component();
}

export function ParentWithChildButton(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	var div_6 = root_6();

	{
		var node = _$_.child(div_6);

		ChildButton(
			node,
			{
				onClick: () => {
					_$_.update(count);
				},

				label: "Click me"
			},
			_$_.active_block
		);

		var span_7 = _$_.sibling(node);

		{
			var text_8 = _$_.child(span_7, true);

			_$_.pop(span_7);
		}

		_$_.pop(div_6);
	}

	_$_.render(() => {
		_$_.set_text(text_8, _$_.get(count));
	});

	_$_.append(__anchor, div_6);
	_$_.pop_component();
}

_$_.delegate(['click']);