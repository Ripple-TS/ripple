// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><nav class="nav">Navigation</nav><main class="main"><!></main></div>`, 0);
var root_2 = _$_.template(`<p class="text">Hello world</p>`, 0);
var root_1 = _$_.template(`<div class="content"><!></div>`, 0);
var root_4 = _$_.template(`<!>`, 1, 1);
var root_3 = _$_.template(`<!>`, 1, 1);

import { track } from 'ripple';

export function Layout(__anchor, __props, __block) {
	_$_.push_component();

	var div_1 = root();

	{
		var nav_1 = _$_.child(div_1);
		var main_1 = _$_.sibling(nav_1);

		{
			var node = _$_.child(main_1);

			_$_.composite(() => __props.children, node, {});
			_$_.pop(main_1);
		}
	}

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function Content(__anchor, _, __block) {
	_$_.push_component();

	let visible = track(true, void 0, void 0, __block);
	var div_2 = root_1();

	{
		var node_1 = _$_.child(div_2);

		{
			var consequent = (__anchor) => {
				var p_1 = root_2();

				_$_.append(__anchor, p_1);
			};

			_$_.if(node_1, (__render) => {
				if (_$_.get(visible)) __render(consequent);
			});
		}

		_$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function LayoutWithContent(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root_3();
	var node_2 = _$_.first_child_frag(fragment);

	Layout(
		node_2,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_1 = root_4();
				var node_3 = _$_.first_child_frag(fragment_1);

				Content(node_3, {}, _$_.active_block);
				_$_.append(__anchor, fragment_1);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}