import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="before">Before</div>`, 1);
var root_2 = _$_.template(`<div class="after">After</div>`, 0);
var root = _$_.template(`<!><!>`, 1);
var root_4 = _$_.template(`<div class="before">Before</div>`, 1);
var root_5 = _$_.template(`<div class="after">After</div>`, 0);
var root_3 = _$_.template(`<!><!>`, 1);
var root_7 = _$_.template(`<div class="stop">Stopped</div>`, 1);
var root_8 = _$_.template(`<div class="after">After</div>`, 0);
var root_6 = _$_.template(`<button class="toggle">Toggle</button><!><!>`, 1);
var root_10 = _$_.template(`<div class="after-lone">After lone</div>`, 0);
var root_9 = _$_.template(`<button class="toggle-lone">Toggle lone</button><!><!>`, 1);

import { track } from 'ripple';

export function EarlyReturnStaticTrue(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	{
		var consequent = (__anchor) => {
			var fragment_1 = root_1();

			__r = true;
			_$_.append(__anchor, fragment_1);
		};

		_$_.if(node, (__render) => {
			__r = false;

			if (true) __render(consequent);
		});
	}

	var node_1 = _$_.sibling(node);

	var content = (__anchor) => {
		var div_1 = root_2();

		_$_.append(__anchor, div_1);
	};

	_$_.if(node_1, (__render) => {
		if (!__r) __render(content);
	});

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function EarlyReturnStaticFalse(__anchor, _, __block) {
	_$_.push_component();

	var __r_1 = false;
	var fragment_2 = root_3();
	var node_2 = _$_.first_child_frag(fragment_2);

	{
		var consequent_1 = (__anchor) => {
			var fragment_3 = root_4();

			__r_1 = true;
			_$_.append(__anchor, fragment_3);
		};

		_$_.if(node_2, (__render) => {
			__r_1 = false;

			if (false) __render(consequent_1);
		});
	}

	var node_3 = _$_.sibling(node_2);

	var content_1 = (__anchor) => {
		var div_2 = root_5();

		_$_.append(__anchor, div_2);
	};

	_$_.if(node_3, (__render) => {
		if (!__r_1) __render(content_1);
	});

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function ReactiveEarlyReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = _$_.tracked(false);
	let stop = track(true, void 0, void 0, __block);
	var fragment_4 = root_6();
	var button_1 = _$_.first_child_frag(fragment_4);

	button_1.__click = () => {
		_$_.set(stop, !_$_.get(stop));
	};

	var node_4 = _$_.sibling(button_1);

	{
		var consequent_2 = (__anchor) => {
			var fragment_5 = root_7();

			_$_.set(__r_2, true);
			_$_.append(__anchor, fragment_5);
		};

		_$_.if(node_4, (__render) => {
			_$_.set(__r_2, false);

			if (_$_.get(stop)) __render(consequent_2);
		});
	}

	var node_5 = _$_.sibling(node_4);

	var content_2 = (__anchor) => {
		var div_3 = root_8();

		_$_.append(__anchor, div_3);
	};

	_$_.if(node_5, (__render) => {
		if (!_$_.get(__r_2)) __render(content_2);
	});

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function ReactiveLoneReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = _$_.tracked(false);
	let stop = track(true, void 0, void 0, __block);
	var fragment_6 = root_9();
	var button_2 = _$_.first_child_frag(fragment_6);

	button_2.__click = () => {
		_$_.set(stop, !_$_.get(stop));
	};

	var node_6 = _$_.sibling(button_2);

	{
		_$_.if(node_6, (__render) => {
			_$_.set(__r_3, false);

			if (_$_.get(stop)) _$_.set(__r_3, true);
		});
	}

	var node_7 = _$_.sibling(node_6);

	var content_3 = (__anchor) => {
		var div_4 = root_10();

		_$_.append(__anchor, div_4);
	};

	_$_.if(node_7, (__render) => {
		if (!_$_.get(__r_3)) __render(content_3);
	});

	_$_.append(__anchor, fragment_6);
	_$_.pop_component();
}

_$_.delegate(['click']);