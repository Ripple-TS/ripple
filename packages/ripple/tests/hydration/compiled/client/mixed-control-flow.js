// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template_el('div');

function render(__prev) {
	var __pattern = _$_.get(__prev._a);
	var __a = `A-${__pattern.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `row row-${__pattern.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_2 = _$_.template_el('div', null, 'pending a');

function render_1(__prev) {
	var __a = `pending pending-${_$_.get(__prev._a).id}`;

	if (__prev.a !== __a) {
		_$_.set_class(__prev._b, __prev.a = __a);
	}
}

var root_3 = _$_.template_el('div');

function render_2(__prev) {
	var __pattern_1 = _$_.get(__prev._a);
	var __a = `B-${__pattern_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `row row-${__pattern_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_4 = _$_.template_el('div', null, 'pending b');

function render_3(__prev) {
	var __a = `pending pending-${_$_.get(__prev._a).id}`;

	if (__prev.a !== __a) {
		_$_.set_class(__prev._b, __prev.a = __a);
	}
}

function switch_case_0(__anchor, pattern) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var div = root_1();

			_$_.render(render, { a: '', b: _$_.UNINITIALIZED, _a: pattern, _b: div });
			_$_.append(__anchor, div);
		},
		null,
		(__anchor) => {
			var div_1 = root_2();

			_$_.render(render_1, { a: _$_.UNINITIALIZED, _a: pattern, _b: div_1 });
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

			_$_.render(render_2, { a: '', b: _$_.UNINITIALIZED, _a: pattern, _b: div_2 });
			_$_.append(__anchor, div_2);
		},
		null,
		(__anchor) => {
			var div_3 = root_4();

			_$_.render(render_3, { a: _$_.UNINITIALIZED, _a: pattern, _b: div_3 });
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

function render_4(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root = _$_.template_el('section', ['class', 'mixed-static']);

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
				var ifs = _$_.if_static(__anchor, if_1, 3, pattern);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern, _b: ifs });
			},
			4,
			(pattern) => pattern.id,
			void 0,
			void 0,
			render_4
		);

		_$_.hydrating && _$_.pop(section);
	}

	_$_.append(__anchor, section);
}

MixedControlFlowStatic[_$_.$r] = MixedControlFlowStatic_render;

var root_8 = _$_.template_el('p');

function render_5(__prev) {
	var __pattern_1_1 = _$_.get(__prev._a);
	var __a = `A:${__pattern_1_1.label}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_1_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_9 = _$_.template_el('p', ['class', 'pending'], 'pending a');
var root_10 = _$_.template_el('p');

function render_6(__prev) {
	var __pattern_1_2 = _$_.get(__prev._a);
	var __a = `B:${__pattern_1_2.label}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_1_2.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_11 = _$_.template_el('p', ['class', 'pending'], 'pending b');

function switch_case_0_1(__anchor, { b: pattern_1 }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var p = root_8();

			_$_.render(render_5, { a: '', b: _$_.UNINITIALIZED, _a: pattern_1, _b: p });
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

function switch_case_default_1(__anchor, { b: pattern_1 }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var p_2 = root_10();

			_$_.render(render_6, { a: '', b: _$_.UNINITIALIZED, _a: pattern_1, _b: p_2 });
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

function switch_2({ a: mode }) {
	switch (mode.value) {
		case 'a':
			return switch_case_0_1;

		default:
			return switch_case_default_1;
	}
}

var root_7 = _$_.template_el('div', ['class', 'mixed-reactive-list']);

function consequent_1(__anchor, { b: items, c: mode }) {
	var div_4 = root_7();

	{
		_$_.for_keyed(
			div_4,
			() => items.value,
			(__anchor, pattern_1) => {
				_$_.switch(__anchor, switch_2, true, { a: mode, b: pattern_1 });
			},
			4,
			(pattern_1) => pattern_1.id
		);

		_$_.hydrating && _$_.pop(div_4);
	}

	_$_.append(__anchor, div_4);
}

function if_2({ a: show }) {
	if (show.value) return consequent_1;
}

var root_6 = _$_.template(`<button class=toggle-show>Toggle Show</button><button class=toggle-mode>Toggle Mode</button><button class=add-item>Add Item</button><!>`, 1, 4);

function render_7(__prev) {
	var __a = if_2({ a: __prev._a, b: __prev._b, c: __prev._c });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._d, __prev.a = __a);
	}
}

var root_5 = _$_.template(`<!>`, 1, 1);

function MixedControlFlowReactive_render(__anchor, __block) {
	const show = _$_.track(true, __block, 'p7xgkm');
	const mode = _$_.track('a', __block, 'pc8xwi');
	const items = _$_.track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }], __block, 'xgaqxi');
	var fragment = root_5();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_6();
		var button = _$_.first_child_frag(fragment_1);

		button.__click = () => {
			show.value = !show.value;
		};

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = () => {
			mode.value = mode.value === 'a' ? 'b' : 'a';
		};

		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		button_2.__click = () => {
			items.value = [...items.value, { id: 3, label: 'Three' }];
		};

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;
		var ifs_1 = _$_.if_static(node, if_2, 0, { a: show, b: items, c: mode });

		_$_.render(render_7, {
			a: _$_.UNINITIALIZED,
			_a: show,
			_b: items,
			_c: mode,
			_d: ifs_1
		});

		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

MixedControlFlowReactive[_$_.$r] = MixedControlFlowReactive_render;

var root_14 = _$_.template_el('div');
var root_15 = _$_.template_el('div', ['class', 'unexpected'], 'unexpected');

function switch_case_0_2(__anchor, { b: row }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			_$_.render_component(AsyncRow, __anchor, { label: `row-${row}` });
		},
		null,
		(__anchor) => {
			var div_6 = root_14();

			_$_.set_class(div_6, `pending-row pending-row-${row}`);

			{
				div_6.textContent = `pending ${row}`;
			}

			_$_.append(__anchor, div_6);
		},
		true
	);
}

function switch_case_default_2(__anchor) {
	var div_7 = root_15();

	_$_.append(__anchor, div_7);
}

function switch_3({ a: state }) {
	switch (state) {
		case 'slow':
			return switch_case_0_2;

		default:
			return switch_case_default_2;
	}
}

function consequent_2(__anchor, { a: row, b: state }) {
	_$_.switch(__anchor, switch_3, true, { a: state, b: row });
}

function if_3({ a: row }) {
	if (row === 1) return consequent_2;
}

var root_13 = _$_.template(`<div class=before>before</div><!>`, 1, 2);
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
				_$_.if(__anchor, if_3, true, { a: row, b: state });
			},
			0
		);

		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

MixedControlFlowAsyncPending[_$_.$r] = MixedControlFlowAsyncPending_render;

var root_16 = _$_.template_el('div', ['class', 'resolved-row'], ' ');

function AsyncRow_render(__anchor, __block, { label }) {
	const value = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(label)), __block, '4nsq00');
	var div_8 = root_16();

	{
		var expression_5 = _$_.hydrating ? _$_.hydrate_child() : div_8.firstChild;

		_$_.expression(expression_5, () => value.value);
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