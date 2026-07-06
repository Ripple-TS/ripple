// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="status-success">Success</div>`, 0);
var root_1 = _$_.template(`<div class="status-error">Error</div>`, 0);
var root_2 = _$_.template(`<div class="status-unknown">Unknown</div>`, 0);
var root_5 = _$_.template(`<div class="case-a">Case A</div>`, 0);
var root_6 = _$_.template(`<div class="case-b">Case B</div>`, 0);
var root_7 = _$_.template(`<div class="case-c">Case C</div>`, 0);
var root_4 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1, 2);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_8 = _$_.template(`<div class="case-1-2">1 or 2</div>`, 0);
var root_9 = _$_.template(`<div class="case-other">Other</div>`, 0);
var root_12 = _$_.template(`<div class="level-1">Level 1</div>`, 0);
var root_13 = _$_.template(`<div class="level-2">Level 2</div>`, 0);
var root_14 = _$_.template(`<div class="level-3">Level 3</div>`, 0);
var root_11 = _$_.template(`<button class="level-toggle">Toggle Level</button><!>`, 1, 2);
var root_10 = _$_.template(`<!>`, 1, 1);
var root_17 = _$_.template(`<div class="block-1">Block 1</div>`, 0);
var root_18 = _$_.template(`<div class="block-2">Block 2</div>`, 0);
var root_19 = _$_.template(`<div class="block-3">Block 3</div>`, 0);
var root_16 = _$_.template(`<button class="block-toggle">Toggle</button><!>`, 1, 2);
var root_15 = _$_.template(`<!>`, 1, 1);
var root_22 = _$_.template(`<div class="nobreak-1">NoBreak 1</div>`, 0);
var root_23 = _$_.template(`<div class="nobreak-2">NoBreak 2</div>`, 0);
var root_24 = _$_.template(`<div class="nobreak-3">NoBreak 3</div>`, 0);
var root_21 = _$_.template(`<button class="nobreak-toggle">Toggle</button><!>`, 1, 2);
var root_20 = _$_.template(`<!>`, 1, 1);

import { track } from 'ripple';

export function SwitchStatic() {
	return _$_.tsrx_element((__anchor, __block) => {
		const status = 'success';

		{
			var switch_case_0 = (__anchor) => {
				var div = root();

				_$_.append(__anchor, div);
			};

			var switch_case_1 = (__anchor) => {
				var div_1 = root_1();

				_$_.append(__anchor, div_1);
			};

			var switch_case_default = (__anchor) => {
				var div_2 = root_2();

				_$_.append(__anchor, div_2);
			};

			_$_.switch(
				__anchor,
				() => {
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
				},
				true
			);
		}
	});
}

export function SwitchReactive() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track('a', __block, '9b34d955');
		var fragment = root_3();
		var node_1 = _$_.first_child_frag(fragment);

		_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_4();
			var button = _$_.first_child_frag(fragment_1);

			button.__click = () => {
				if (lazy.value === 'a') _$_.set(lazy, 'b'); else if (lazy.value === 'b') _$_.set(lazy, 'c'); else _$_.set(lazy, 'a');
			};

			var node = _$_.sibling(button);

			{
				var switch_case_0_1 = (__anchor) => {
					var div_3 = root_5();

					_$_.append(__anchor, div_3);
				};

				var switch_case_1_1 = (__anchor) => {
					var div_4 = root_6();

					_$_.append(__anchor, div_4);
				};

				var switch_case_default_1 = (__anchor) => {
					var div_5 = root_7();

					_$_.append(__anchor, div_5);
				};

				_$_.switch(node, () => {
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

			_$_.append(__anchor, fragment_1);
		}));

		_$_.append(__anchor, fragment);
	});
}

