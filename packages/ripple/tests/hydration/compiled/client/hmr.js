// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class=layout><nav class=nav>Navigation</nav><main class=main><!>`);

function Layout_render(__anchor, __block, { children }) {
	var div = root();

	{
		var nav = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;
		var main = _$_.hydrating ? _$_.hydrate_sibling() : nav.nextSibling;

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;

			_$_.expression(expression, () => children);
			_$_.hydrating && _$_.pop(main);
		}
	}

	_$_.append(__anchor, div);
}

Layout[_$_.$r] = Layout_render;

var root_2 = _$_.template_el('p', ['class', 'text'], 'Hello world');

function consequent(__anchor, visible) {
	var p = root_2();

	_$_.append(__anchor, p);
}

function if_1(visible) {
	if (visible.value) return consequent;
}

var root_1 = _$_.template(`<div class=content><!>`);

function render(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

function Content_render(__anchor, __block) {
	const visible = _$_.track(true, __block, '3af9q8');
	var div_1 = root_1();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;
		var ifs = _$_.if_static(node, if_1, 0, visible);

		_$_.hydrating && _$_.pop(div_1);
	}

	_$_.render(render, { a: _$_.UNINITIALIZED, _a: visible, _b: ifs });
	_$_.append(__anchor, div_1);
}

Content[_$_.$r] = Content_render;

function LayoutWithContent_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Content, __anchor, {});
		})
	});
}

LayoutWithContent[_$_.$r] = LayoutWithContent_render;

import { track } from 'ripple';

export function Layout(__props) {
	return _$_.tsrx_element(Layout_render, __props);
}

export function Content() {
	return _$_.tsrx_element(Content_render);
}

export function LayoutWithContent() {
	return _$_.tsrx_element(LayoutWithContent_render);
}