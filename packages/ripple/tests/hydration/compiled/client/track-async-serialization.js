// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<p class="result"> </p>`, 0);
var root_3 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_2 = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);
var root_1 = _$_.template(`<!>`, 1, 1);
var root_4 = _$_.template(`<p class="result"> </p>`, 0);
var root_5 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_6 = _$_.template(`<span class="count"> </span>`, 0);
var root_7 = _$_.template(`<span class="pending">...</span>`, 0);
var root_8 = _$_.template(`<div class="user"><span class="name"> </span><span class="age"> </span></div>`, 0);
var root_9 = _$_.template(`<div class="loading">loading user...</div>`, 0);
var root_10 = _$_.template(`<div class="multi"><span class="first"> </span><span class="second"> </span></div>`, 0);
var root_11 = _$_.template(`<div class="loading">loading...</div>`, 0);
var root_12 = _$_.template(`<p class="result"> </p>`, 0);
var root_13 = _$_.template(`<p class="error"> </p>`, 0);
var root_14 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_15 = _$_.template(`<p class="result"> </p>`, 0);
var root_16 = _$_.template(`<p class="pending">loading...</p>`, 0);
var root_17 = _$_.template(`<p class="parent-error"> </p>`, 0);
var root_18 = _$_.template(`<p class="result"> </p>`, 0);
var root_21 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_20 = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);
var root_19 = _$_.template(`<!>`, 1, 1);

import { track, trackAsync } from 'ripple';

const formatValue = function (...args) {
	return _$_.rpc('1215faad', args);
};

function ServerCallResult({ count }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track_async(() => _$_.with_scope(__block, () => formatValue(count.value)), __block, '2e21cbe9');
		var p = root();

		{
			var expression = _$_.child(p);

			_$_.expression(expression, () => lazy.value);
			_$_.pop(p);
		}

		_$_.append(__anchor, p);
	});
}

export function AsyncWithServerCall() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(0, __block, 'f0c2b41e');
		var fragment = root_1();
		var node_1 = _$_.first_child_frag(fragment);

		_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_2();
			var button = _$_.first_child_frag(fragment_1);

			button.__click = () => {
				_$_.update(lazy_1);
			};

			var node = _$_.sibling(button);

			_$_.try(
				node,
				(__anchor) => {
					_$_.render_component(ServerCallResult, __anchor, {
						get count() {
							return lazy_1;
						}
					});
				},
				null,
				(__anchor) => {
					var p_1 = root_3();

					_$_.append(__anchor, p_1);
				}
			);

			_$_.append(__anchor, fragment_1);
		}));

		_$_.append(__anchor, fragment);
	});
}

export function AsyncSimpleValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				let lazy_2 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('hydrated value')), __block, '4e502c38');
				var p_2 = root_4();

				{
					var expression_1 = _$_.child(p_2);

					_$_.expression(expression_1, () => lazy_2.value);
					_$_.pop(p_2);
				}

				_$_.append(__anchor, p_2);
			},
			null,
			(__anchor) => {
				var p_3 = root_5();

				_$_.append(__anchor, p_3);
			},
			true
		);
	});
}

export function AsyncNumericValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(42)), __block, '14891754');
				var span = root_6();

				{
					var expression_2 = _$_.child(span);

					_$_.expression(expression_2, () => lazy_3.value);
					_$_.pop(span);
				}

				_$_.append(__anchor, span);
			},
			null,
			(__anchor) => {
				var span_1 = root_7();

				_$_.append(__anchor, span_1);
			},
			true
		);
	});
}

export function AsyncObjectValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				let lazy_4 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve({ name: 'Alice', age: 30 })), __block, 'f325448a');
				var div = root_8();

				{
					var span_2 = _$_.child(div);

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

				_$_.append(__anchor, div);
			},
			null,
			(__anchor) => {
				var div_1 = root_9();

				_$_.append(__anchor, div_1);
			},
			true
		);
	});
}

export function AsyncMultipleValues() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				let lazy_5 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('alpha')), __block, 'ab8199a0');
				let lazy_6 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('beta')), __block, 'fb7ad40b');
				var div_2 = root_10();

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

				_$_.append(__anchor, div_2);
			},
			null,
			(__anchor) => {
				var div_3 = root_11();

				_$_.append(__anchor, div_3);
			},
			true
		);
	});
}

export function AsyncWithCatch() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				let lazy_7 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('fetch failed'))), __block, '99982de5');
				var p_4 = root_12();

				{
					var expression_7 = _$_.child(p_4);

					_$_.expression(expression_7, () => lazy_7.value);
					_$_.pop(p_4);
				}

				_$_.append(__anchor, p_4);
			},
			(__anchor, e) => {
				var p_5 = root_13();

				{
					var expression_8 = _$_.child(p_5);

					_$_.expression(expression_8, () => e.message);
					_$_.pop(p_5);
				}

				_$_.append(__anchor, p_5);
			},
			(__anchor) => {
				var p_6 = root_14();

				_$_.append(__anchor, p_6);
			},
			true
		);
	});
}

export function ChildWithError() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				let lazy_8 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('child error'))), __block, '1dea4c85');
				var p_7 = root_15();

				{
					var expression_9 = _$_.child(p_7);

					_$_.expression(expression_9, () => lazy_8.value);
					_$_.pop(p_7);
				}

				_$_.append(__anchor, p_7);
			},
			null,
			(__anchor) => {
				var p_8 = root_16();

				_$_.append(__anchor, p_8);
			},
			true
		);
	});
}

export function ParentWithCatch() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				_$_.render_component(ChildWithError, __anchor, {});
			},
			(__anchor, e) => {
				var p_9 = root_17();

				{
					var expression_10 = _$_.child(p_9);

					_$_.expression(expression_10, () => e.message);
					_$_.pop(p_9);
				}

				_$_.append(__anchor, p_9);
			},
			null,
			true
		);
	});
}

function ReactiveDependencyResult({ count }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_9 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(`count-${count.value}`)), __block, 'c9d12acf');
		var p_10 = root_18();

		{
			var expression_11 = _$_.child(p_10);

			_$_.expression(expression_11, () => lazy_9.value);
			_$_.pop(p_10);
		}

		_$_.append(__anchor, p_10);
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_10 = _$_.track(0, __block, 'cdd1adb8');
		var fragment_2 = root_19();
		var node_3 = _$_.first_child_frag(fragment_2);

		_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_3 = root_20();
			var button_1 = _$_.first_child_frag(fragment_3);

			button_1.__click = () => {
				_$_.update(lazy_10);
			};

			var node_2 = _$_.sibling(button_1);

			_$_.try(
				node_2,
				(__anchor) => {
					_$_.render_component(ReactiveDependencyResult, __anchor, {
						get count() {
							return lazy_10;
						}
					});
				},
				null,
				(__anchor) => {
					var p_11 = root_21();

					_$_.append(__anchor, p_11);
				}
			);

			_$_.append(__anchor, fragment_3);
		}));

		_$_.append(__anchor, fragment_2);
	});
}

_$_.delegate(['click']);