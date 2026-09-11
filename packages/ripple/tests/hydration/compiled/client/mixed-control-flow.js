// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div> </div>`, 0);

function render(__prev) {
	var __pattern = _$_.get(__prev._pattern);
	var __a = `A-${__pattern.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression, __prev.a = __a);
	}

	var __b = `row row-${__pattern.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._div, __prev.b = __b, void 0, true);
	}
}

var root_2 = _$_.template(`<div>pending a</div>`, 0);

function render_1(__prev) {
	var __a = `pending pending-${_$_.get(__prev._pattern).id}`;

	if (__prev.a !== __a) {
		_$_.set_class(__prev._div_1, __prev.a = __a, void 0, true);
	}
}

var root_3 = _$_.template(`<div> </div>`, 0);

function render_2(__prev) {
	var __pattern_1 = _$_.get(__prev._pattern);
	var __a = `B-${__pattern_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_1, __prev.a = __a);
	}

	var __b = `row row-${__pattern_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._div_2, __prev.b = __b, void 0, true);
	}
}

var root_4 = _$_.template(`<div>pending b</div>`, 0);

function render_3(__prev) {
	var __a = `pending pending-${_$_.get(__prev._pattern).id}`;

	if (__prev.a !== __a) {
		_$_.set_class(__prev._div_3, __prev.a = __a, void 0, true);
	}
}

function switch_case_0(__anchor, pattern) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var div = root_1();

			{
				var expression = _$_.hydrating ? _$_.hydrate_text() : div.firstChild;
			}

			_$_.render(render, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern: pattern,
				_expression: expression,
				_div: div
			});

			_$_.append(__anchor, div);
		},
		null,
		(__anchor) => {
			var div_1 = root_2();

			_$_.render(render_1, { a: _$_.UNINITIALIZED, _pattern: pattern, _div_1: div_1 });
			_$_.append(__anchor, div_1);
		},
		true
	);
}

function switch_case_default(__anchor, pattern) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var div_2 = root_3();

			{
				var expression_1 = _$_.hydrating ? _$_.hydrate_text() : div_2.firstChild;
			}

			_$_.render(render_2, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern: pattern,
				_expression_1: expression_1,
				_div_2: div_2
			});

			_$_.append(__anchor, div_2);
		},
		null,
		(__anchor) => {
			var div_3 = root_4();

			_$_.render(render_3, { a: _$_.UNINITIALIZED, _pattern: pattern, _div_3: div_3 });
			_$_.append(__anchor, div_3);
		},
		true
	);
}

function switch_1(pattern) {
	switch (_$_.get(pattern).kind) {
		case 'a':
			return switch_case_0;

		default:
			return switch_case_default;
	}
}

function consequent(__anchor, pattern) {
	_$_.switch(__anchor, switch_1, true, pattern);
}

function if_1(pattern) {
	if (_$_.get(pattern).enabled) return consequent;
}

var root = _$_.template(`<section class="mixed-static"></section>`, 0);

function MixedControlFlowStatic_render(__anchor, __block) {
	const rows = [
		{ id: 1, kind: 'a', enabled: true },
		{ id: 2, kind: 'b', enabled: true },
		{ id: 3, kind: 'a', enabled: false }
	];

	var section = root();

	{
		_$_.for_keyed(
			section,
			() => rows,
			(__anchor, pattern) => {
				_$_.if(__anchor, if_1, true, pattern);
			},
			4,
			(pattern) => _$_.get(pattern).id
		);

		_$_.hydrating && _$_.pop(section);
	}

	_$_.append(__anchor, section);
}

MixedControlFlowStatic[_$_.$r] = MixedControlFlowStatic_render;

var root_8 = _$_.template(`<p> </p>`, 0);

function render_4(__prev) {
	var __pattern_1_1 = _$_.get(__prev._pattern_1);
	var __a = `A:${__pattern_1_1.label}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_2, __prev.a = __a);
	}

	var __b = `item item-${__pattern_1_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._p, __prev.b = __b, void 0, true);
	}
}

var root_9 = _$_.template(`<p class="pending">pending a</p>`, 0);
var root_10 = _$_.template(`<p> </p>`, 0);

function render_5(__prev) {
	var __pattern_1_2 = _$_.get(__prev._pattern_1);
	var __a = `B:${__pattern_1_2.label}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_3, __prev.a = __a);
	}

	var __b = `item item-${__pattern_1_2.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._p_2, __prev.b = __b, void 0, true);
	}
}

var root_11 = _$_.template(`<p class="pending">pending b</p>`, 0);

function switch_case_0_1(__anchor, { lazy_1, pattern_1 }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var p = root_8();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_text() : p.firstChild;
			}

			_$_.render(render_4, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_1: pattern_1,
				_expression_2: expression_2,
				_p: p
			});

			_$_.append(__anchor, p);
		},
		null,
		(__anchor) => {
			var p_1 = root_9();

			_$_.append(__anchor, p_1);
		},
		true
	);
}

function switch_case_default_1(__anchor, { lazy_1, pattern_1 }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var p_2 = root_10();

			{
				var expression_3 = _$_.hydrating ? _$_.hydrate_text() : p_2.firstChild;
			}

			_$_.render(render_5, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_1: pattern_1,
				_expression_3: expression_3,
				_p_2: p_2
			});

			_$_.append(__anchor, p_2);
		},
		null,
		(__anchor) => {
			var p_3 = root_11();

			_$_.append(__anchor, p_3);
		},
		true
	);
}

