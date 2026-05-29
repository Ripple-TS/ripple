// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="ready">ready</div>`, 0);
var root = _$_.template(`<!><!>`, 1, 2);
var root_3 = _$_.template(`<div class="ready">ready</div>`, 0);
var root_2 = _$_.template(`<!><!>`, 1, 2);
var root_4 = _$_.template(`hello`, 1, 1);

export function GuardReturnRenders(__anchor, _, __block) {
	_$_.push_component();

	var __r_1 = false;
	var __r = false;
	const ready = true;
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	{
		_$_.if(node, (__render) => {
			__r = false;

			if (!ready) __r = true;
		});
	}

	var node_1 = _$_.sibling(node);

	var content = (__anchor) => {
		var div_1 = root_1();

		_$_.append(__anchor, div_1);
	};

	_$_.if(node_1, (__render) => {
		if (!__r) __render(content);
	});

	__r_1 = true;
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function GuardReturnNull(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = false;
	var __r_2 = false;
	const ready = false;
	var fragment_1 = root_2();
	var node_2 = _$_.first_child_frag(fragment_1);

	{
		_$_.if(node_2, (__render) => {
			__r_2 = false;

			if (!ready) __r_2 = true;
		});
	}

	var node_3 = _$_.sibling(node_2);

	var content_1 = (__anchor) => {
		var div_2 = root_3();

		_$_.append(__anchor, div_2);
	};

	_$_.if(node_3, (__render) => {
		if (!__r_2) __render(content_1);
	});

	__r_3 = true;
	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function StringReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	var fragment_2 = root_4();

	__r_4 = true;
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}