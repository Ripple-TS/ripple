// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<p class="result"> </p>`, 0);
var root_3 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_2 = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);
var root_1 = _$_.template(`<!>`, 1, 1);

function AsyncCustomType_render(__anchor, __block) {
	let lazy_1 = _$_.track(6, __block, 'f0c2b41e');
	var fragment = root_1();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_2();
		var button = _$_.first_child_frag(fragment_1);

		button.__click = () => {
			_$_.update(lazy_1);
		};

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.try(
			node,
			(__anchor) => {
				_$_.render_component(MoneyResult, __anchor, { count: lazy_1 });
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
}

var root_4 = _$_.template(`<p class="result"> </p>`, 0);
var root_7 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_6 = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);
var root_5 = _$_.template(`<!>`, 1, 1);

function AsyncWithServerCall_render(__anchor, __block) {
	let lazy_3 = _$_.track(0, __block, '14891754');
	var fragment_2 = root_5();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_6();
		var button_1 = _$_.first_child_frag(fragment_3);

		button_1.__click = () => {
			_$_.update(lazy_3);
		};

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		_$_.try(
			node_2,
			(__anchor) => {
				_$_.render_component(ServerCallResult, __anchor, { count: lazy_3 });
			},
			null,
			(__anchor) => {
				var p_3 = root_7();

				_$_.append(__anchor, p_3);
			}
		);

		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

var root_8 = _$_.template(`<p class="result"> </p>`, 0);
var root_9 = _$_.template(`<p class="loading">loading...</p>`, 0);

function AsyncSimpleValue_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			let lazy_4 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('hydrated value')), __block, 'f325448a');
			var p_4 = root_8();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_child() : p_4.firstChild;

				_$_.expression(expression_2, () => lazy_4.value);
				_$_.pop(p_4);
			}

			_$_.append(__anchor, p_4);
		},
		null,
		(__anchor) => {
			var p_5 = root_9();

			_$_.append(__anchor, p_5);
		},
		true
	);
}

var root_10 = _$_.template(`<span class="count"> </span>`, 0);
var root_11 = _$_.template(`<span class="pending">...</span>`, 0);

function AsyncNumericValue_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			let lazy_5 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(42)), __block, 'ab8199a0');
			var span = root_10();

			{
				var expression_3 = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

				_$_.expression(expression_3, () => lazy_5.value);
				_$_.pop(span);
			}

			_$_.append(__anchor, span);
		},
		null,
		(__anchor) => {
			var span_1 = root_11();

			_$_.append(__anchor, span_1);
		},
		true
	);
}

var root_12 = _$_.template(`<div class="user"><span class="name"> </span><span class="age"> </span></div>`, 0);
var root_13 = _$_.template(`<div class="loading">loading user...</div>`, 0);

function AsyncObjectValue_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			let lazy_6 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve({ name: 'Alice', age: 30 })), __block, 'fb7ad40b');
			var div = root_12();

			{
				var span_2 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

				{
					var expression_4 = _$_.hydrating ? _$_.hydrate_child() : span_2.firstChild;

					_$_.expression(expression_4, () => lazy_6.value.name);
					_$_.pop(span_2);
				}

				var span_3 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;

				{
					var expression_5 = _$_.hydrating ? _$_.hydrate_child() : span_3.firstChild;

					_$_.expression(expression_5, () => lazy_6.value.age);
					_$_.pop(span_3);
				}
			}

			_$_.append(__anchor, div);
		},
		null,
		(__anchor) => {
			var div_1 = root_13();

			_$_.append(__anchor, div_1);
		},
		true
	);
}

var root_14 = _$_.template(`<div class="multi"><span class="first"> </span><span class="second"> </span></div>`, 0);
var root_15 = _$_.template(`<div class="loading">loading...</div>`, 0);

function AsyncMultipleValues_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			let lazy_7 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('alpha')), __block, '99982de5');
			let lazy_8 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('beta')), __block, '1dea4c85');
			var div_2 = root_14();

			{
				var span_4 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

				{
					var expression_6 = _$_.hydrating ? _$_.hydrate_child() : span_4.firstChild;

					_$_.expression(expression_6, () => lazy_7.value);
					_$_.pop(span_4);
				}

				var span_5 = _$_.hydrating ? _$_.hydrate_sibling() : span_4.nextSibling;

				{
					var expression_7 = _$_.hydrating ? _$_.hydrate_child() : span_5.firstChild;

					_$_.expression(expression_7, () => lazy_8.value);
					_$_.pop(span_5);
				}
			}

			_$_.append(__anchor, div_2);
		},
		null,
		(__anchor) => {
			var div_3 = root_15();

			_$_.append(__anchor, div_3);
		},
		true
	);
}

var root_16 = _$_.template(`<p class="result"> </p>`, 0);
var root_17 = _$_.template(`<p class="error"> </p>`, 0);
var root_18 = _$_.template(`<p class="loading">loading...</p>`, 0);

