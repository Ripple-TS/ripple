import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="shown">Visible</div>`, 0);
var root = _$_.template(`<!>`, 1);
var root_3 = _$_.template(`<div class="shown">Visible</div>`, 0);
var root_2 = _$_.template(`<!>`, 1);
var root_5 = _$_.template(`<div class="logged-in">Welcome back!</div>`, 0);
var root_6 = _$_.template(`<div class="logged-out">Please log in</div>`, 0);
var root_4 = _$_.template(`<!>`, 1);
var root_8 = _$_.template(`<div class="content">Content visible</div>`, 0);
var root_7 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1);
var root_10 = _$_.template(`<div class="on">ON</div>`, 0);
var root_11 = _$_.template(`<div class="off">OFF</div>`, 0);
var root_9 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1);
var root_14 = _$_.template(`<span class="inner-content">Inner</span>`, 0);
var root_13 = _$_.template(`<div class="outer-content">Outer<!></div>`, 0);
var root_12 = _$_.template(`<button class="outer-toggle">Outer</button><button class="inner-toggle">Inner</button><!>`, 1);
var root_16 = _$_.template(`<div class="state">Loading...</div>`, 0);
var root_18 = _$_.template(`<div class="state">Success!</div>`, 0);
var root_19 = _$_.template(`<div class="state">Error occurred</div>`, 0);
var root_17 = _$_.template(`<!>`, 1);
var root_15 = _$_.template(`<div><button class="success">Success</button><button class="error">Error</button><button class="loading">Loading</button><!></div>`, 0);

import { track } from 'ripple';

export function IfTruthy(__anchor, _, __block) {
	_$_.push_component();

	const show = true;
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	{
		var consequent = (__anchor) => {
			var div_1 = root_1();

			_$_.append(__anchor, div_1);
		};

		_$_.if(node, (__render) => {
			if (show) __render(consequent);
		});
	}

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function IfFalsy(__anchor, _, __block) {
	_$_.push_component();

	const show = false;
	var fragment_1 = root_2();
	var node_1 = _$_.first_child_frag(fragment_1);

	{
		var consequent_1 = (__anchor) => {
			var div_2 = root_3();

			_$_.append(__anchor, div_2);
		};

		_$_.if(node_1, (__render) => {
			if (show) __render(consequent_1);
		});
	}

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function IfElse(__anchor, _, __block) {
	_$_.push_component();

	const isLoggedIn = true;
	var fragment_2 = root_4();
	var node_2 = _$_.first_child_frag(fragment_2);

	{
		var consequent_2 = (__anchor) => {
			var div_3 = root_5();

			_$_.append(__anchor, div_3);
		};

		var alternate = (__anchor) => {
			var div_4 = root_6();

			_$_.append(__anchor, div_4);
		};

		_$_.if(node_2, (__render) => {
			if (isLoggedIn) __render(consequent_2); else __render(alternate, false);
		});
	}

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function ReactiveIf(__anchor, _, __block) {
	_$_.push_component();

	let show = track(true, void 0, void 0, __block);
	var fragment_3 = root_7();
	var button_1 = _$_.first_child_frag(fragment_3);

	button_1.__click = () => {
		_$_.set(show, !_$_.get(show));
	};

	var node_3 = _$_.sibling(button_1);

	{
		var consequent_3 = (__anchor) => {
			var div_5 = root_8();

			_$_.append(__anchor, div_5);
		};

		_$_.if(node_3, (__render) => {
			if (_$_.get(show)) __render(consequent_3);
		});
	}

	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function ReactiveIfElse(__anchor, _, __block) {
	_$_.push_component();

	let isOn = track(false, void 0, void 0, __block);
	var fragment_4 = root_9();
	var button_2 = _$_.first_child_frag(fragment_4);

	button_2.__click = () => {
		_$_.set(isOn, !_$_.get(isOn));
	};

	var node_4 = _$_.sibling(button_2);

	{
		var consequent_4 = (__anchor) => {
			var div_6 = root_10();

			_$_.append(__anchor, div_6);
		};

		var alternate_1 = (__anchor) => {
			var div_7 = root_11();

			_$_.append(__anchor, div_7);
		};

		_$_.if(node_4, (__render) => {
			if (_$_.get(isOn)) __render(consequent_4); else __render(alternate_1, false);
		});
	}

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function NestedIf(__anchor, _, __block) {
	_$_.push_component();

	let outer = track(true, void 0, void 0, __block);
	let inner = track(true, void 0, void 0, __block);
	var fragment_5 = root_12();
	var button_3 = _$_.first_child_frag(fragment_5);

	button_3.__click = () => {
		_$_.set(outer, !_$_.get(outer));
	};

	var button_4 = _$_.sibling(button_3);

	button_4.__click = () => {
		_$_.set(inner, !_$_.get(inner));
	};

	var node_5 = _$_.sibling(button_4);

	{
		var consequent_6 = (__anchor) => {
			var div_8 = root_13();

			{
				var text = _$_.child(div_8);
				var node_6 = _$_.sibling(text);

				{
					var consequent_5 = (__anchor) => {
						var span_1 = root_14();

						_$_.append(__anchor, span_1);
					};

					_$_.if(node_6, (__render) => {
						if (_$_.get(inner)) __render(consequent_5);
					});
				}

				_$_.pop(div_8);
			}

			_$_.append(__anchor, div_8);
		};

		_$_.if(node_5, (__render) => {
			if (_$_.get(outer)) __render(consequent_6);
		});
	}

	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function IfElseIfChain(__anchor, _, __block) {
	_$_.push_component();

	let status = track('loading', void 0, void 0, __block);
	var div_9 = root_15();

	{
		var button_5 = _$_.child(div_9);

		button_5.__click = () => {
			_$_.set(status, 'success');
		};

		var button_6 = _$_.sibling(button_5);

		button_6.__click = () => {
			_$_.set(status, 'error');
		};

		var button_7 = _$_.sibling(button_6);

		button_7.__click = () => {
			_$_.set(status, 'loading');
		};

		var node_7 = _$_.sibling(button_7);

		{
			var consequent_7 = (__anchor) => {
				var div_10 = root_16();

				_$_.append(__anchor, div_10);
			};

			var alternate_3 = (__anchor) => {
				var fragment_6 = root_17();
				var node_8 = _$_.first_child_frag(fragment_6);

				{
					var consequent_8 = (__anchor) => {
						var div_11 = root_18();

						_$_.append(__anchor, div_11);
					};

					var alternate_2 = (__anchor) => {
						var div_12 = root_19();

						_$_.append(__anchor, div_12);
					};

					_$_.if(node_8, (__render) => {
						if (_$_.get(status) === 'success') __render(consequent_8); else __render(alternate_2, false);
					});
				}

				_$_.append(__anchor, fragment_6);
			};

			_$_.if(node_7, (__render) => {
				if (_$_.get(status) === 'loading') __render(consequent_7); else __render(alternate_3, false);
			});
		}

		_$_.pop(div_9);
	}

	_$_.append(__anchor, div_9);
	_$_.pop_component();
}

_$_.delegate(['click']);