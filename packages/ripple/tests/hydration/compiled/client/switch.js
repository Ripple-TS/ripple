// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="status-success">Success</div>`, 0);
var root_2 = _$_.template(`<div class="status-error">Error</div>`, 0);
var root_3 = _$_.template(`<div class="status-unknown">Unknown</div>`, 0);
var root = _$_.template(`<!>`, 1);
var root_5 = _$_.template(`<div class="case-a">Case A</div>`, 0);
var root_6 = _$_.template(`<div class="case-b">Case B</div>`, 0);
var root_7 = _$_.template(`<div class="case-c">Case C</div>`, 0);
var root_4 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1);
var root_9 = _$_.template(`<div class="case-1-2">1 or 2</div>`, 0);
var root_10 = _$_.template(`<div class="case-other">Other</div>`, 0);
var root_8 = _$_.template(`<!>`, 1);
var root_12 = _$_.template(`<div class="level-1">Level 1</div>`, 0);
var root_13 = _$_.template(`<div class="level-2">Level 2</div>`, 0);
var root_14 = _$_.template(`<div class="level-3">Level 3</div>`, 0);
var root_11 = _$_.template(`<button class="level-toggle">Toggle Level</button><!>`, 1);
var root_16 = _$_.template(`<div class="block-1">Block 1</div>`, 0);
var root_17 = _$_.template(`<div class="block-2">Block 2</div>`, 0);
var root_18 = _$_.template(`<div class="block-3">Block 3</div>`, 0);
var root_15 = _$_.template(`<button class="block-toggle">Toggle</button><!>`, 1);
var root_20 = _$_.template(`<div class="nobreak-1">NoBreak 1</div>`, 0);
var root_21 = _$_.template(`<div class="nobreak-2">NoBreak 2</div>`, 0);
var root_22 = _$_.template(`<div class="nobreak-3">NoBreak 3</div>`, 0);
var root_19 = _$_.template(`<button class="nobreak-toggle">Toggle</button><!>`, 1);

import { track } from 'ripple';

