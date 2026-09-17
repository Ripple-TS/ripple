// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('p', ['class', 'result'], ' ');

function MoneyResult_render(__anchor, __block, { count }) {
	const money = _$_.track_async(() => _$_.with_scope(__block, () => doubleMoney(new Money(count.value, 'USD'))), __block, 'csssmh');
	var p = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

		_$_.expression(expression, () => _$_.with_scope(__block, () => money.value.format()));
		_$_.hydrating && _$_.pop(p);
	}

	_$_.append(__anchor, p);
}

MoneyResult[_$_.$r] = MoneyResult_render;

var root_3 = _$_.template_el('p', ['class', 'loading'], 'loading...');
var root_2 = _$_.template(`<button class=increment>increment</button><!>`, 1, 2);
var root_1 = _$_.template(`<!>`, 1, 1);

function AsyncCustomType_render(__anchor, __block) {
	const count = _$_.track(6, __block, '1usw1lq');
	var fragment = root_1();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_2();
		var button = _$_.first_child_frag(fragment_1);

		button.__click = () => {
			count.value++;
		};

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.try(
			node,
			(__anchor) => {
				_$_.render_component(MoneyResult, __anchor, { count });
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

AsyncCustomType[_$_.$r] = AsyncCustomType_render;

var root_4 = _$_.template_el('p', ['class', 'result'], ' ');

function ServerCallResult_render(__anchor, __block, { count }) {
	const data = _$_.track_async(() => _$_.with_scope(__block, () => formatValue(count.value)), __block, 'lq8y0o');
	var p_2 = root_4();

	{
		var expression_1 = _$_.hydrating ? _$_.hydrate_child() : p_2.firstChild;

		_$_.expression(expression_1, () => data.value);
		_$_.hydrating && _$_.pop(p_2);
	}

	_$_.append(__anchor, p_2);
}

ServerCallResult[_$_.$r] = ServerCallResult_render;

var root_7 = _$_.template_el('p', ['class', 'loading'], 'loading...');
var root_6 = _$_.template(`<button class=increment>increment</button><!>`, 1, 2);
var root_5 = _$_.template(`<!>`, 1, 1);

function AsyncWithServerCall_render(__anchor, __block) {
	const count = _$_.track(0, __block, '5p4g2c');
	var fragment_2 = root_5();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_6();
		var button_1 = _$_.first_child_frag(fragment_3);

		button_1.__click = () => {
			count.value++;
		};

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		_$_.try(
			node_2,
			(__anchor) => {
				_$_.render_component(ServerCallResult, __anchor, { count });
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

AsyncWithServerCall[_$_.$r] = AsyncWithServerCall_render;

var root_8 = _$_.template_el('p', ['class', 'result'], ' ');
var root_9 = _$_.template_el('p', ['class', 'loading'], 'loading...');

function AsyncSimpleValue_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const data = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('hydrated value')), __block, '1vgpoju');
			var p_4 = root_8();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_child() : p_4.firstChild;

				_$_.expression(expression_2, () => data.value);
				_$_.hydrating && _$_.pop(p_4);
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

AsyncSimpleValue[_$_.$r] = AsyncSimpleValue_render;

var root_10 = _$_.template_el('span', ['class', 'count'], ' ');
var root_11 = _$_.template_el('span', ['class', 'pending'], '...');

function AsyncNumericValue_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const count = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(42)), __block, '1bl4m1s');
			var span = root_10();

			{
				var expression_3 = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

				_$_.expression(expression_3, () => count.value);
				_$_.hydrating && _$_.pop(span);
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

AsyncNumericValue[_$_.$r] = AsyncNumericValue_render;

var root_12 = _$_.template(`<div class=user><span class=name> </span><span class=age> `);
var root_13 = _$_.template_el('div', ['class', 'loading'], 'loading user...');

function AsyncObjectValue_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const user = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve({ name: 'Alice', age: 30 })), __block, '1xrym8b');
			var div = root_12();

			{
				var span_2 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

				{
					var expression_4 = _$_.hydrating ? _$_.hydrate_child() : span_2.firstChild;

					_$_.expression(expression_4, () => user.value.name);
					_$_.hydrating && _$_.pop(span_2);
				}

				var span_3 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;

				{
					var expression_5 = _$_.hydrating ? _$_.hydrate_child() : span_3.firstChild;

					_$_.expression(expression_5, () => user.value.age);
					_$_.hydrating && _$_.pop(span_3);
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

AsyncObjectValue[_$_.$r] = AsyncObjectValue_render;

var root_14 = _$_.template(`<div class=multi><span class=first> </span><span class=second> `);
var root_15 = _$_.template_el('div', ['class', 'loading'], 'loading...');

function AsyncMultipleValues_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const first = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('alpha')), __block, '16m7mxx');
			const second = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('beta')), __block, '8atc3p');
			var div_2 = root_14();

			{
				var span_4 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

				{
					var expression_6 = _$_.hydrating ? _$_.hydrate_child() : span_4.firstChild;

					_$_.expression(expression_6, () => first.value);
					_$_.hydrating && _$_.pop(span_4);
				}

				var span_5 = _$_.hydrating ? _$_.hydrate_sibling() : span_4.nextSibling;

				{
					var expression_7 = _$_.hydrating ? _$_.hydrate_child() : span_5.firstChild;

					_$_.expression(expression_7, () => second.value);
					_$_.hydrating && _$_.pop(span_5);
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

AsyncMultipleValues[_$_.$r] = AsyncMultipleValues_render;

var root_16 = _$_.template_el('p', ['class', 'result'], ' ');
var root_17 = _$_.template_el('p', ['class', 'error'], ' ');
var root_18 = _$_.template_el('p', ['class', 'loading'], 'loading...');

function AsyncWithCatch_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const data = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('fetch failed'))), __block, '1jzw72n');
			var p_6 = root_16();

			{
				var expression_8 = _$_.hydrating ? _$_.hydrate_child() : p_6.firstChild;

				_$_.expression(expression_8, () => data.value);
				_$_.hydrating && _$_.pop(p_6);
			}

			_$_.append(__anchor, p_6);
		},
		(__anchor, e) => {
			var p_7 = root_17();

			{
				var expression_9 = _$_.hydrating ? _$_.hydrate_child() : p_7.firstChild;

				_$_.expression(expression_9, () => e.message);
				_$_.hydrating && _$_.pop(p_7);
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

AsyncWithCatch[_$_.$r] = AsyncWithCatch_render;

var root_19 = _$_.template_el('p', ['class', 'result'], ' ');
var root_20 = _$_.template_el('p', ['class', 'pending'], 'loading...');

function ChildWithError_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const data = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('child error'))), __block, '1l3vago');
			var p_9 = root_19();

			{
				var expression_10 = _$_.hydrating ? _$_.hydrate_child() : p_9.firstChild;

				_$_.expression(expression_10, () => data.value);
				_$_.hydrating && _$_.pop(p_9);
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

ChildWithError[_$_.$r] = ChildWithError_render;

var root_21 = _$_.template_el('p', ['class', 'parent-error'], ' ');

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
				_$_.hydrating && _$_.pop(p_11);
			}

			_$_.append(__anchor, p_11);
		},
		null,
		true
	);
}

