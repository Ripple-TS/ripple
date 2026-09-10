// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><nav class="nav">Navigation</nav><main class="main"><!></main></div>`, 0);
var root_2 = _$_.template(`<p class="text">Hello world</p>`, 0);
var root_1 = _$_.template(`<div class="content"><!></div>`, 0);

function Content_render(__anchor, __block) {
	let lazy = _$_.track(true, __block, '0bdb1500');
	var div_1 = root_1();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		{
			var consequent = (__anchor) => {
				var p = root_2();

				_$_.append(__anchor, p);
			};

			_$_.if(node, (__render) => {
				if (lazy.value) __render(consequent);
			});
		}

		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
}

function LayoutWithContent_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Content, __anchor, {});
		})
	});
}

import { track } from 'ripple';

export function Layout({ children }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div = root();

		{
			var nav = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;
			var main = _$_.hydrating ? _$_.hydrate_sibling() : nav.nextSibling;

			{
				var expression = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;

				_$_.expression(expression, () => children);
				_$_.pop(main);
			}
		}

		_$_.append(__anchor, div);
	});
}

export function Content() {
	return _$_.tsrx_element(Content_render);
}

export function LayoutWithContent() {
	return _$_.tsrx_element(LayoutWithContent_render);
}