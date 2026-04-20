// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<p class="result"> </p>`, 0);
var root_2 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root = _$_.template(`<!>`, 1, 1);
var root_4 = _$_.template(`<span class="count"> </span>`, 0);
var root_5 = _$_.template(`<span class="pending">...</span>`, 0);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<div class="user"><span class="name"> </span><span class="age"> </span></div>`, 0);
var root_8 = _$_.template(`<div class="loading">loading user...</div>`, 0);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_10 = _$_.template(`<div class="multi"><span class="first"> </span><span class="second"> </span></div>`, 0);
var root_11 = _$_.template(`<div class="loading">loading...</div>`, 0);
var root_9 = _$_.template(`<!>`, 1, 1);

import { trackAsync } from 'ripple';

export function AsyncSimpleValue(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.try(
		node,
		(__anchor) => {
			let lazy = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('hydrated value')), __block, '726bba99');
			var p_1 = root_1();

			{
				var expression = _$_.child(p_1, true);

				_$_.expression(expression, () => _$_.get(lazy));
				_$_.pop(p_1);
			}

			_$_.append(__anchor, p_1);
		},
		null,
		(__anchor) => {
			var p_2 = root_2();

			_$_.append(__anchor, p_2);
		}
	);

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function AsyncNumericValue(__anchor, _, __block) {
	_$_.push_component();

	var fragment_1 = root_3();
	var node_1 = _$_.first_child_frag(fragment_1);

	_$_.try(
		node_1,
		(__anchor) => {
			let lazy_1 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(42)), __block, '726bba99');
			var span_1 = root_4();

			{
				var expression_1 = _$_.child(span_1, true);

				_$_.expression(expression_1, () => _$_.get(lazy_1));
				_$_.pop(span_1);
			}

			_$_.append(__anchor, span_1);
		},
		null,
		(__anchor) => {
			var span_2 = root_5();

			_$_.append(__anchor, span_2);
		}
	);

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function AsyncObjectValue(__anchor, _, __block) {
	_$_.push_component();

	var fragment_2 = root_6();
	var node_2 = _$_.first_child_frag(fragment_2);

	_$_.try(
		node_2,
		(__anchor) => {
			let lazy_2 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve({ name: 'Alice', age: 30 })), __block, '726bba99');
			var div_1 = root_7();

			{
				var span_3 = _$_.child(div_1);

				{
					var expression_2 = _$_.child(span_3, true);

					_$_.expression(expression_2, () => _$_.get(lazy_2).name);
					_$_.pop(span_3);
				}

				var span_4 = _$_.sibling(span_3);

				{
					var expression_3 = _$_.child(span_4, true);

					_$_.expression(expression_3, () => _$_.get(lazy_2).age);
					_$_.pop(span_4);
				}
			}

			_$_.append(__anchor, div_1);
		},
		null,
		(__anchor) => {
			var div_2 = root_8();

			_$_.append(__anchor, div_2);
		}
	);

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function AsyncMultipleValues(__anchor, _, __block) {
	_$_.push_component();

	var fragment_3 = root_9();
	var node_3 = _$_.first_child_frag(fragment_3);

	_$_.try(
		node_3,
		(__anchor) => {
			let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('alpha')), __block, '726bba99');
			let lazy_4 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('beta')), __block, 'd2783ee4');
			var div_3 = root_10();

			{
				var span_5 = _$_.child(div_3);

				{
					var expression_4 = _$_.child(span_5, true);

					_$_.expression(expression_4, () => _$_.get(lazy_3));
					_$_.pop(span_5);
				}

				var span_6 = _$_.sibling(span_5);

				{
					var expression_5 = _$_.child(span_6, true);

					_$_.expression(expression_5, () => _$_.get(lazy_4));
					_$_.pop(span_6);
				}
			}

			_$_.append(__anchor, div_3);
		},
		null,
		(__anchor) => {
			var div_4 = root_11();

			_$_.append(__anchor, div_4);
		}
	);

	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}