export function SwitchStatic(__anchor, _, __block) {
	_$_.push_component();

	const status = 'success';
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	{
		var switch_case_0 = (__anchor) => {
			var div_1 = root_1();

			_$_.append(__anchor, div_1);
		};

		var switch_case_1 = (__anchor) => {
			var div_2 = root_2();

			_$_.append(__anchor, div_2);
		};

		var switch_case_default = (__anchor) => {
			var div_3 = root_3();

			_$_.append(__anchor, div_3);
		};

		_$_.switch(node, () => {
			var result = [];

			switch (status) {
				case 'success':
					result.push(switch_case_0);
					return result;

				case 'error':
					result.push(switch_case_1);
					return result;

				default:
					result.push(switch_case_default);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function SwitchReactive(__anchor, _, __block) {
	_$_.push_component();

	let status = track('a', void 0, void 0, __block);
	var fragment_1 = root_4();
	var button_1 = _$_.first_child_frag(fragment_1);

	button_1.__click = () => {
		if (_$_.get(status) === 'a') _$_.set(status, 'b'); else if (_$_.get(status) === 'b') _$_.set(status, 'c'); else _$_.set(status, 'a');
	};

	var node_1 = _$_.sibling(button_1);

	{
		var switch_case_0_1 = (__anchor) => {
			var div_4 = root_5();

			_$_.append(__anchor, div_4);
		};

		var switch_case_1_1 = (__anchor) => {
			var div_5 = root_6();

			_$_.append(__anchor, div_5);
		};

		var switch_case_default_1 = (__anchor) => {
			var div_6 = root_7();

			_$_.append(__anchor, div_6);
		};

		_$_.switch(node_1, () => {
			var result = [];

			switch (_$_.get(status)) {
				case 'a':
					result.push(switch_case_0_1);
					return result;

				case 'b':
					result.push(switch_case_1_1);
					return result;

				default:
					result.push(switch_case_default_1);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function SwitchFallthrough(__anchor, _, __block) {
	_$_.push_component();

	const val = 1;
	var fragment_2 = root_8();
	var node_2 = _$_.first_child_frag(fragment_2);

	{
		var switch_case_0_2 = (__anchor) => {
			var div_7 = root_9();

			_$_.append(__anchor, div_7);
		};

		var switch_case_default_2 = (__anchor) => {
			var div_8 = root_10();

			_$_.append(__anchor, div_8);
		};

		_$_.switch(node_2, () => {
			var result = [];

			switch (val) {
				case 1:

				case 2:
					result.push(switch_case_0_2);
					return result;

				default:
					result.push(switch_case_default_2);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function SwitchNumericLevels(__anchor, _, __block) {
	_$_.push_component();

	let level = track(1, void 0, void 0, __block);
	var fragment_3 = root_11();
	var button_2 = _$_.first_child_frag(fragment_3);

	button_2.__click = () => {
		if (_$_.get(level) === 1) _$_.set(level, 2); else if (_$_.get(level) === 2) _$_.set(level, 3); else _$_.set(level, 1);
	};

	var node_3 = _$_.sibling(button_2);

	{
		var switch_case_0_3 = (__anchor) => {
			var div_9 = root_12();

			_$_.append(__anchor, div_9);
		};

		var switch_case_1_2 = (__anchor) => {
			var div_10 = root_13();

			_$_.append(__anchor, div_10);
		};

		var switch_case_2 = (__anchor) => {
			var div_11 = root_14();

			_$_.append(__anchor, div_11);
		};

		_$_.switch(node_3, () => {
			var result = [];

			switch (_$_.get(level)) {
				case 1:
					result.push(switch_case_0_3);
					return result;

				case 2:
					result.push(switch_case_1_2);
					return result;

				case 3:
					result.push(switch_case_2);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function SwitchBlockScoped(__anchor, _, __block) {
	_$_.push_component();

	let level = track(1, void 0, void 0, __block);
	var fragment_4 = root_15();
	var button_3 = _$_.first_child_frag(fragment_4);

	button_3.__click = () => {
		if (_$_.get(level) === 1) _$_.set(level, 2); else if (_$_.get(level) === 2) _$_.set(level, 3); else _$_.set(level, 1);
	};

	var node_4 = _$_.sibling(button_3);

	{
		var switch_case_0_4 = (__anchor) => {
			var div_12 = root_16();

			_$_.append(__anchor, div_12);
		};

		var switch_case_1_3 = (__anchor) => {
			var div_13 = root_17();

			_$_.append(__anchor, div_13);
		};

		var switch_case_2_1 = (__anchor) => {
			var div_14 = root_18();

			_$_.append(__anchor, div_14);
		};

		_$_.switch(node_4, () => {
			var result = [];

			switch (_$_.get(level)) {
				case 1:
					result.push(switch_case_0_4);
					return result;

				case 2:
					result.push(switch_case_1_3);
					return result;

				case 3:
					result.push(switch_case_2_1);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function SwitchNoBreak(__anchor, _, __block) {
	_$_.push_component();

	let level = track(1, void 0, void 0, __block);
	var fragment_5 = root_19();
	var button_4 = _$_.first_child_frag(fragment_5);

	button_4.__click = () => {
		if (_$_.get(level) === 1) _$_.set(level, 2); else if (_$_.get(level) === 2) _$_.set(level, 3); else _$_.set(level, 1);
	};

	var node_5 = _$_.sibling(button_4);

	{
		var switch_case_0_5 = (__anchor) => {
			var div_15 = root_20();

			_$_.append(__anchor, div_15);
		};

		var switch_case_1_4 = (__anchor) => {
			var div_16 = root_21();

			_$_.append(__anchor, div_16);
		};

		var switch_case_2_2 = (__anchor) => {
			var div_17 = root_22();

			_$_.append(__anchor, div_17);
		};

		_$_.switch(node_5, () => {
			var result = [];

			switch (_$_.get(level)) {
				case 1:
					result.push(switch_case_0_5);

				case 2:
					result.push(switch_case_1_4);

				case 3:
					result.push(switch_case_2_2);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

_$_.delegate(['click']);