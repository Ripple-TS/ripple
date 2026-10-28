// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('button', ['class', 'child'], 'Child');

function Leaf_render(__anchor, __block) {
	var button = root();

	_$_.append(__anchor, button);
}

Leaf[_$_.$r] = Leaf_render;

var root_1 = _$_.template(`<!>`, 1, 1);

function Child_render(__anchor, __block) {
	_$_.for_keyed(
		__anchor,
		() => ['a'],
		(__anchor, pattern) => {
			var fragment = root_1();
			var expression = _$_.first_child_frag(fragment);

			_$_.expression(expression, () => _$_.with_scope(__block, Leaf));
			_$_.append(__anchor, fragment);
		},
		16
	);
}

Child[_$_.$r] = Child_render;

var root_3 = _$_.template(`<!>`, 1, 1);

function consequent(__anchor) {
	_$_.render_component(Child, __anchor, {});
}

function alternate(__anchor, { b: __block }) {
	var fragment_1 = root_3();
	var expression_1 = _$_.first_child_frag(fragment_1);

	_$_.expression(expression_1, () => _$_.with_scope(__block, Child));
	_$_.append(__anchor, fragment_1);
}

alternate.h = 1;

function if_1({ a: native }) {
	if (native) return consequent; else return alternate;
}

var root_4 = _$_.template_el('button', null, 'Error');

function consequent_1(__anchor, { b: native, c: __block }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			_$_.if(__anchor, if_1, true, { a: native, b: __block });
		},
		(__anchor) => {
			var button_2 = root_4();

			_$_.append(__anchor, button_2);
		},
		null,
		true
	);
}

function if_2({ a: shown }) {
	if (shown.value) return consequent_1;
}

var root_2 = _$_.template_el('section', null, [['button', ['id', 'toggle'], 'Toggle']]);

function render(__prev) {
	var __a = if_2({ a: __prev._a, b: __prev._b, c: __prev._c });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._d, __prev.a = __a);
	}
}

function ComponentCallCleanup_render(__anchor, __block, { native, initialShown }) {
	const shown = _$_.track(initialShown, __block, '18fvrp1');
	var section = root_2();

	{
		var button_1 = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;

		button_1.__click = () => shown.value = !shown.value;

		var node = _$_.hydrating
			? _$_.hydrate_sibling()
			: _$_.append_into(section, true);

		var ifs = _$_.if_static(node, if_2, 0, { a: shown, b: native, c: __block });

		_$_.hydrating && _$_.pop(section);
	}

	_$_.render(render, {
		a: _$_.UNINITIALIZED,
		_a: shown,
		_b: native,
		_c: __block,
		_d: ifs
	});

	_$_.append(__anchor, section);
}

ComponentCallCleanup[_$_.$r] = ComponentCallCleanup_render;

import { track } from 'ripple';

function Leaf() {
	return _$_.tsrx_element(Leaf_render);
}

function Child() {
	return _$_.tsrx_element(Child_render);
}

export function ComponentCallCleanup(__props) {
	return _$_.tsrx_element(ComponentCallCleanup_render, __props);
}

_$_.delegate(['click']);