import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="portal-content">Portal content</div>`, 0);
var root = _$_.template(`<div class="container"><h1>Main Content</h1><!></div>`, 0);
var root_4 = _$_.template(`<div class="portal-content">Portal is visible</div>`, 0);
var root_3 = _$_.template(`<!>`, 1);
var root_2 = _$_.template(`<div class="container"><button class="toggle">Toggle</button><!></div>`, 0);
var root_6 = _$_.template(`<div class="portal-content">Modal content</div>`, 0);
var root_5 = _$_.template(`<div><div class="main-content">Main page content</div><!><div class="footer">Footer</div></div>`, 0);
var root_8 = _$_.template(`<div class="portal-content">Portal content</div>`, 0);
var root_7 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div><!></div>`, 0);

import { Portal } from 'ripple';

export function SimplePortal(__anchor, _, __block) {
	_$_.push_component();

	var div_1 = root();

	{
		var h1_1 = _$_.child(div_1);
		var node = _$_.sibling(h1_1);

		Portal(
			node,
			{
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children(__anchor, _, __block) {
					_$_.push_component();

					var div_2 = root_1();

					_$_.append(__anchor, div_2);
					_$_.pop_component();
				}
			},
			_$_.active_block
		);

		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function ConditionalPortal(__anchor, _, __block) {
	_$_.push_component();

	let show = _$_.get(true);
	var div_3 = root_2();

	{
		var button_1 = _$_.child(div_3);

		button_1.__click = () => _$_.set(show, !_$_.get(show));

		var node_1 = _$_.sibling(button_1);

		{
			var consequent = (__anchor) => {
				var fragment = root_3();
				var node_2 = _$_.first_child_frag(fragment);

				Portal(
					node_2,
					{
						get target() {
							return typeof document !== 'undefined' ? document.body : null;
						},

						children(__anchor, _, __block) {
							_$_.push_component();

							var div_4 = root_4();

							_$_.append(__anchor, div_4);
							_$_.pop_component();
						}
					},
					_$_.active_block
				);

				_$_.append(__anchor, fragment);
			};

			_$_.if(node_1, (__render) => {
				if (_$_.get(show)) __render(consequent);
			});
		}

		_$_.pop(div_3);
	}

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function PortalWithMainContent(__anchor, _, __block) {
	_$_.push_component();

	var div_5 = root_5();

	{
		var div_6 = _$_.child(div_5);
		var node_3 = _$_.sibling(div_6);

		Portal(
			node_3,
			{
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children(__anchor, _, __block) {
					_$_.push_component();

					var div_7 = root_6();

					_$_.append(__anchor, div_7);
					_$_.pop_component();
				}
			},
			_$_.active_block
		);

		_$_.pop(div_5);
	}

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function NestedContentWithPortal(__anchor, _, __block) {
	_$_.push_component();

	var div_8 = root_7();

	{
		var div_9 = _$_.child(div_8);

		_$_.pop(div_9);

		var node_4 = _$_.sibling(div_9);

		Portal(
			node_4,
			{
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children(__anchor, _, __block) {
					_$_.push_component();

					var div_10 = root_8();

					_$_.append(__anchor, div_10);
					_$_.pop_component();
				}
			},
			_$_.active_block
		);

		_$_.pop(div_8);
	}

	_$_.append(__anchor, div_8);
	_$_.pop_component();
}

_$_.delegate(['click']);