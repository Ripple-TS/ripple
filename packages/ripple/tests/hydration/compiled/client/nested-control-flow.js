// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template_el('li', null, ' ');

function render(__prev) {
	var __a = `item item-${_$_.get(__prev._a).id}`;

	if (__prev.a !== __a) {
		_$_.set_class(__prev._b, __prev.a = __a);
	}
}

function consequent(__anchor, pattern) {
	var li = root_1();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : li.firstChild;

		_$_.expression(expression, () => _$_.get(pattern).label);
		_$_.hydrating && _$_.pop(li);
	}

	_$_.render(render, { a: _$_.UNINITIALIZED, _a: pattern, _b: li });
	_$_.append(__anchor, li);
}

function if_1(pattern) {
	if (_$_.get(pattern).show) return consequent;
}

function render_1(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root = _$_.template_el('ul', ['class', 'for-if']);

function ForIf_render(__anchor, __block) {
	const items = [
		{ id: 1, show: true, label: 'One' },
		{ id: 2, show: true, label: 'Two' },
		{ id: 3, show: false, label: 'Three' }
	];

	var ul = root();

	{
		_$_.for_keyed(
			ul,
			() => items,
			(__anchor, pattern) => {
				var ifs = _$_.if_static(__anchor, if_1, 3, pattern);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern, _b: ifs });
			},
			4,
			(pattern) => pattern.id,
			void 0,
			void 0,
			render_1
		);

		_$_.hydrating && _$_.pop(ul);
	}

	_$_.append(__anchor, ul);
}

ForIf[_$_.$r] = ForIf_render;

var root_3 = _$_.template_el('li');

function render_2(__prev) {
	var __pattern_1 = _$_.get(__prev._a);
	var __a = `A-${__pattern_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_1.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_4 = _$_.template_el('li');

function render_3(__prev) {
	var __pattern_1_1 = _$_.get(__prev._a);
	var __a = `B-${__pattern_1_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_1_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0(__anchor, pattern_1) {
	var li_1 = root_3();

	_$_.render(render_2, { a: '', b: _$_.UNINITIALIZED, _a: pattern_1, _b: li_1 });
	_$_.append(__anchor, li_1);
}

function switch_case_default(__anchor, pattern_1) {
	var li_2 = root_4();

	_$_.render(render_3, { a: '', b: _$_.UNINITIALIZED, _a: pattern_1, _b: li_2 });
	_$_.append(__anchor, li_2);
}

function switch_1(pattern_1) {
	switch (_$_.get(pattern_1).kind) {
		case 'a':
			return switch_case_0;

		default:
			return switch_case_default;
	}
}

var root_2 = _$_.template_el('ul', ['class', 'for-switch']);

function ForSwitch_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a' },
		{ id: 2, kind: 'b' },
		{ id: 3, kind: 'a' }
	];

	var ul_1 = root_2();

	{
		_$_.for_keyed(
			ul_1,
			() => items,
			(__anchor, pattern_1) => {
				_$_.switch(__anchor, switch_1, true, pattern_1);
			},
			4,
			(pattern_1) => pattern_1.id
		);

		_$_.hydrating && _$_.pop(ul_1);
	}

	_$_.append(__anchor, ul_1);
}

ForSwitch[_$_.$r] = ForSwitch_render;

var root_6 = _$_.template_el('p', ['class', 'case-a'], 'Case A');
var root_7 = _$_.template_el('p', ['class', 'case-default'], 'Default');

function switch_case_0_1(__anchor, kind) {
	var p = root_6();

	_$_.append(__anchor, p);
}

function switch_case_default_1(__anchor, kind) {
	var p_1 = root_7();

	_$_.append(__anchor, p_1);
}

function switch_2(kind) {
	switch (kind) {
		case 'a':
			return switch_case_0_1;

		default:
			return switch_case_default_1;
	}
}

function consequent_1(__anchor, { a: show, b: kind }) {
	_$_.switch(__anchor, switch_2, true, kind);
}

function if_2({ a: show, b: kind }) {
	if (show) return consequent_1;
}

var root_5 = _$_.template(`<div class=if-switch><!>`);

