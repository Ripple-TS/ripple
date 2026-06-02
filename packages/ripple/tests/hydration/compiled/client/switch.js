// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="status-success">Success</div>`, 1, 1);
var root_2 = _$_.template(`<div class="status-error">Error</div>`, 1, 1);
var root_3 = _$_.template(`<div class="status-unknown">Unknown</div>`, 1, 1);
var root = _$_.template(`<!>`, 1, 1);
var root_5 = _$_.template(`<div class="case-a">Case A</div>`, 1, 1);
var root_6 = _$_.template(`<div class="case-b">Case B</div>`, 1, 1);
var root_7 = _$_.template(`<div class="case-c">Case C</div>`, 1, 1);
var root_4 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1, 2);
var root_9 = _$_.template(`<div class="case-1-2">1 or 2</div>`, 1, 1);
var root_10 = _$_.template(`<div class="case-other">Other</div>`, 1, 1);
var root_8 = _$_.template(`<!>`, 1, 1);
var root_12 = _$_.template(`<div class="level-1">Level 1</div>`, 1, 1);
var root_13 = _$_.template(`<div class="level-2">Level 2</div>`, 1, 1);
var root_14 = _$_.template(`<div class="level-3">Level 3</div>`, 1, 1);
var root_11 = _$_.template(`<button class="level-toggle">Toggle Level</button><!>`, 1, 2);
var root_16 = _$_.template(`<div class="block-1">Block 1</div>`, 1, 1);
var root_17 = _$_.template(`<div class="block-2">Block 2</div>`, 1, 1);
var root_18 = _$_.template(`<div class="block-3">Block 3</div>`, 1, 1);
var root_15 = _$_.template(`<button class="block-toggle">Toggle</button><!>`, 1, 2);
var root_20 = _$_.template(`<div class="nobreak-1">NoBreak 1</div>`, 1, 1);
var root_21 = _$_.template(`<div class="nobreak-2">NoBreak 2</div>`, 1, 1);
var root_22 = _$_.template(`<div class="nobreak-3">NoBreak 3</div>`, 1, 1);
var root_19 = _$_.template(`<button class="nobreak-toggle">Toggle</button><!>`, 1, 2);

import { track } from 'ripple';

export function SwitchStatic() {
	return _$_.tsrx_element((__anchor, __block) => {
		const status = 'success';
		var fragment = root();
		var node = _$_.first_child_frag(fragment);

		{
			var switch_case_0 = (__anchor) => {
				var return_guard = false;
				var fragment_1 = root_1();

				return_guard = true;
				_$_.append(__anchor, fragment_1);
			};

			var switch_case_1 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_2 = root_2();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_2);
			};

			var switch_case_default = (__anchor) => {
				var return_guard_2 = false;
				var fragment_3 = root_3();

				return_guard_2 = true;
				_$_.append(__anchor, fragment_3);
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
	});
}

export function SwitchReactive() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track('a', __block, '9b34d955');
		var fragment_4 = root_4();
		var button_1 = _$_.first_child_frag(fragment_4);

		button_1.__click = () => {
			if (lazy.value === 'a') _$_.set(lazy, 'b'); else if (lazy.value === 'b') _$_.set(lazy, 'c'); else _$_.set(lazy, 'a');
		};

		var node_1 = _$_.sibling(button_1);

		{
			var switch_case_0_1 = (__anchor) => {
				var return_guard = false;
				var fragment_5 = root_5();

				return_guard = true;
				_$_.append(__anchor, fragment_5);
			};

			var switch_case_1_1 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_6 = root_6();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_6);
			};

			var switch_case_default_1 = (__anchor) => {
				var return_guard_2 = false;
				var fragment_7 = root_7();

				return_guard_2 = true;
				_$_.append(__anchor, fragment_7);
			};

			_$_.switch(node_1, () => {
				var result = [];

				switch (lazy.value) {
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

		_$_.append(__anchor, fragment_4);
	});
}