export function SwitchFallthrough() {
	return _$_.tsrx_element((__anchor, __block) => {
		const val = 1;

		{
			var switch_case_0_2 = (__anchor) => {
				var div_6 = root_8();

				_$_.append(__anchor, div_6);
			};

			var switch_case_default_2 = (__anchor) => {
				var div_7 = root_9();

				_$_.append(__anchor, div_7);
			};

			_$_.switch(
				__anchor,
				() => {
					var result = [];

					switch (val) {
						case 1:
							return result;

						case 2:
							result.push(switch_case_0_2);
							return result;

						default:
							result.push(switch_case_default_2);
							return result;
					}
				},
				true
			);
		}
	});
}

export function SwitchNumericLevels() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(1, __block, '7581a7ab');
		var fragment_2 = root_10();
		var node_3 = _$_.first_child_frag(fragment_2);

		_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_3 = root_11();
			var button_1 = _$_.first_child_frag(fragment_3);

			button_1.__click = () => {
				if (lazy_1.value === 1) _$_.set(lazy_1, 2); else if (lazy_1.value === 2) _$_.set(lazy_1, 3); else _$_.set(lazy_1, 1);
			};

			var node_2 = _$_.sibling(button_1);

			{
				var switch_case_0_3 = (__anchor) => {
					var div_8 = root_12();

					_$_.append(__anchor, div_8);
				};

				var switch_case_1_2 = (__anchor) => {
					var div_9 = root_13();

					_$_.append(__anchor, div_9);
				};

				var switch_case_2 = (__anchor) => {
					var div_10 = root_14();

					_$_.append(__anchor, div_10);
				};

				_$_.switch(node_2, () => {
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

			_$_.append(__anchor, fragment_3);
		}));

		_$_.append(__anchor, fragment_2);
	});
}

export function SwitchBlockScoped() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track(1, __block, 'ca9f9852');
		var fragment_4 = root_15();
		var node_5 = _$_.first_child_frag(fragment_4);

		_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_5 = root_16();
			var button_2 = _$_.first_child_frag(fragment_5);

			button_2.__click = () => {
				if (lazy_2.value === 1) _$_.set(lazy_2, 2); else if (lazy_2.value === 2) _$_.set(lazy_2, 3); else _$_.set(lazy_2, 1);
			};

			var node_4 = _$_.sibling(button_2);

			{
				var switch_case_0_4 = (__anchor) => {
					var div_11 = root_17();

					_$_.append(__anchor, div_11);
				};

				var switch_case_1_3 = (__anchor) => {
					var div_12 = root_18();

					_$_.append(__anchor, div_12);
				};

				var switch_case_2_1 = (__anchor) => {
					var div_13 = root_19();

					_$_.append(__anchor, div_13);
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

			_$_.append(__anchor, fragment_5);
		}));

		_$_.append(__anchor, fragment_4);
	});
}

export function SwitchNoBreak() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track(1, __block, '6b7cb0ea');
		var fragment_6 = root_20();
		var node_7 = _$_.first_child_frag(fragment_6);

		_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_7 = root_21();
			var button_3 = _$_.first_child_frag(fragment_7);

			button_3.__click = () => {
				if (lazy_3.value === 1) _$_.set(lazy_3, 2); else if (lazy_3.value === 2) _$_.set(lazy_3, 3); else _$_.set(lazy_3, 1);
			};

			var node_6 = _$_.sibling(button_3);

			{
				var switch_case_0_5 = (__anchor) => {
					var div_14 = root_22();

					_$_.append(__anchor, div_14);
				};

				var switch_case_1_4 = (__anchor) => {
					var div_15 = root_23();

					_$_.append(__anchor, div_15);
				};

				var switch_case_2_2 = (__anchor) => {
					var div_16 = root_24();

					_$_.append(__anchor, div_16);
				};

				_$_.switch(node_6, () => {
					var result = [];

					switch (lazy_3.value) {
						case 1:
							result.push(switch_case_0_5);
							return result;

						case 2:
							result.push(switch_case_1_4);
							return result;

						case 3:
							result.push(switch_case_2_2);
							return result;
					}
				});
			}

			_$_.append(__anchor, fragment_7);
		}));

		_$_.append(__anchor, fragment_6);
	});
}

_$_.delegate(['click']);