// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var spread_excluded = ['open'];
var root = _$_.template_el('dialog', null, [['button', null, 'Update'], ['button', null, 'Toggle']]);

function render(__prev) {
	__prev.a = _$_.spread(__prev._a, { class: 'v' + __prev._b.value }, __prev.a, spread_excluded);

	var __b = __prev._c ? __prev._d.value : undefined;

	if (__prev.b !== __b) {
		__prev._a.open = __prev.b = __b;
	}
}

function Dialog_render(__anchor, __block, { managed = false }) {
	const version = _$_.track(0, __block, '18zhp6i');
	const open = _$_.track(false, __block, '1nw4vc3');
	var dialog = root();

	{
		var button = _$_.hydrating ? _$_.hydrate_child() : dialog.firstChild;

		button.__click = () => version.value++;

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = () => open.value = !open.value;
	}

	_$_.render(render, {
		a: void 0,
		b: _$_.UNINITIALIZED,
		_a: dialog,
		_b: version,
		_c: managed,
		_d: open
	});

	_$_.append(__anchor, dialog);
}

Dialog[_$_.$r] = Dialog_render;

import { track } from 'ripple';

export function Dialog(__props) {
	return _$_.tsrx_element(Dialog_render, __props);
}

export function ManagedDialog() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Dialog, __anchor, { managed: true });
	});
}

_$_.delegate(['click']);