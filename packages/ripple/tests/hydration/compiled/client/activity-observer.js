// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('p', ['class', 'panel'], ' ');

function Panel_render(__anchor, __block, { version }) {
	const data = _$_.track_async(() => _$_.with_scope(__block, () => load(version.value)), __block, 'i6d8b9');

	_$_.with_scope(__block, () => calls.push('initialize'));

	_$_.effect(() => {
		_$_.with_scope(__block, () => calls.push(`effect:${data.value}`));
	});

	var p = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

		_$_.expression(expression, () => data.value);
		_$_.hydrating && _$_.pop(p);
	}

	_$_.append(__anchor, p);
}

Panel[_$_.$r] = Panel_render;

var root_1 = _$_.template_el('p', ['class', 'visible']);

function render(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function Sibling_render(__anchor, __block, { count }) {
	controls.sibling = _$_.with_scope(__block, createRenderObserver);

	var p_1 = root_1();

	_$_.render(render, { a: '', _a: count, _b: p_1 });
	_$_.append(__anchor, p_1);
}

Sibling[_$_.$r] = Sibling_render;

var root_2 = _$_.template_el('aside', null, 'background');

function Background_render(__anchor, __block) {
	_$_.with_scope(__block, () => calls.push('background'));

	var aside = root_2();

	_$_.append(__anchor, aside);
}

Background[_$_.$r] = Background_render;

var root_4 = _$_.template_el('strong', ['class', 'caught'], ' ');
var root_5 = _$_.template_el('em', ['class', 'pending'], 'loading');

function consequent(__anchor, { b: mode, c: version }) {
	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					_$_.render_component(Panel, __anchor, { version });
				},
				(__anchor, error) => {
					var strong = root_4();

					{
						var expression_2 = _$_.hydrating ? _$_.hydrate_child() : strong.firstChild;

						_$_.expression(expression_2, () => error.message);
						_$_.hydrating && _$_.pop(strong);
					}

					_$_.append(__anchor, strong);
				},
				(__anchor) => {
					var em = root_5();

					_$_.append(__anchor, em);
				},
				true
			);
		})
	});
}

function if_1({ a: exists }) {
	if (exists.value) return consequent;
}

var root_3 = _$_.template(`<!><!><!>`, 1, 3);

function render_1(__prev) {
	var __a = if_1({ a: __prev._a, b: __prev._b, c: __prev._c });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._d, __prev.a = __a);
	}
}

function App_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, 'mxbfeh');
	const version = _$_.track(0, __block, '1x6c9r5');
	const count = _$_.track(0, __block, '1pfmv0g');
	const exists = _$_.track(true, __block, 'k7fzil');

	controls = {
		mode,
		version,
		count,
		exists,
		observer: _$_.with_scope(__block, createRenderObserver)
	};

	var fragment = root_3();
	var node = _$_.first_child_frag(fragment);

	_$_.render_component(Sibling, node, { count });

	var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;
	var ifs = _$_.if_static(node_1, if_1, 0, { a: exists, b: mode, c: version });
	var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1.nextSibling;

	_$_.render_component(Activity, node_2, {
		mode: "hidden",
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Background, __anchor, {});
		})
	});

	_$_.render(render_1, {
		a: _$_.UNINITIALIZED,
		_a: exists,
		_b: mode,
		_c: version,
		_d: ifs
	});

	_$_.append(__anchor, fragment);
}

App[_$_.$r] = App_render;

import { Activity, createRenderObserver, effect, track, trackAsync } from 'ripple';

export const calls = [];
export let controls;

let load = (version) => Promise.resolve('server:' + version);

export function setLoad(fn) {
	load = fn;
}

function Panel(__props) {
	return _$_.tsrx_element(Panel_render, __props);
}

function Sibling(__props) {
	return _$_.tsrx_element(Sibling_render, __props);
}

function Background() {
	return _$_.tsrx_element(Background_render);
}

export function App() {
	return _$_.tsrx_element(App_render);
}