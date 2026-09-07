// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="portal-content">Portal content</div>`, 0);
var root = _$_.template(`<div class="container"><h1>Main Content</h1><!></div>`, 0);
var root_3 = _$_.template(`<div class="portal-content">Portal is visible</div>`, 0);
var root_2 = _$_.template(`<div class="container"><button class="toggle">Toggle</button><!></div>`, 0);
var root_5 = _$_.template(`<div class="portal-content">Modal content</div>`, 0);
var root_4 = _$_.template(`<div><div class="main-content">Main page content</div><!><div class="footer">Footer</div></div>`, 0);
var root_7 = _$_.template(`<div class="portal-content">Portal content</div>`, 0);
var root_6 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div><!></div>`, 0);

import { Portal, track } from 'ripple';

export function SimplePortal() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div = root();

		{
			var h1 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;
			var node = _$_.hydrating ? _$_.hydrate_sibling() : h1.nextSibling;

			_$_.render_component(Portal, node, {
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children: _$_.tsrx_element((__anchor, __block) => {
					var div_1 = root_1();

					_$_.append(__anchor, div_1);
				})
			});

			_$_.pop(div);
		}

		_$_.append(__anchor, div);
	});
}

export function ConditionalPortal() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(true, __block, '4f6df174');
		var div_2 = root_2();

		{
			var button = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

			button.__click = () => _$_.set(lazy, !lazy.value);

			var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

			{
				var consequent = (__anchor) => {
					_$_.render_component(Portal, __anchor, {
						get target() {
							return typeof document !== 'undefined' ? document.body : null;
						},

						children: _$_.tsrx_element((__anchor, __block) => {
							var div_3 = root_3();

							_$_.append(__anchor, div_3);
						})
					});
				};

				_$_.if(node_1, (__render) => {
					if (lazy.value) __render(consequent);
				});
			}

			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

export function PortalWithMainContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_4 = root_4();

		{
			var div_5 = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;
			var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : div_5.nextSibling;

			_$_.render_component(Portal, node_2, {
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children: _$_.tsrx_element((__anchor, __block) => {
					var div_6 = root_5();

					_$_.append(__anchor, div_6);
				})
			});

			_$_.pop(div_4);
		}

		_$_.append(__anchor, div_4);
	});
}

export function NestedContentWithPortal() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_7 = root_6();

		{
			var div_8 = _$_.hydrating ? _$_.hydrate_child() : div_7.firstChild;

			_$_.pop(div_8);

			var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : div_8.nextSibling;

			_$_.render_component(Portal, node_3, {
				get target() {
					return typeof document !== 'undefined' ? document.body : null;
				},

				children: _$_.tsrx_element((__anchor, __block) => {
					var div_9 = root_7();

					_$_.append(__anchor, div_9);
				})
			});

			_$_.pop(div_7);
		}

		_$_.append(__anchor, div_7);
	});
}

_$_.delegate(['click']);