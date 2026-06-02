// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<p class="result"> </p>`, 1, 1);
var root_2 = _$_.template(`<p class="loading">loading...</p>`, 1, 1);
var root = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);
var root_4 = _$_.template(`<p class="result"> </p>`, 1, 1);
var root_5 = _$_.template(`<p class="loading">loading...</p>`, 1, 1);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<span class="count"> </span>`, 1, 1);
var root_8 = _$_.template(`<span class="pending">...</span>`, 1, 1);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_10 = _$_.template(`<div class="user"><span class="name"> </span><span class="age"> </span></div>`, 1, 1);
var root_11 = _$_.template(`<div class="loading">loading user...</div>`, 1, 1);
var root_9 = _$_.template(`<!>`, 1, 1);
var root_13 = _$_.template(`<div class="multi"><span class="first"> </span><span class="second"> </span></div>`, 1, 1);
var root_14 = _$_.template(`<div class="loading">loading...</div>`, 1, 1);
var root_12 = _$_.template(`<!>`, 1, 1);
var root_16 = _$_.template(`<p class="result"> </p>`, 1, 1);
var root_17 = _$_.template(`<p class="error"> </p>`, 1, 1);
var root_18 = _$_.template(`<p class="loading">loading...</p>`, 1, 1);
var root_15 = _$_.template(`<!>`, 1, 1);
var root_20 = _$_.template(`<p class="result"> </p>`, 1, 1);
var root_21 = _$_.template(`<p class="pending">loading...</p>`, 1, 1);
var root_19 = _$_.template(`<!>`, 1, 1);
var root_23 = _$_.template(`<!>`, 1, 1);
var root_24 = _$_.template(`<p class="parent-error"> </p>`, 1, 1);
var root_22 = _$_.template(`<!>`, 1, 1);
var root_26 = _$_.template(`<p class="result"> </p>`, 1, 1);
var root_27 = _$_.template(`<p class="loading">loading...</p>`, 1, 1);
var root_25 = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);

import { track, trackAsync } from 'ripple';

const formatValue = function (...args) {
	return _$_.rpc('1215faad', args);
};

export function AsyncWithServerCall() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(0, __block, '2e21cbe9');
		var fragment = root();
		var button_1 = _$_.first_child_frag(fragment);

		button_1.__click = () => {
			_$_.update(lazy);
		};

		var node = _$_.sibling(button_1);

		_$_.try(
			node,
			(__anchor) => {
				var return_guard = false;
				let lazy_1 = _$_.track_async(() => _$_.with_scope(__block, () => formatValue(lazy.value)), __block, 'f0c2b41e');
				var fragment_1 = root_1();
				var p_1 = _$_.first_child_frag(fragment_1);

				{
					var expression = _$_.child(p_1);

					_$_.expression(expression, () => lazy_1.value);
					_$_.pop(p_1);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_1);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_2 = root_2();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_2);
			}
		);

		_$_.append(__anchor, fragment);
	});
}

export function AsyncSimpleValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_3();
		var node_1 = _$_.first_child_frag(fragment_3);

		_$_.try(
			node_1,
			(__anchor) => {
				var return_guard = false;
				let lazy_2 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('hydrated value')), __block, '4e502c38');
				var fragment_4 = root_4();
				var p_2 = _$_.first_child_frag(fragment_4);

				{
					var expression_1 = _$_.child(p_2);

					_$_.expression(expression_1, () => lazy_2.value);
					_$_.pop(p_2);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_4);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_5 = root_5();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_5);
			}
		);

		_$_.append(__anchor, fragment_3);
	});
}

export function AsyncNumericValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_6 = root_6();
		var node_2 = _$_.first_child_frag(fragment_6);

		_$_.try(
			node_2,
			(__anchor) => {
				var return_guard = false;
				let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(42)), __block, '14891754');
				var fragment_7 = root_7();
				var span_1 = _$_.first_child_frag(fragment_7);

				{
					var expression_2 = _$_.child(span_1);

					_$_.expression(expression_2, () => lazy_3.value);
					_$_.pop(span_1);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_7);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_8 = root_8();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_8);
			}
		);

		_$_.append(__anchor, fragment_6);
	});
}

export function AsyncObjectValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_9 = root_9();
		var node_3 = _$_.first_child_frag(fragment_9);

		_$_.try(
			node_3,
			(__anchor) => {
				var return_guard = false;
				let lazy_4 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve({ name: 'Alice', age: 30 })), __block, 'f325448a');
				var fragment_10 = root_10();
				var div_1 = _$_.first_child_frag(fragment_10);

				{
					var span_2 = _$_.child(div_1);

					{
						var expression_3 = _$_.child(span_2);

						_$_.expression(expression_3, () => lazy_4.value.name);
						_$_.pop(span_2);
					}

					var span_3 = _$_.sibling(span_2);

					{
						var expression_4 = _$_.child(span_3);

						_$_.expression(expression_4, () => lazy_4.value.age);
						_$_.pop(span_3);
					}
				}

				_$_.pop(div_1);
				return_guard = true;
				_$_.append(__anchor, fragment_10);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_11 = root_11();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_11);
			}
		);

		_$_.append(__anchor, fragment_9);
	});
}

export function AsyncMultipleValues() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_12 = root_12();
		var node_4 = _$_.first_child_frag(fragment_12);

		_$_.try(
			node_4,
			(__anchor) => {
				var return_guard = false;
				let lazy_5 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('alpha')), __block, 'ab8199a0');
				let lazy_6 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('beta')), __block, 'fb7ad40b');
				var fragment_13 = root_13();
				var div_2 = _$_.first_child_frag(fragment_13);

				{
					var span_4 = _$_.child(div_2);

					{
						var expression_5 = _$_.child(span_4);

						_$_.expression(expression_5, () => lazy_5.value);
						_$_.pop(span_4);
					}

					var span_5 = _$_.sibling(span_4);

					{
						var expression_6 = _$_.child(span_5);

						_$_.expression(expression_6, () => lazy_6.value);
						_$_.pop(span_5);
					}
				}

				_$_.pop(div_2);
				return_guard = true;
				_$_.append(__anchor, fragment_13);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_14 = root_14();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_14);
			}
		);

		_$_.append(__anchor, fragment_12);
	});
}

export function AsyncWithCatch() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_15 = root_15();
		var node_5 = _$_.first_child_frag(fragment_15);

		_$_.try(
			node_5,
			(__anchor) => {
				var return_guard = false;
				let lazy_7 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('fetch failed'))), __block, '99982de5');
				var fragment_16 = root_16();
				var p_3 = _$_.first_child_frag(fragment_16);

				{
					var expression_7 = _$_.child(p_3);

					_$_.expression(expression_7, () => lazy_7.value);
					_$_.pop(p_3);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_16);
			},
			(__anchor, e) => {
				var return_guard_1 = false;
				var fragment_17 = root_17();
				var p_4 = _$_.first_child_frag(fragment_17);

				{
					var expression_8 = _$_.child(p_4);

					_$_.expression(expression_8, () => e.message);
					_$_.pop(p_4);
				}

				return_guard_1 = true;
				_$_.append(__anchor, fragment_17);
			},
			(__anchor) => {
				var return_guard_2 = false;
				var fragment_18 = root_18();

				return_guard_2 = true;
				_$_.append(__anchor, fragment_18);
			}
		);

		_$_.append(__anchor, fragment_15);
	});
}

export function ChildWithError() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_19 = root_19();
		var node_6 = _$_.first_child_frag(fragment_19);

		_$_.try(
			node_6,
			(__anchor) => {
				var return_guard = false;
				let lazy_8 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('child error'))), __block, '1dea4c85');
				var fragment_20 = root_20();
				var p_5 = _$_.first_child_frag(fragment_20);

				{
					var expression_9 = _$_.child(p_5);

					_$_.expression(expression_9, () => lazy_8.value);
					_$_.pop(p_5);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_20);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_21 = root_21();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_21);
			}
		);

		_$_.append(__anchor, fragment_19);
	});
}

export function ParentWithCatch() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_22 = root_22();
		var node_7 = _$_.first_child_frag(fragment_22);

		_$_.try(
			node_7,
			(__anchor) => {
				var return_guard = false;
				var fragment_23 = root_23();
				var node_8 = _$_.first_child_frag(fragment_23);

				_$_.render_component(ChildWithError, node_8, {});
				return_guard = true;
				_$_.append(__anchor, fragment_23);
			},
			(__anchor, e) => {
				var return_guard_1 = false;
				var fragment_24 = root_24();
				var p_6 = _$_.first_child_frag(fragment_24);

				{
					var expression_10 = _$_.child(p_6);

					_$_.expression(expression_10, () => e.message);
					_$_.pop(p_6);
				}

				return_guard_1 = true;
				_$_.append(__anchor, fragment_24);
			}
		);

		_$_.append(__anchor, fragment_22);
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_9 = _$_.track(0, __block, 'c9d12acf');
		var fragment_25 = root_25();
		var button_2 = _$_.first_child_frag(fragment_25);

		button_2.__click = () => {
			_$_.update(lazy_9);
		};

		var node_9 = _$_.sibling(button_2);

		_$_.try(
			node_9,
			(__anchor) => {
				var return_guard = false;
				let lazy_10 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(`count-${lazy_9.value}`)), __block, 'cdd1adb8');
				var fragment_26 = root_26();
				var p_7 = _$_.first_child_frag(fragment_26);

				{
					var expression_11 = _$_.child(p_7);

					_$_.expression(expression_11, () => lazy_10.value);
					_$_.pop(p_7);
				}

				return_guard = true;
				_$_.append(__anchor, fragment_26);
			},
			null,
			(__anchor) => {
				var return_guard_1 = false;
				var fragment_27 = root_27();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_27);
			}
		);

		_$_.append(__anchor, fragment_25);
	});
}

_$_.delegate(['click']);