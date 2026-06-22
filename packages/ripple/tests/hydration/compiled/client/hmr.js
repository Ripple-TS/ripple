// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><nav class="nav">Navigation</nav><main class="main"><!></main></div>`, 0);
var root_2 = _$_.template(`<p class="text">Hello world</p>`, 0);
var root_1 = _$_.template(`<div class="content"><!></div>`, 0);

import { track } from 'ripple';

export function Layout({ children }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_1 = root();

		{
			var nav_1 = _$_.child(div_1);
			var main_1 = _$_.sibling(nav_1);

			{
				var expression = _$_.child(main_1);

				_$_.expression(expression, () => children);
				_$_.pop(main_1);
			}
		}

		_$_.append(__anchor, div_1);
	});
}

export function Content() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(true, __block, '0bdb1500');
		var div_2 = root_1();

		{
			var node = _$_.child(div_2);

			{
				var consequent = (__anchor) => {
					var p_1 = root_2();

					_$_.append(__anchor, p_1);
				};

				_$_.if(node, (__render) => {
					if (lazy.value) __render(consequent);
				});
			}

			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

export function LayoutWithContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Layout, __anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Content, __anchor, {});
			})
		});
	});
}