function switch_2({ lazy_1, pattern_1 }) {
	switch (lazy_1.value) {
		case 'a':
			return switch_case_0_1;

		default:
			return switch_case_default_1;
	}
}

var root_7 = _$_.template(`<div class="mixed-reactive-list"></div>`, 0);

function consequent_1(__anchor, { lazy, lazy_2, lazy_1 }) {
	var div_4 = root_7();

	{
		_$_.for_keyed(
			div_4,
			() => lazy_2.value,
			(__anchor, pattern_1) => {
				_$_.switch(__anchor, switch_2, true, { lazy_1, pattern_1 });
			},
			4,
			(pattern_1) => _$_.get(pattern_1).id
		);

		_$_.hydrating && _$_.pop(div_4);
	}

	_$_.append(__anchor, div_4);
}

function if_2({ lazy, lazy_2, lazy_1 }) {
	if (lazy.value) return consequent_1;
}

var root_6 = _$_.template(`<button class="toggle-show">Toggle Show</button><button class="toggle-mode">Toggle Mode</button><button class="add-item">Add Item</button><!>`, 1, 4);
var root_5 = _$_.template(`<!>`, 1, 1);

function MixedControlFlowReactive_render(__anchor, __block) {
	let lazy = _$_.track(true, __block, '5ae53d26');
	let lazy_1 = _$_.track('a', __block, '5b53eda2');
	let lazy_2 = _$_.track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }], __block, '7890dad6');
	var fragment = root_5();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_6();
		var button = _$_.first_child_frag(fragment_1);

		button.__click = () => {
			_$_.set(lazy, !lazy.value);
		};

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = () => {
			_$_.set(lazy_1, lazy_1.value === 'a' ? 'b' : 'a');
		};

		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		button_2.__click = () => {
			_$_.set(lazy_2, [...lazy_2.value, { id: 3, label: 'Three' }]);
		};

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

		_$_.if(node, if_2, false, { lazy, lazy_2, lazy_1 });
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

MixedControlFlowReactive[_$_.$r] = MixedControlFlowReactive_render;

var root_14 = _$_.template(`<div> </div>`, 0);
var root_15 = _$_.template(`<div class="unexpected">unexpected</div>`, 0);

function switch_case_0_2(__anchor, { state, row }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			_$_.render_component(AsyncRow, __anchor, { label: `row-${row}` });
		},
		null,
		(__anchor) => {
			var div_6 = root_14();

			_$_.set_class(div_6, `pending-row pending-row-${row}`, void 0, true);

			{
				var expression_4 = _$_.hydrating ? _$_.hydrate_text() : div_6.firstChild;

				expression_4.nodeValue = `pending ${row}`;
			}

			_$_.append(__anchor, div_6);
		},
		true
	);
}

function switch_case_default_2(__anchor, { state, row }) {
	var div_7 = root_15();

	_$_.append(__anchor, div_7);
}

function switch_3({ state, row }) {
	switch (state) {
		case 'slow':
			return switch_case_0_2;

		default:
			return switch_case_default_2;
	}
}

function consequent_2(__anchor, { row, state }) {
	_$_.switch(__anchor, switch_3, true, { state, row });
}

function if_3({ row, state }) {
	if (row === 1) return consequent_2;
}

var root_13 = _$_.template(`<div class="before">before</div><!>`, 1, 2);
var root_12 = _$_.template(`<!>`, 1, 1);

function MixedControlFlowAsyncPending_render(__anchor, __block) {
	const rows = [1, 2];
	const state = 'slow';
	var fragment_2 = root_12();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_13();
		var div_5 = _$_.first_child_frag(fragment_3);
		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : div_5.nextSibling;

		_$_.for(
			node_2,
			() => rows,
			(__anchor, row) => {
				_$_.if(__anchor, if_3, true, { row, state });
			},
			0
		);

		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

MixedControlFlowAsyncPending[_$_.$r] = MixedControlFlowAsyncPending_render;

var root_16 = _$_.template(`<div class="resolved-row"> </div>`, 0);

function AsyncRow_render(__anchor, __block, { label }) {
	let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(label)), __block, '10cc79a0');
	var div_8 = root_16();

	{
		var expression_5 = _$_.hydrating ? _$_.hydrate_child() : div_8.firstChild;

		_$_.expression(expression_5, () => lazy_3.value);
		_$_.hydrating && _$_.pop(div_8);
	}

	_$_.append(__anchor, div_8);
}

AsyncRow[_$_.$r] = AsyncRow_render;

import { track, trackAsync } from 'ripple';

export function MixedControlFlowStatic() {
	return _$_.tsrx_element(MixedControlFlowStatic_render);
}

export function MixedControlFlowReactive() {
	return _$_.tsrx_element(MixedControlFlowReactive_render);
}

export function MixedControlFlowAsyncPending() {
	return _$_.tsrx_element(MixedControlFlowAsyncPending_render);
}

function AsyncRow(__props) {
	return _$_.tsrx_element(AsyncRow_render, __props);
}

_$_.delegate(['click']);