function AsyncWithCatch_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			let lazy_9 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('fetch failed'))), __block, 'c9d12acf');
			var p_6 = root_16();

			{
				var expression_8 = _$_.hydrating ? _$_.hydrate_child() : p_6.firstChild;

				_$_.expression(expression_8, () => lazy_9.value);
				_$_.pop(p_6);
			}

			_$_.append(__anchor, p_6);
		},
		(__anchor, e) => {
			var p_7 = root_17();

			{
				var expression_9 = _$_.hydrating ? _$_.hydrate_child() : p_7.firstChild;

				_$_.expression(expression_9, () => e.message);
				_$_.pop(p_7);
			}

			_$_.append(__anchor, p_7);
		},
		(__anchor) => {
			var p_8 = root_18();

			_$_.append(__anchor, p_8);
		},
		true
	);
}

var root_19 = _$_.template(`<p class="result"> </p>`, 0);
var root_20 = _$_.template(`<p class="pending">loading...</p>`, 0);

function ChildWithError_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			let lazy_10 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('child error'))), __block, 'cdd1adb8');
			var p_9 = root_19();

			{
				var expression_10 = _$_.hydrating ? _$_.hydrate_child() : p_9.firstChild;

				_$_.expression(expression_10, () => lazy_10.value);
				_$_.pop(p_9);
			}

			_$_.append(__anchor, p_9);
		},
		null,
		(__anchor) => {
			var p_10 = root_20();

			_$_.append(__anchor, p_10);
		},
		true
	);
}

var root_21 = _$_.template(`<p class="parent-error"> </p>`, 0);

function ParentWithCatch_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			_$_.render_component(ChildWithError, __anchor, {});
		},
		(__anchor, e) => {
			var p_11 = root_21();

			{
				var expression_11 = _$_.hydrating ? _$_.hydrate_child() : p_11.firstChild;

				_$_.expression(expression_11, () => e.message);
				_$_.pop(p_11);
			}

			_$_.append(__anchor, p_11);
		},
		null,
		true
	);
}

var root_22 = _$_.template(`<p class="result"> </p>`, 0);
var root_25 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_24 = _$_.template(`<button class="increment">increment</button><!>`, 1, 2);
var root_23 = _$_.template(`<!>`, 1, 1);

function AsyncWithReactiveDependency_render(__anchor, __block) {
	let lazy_12 = _$_.track(0, __block, 'd5dcc1d3');
	var fragment_4 = root_23();
	var node_5 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_24();
		var button_2 = _$_.first_child_frag(fragment_5);

		button_2.__click = () => {
			_$_.update(lazy_12);
		};

		var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

		_$_.try(
			node_4,
			(__anchor) => {
				_$_.render_component(ReactiveDependencyResult, __anchor, { count: lazy_12 });
			},
			null,
			(__anchor) => {
				var p_13 = root_25();

				_$_.append(__anchor, p_13);
			}
		);

		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

import { track, trackAsync } from 'ripple';
import { Money } from '../fixtures/money.js';

export const transport = {
	Money: {
		encode: (value) => value instanceof Money && [value.amount, value.currency],
		decode: ([amount, currency]) => new Money(amount, currency)
	}
};

const doubleMoney = function (...args) {
	return _$_.rpc('4a0a0675', args);
};

const formatValue = function (...args) {
	return _$_.rpc('1215faad', args);
};

function MoneyResult({ count }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track_async(() => _$_.with_scope(__block, () => doubleMoney(new Money(count.value, 'USD'))), __block, '2e21cbe9');
		var p = root();

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

			_$_.expression(expression, () => _$_.with_scope(__block, () => lazy.value.format()));
			_$_.pop(p);
		}

		_$_.append(__anchor, p);
	});
}

export function AsyncCustomType() {
	return _$_.tsrx_element(AsyncCustomType_render);
}

function ServerCallResult({ count }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track_async(() => _$_.with_scope(__block, () => formatValue(count.value)), __block, '4e502c38');
		var p_2 = root_4();

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : p_2.firstChild;

			_$_.expression(expression_1, () => lazy_2.value);
			_$_.pop(p_2);
		}

		_$_.append(__anchor, p_2);
	});
}

export function AsyncWithServerCall() {
	return _$_.tsrx_element(AsyncWithServerCall_render);
}

export function AsyncSimpleValue() {
	return _$_.tsrx_element(AsyncSimpleValue_render);
}

export function AsyncNumericValue() {
	return _$_.tsrx_element(AsyncNumericValue_render);
}

export function AsyncObjectValue() {
	return _$_.tsrx_element(AsyncObjectValue_render);
}

export function AsyncMultipleValues() {
	return _$_.tsrx_element(AsyncMultipleValues_render);
}

export function AsyncWithCatch() {
	return _$_.tsrx_element(AsyncWithCatch_render);
}

export function ChildWithError() {
	return _$_.tsrx_element(ChildWithError_render);
}

export function ParentWithCatch() {
	return _$_.tsrx_element(ParentWithCatch_render);
}

function ReactiveDependencyResult({ count }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_11 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(`count-${count.value}`)), __block, '18c43c3a');
		var p_12 = root_22();

		{
			var expression_12 = _$_.hydrating ? _$_.hydrate_child() : p_12.firstChild;

			_$_.expression(expression_12, () => lazy_11.value);
			_$_.pop(p_12);
		}

		_$_.append(__anchor, p_12);
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element(AsyncWithReactiveDependency_render);
}

_$_.delegate(['click']);