ParentWithCatch[_$_.$r] = ParentWithCatch_render;

var root_22 = _$_.template_el('p', ['class', 'result'], ' ');

function ReactiveDependencyResult_render(__anchor, __block, { count }) {
	const data = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(`count-${count.value}`)), __block, '6vdwe2');
	var p_12 = root_22();

	{
		var expression_12 = _$_.hydrating ? _$_.hydrate_child() : p_12.firstChild;

		_$_.expression(expression_12, () => data.value);
		_$_.hydrating && _$_.pop(p_12);
	}

	_$_.append(__anchor, p_12);
}

ReactiveDependencyResult[_$_.$r] = ReactiveDependencyResult_render;

var root_25 = _$_.template_el('p', ['class', 'loading'], 'loading...');
var root_24 = _$_.template(`<button class=increment>increment</button><!>`, 1, 2);
var root_23 = _$_.template(`<!>`, 1, 1);

function AsyncWithReactiveDependency_render(__anchor, __block) {
	const count = _$_.track(0, __block, '1nc7lqr');
	var fragment_4 = root_23();
	var node_5 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_24();
		var button_2 = _$_.first_child_frag(fragment_5);

		button_2.__click = () => {
			count.value++;
		};

		var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

		_$_.try(
			node_4,
			(__anchor) => {
				_$_.render_component(ReactiveDependencyResult, __anchor, { count });
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

AsyncWithReactiveDependency[_$_.$r] = AsyncWithReactiveDependency_render;

var root_28 = _$_.template_el('p', ['class', 'loading'], 'loading...');
var root_27 = _$_.template(`<button class=increment>increment</button><!>`, 1, 2);
var root_26 = _$_.template(`<!>`, 1, 1);

function AsyncWithReadOnlyDependency_render(__anchor, __block) {
	const count = _$_.track(0, __block, 'wnak4k');
	var fragment_6 = root_26();
	var node_7 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_27();
		var button_3 = _$_.first_child_frag(fragment_7);

		button_3.__click = () => {
			count.value++;
		};

		var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;

		_$_.try(
			node_6,
			(__anchor) => {
				_$_.render_component(ReactiveDependencyResult, __anchor, { count: _$_.track_read_only(count, __block) });
			},
			null,
			(__anchor) => {
				var p_14 = root_28();

				_$_.append(__anchor, p_14);
			}
		);

		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

AsyncWithReadOnlyDependency[_$_.$r] = AsyncWithReadOnlyDependency_render;

import { track, trackAsync, trackReadOnly } from 'ripple';
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

function MoneyResult(__props) {
	return _$_.tsrx_element(MoneyResult_render, __props);
}

export function AsyncCustomType() {
	return _$_.tsrx_element(AsyncCustomType_render);
}

function ServerCallResult(__props) {
	return _$_.tsrx_element(ServerCallResult_render, __props);
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

function ReactiveDependencyResult(__props) {
	return _$_.tsrx_element(ReactiveDependencyResult_render, __props);
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element(AsyncWithReactiveDependency_render);
}

export function AsyncWithReadOnlyDependency() {
	return _$_.tsrx_element(AsyncWithReadOnlyDependency_render);
}

_$_.delegate(['click']);