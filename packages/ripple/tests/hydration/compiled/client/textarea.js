// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<textarea>
</textarea>`);

var root_1 = _$_.template(`<form><textarea>
</textarea><button type=button>update`);

function render(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_value(__prev._b, __prev.a = __a);
	}
}

function Value_render(__anchor, __block, { initial, next }) {
	const text = _$_.track(initial, __block, 'a52697');
	var form = root_1();

	{
		var textarea_1 = _$_.hydrating ? _$_.hydrate_child() : form.firstChild;
		var button = _$_.hydrating ? _$_.hydrate_sibling() : textarea_1.nextSibling;

		button.__click = () => text.value = next;
	}

	_$_.render(render, { a: void 0, _a: text, _b: textarea_1 });
	_$_.append(__anchor, form);
}

Value[_$_.$r] = Value_render;

var root_2 = _$_.template(`<form><textarea>
</textarea><button type=button>update`);

function render_1(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function Child_render(__anchor, __block, { initial, next }) {
	const text = _$_.track(initial, __block, 'blawr5');
	var form_1 = root_2();

	{
		var textarea_2 = _$_.hydrating ? _$_.hydrate_child() : form_1.firstChild;
		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : textarea_2.nextSibling;

		button_1.__click = () => text.value = next;
	}

	_$_.render(render_1, { a: '', _a: text, _b: textarea_2 });
	_$_.append(__anchor, form_1);
}

Child[_$_.$r] = Child_render;

var root_3 = _$_.template(`<form><textarea>
</textarea><button type=button>update`);

function render_2(__prev) {
	var __a = "before:" + (String(__prev._a() ?? '') + (String(__prev._b.value ?? '') + ":after"));

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._c, __a, __prev.a);
		__prev.a = __a;
	}
}

function MixedChildren_render(__anchor, __block, { initial, next }) {
	const text = _$_.track(initial, __block, 'qrqvhj');
	const read = () => text.value;
	var form_2 = root_3();

	{
		var textarea_3 = _$_.hydrating ? _$_.hydrate_child() : form_2.firstChild;
		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : textarea_3.nextSibling;

		button_2.__click = () => text.value = next;
	}

	_$_.render(render_2, { a: '', _a: read, _b: text, _c: textarea_3 });
	_$_.append(__anchor, form_2);
}

MixedChildren[_$_.$r] = MixedChildren_render;

var root_4 = _$_.template(`<textarea>
hello &amp; &lt;world></textarea>`);

var root_5 = _$_.template(`<form><textarea>
</textarea><button type=button>update`);

function render_3(__prev) {
	__prev.a = _$_.spread(__prev._a, { value: __prev._b.value }, __prev.a);
}

function SpreadValue_render(__anchor, __block, { initial, next }) {
	const text = _$_.track(initial, __block, '1ypyugy');
	var form_3 = root_5();

	{
		var textarea_5 = _$_.hydrating ? _$_.hydrate_child() : form_3.firstChild;
		var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : textarea_5.nextSibling;

		button_3.__click = () => text.value = next;
	}

	_$_.render(render_3, { a: void 0, _a: textarea_5, _b: text });
	_$_.append(__anchor, form_3);
}

SpreadValue[_$_.$r] = SpreadValue_render;

import { track } from 'ripple';

export function StaticValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		var textarea = root();

		_$_.set_value(textarea, "hello & <world>");
		_$_.append(__anchor, textarea);
	});
}

export function Value(__props) {
	return _$_.tsrx_element(Value_render, __props);
}

export function Child(__props) {
	return _$_.tsrx_element(Child_render, __props);
}

export function MixedChildren(__props) {
	return _$_.tsrx_element(MixedChildren_render, __props);
}

export function StaticChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var textarea_4 = root_4();

		_$_.append(__anchor, textarea_4);
	});
}

export function SpreadValue(__props) {
	return _$_.tsrx_element(SpreadValue_render, __props);
}

_$_.delegate(['click']);