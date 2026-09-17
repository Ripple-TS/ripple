// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('div', ['class', 'status-success'], 'Success');
var root_1 = _$_.template_el('div', ['class', 'status-error'], 'Error');
var root_2 = _$_.template_el('div', ['class', 'status-unknown'], 'Unknown');

function switch_case_0(__anchor, status) {
	var div = root();

	_$_.append(__anchor, div);
}

function switch_case_1(__anchor, status) {
	var div_1 = root_1();

	_$_.append(__anchor, div_1);
}

function switch_case_default(__anchor, status) {
	var div_2 = root_2();

	_$_.append(__anchor, div_2);
}

function switch_1(status) {
	switch (status) {
		case 'success':
			return switch_case_0;

		case 'error':
			return switch_case_1;

		default:
			return switch_case_default;
	}
}

function SwitchStatic_render(__anchor, __block) {
	const status = 'success';

	_$_.switch(__anchor, switch_1, true, status);
}

SwitchStatic[_$_.$r] = SwitchStatic_render;

var root_5 = _$_.template_el('div', ['class', 'case-a'], 'Case A');
var root_6 = _$_.template_el('div', ['class', 'case-b'], 'Case B');
var root_7 = _$_.template_el('div', ['class', 'case-c'], 'Case C');

function switch_case_0_1(__anchor, status) {
	var div_3 = root_5();

	_$_.append(__anchor, div_3);
}

function switch_case_1_1(__anchor, status) {
	var div_4 = root_6();

	_$_.append(__anchor, div_4);
}

function switch_case_default_1(__anchor, status) {
	var div_5 = root_7();

	_$_.append(__anchor, div_5);
}

function switch_2(status) {
	switch (status.value) {
		case 'a':
			return switch_case_0_1;

		case 'b':
			return switch_case_1_1;

		default:
			return switch_case_default_1;
	}
}

var root_4 = _$_.template(`<button class=toggle>Toggle</button><!>`, 1, 2);
var root_3 = _$_.template(`<!>`, 1, 1);

