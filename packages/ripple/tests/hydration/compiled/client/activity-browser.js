// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<section><input>`, 1, 1);

function Panel_render(__anchor, __block, { index }) {
	if (typeof window !== 'undefined') {
		_$_.with_scope(__block, () => window.recordActivity('initialize', index));

		const until = _$_.with_scope(__block, () => performance.now()) + 8;

		while (_$_.with_scope(__block, () => performance.now()) < until) {}

		_$_.with_scope(__block, () => setTimeout(
			() => {
				_$_.with_scope(__block, () => window.recordActivity('timer', index));
				_$_.with_scope(__block, () => document.querySelector('button')?.click());
			},
			0
		));
	}

	_$_.effect(() => {
		if (typeof window !== 'undefined') _$_.with_scope(__block, () => window.recordActivity('effect', index));
	});

	var fragment = root();
	var section = _$_.first_child_frag(fragment);

	{
		var input = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;

		_$_.set_value(input, 'panel ' + index);
	}

	_$_.hydrating && _$_.pop(section);
	_$_.append(__anchor, fragment);
}

Panel[_$_.$r] = Panel_render;

var root_2 = _$_.template(`<button>Input remains available</button><!>`, 1, 2);
var root_1 = _$_.template(`<!>`, 1, 1);

function App_render(__anchor, __block) {
	var fragment_1 = root_1();
	var node_1 = _$_.first_child_frag(fragment_1);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_2 = root_2();
		var button = _$_.first_child_frag(fragment_2);

		button.__click = () => _$_.with_scope(__block, () => window.recordActivity('input'));

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.for(
			node,
			() => _$_.with_scope(__block, () => Array.from({ length: 12 }, (_, index) => index)),
			(__anchor, index) => {
				_$_.render_component(Activity, __anchor, {
					mode: "hidden",
					children: _$_.tsrx_element((__anchor, __block) => {
						_$_.render_component(Panel, __anchor, { index });
					})
				});
			},
			0
		);

		_$_.append(__anchor, fragment_2);
	}));

	_$_.append(__anchor, fragment_1);
}

App[_$_.$r] = App_render;

import { Activity, effect } from 'ripple';

function Panel(__props) {
	return _$_.tsrx_element(Panel_render, __props);
}

export function App() {
	return _$_.tsrx_element(App_render);
}

_$_.delegate(['click']);