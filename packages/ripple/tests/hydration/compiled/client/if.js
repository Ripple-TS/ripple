// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="shown">Visible</div>`, 1, 1);
var root = _$_.template(`<!>`, 1, 1);
var root_3 = _$_.template(`<div class="shown">Visible</div>`, 1, 1);
var root_2 = _$_.template(`<!>`, 1, 1);
var root_5 = _$_.template(`<div class="logged-in">Welcome back!</div>`, 1, 1);
var root_6 = _$_.template(`<div class="logged-out">Please log in</div>`, 1, 1);
var root_4 = _$_.template(`<!>`, 1, 1);
var root_8 = _$_.template(`<div class="content">Content visible</div>`, 1, 1);
var root_7 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1, 2);
var root_10 = _$_.template(`<div class="on">ON</div>`, 1, 1);
var root_11 = _$_.template(`<div class="off">OFF</div>`, 1, 1);
var root_9 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1, 2);
var root_14 = _$_.template(`<span class="inner-content">Inner</span>`, 1, 1);
var root_13 = _$_.template(`<div class="outer-content">Outer<!></div>`, 1, 1);
var root_12 = _$_.template(`<button class="outer-toggle">Outer</button><button class="inner-toggle">Inner</button><!>`, 1, 3);
var root_16 = _$_.template(`<div class="state">Loading...</div>`, 1, 1);
var root_18 = _$_.template(`<div class="state">Success!</div>`, 1, 1);
var root_19 = _$_.template(`<div class="state">Error occurred</div>`, 1, 1);
var root_17 = _$_.template(`<!>`, 1, 1);
var root_15 = _$_.template(`<div><button class="success">Success</button><button class="error">Error</button><button class="loading">Loading</button><!></div>`, 0);

import { track } from 'ripple';

export function IfTruthy() {
	return _$_.tsrx_element((__anchor, __block) => {
		const show = true;
		var fragment = root();
		var node = _$_.first_child_frag(fragment);

		{
			var consequent = (__anchor) => {
				var return_guard = false;
				var fragment_1 = root_1();

				return_guard = true;
				_$_.append(__anchor, fragment_1);
			};

			_$_.if(node, (__render) => {
				if (show) __render(consequent);
			});
		}

		_$_.append(__anchor, fragment);
	});
}

export function IfFalsy() {
	return _$_.tsrx_element((__anchor, __block) => {
		const show = false;
		var fragment_2 = root_2();
		var node_1 = _$_.first_child_frag(fragment_2);

		{
			var consequent_1 = (__anchor) => {
				var return_guard = false;
				var fragment_3 = root_3();

				return_guard = true;
				_$_.append(__anchor, fragment_3);
			};

			_$_.if(node_1, (__render) => {
				if (show) __render(consequent_1);
			});
		}

		_$_.append(__anchor, fragment_2);
	});
}

export function IfElse() {
	return _$_.tsrx_element((__anchor, __block) => {
		const isLoggedIn = true;
		var fragment_4 = root_4();
		var node_2 = _$_.first_child_frag(fragment_4);

		{
			var consequent_2 = (__anchor) => {
				var return_guard = false;
				var fragment_5 = root_5();

				return_guard = true;
				_$_.append(__anchor, fragment_5);
			};

			var alternate = (__anchor) => {
				var return_guard_1 = false;
				var fragment_6 = root_6();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_6);
			};

			_$_.if(node_2, (__render) => {
				if (isLoggedIn) __render(consequent_2); else __render(alternate, false);
			});
		}

		_$_.append(__anchor, fragment_4);
	});
}

export function ReactiveIf() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(true, __block, '19a16ff0');
		var fragment_7 = root_7();
		var button_1 = _$_.first_child_frag(fragment_7);

		button_1.__click = () => {
			_$_.set(lazy, !lazy.value);
		};

		var node_3 = _$_.sibling(button_1);

		{
			var consequent_3 = (__anchor) => {
				var return_guard = false;
				var fragment_8 = root_8();

				return_guard = true;
				_$_.append(__anchor, fragment_8);
			};

			_$_.if(node_3, (__render) => {
				if (lazy.value) __render(consequent_3);
			});
		}

		_$_.append(__anchor, fragment_7);
	});
}

