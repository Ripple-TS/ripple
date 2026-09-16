// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class=typed-run> <span>tail</span></div><p class=typed-number></p><button>update`, 1, 3);

function render(__prev) {
	var __a = 'value: ' + (__prev._row.value.label + String(__prev._row.value.count ?? ''));

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression, __prev.a = __a);
	}

	var __b = (0, __prev._row.value.count);

	if (__prev.b !== __b) {
		_$_.set_text_content(__prev._p, __b, __prev.b);
		__prev.b = __b;
	}
}

var root = _$_.template(`<!>`, 1, 1);

function TypedText_render(__anchor, __block) {
	const row = _$_.track({ label: '<first>', count: 2 }, __block, '9bf2304a');
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

		_$_.render(render, { a: ' ', b: '', _row: row, _expression: expression, _p: p });
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