function IfSwitch_render(__anchor, __block) {
	const show = true;
	const kind = 'a';
	var div = root_5();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.if(node, if_2, false, { a: show, b: kind });
		_$_.hydrating && _$_.pop(div);
	}

	_$_.append(__anchor, div);
}

IfSwitch[_$_.$r] = IfSwitch_render;

var root_9 = _$_.template_el('p', ['class', 'case-a'], 'Case A');
var root_10 = _$_.template_el('p', ['class', 'case-default'], 'Default');

function switch_case_0_2(__anchor, kind) {
	var p_2 = root_9();

	_$_.append(__anchor, p_2);
}

function switch_case_default_2(__anchor, kind) {
	var p_3 = root_10();

	_$_.append(__anchor, p_3);
}

function switch_3(kind) {
	switch (kind) {
		case 'a':
			return switch_case_0_2;

		default:
			return switch_case_default_2;
	}
}

function consequent_2(__anchor, { a: show, b: kind }) {
	_$_.switch(__anchor, switch_3, true, kind);
}

function if_3({ a: show, b: kind }) {
	if (show) return consequent_2;
}

var root_8 = _$_.template(`<div class=if-switch-hidden><p class=after>after`);

function IfSwitchHidden_render(__anchor, __block) {
	const show = false;
	const kind = 'a';
	var div_1 = root_8();

	{
		var node_1 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		_$_.if(node_1, if_3, false, { a: show, b: kind });
		_$_.hydrating && _$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
}

IfSwitchHidden[_$_.$r] = IfSwitchHidden_render;

var root_12 = _$_.template_el('li');

function render_4(__prev) {
	var __pattern_2 = _$_.get(__prev._a);
	var __a = `A-${__pattern_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_2.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_13 = _$_.template_el('li');

function render_5(__prev) {
	var __pattern_2_1 = _$_.get(__prev._a);
	var __a = `D-${__pattern_2_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_2_1.id} kind-default`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0_3(__anchor, pattern_2) {
	var li_3 = root_12();

	_$_.render(render_4, { a: '', b: _$_.UNINITIALIZED, _a: pattern_2, _b: li_3 });
	_$_.append(__anchor, li_3);
}

function switch_case_default_3(__anchor, pattern_2) {
	var li_4 = root_13();

	_$_.render(render_5, { a: '', b: _$_.UNINITIALIZED, _a: pattern_2, _b: li_4 });
	_$_.append(__anchor, li_4);
}

function switch_4(pattern_2) {
	switch (_$_.get(pattern_2).kind) {
		case 'a':
			return switch_case_0_3;

		default:
			return switch_case_default_3;
	}
}

function consequent_3(__anchor, pattern_2) {
	_$_.switch(__anchor, switch_4, true, pattern_2);
}

function if_4(pattern_2) {
	if (_$_.get(pattern_2).show) return consequent_3;
}

function render_6(__prev) {
	var __a = if_4(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_11 = _$_.template_el('ul', ['class', 'for-if-switch-single']);

function ForIfSwitchSingle_render(__anchor, __block) {
	const items = [{ id: 1, kind: 'a', show: true }];
	var ul_2 = root_11();

	{
		_$_.for_keyed(
			ul_2,
			() => items,
			(__anchor, pattern_2) => {
				var ifs_1 = _$_.if_static(__anchor, if_4, 3, pattern_2);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern_2, _b: ifs_1 });
			},
			4,
			(pattern_2) => pattern_2.id,
			void 0,
			void 0,
			render_6
		);

		_$_.hydrating && _$_.pop(ul_2);
	}

	_$_.append(__anchor, ul_2);
}

ForIfSwitchSingle[_$_.$r] = ForIfSwitchSingle_render;

var root_15 = _$_.template_el('li');

function render_7(__prev) {
	var __pattern_3 = _$_.get(__prev._a);
	var __a = `A-${__pattern_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_3.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_16 = _$_.template_el('li');

function render_8(__prev) {
	var __pattern_3_1 = _$_.get(__prev._a);
	var __a = `B-${__pattern_3_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_3_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0_4(__anchor, pattern_3) {
	var li_5 = root_15();

	_$_.render(render_7, { a: '', b: _$_.UNINITIALIZED, _a: pattern_3, _b: li_5 });
	_$_.append(__anchor, li_5);
}

function switch_case_default_4(__anchor, pattern_3) {
	var li_6 = root_16();

	_$_.render(render_8, { a: '', b: _$_.UNINITIALIZED, _a: pattern_3, _b: li_6 });
	_$_.append(__anchor, li_6);
}

function switch_5(pattern_3) {
	switch (_$_.get(pattern_3).kind) {
		case 'a':
			return switch_case_0_4;

		default:
			return switch_case_default_4;
	}
}

function consequent_4(__anchor, pattern_3) {
	_$_.switch(__anchor, switch_5, true, pattern_3);
}

function if_5(pattern_3) {
	if (_$_.get(pattern_3).show) return consequent_4;
}

function render_9(__prev) {
	var __a = if_5(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_14 = _$_.template_el('ul', ['class', 'for-if-switch-multi']);

function ForIfSwitchMulti_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	var ul_3 = root_14();

	{
		_$_.for_keyed(
			ul_3,
			() => items,
			(__anchor, pattern_3) => {
				var ifs_2 = _$_.if_static(__anchor, if_5, 3, pattern_3);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern_3, _b: ifs_2 });
			},
			4,
			(pattern_3) => pattern_3.id,
			void 0,
			void 0,
			render_9
		);

		_$_.hydrating && _$_.pop(ul_3);
	}

	_$_.append(__anchor, ul_3);
}

ForIfSwitchMulti[_$_.$r] = ForIfSwitchMulti_render;

var root_18 = _$_.template_el('li');

function render_10(__prev) {
	var __pattern_4 = _$_.get(__prev._a);
	var __a = `A-${__pattern_4.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_4.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_19 = _$_.template_el('li');

function render_11(__prev) {
	var __pattern_4_1 = _$_.get(__prev._a);
	var __a = `B-${__pattern_4_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_4_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0_5(__anchor, pattern_4) {
	var li_7 = root_18();

	_$_.render(render_10, { a: '', b: _$_.UNINITIALIZED, _a: pattern_4, _b: li_7 });
	_$_.append(__anchor, li_7);
}

function switch_case_default_5(__anchor, pattern_4) {
	var li_8 = root_19();

	_$_.render(render_11, { a: '', b: _$_.UNINITIALIZED, _a: pattern_4, _b: li_8 });
	_$_.append(__anchor, li_8);
}

function switch_6(pattern_4) {
	switch (_$_.get(pattern_4).kind) {
		case 'a':
			return switch_case_0_5;

		default:
			return switch_case_default_5;
	}
}

function consequent_5(__anchor, pattern_4) {
	_$_.switch(__anchor, switch_6, true, pattern_4);
}

function if_6(pattern_4) {
	if (_$_.get(pattern_4).show) return consequent_5;
}

function render_12(__prev) {
	var __a = if_6(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_17 = _$_.template_el('ul', ['class', 'for-if-switch-disabled']);

function ForIfSwitchWithDisabled_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: false },
		{ id: 3, kind: 'a', show: true }
	];

	var ul_4 = root_17();

	{
		_$_.for_keyed(
			ul_4,
			() => items,
			(__anchor, pattern_4) => {
				var ifs_3 = _$_.if_static(__anchor, if_6, 3, pattern_4);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern_4, _b: ifs_3 });
			},
			4,
			(pattern_4) => pattern_4.id,
			void 0,
			void 0,
			render_12
		);

		_$_.hydrating && _$_.pop(ul_4);
	}

	_$_.append(__anchor, ul_4);
}

ForIfSwitchWithDisabled[_$_.$r] = ForIfSwitchWithDisabled_render;

var root_21 = _$_.template_el('p', ['class', 'resolved-a'], 'A resolved');
var root_22 = _$_.template_el('p', ['class', 'pending-a'], 'A pending');
var root_23 = _$_.template_el('p', ['class', 'default'], 'Default');

function switch_case_0_6(__anchor, kind) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var p_4 = root_21();

			_$_.append(__anchor, p_4);
		},
		null,
		(__anchor) => {
			var p_5 = root_22();

			_$_.append(__anchor, p_5);
		},
		true
	);
}

function switch_case_default_6(__anchor, kind) {
	var p_6 = root_23();

	_$_.append(__anchor, p_6);
}

function switch_7(kind) {
	switch (kind) {
		case 'a':
			return switch_case_0_6;

		default:
			return switch_case_default_6;
	}
}

var root_20 = _$_.template(`<div class=switch-try><!>`);

function SwitchTry_render(__anchor, __block) {
	const kind = 'a';
	var div_2 = root_20();

	{
		var node_2 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		_$_.switch(node_2, switch_7, false, kind);
		_$_.hydrating && _$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

SwitchTry[_$_.$r] = SwitchTry_render;

var root_25 = _$_.template_el('li');

function render_13(__prev) {
	var __pattern_5 = _$_.get(__prev._a);
	var __a = `A-${__pattern_5.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_5.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_26 = _$_.template_el('li');

function render_14(__prev) {
	var __pattern_5_1 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_5_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_5_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_27 = _$_.template_el('li');

function render_15(__prev) {
	var __pattern_5_2 = _$_.get(__prev._a);
	var __a = `B-${__pattern_5_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_5_2.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_28 = _$_.template_el('li');

function render_16(__prev) {
	var __pattern_5_3 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_5_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_5_3.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0_7(__anchor, pattern_5) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_9 = root_25();

			_$_.render(render_13, { a: '', b: _$_.UNINITIALIZED, _a: pattern_5, _b: li_9 });
			_$_.append(__anchor, li_9);
		},
		null,
		(__anchor) => {
			var li_10 = root_26();

			_$_.render(render_14, { a: '', b: _$_.UNINITIALIZED, _a: pattern_5, _b: li_10 });
			_$_.append(__anchor, li_10);
		},
		true
	);
}

function switch_case_default_7(__anchor, pattern_5) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_11 = root_27();

			_$_.render(render_15, { a: '', b: _$_.UNINITIALIZED, _a: pattern_5, _b: li_11 });
			_$_.append(__anchor, li_11);
		},
		null,
		(__anchor) => {
			var li_12 = root_28();

			_$_.render(render_16, { a: '', b: _$_.UNINITIALIZED, _a: pattern_5, _b: li_12 });
			_$_.append(__anchor, li_12);
		},
		true
	);
}

function switch_8(pattern_5) {
	switch (_$_.get(pattern_5).kind) {
		case 'a':
			return switch_case_0_7;

		default:
			return switch_case_default_7;
	}
}

var root_24 = _$_.template_el('ul', ['class', 'for-switch-try']);

function ForSwitchTry_render(__anchor, __block) {
	const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];
	var ul_5 = root_24();

	{
		_$_.for_keyed(
			ul_5,
			() => items,
			(__anchor, pattern_5) => {
				_$_.switch(__anchor, switch_8, true, pattern_5);
			},
			4,
			(pattern_5) => pattern_5.id
		);

		_$_.hydrating && _$_.pop(ul_5);
	}

	_$_.append(__anchor, ul_5);
}

ForSwitchTry[_$_.$r] = ForSwitchTry_render;

var root_30 = _$_.template_el('li');

function render_17(__prev) {
	var __pattern_6 = _$_.get(__prev._a);
	var __a = `item-${__pattern_6.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_6.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_31 = _$_.template_el('li');

function render_18(__prev) {
	var __pattern_6_1 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_6_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_6_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function consequent_6(__anchor, pattern_6) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_13 = root_30();

			_$_.render(render_17, { a: '', b: _$_.UNINITIALIZED, _a: pattern_6, _b: li_13 });
			_$_.append(__anchor, li_13);
		},
		null,
		(__anchor) => {
			var li_14 = root_31();

			_$_.render(render_18, { a: '', b: _$_.UNINITIALIZED, _a: pattern_6, _b: li_14 });
			_$_.append(__anchor, li_14);
		},
		true
	);
}

function if_7(pattern_6) {
	if (_$_.get(pattern_6).show) return consequent_6;
}

function render_19(__prev) {
	var __a = if_7(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_29 = _$_.template_el('ul', ['class', 'for-if-try']);

function ForIfTry_render(__anchor, __block) {
	const items = [{ id: 1, show: true }, { id: 2, show: true }];
	var ul_6 = root_29();

	{
		_$_.for_keyed(
			ul_6,
			() => items,
			(__anchor, pattern_6) => {
				var ifs_4 = _$_.if_static(__anchor, if_7, 3, pattern_6);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern_6, _b: ifs_4 });
			},
			4,
			(pattern_6) => pattern_6.id,
			void 0,
			void 0,
			render_19
		);

		_$_.hydrating && _$_.pop(ul_6);
	}

	_$_.append(__anchor, ul_6);
}

ForIfTry[_$_.$r] = ForIfTry_render;

var root_33 = _$_.template_el('li');

function render_20(__prev) {
	var __pattern_7 = _$_.get(__prev._a);
	var __a = `A-${__pattern_7.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_7.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_34 = _$_.template_el('li');

function render_21(__prev) {
	var __pattern_7_1 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_7_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_7_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_35 = _$_.template_el('li');

function render_22(__prev) {
	var __pattern_7_2 = _$_.get(__prev._a);
	var __a = `D-${__pattern_7_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_7_2.id} kind-default`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_36 = _$_.template_el('li');

function render_23(__prev) {
	var __pattern_7_3 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_7_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_7_3.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0_8(__anchor, pattern_7) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_15 = root_33();

			_$_.render(render_20, { a: '', b: _$_.UNINITIALIZED, _a: pattern_7, _b: li_15 });
			_$_.append(__anchor, li_15);
		},
		null,
		(__anchor) => {
			var li_16 = root_34();

			_$_.render(render_21, { a: '', b: _$_.UNINITIALIZED, _a: pattern_7, _b: li_16 });
			_$_.append(__anchor, li_16);
		},
		true
	);
}

function switch_case_default_8(__anchor, pattern_7) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_17 = root_35();

			_$_.render(render_22, { a: '', b: _$_.UNINITIALIZED, _a: pattern_7, _b: li_17 });
			_$_.append(__anchor, li_17);
		},
		null,
		(__anchor) => {
			var li_18 = root_36();

			_$_.render(render_23, { a: '', b: _$_.UNINITIALIZED, _a: pattern_7, _b: li_18 });
			_$_.append(__anchor, li_18);
		},
		true
	);
}

function switch_9(pattern_7) {
	switch (_$_.get(pattern_7).kind) {
		case 'a':
			return switch_case_0_8;

		default:
			return switch_case_default_8;
	}
}

function consequent_7(__anchor, pattern_7) {
	_$_.switch(__anchor, switch_9, true, pattern_7);
}

function if_8(pattern_7) {
	if (_$_.get(pattern_7).show) return consequent_7;
}

function render_24(__prev) {
	var __a = if_8(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_32 = _$_.template_el('ul', ['class', 'for-if-switch-try-single']);

function ForIfSwitchTrySingle_render(__anchor, __block) {
	const items = [{ id: 1, kind: 'a', show: true }];
	var ul_7 = root_32();

	{
		_$_.for_keyed(
			ul_7,
			() => items,
			(__anchor, pattern_7) => {
				var ifs_5 = _$_.if_static(__anchor, if_8, 3, pattern_7);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern_7, _b: ifs_5 });
			},
			4,
			(pattern_7) => pattern_7.id,
			void 0,
			void 0,
			render_24
		);

		_$_.hydrating && _$_.pop(ul_7);
	}

	_$_.append(__anchor, ul_7);
}

ForIfSwitchTrySingle[_$_.$r] = ForIfSwitchTrySingle_render;

var root_38 = _$_.template_el('li');

function render_25(__prev) {
	var __pattern_8 = _$_.get(__prev._a);
	var __a = `A-${__pattern_8.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_8.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_39 = _$_.template_el('li');

function render_26(__prev) {
	var __pattern_8_1 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_8_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_8_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_40 = _$_.template_el('li');

function render_27(__prev) {
	var __pattern_8_2 = _$_.get(__prev._a);
	var __a = `B-${__pattern_8_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `item item-${__pattern_8_2.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

var root_41 = _$_.template_el('li');

function render_28(__prev) {
	var __pattern_8_3 = _$_.get(__prev._a);
	var __a = `pending ${__pattern_8_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = `pending pending-${__pattern_8_3.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._b, __prev.b = __b);
	}
}

function switch_case_0_9(__anchor, pattern_8) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_19 = root_38();

			_$_.render(render_25, { a: '', b: _$_.UNINITIALIZED, _a: pattern_8, _b: li_19 });
			_$_.append(__anchor, li_19);
		},
		null,
		(__anchor) => {
			var li_20 = root_39();

			_$_.render(render_26, { a: '', b: _$_.UNINITIALIZED, _a: pattern_8, _b: li_20 });
			_$_.append(__anchor, li_20);
		},
		true
	);
}

function switch_case_default_9(__anchor, pattern_8) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_21 = root_40();

			_$_.render(render_27, { a: '', b: _$_.UNINITIALIZED, _a: pattern_8, _b: li_21 });
			_$_.append(__anchor, li_21);
		},
		null,
		(__anchor) => {
			var li_22 = root_41();

			_$_.render(render_28, { a: '', b: _$_.UNINITIALIZED, _a: pattern_8, _b: li_22 });
			_$_.append(__anchor, li_22);
		},
		true
	);
}

function switch_10(pattern_8) {
	switch (_$_.get(pattern_8).kind) {
		case 'a':
			return switch_case_0_9;

		default:
			return switch_case_default_9;
	}
}

function consequent_8(__anchor, pattern_8) {
	_$_.switch(__anchor, switch_10, true, pattern_8);
}

function if_9(pattern_8) {
	if (_$_.get(pattern_8).show) return consequent_8;
}

function render_29(__prev) {
	var __a = if_9(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_37 = _$_.template_el('ul', ['class', 'for-if-switch-try-multi']);

function ForIfSwitchTryMulti_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	var ul_8 = root_37();

	{
		_$_.for_keyed(
			ul_8,
			() => items,
			(__anchor, pattern_8) => {
				var ifs_6 = _$_.if_static(__anchor, if_9, 3, pattern_8);

				_$_.item({ a: _$_.UNINITIALIZED, _a: pattern_8, _b: ifs_6 });
			},
			4,
			(pattern_8) => pattern_8.id,
			void 0,
			void 0,
			render_29
		);

		_$_.hydrating && _$_.pop(ul_8);
	}

	_$_.append(__anchor, ul_8);
}

ForIfSwitchTryMulti[_$_.$r] = ForIfSwitchTryMulti_render;

export function ForIf() {
	return _$_.tsrx_element(ForIf_render);
}

export function ForSwitch() {
	return _$_.tsrx_element(ForSwitch_render);
}

export function IfSwitch() {
	return _$_.tsrx_element(IfSwitch_render);
}

export function IfSwitchHidden() {
	return _$_.tsrx_element(IfSwitchHidden_render);
}

export function ForIfSwitchSingle() {
	return _$_.tsrx_element(ForIfSwitchSingle_render);
}

export function ForIfSwitchMulti() {
	return _$_.tsrx_element(ForIfSwitchMulti_render);
}

export function ForIfSwitchWithDisabled() {
	return _$_.tsrx_element(ForIfSwitchWithDisabled_render);
}

export function SwitchTry() {
	return _$_.tsrx_element(SwitchTry_render);
}

export function ForSwitchTry() {
	return _$_.tsrx_element(ForSwitchTry_render);
}

export function ForIfTry() {
	return _$_.tsrx_element(ForIfTry_render);
}

export function ForIfSwitchTrySingle() {
	return _$_.tsrx_element(ForIfSwitchTrySingle_render);
}

export function ForIfSwitchTryMulti() {
	return _$_.tsrx_element(ForIfSwitchTryMulti_render);
}