export function ReactiveIfElse() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(false, __block, '41177f39');
		var fragment_9 = root_9();
		var button_2 = _$_.first_child_frag(fragment_9);

		button_2.__click = () => {
			_$_.set(lazy_1, !lazy_1.value);
		};

		var node_4 = _$_.sibling(button_2);

		{
			var consequent_4 = (__anchor) => {
				var return_guard = false;
				var fragment_10 = root_10();

				return_guard = true;
				_$_.append(__anchor, fragment_10);
			};

			var alternate_1 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_11 = root_11();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_11);
			};

			_$_.if(node_4, (__render) => {
				if (lazy_1.value) __render(consequent_4); else __render(alternate_1, false);
			});
		}

		_$_.append(__anchor, fragment_9);
	});
}

export function NestedIf() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track(true, __block, '7894e1df');
		let lazy_3 = _$_.track(true, __block, 'f21b8c26');
		var fragment_12 = root_12();
		var button_3 = _$_.first_child_frag(fragment_12);

		button_3.__click = () => {
			_$_.set(lazy_2, !lazy_2.value);
		};

		var button_4 = _$_.sibling(button_3);

		button_4.__click = () => {
			_$_.set(lazy_3, !lazy_3.value);
		};

		var node_5 = _$_.sibling(button_4);

		{
			var consequent_6 = (__anchor) => {
				var return_guard = false;
				var fragment_13 = root_13();
				var div_1 = _$_.first_child_frag(fragment_13);

				{
					var expression = _$_.child(div_1);
					var node_6 = _$_.sibling(expression);

					{
						var consequent_5 = (__anchor) => {
							var return_guard_1 = false;
							var fragment_14 = root_14();

							return_guard_1 = true;
							_$_.append(__anchor, fragment_14);
						};

						_$_.if(node_6, (__render) => {
							if (lazy_3.value) __render(consequent_5);
						});
					}

					_$_.pop(div_1);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_13);
			};

			_$_.if(node_5, (__render) => {
				if (lazy_2.value) __render(consequent_6);
			});
		}

		_$_.append(__anchor, fragment_12);
	});
}

export function IfElseIfChain() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_4 = _$_.track('loading', __block, '4c69c94a');
		var div_2 = root_15();

		{
			var button_5 = _$_.child(div_2);

			button_5.__click = () => {
				_$_.set(lazy_4, 'success');
			};

			var button_6 = _$_.sibling(button_5);

			button_6.__click = () => {
				_$_.set(lazy_4, 'error');
			};

			var button_7 = _$_.sibling(button_6);

			button_7.__click = () => {
				_$_.set(lazy_4, 'loading');
			};

			var node_7 = _$_.sibling(button_7);

			{
				var consequent_7 = (__anchor) => {
					var return_guard = false;
					var fragment_15 = root_16();

					return_guard = true;
					_$_.append(__anchor, fragment_15);
				};

				var alternate_3 = (__anchor) => {
					var fragment_16 = root_17();
					var node_8 = _$_.first_child_frag(fragment_16);

					{
						var consequent_8 = (__anchor) => {
							var return_guard_1 = false;
							var fragment_17 = root_18();

							return_guard_1 = true;
							_$_.append(__anchor, fragment_17);
						};

						var alternate_2 = (__anchor) => {
							var return_guard_2 = false;
							var fragment_18 = root_19();

							return_guard_2 = true;
							_$_.append(__anchor, fragment_18);
						};

						_$_.if(node_8, (__render) => {
							if (lazy_4.value === 'success') __render(consequent_8); else __render(alternate_2, false);
						});
					}

					_$_.append(__anchor, fragment_16);
				};

				_$_.if(node_7, (__render) => {
					if (lazy_4.value === 'loading') __render(consequent_7); else __render(alternate_3, false);
				});
			}

			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

_$_.delegate(['click']);