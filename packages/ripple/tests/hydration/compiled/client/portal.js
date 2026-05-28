// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="portal-content">Portal content</div>`, 1, 1);
var root = _$_.template(`<div class="container"><h1>Main Content</h1><!></div>`, 1, 1);
var root_4 = _$_.template(`<div class="portal-content">Portal is visible</div>`, 1, 1);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_2 = _$_.template(`<div class="container"><button class="toggle">Toggle</button><!></div>`, 1, 1);
var root_6 = _$_.template(`<div class="portal-content">Modal content</div>`, 1, 1);
var root_5 = _$_.template(`<div><div class="main-content">Main page content</div><!><div class="footer">Footer</div></div>`, 1, 1);
var root_8 = _$_.template(`<div class="portal-content">Portal content</div>`, 1, 1);
var root_7 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div><!></div>`, 1, 1);

import { Portal, track } from 'ripple';

export function SimplePortal(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();
	var div_1 = _$_.first_child_frag(fragment);

	{
		var h1_1 = _$_.child(div_1);
		var node = _$_.sibling(h1_1);

		Portal(
			node,
			{
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children: _$_.tsrx_element(function render_children(__anchor, __block) {
					var __r_1 = false;
					var fragment_1 = root_1();

					__r_1 = true;
					_$_.append(__anchor, fragment_1);
				})
			},
			_$_.active_block
		);

		_$_.pop(div_1);
	}

	__r = true;
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function ConditionalPortal(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;
	let lazy = _$_.track(true, __block, '4f6df174');
	var fragment_2 = root_2();
	var div_2 = _$_.first_child_frag(fragment_2);

	{
		var button_1 = _$_.child(div_2);

		button_1.__click = () => _$_.set(lazy, !lazy.value);

		var node_1 = _$_.sibling(button_1);

		{
			var consequent = (__anchor) => {
				var fragment_3 = root_3();
				var node_2 = _$_.first_child_frag(fragment_3);

				Portal(
					node_2,
					{
						get target() {
							return typeof document !== 'undefined' ? document.body : null;
						},

						children: _$_.tsrx_element(function render_children(__anchor, __block) {
							var __r_3 = false;
							var fragment_4 = root_4();

							__r_3 = true;
							_$_.append(__anchor, fragment_4);
						})
					},
					_$_.active_block
				);

				_$_.append(__anchor, fragment_3);
			};

			_$_.if(node_1, (__render) => {
				if (lazy.value) __render(consequent);
			});
		}

		_$_.pop(div_2);
	}

	__r_2 = true;
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function PortalWithMainContent(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	var fragment_5 = root_5();
	var div_4 = _$_.first_child_frag(fragment_5);

	{
		var div_3 = _$_.child(div_4);
		var node_3 = _$_.sibling(div_3);

		Portal(
			node_3,
			{
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children: _$_.tsrx_element(function render_children(__anchor, __block) {
					var __r_5 = false;
					var fragment_6 = root_6();

					__r_5 = true;
					_$_.append(__anchor, fragment_6);
				})
			},
			_$_.active_block
		);

		_$_.pop(div_4);
	}

	__r_4 = true;
	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function NestedContentWithPortal(__anchor, _, __block) {
	_$_.push_component();

	var __r_6 = false;
	var fragment_7 = root_7();
	var div_6 = _$_.first_child_frag(fragment_7);

	{
		var div_5 = _$_.child(div_6);

		_$_.pop(div_5);

		var node_4 = _$_.sibling(div_5);

		Portal(
			node_4,
			{
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children: _$_.tsrx_element(function render_children(__anchor, __block) {
					var __r_7 = false;
					var fragment_8 = root_8();

					__r_7 = true;
					_$_.append(__anchor, fragment_8);
				})
			},
			_$_.active_block
		);

		_$_.pop(div_6);
	}

	__r_6 = true;
	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

_$_.delegate(['click']);