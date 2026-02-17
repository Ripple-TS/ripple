import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="status-success">Success</div>`, 1);
var root_2 = _$_.template(`<div class="status-error">Error</div>`, 1);
var root_3 = _$_.template(`<div class="status-unknown">Unknown</div>`, 0);
var root = _$_.template(`<!>`, 1);
var root_5 = _$_.template(`<div class="case-a">Case A</div>`, 1);
var root_6 = _$_.template(`<div class="case-b">Case B</div>`, 1);
var root_7 = _$_.template(`<div class="case-c">Case C</div>`, 0);
var root_4 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1);
var root_9 = _$_.template(`<div class="case-1-2">1 or 2</div>`, 1);
var root_10 = _$_.template(`<div class="case-other">Other</div>`, 0);
var root_8 = _$_.template(`<!>`, 1);

import { track } from 'ripple';

export function SwitchStatic(__anchor, _, __block) {
	_$_.push_component();

	const status = 'success';
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	{
		var switch_case_0 = (__anchor) => {
			var fragment_1 = root_1();

			_$_.append(__anchor, fragment_1);
		};

		var switch_case_1 = (__anchor) => {
			var fragment_2 = root_2();

			_$_.append(__anchor, fragment_2);
		};

		var switch_case_default = (__anchor) => {
			var div_1 = root_3();

			_$_.append(__anchor, div_1);
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
	var fragment_3 = root_4();
	var button_1 = _$_.first_child_frag(fragment_3);

	button_1.__click = () => {
		if (_$_.get(status) === 'a') _$_.set(status, 'b'); else if (_$_.get(status) === 'b') _$_.set(status, 'c'); else _$_.set(status, 'a');
	};

	var node_1 = _$_.sibling(button_1);

	{
		var switch_case_0_1 = (__anchor) => {
			var fragment_4 = root_5();

			_$_.append(__anchor, fragment_4);
		};

		var switch_case_1_1 = (__anchor) => {
			var fragment_5 = root_6();

			_$_.append(__anchor, fragment_5);
		};

		var switch_case_default_1 = (__anchor) => {
			var div_2 = root_7();

			_$_.append(__anchor, div_2);
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

	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function SwitchFallthrough(__anchor, _, __block) {
	_$_.push_component();

	const val = 1;
	var fragment_6 = root_8();
	var node_2 = _$_.first_child_frag(fragment_6);

	{
		var switch_case_0_2 = (__anchor) => {
			var fragment_7 = root_9();

			_$_.append(__anchor, fragment_7);
		};

		var switch_case_default_2 = (__anchor) => {
			var div_3 = root_10();

			_$_.append(__anchor, div_3);
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

	_$_.append(__anchor, fragment_6);
	_$_.pop_component();
}

_$_.delegate(['click']);