export function SwitchFallthrough() {
	return _$_.tsrx_element((__anchor, __block) => {
		const val = 1;
		var fragment_8 = root_8();
		var node_2 = _$_.first_child_frag(fragment_8);

		{
			var switch_case_0_2 = (__anchor) => {
				var return_guard = false;
				var fragment_9 = root_9();

				return_guard = true;
				_$_.append(__anchor, fragment_9);
			};

			var switch_case_default_2 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_10 = root_10();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_10);
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

		_$_.append(__anchor, fragment_8);
	});
}

export function SwitchNumericLevels() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(1, __block, '7581a7ab');
		var fragment_11 = root_11();
		var button_2 = _$_.first_child_frag(fragment_11);

		button_2.__click = () => {
			if (lazy_1.value === 1) _$_.set(lazy_1, 2); else if (lazy_1.value === 2) _$_.set(lazy_1, 3); else _$_.set(lazy_1, 1);
		};

		var node_3 = _$_.sibling(button_2);

		{
			var switch_case_0_3 = (__anchor) => {
				var return_guard = false;
				var fragment_12 = root_12();

				return_guard = true;
				_$_.append(__anchor, fragment_12);
			};

			var switch_case_1_2 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_13 = root_13();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_13);
			};

			var switch_case_2 = (__anchor) => {
				var return_guard_2 = false;
				var fragment_14 = root_14();

				return_guard_2 = true;
				_$_.append(__anchor, fragment_14);
			};

			_$_.switch(node_3, () => {
				var result = [];

				switch (lazy_1.value) {
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

		_$_.append(__anchor, fragment_11);
	});
}

export function SwitchBlockScoped() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track(1, __block, 'ca9f9852');
		var fragment_15 = root_15();
		var button_3 = _$_.first_child_frag(fragment_15);

		button_3.__click = () => {
			if (lazy_2.value === 1) _$_.set(lazy_2, 2); else if (lazy_2.value === 2) _$_.set(lazy_2, 3); else _$_.set(lazy_2, 1);
		};

		var node_4 = _$_.sibling(button_3);

		{
			var switch_case_0_4 = (__anchor) => {
				var return_guard = false;
				var fragment_16 = root_16();

				return_guard = true;
				_$_.append(__anchor, fragment_16);
			};

			var switch_case_1_3 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_17 = root_17();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_17);
			};

			var switch_case_2_1 = (__anchor) => {
				var return_guard_2 = false;
				var fragment_18 = root_18();

				return_guard_2 = true;
				_$_.append(__anchor, fragment_18);
			};

			_$_.switch(node_4, () => {
				var result = [];

				switch (lazy_2.value) {
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

		_$_.append(__anchor, fragment_15);
	});
}

export function SwitchNoBreak() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track(1, __block, '6b7cb0ea');
		var fragment_19 = root_19();
		var button_4 = _$_.first_child_frag(fragment_19);

		button_4.__click = () => {
			if (lazy_3.value === 1) _$_.set(lazy_3, 2); else if (lazy_3.value === 2) _$_.set(lazy_3, 3); else _$_.set(lazy_3, 1);
		};

		var node_5 = _$_.sibling(button_4);

		{
			var switch_case_0_5 = (__anchor) => {
				var return_guard = false;
				var fragment_20 = root_20();

				return_guard = true;
				_$_.append(__anchor, fragment_20);
			};

			var switch_case_1_4 = (__anchor) => {
				var return_guard_1 = false;
				var fragment_21 = root_21();

				return_guard_1 = true;
				_$_.append(__anchor, fragment_21);
			};

			var switch_case_2_2 = (__anchor) => {
				var return_guard_2 = false;
				var fragment_22 = root_22();

				return_guard_2 = true;
				_$_.append(__anchor, fragment_22);
			};

			_$_.switch(node_5, () => {
				var result = [];

				switch (lazy_3.value) {
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

		_$_.append(__anchor, fragment_19);
	});
}

_$_.delegate(['click']);