function SwitchReactive_render(__anchor, __block) {
	const status = _$_.track('a', __block, '172bas5');
	var fragment = root_3();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_4();
		var button = _$_.first_child_frag(fragment_1);

		button.__click = () => {
			if (status.value === 'a') status.value = 'b'; else if (status.value === 'b') status.value = 'c'; else status.value = 'a';
		};

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.switch(node, switch_2, false, status);
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

SwitchReactive[_$_.$r] = SwitchReactive_render;

var root_8 = _$_.template_el('div', ['class', 'case-1-2'], '1 or 2');
var root_9 = _$_.template_el('div', ['class', 'case-other'], 'Other');

function switch_case_0_2(__anchor, val) {
	var div_6 = root_8();

	_$_.append(__anchor, div_6);
}

function switch_case_default_2(__anchor, val) {
	var div_7 = root_9();

	_$_.append(__anchor, div_7);
}

function switch_3(val) {
	switch (val) {
		case 1:
			return;

		case 2:
			return switch_case_0_2;

		default:
			return switch_case_default_2;
	}
}

function SwitchFallthrough_render(__anchor, __block) {
	const val = 1;

	_$_.switch(__anchor, switch_3, true, val);
}

SwitchFallthrough[_$_.$r] = SwitchFallthrough_render;

var root_12 = _$_.template_el('div', ['class', 'level-1'], 'Level 1');
var root_13 = _$_.template_el('div', ['class', 'level-2'], 'Level 2');
var root_14 = _$_.template_el('div', ['class', 'level-3'], 'Level 3');

function switch_case_0_3(__anchor, level) {
	var div_8 = root_12();

	_$_.append(__anchor, div_8);
}

function switch_case_1_2(__anchor, level) {
	var div_9 = root_13();

	_$_.append(__anchor, div_9);
}

function switch_case_2(__anchor, level) {
	var div_10 = root_14();

	_$_.append(__anchor, div_10);
}

function switch_4(level) {
	switch (level.value) {
		case 1:
			return switch_case_0_3;

		case 2:
			return switch_case_1_2;

		case 3:
			return switch_case_2;
	}
}

var root_11 = _$_.template(`<button class=level-toggle>Toggle Level</button><!>`, 1, 2);
var root_10 = _$_.template(`<!>`, 1, 1);

function SwitchNumericLevels_render(__anchor, __block) {
	const level = _$_.track(1, __block, 'wlqm5n');
	var fragment_2 = root_10();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_11();
		var button_1 = _$_.first_child_frag(fragment_3);

		button_1.__click = () => {
			if (level.value === 1) level.value = 2; else if (level.value === 2) level.value = 3; else level.value = 1;
		};

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		_$_.switch(node_2, switch_4, false, level);
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

SwitchNumericLevels[_$_.$r] = SwitchNumericLevels_render;

var root_17 = _$_.template_el('div', ['class', 'block-1'], 'Block 1');
var root_18 = _$_.template_el('div', ['class', 'block-2'], 'Block 2');
var root_19 = _$_.template_el('div', ['class', 'block-3'], 'Block 3');

function switch_case_0_4(__anchor, level) {
	var div_11 = root_17();

	_$_.append(__anchor, div_11);
}

function switch_case_1_3(__anchor, level) {
	var div_12 = root_18();

	_$_.append(__anchor, div_12);
}

function switch_case_2_1(__anchor, level) {
	var div_13 = root_19();

	_$_.append(__anchor, div_13);
}

function switch_5(level) {
	switch (level.value) {
		case 1:
			return switch_case_0_4;

		case 2:
			return switch_case_1_3;

		case 3:
			return switch_case_2_1;
	}
}

var root_16 = _$_.template(`<button class=block-toggle>Toggle</button><!>`, 1, 2);
var root_15 = _$_.template(`<!>`, 1, 1);

function SwitchBlockScoped_render(__anchor, __block) {
	const level = _$_.track(1, __block, '1k7y5oy');
	var fragment_4 = root_15();
	var node_5 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_16();
		var button_2 = _$_.first_child_frag(fragment_5);

		button_2.__click = () => {
			if (level.value === 1) level.value = 2; else if (level.value === 2) level.value = 3; else level.value = 1;
		};

		var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

		_$_.switch(node_4, switch_5, false, level);
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

SwitchBlockScoped[_$_.$r] = SwitchBlockScoped_render;

var root_22 = _$_.template_el('div', ['class', 'nobreak-1'], 'NoBreak 1');
var root_23 = _$_.template_el('div', ['class', 'nobreak-2'], 'NoBreak 2');
var root_24 = _$_.template_el('div', ['class', 'nobreak-3'], 'NoBreak 3');

function switch_case_0_5(__anchor, level) {
	var div_14 = root_22();

	_$_.append(__anchor, div_14);
}

function switch_case_1_4(__anchor, level) {
	var div_15 = root_23();

	_$_.append(__anchor, div_15);
}

function switch_case_2_2(__anchor, level) {
	var div_16 = root_24();

	_$_.append(__anchor, div_16);
}

function switch_6(level) {
	switch (level.value) {
		case 1:
			return switch_case_0_5;

		case 2:
			return switch_case_1_4;

		case 3:
			return switch_case_2_2;
	}
}

var root_21 = _$_.template(`<button class=nobreak-toggle>Toggle</button><!>`, 1, 2);
var root_20 = _$_.template(`<!>`, 1, 1);

function SwitchNoBreak_render(__anchor, __block) {
	const level = _$_.track(1, __block, 'ttnpbe');
	var fragment_6 = root_20();
	var node_7 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_21();
		var button_3 = _$_.first_child_frag(fragment_7);

		button_3.__click = () => {
			if (level.value === 1) level.value = 2; else if (level.value === 2) level.value = 3; else level.value = 1;
		};

		var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;

		_$_.switch(node_6, switch_6, false, level);
		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

SwitchNoBreak[_$_.$r] = SwitchNoBreak_render;

import { track } from 'ripple';

export function SwitchStatic() {
	return _$_.tsrx_element(SwitchStatic_render);
}

export function SwitchReactive() {
	return _$_.tsrx_element(SwitchReactive_render);
}

export function SwitchFallthrough() {
	return _$_.tsrx_element(SwitchFallthrough_render);
}

export function SwitchNumericLevels() {
	return _$_.tsrx_element(SwitchNumericLevels_render);
}

export function SwitchBlockScoped() {
	return _$_.tsrx_element(SwitchBlockScoped_render);
}

export function SwitchNoBreak() {
	return _$_.tsrx_element(SwitchNoBreak_render);
}

_$_.delegate(['click']);