// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class=typed-run> <span>tail</span></div><p class=typed-number></p><button>update`, 1, 3);

function render(__prev) {
	var __row_value = __prev._a.value;
	var __a = 'value: ' + (__row_value.label + String(__row_value.count ?? ''));

	if (__prev.a !== __a) {
		_$_.set_text(__prev._b, __prev.a = __a);
	}

	var __b = (0, __row_value.count);

	if (__prev.b !== __b) {
		_$_.set_text_content(__prev._c, __b, __prev.b);
		__prev.b = __b;
	}
}

var root = _$_.template(`<!>`, 1, 1);

function TypedText_render(__anchor, __block) {
	const row = _$_.track({ label: '<first>', count: 2 }, __block, '179p9ai');
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_1();
		var div = _$_.first_child_frag(fragment_1);

		{
			var expression = _$_.hydrating ? _$_.hydrate_child(true) : div.firstChild;

			_$_.hydrating && _$_.pop(div);
		}

		var p = _$_.hydrating ? _$_.hydrate_sibling() : div.nextSibling;
		var button = _$_.hydrating ? _$_.hydrate_sibling() : p.nextSibling;

		button.__click = () => {
			row.value = { label: '&next', count: 3n };
		};

		_$_.render(render, { a: ' ', b: '', _a: row, _b: expression, _c: p });
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

TypedText[_$_.$r] = TypedText_render;

import { track } from 'ripple';

export function TypedText() {
	return _$_.tsrx_element(TypedText_render);
}

_$_.delegate(['click']);