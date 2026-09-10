// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="content"><!></div>`, 0);
var root = _$_.template(`<div class="container"><div role="button" class="header">Toggle</div><!></div>`, 0);
var root_2 = _$_.template(`<div class="item"> </div>`, 0);
var root_3 = _$_.template(`<!><!>`, 1, 2);

function TestIfWithChildren_render(__anchor, __block) {
	_$_.render_component(IfWithChildren, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment = root_3();
			var node_1 = _$_.first_child_frag(fragment);

			_$_.render_component(ChildItem, node_1, { text: "Item 1" });

			var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1.nextSibling;

			_$_.render_component(ChildItem, node_2, { text: "Item 2" });
			_$_.append(__anchor, fragment);
		})
	});
}

var root_5 = _$_.template(`<div class="content"><span>Static child 1</span><span>Static child 2</span></div>`, 0);
var root_4 = _$_.template(`<div class="container"><div role="button" class="header">Toggle</div><!></div>`, 0);

function IfWithStaticChildren_render(__anchor, __block) {
	let lazy_1 = _$_.track(true, __block, '3bba8f77');
	var div_4 = root_4();

	{
		var div_5 = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

		div_5.__click = () => _$_.set(lazy_1, !lazy_1.value);

		var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : div_5.nextSibling;

		{
			var consequent_1 = (__anchor) => {
				var div_6 = root_5();

				_$_.append(__anchor, div_6);
			};

			_$_.if(node_3, (__render) => {
				if (lazy_1.value) __render(consequent_1);
			});
		}

		_$_.pop(div_4);
	}

	_$_.append(__anchor, div_4);
}

var root_7 = _$_.template(`<div class="items"><!></div>`, 0);
var root_6 = _$_.template(`<section class="group"><div role="button" class="item"><div class="indicator"></div><h2 class="text">Title</h2><div class="caret"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg></div></div><!></section>`, 0);
var root_8 = _$_.template(`<!><!>`, 1, 2);

function TestIfWithSiblingsAndChildren_render(__anchor, __block) {
	_$_.render_component(IfWithSiblingsAndChildren, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_8();
			var node_5 = _$_.first_child_frag(fragment_1);

			_$_.render_component(ChildItem, node_5, { text: "Item A" });

			var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_5.nextSibling;

			_$_.render_component(ChildItem, node_6, { text: "Item B" });
			_$_.append(__anchor, fragment_1);
		})
	});
}

var root_11 = _$_.template(`<div class="conditional">Conditional content</div>`, 0);
var root_10 = _$_.template(`<div class="wrapper"><div class="nested-parent"><div class="nested-child"><span class="deep">Deep content</span></div></div><!></div><button class="toggle">Toggle</button>`, 1, 2);
var root_9 = _$_.template(`<!>`, 1, 1);

function ElementWithChildrenThenIf_render(__anchor, __block) {
	let lazy_3 = _$_.track(true, __block, '7cd4817b');
	var fragment_2 = root_9();
	var node_8 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_10();
		var div_10 = _$_.first_child_frag(fragment_3);

		{
			var div_9 = _$_.hydrating ? _$_.hydrate_child() : div_10.firstChild;
			var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : div_9.nextSibling;

			{
				var consequent_3 = (__anchor) => {
					var div_11 = root_11();

					_$_.append(__anchor, div_11);
				};

				_$_.if(node_7, (__render) => {
					if (lazy_3.value) __render(consequent_3);
				});
			}

			_$_.pop(div_10);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : div_10.nextSibling;

		button.__click = () => _$_.set(lazy_3, !lazy_3.value);
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

var root_14 = _$_.template(`<footer class="footer">Footer</footer>`, 0);
var root_13 = _$_.template(`<section class="outer"><article class="middle"><div class="inner"><p class="leaf"><strong>Bold</strong><em>Italic</em></p></div></article><!></section><button class="btn">Toggle</button>`, 1, 2);
var root_12 = _$_.template(`<!>`, 1, 1);

function DeepNestingThenIf_render(__anchor, __block) {
	let lazy_4 = _$_.track(true, __block, '923116be');
	var fragment_4 = root_12();
	var node_10 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_10, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_13();
		var section_1 = _$_.first_child_frag(fragment_5);

		{
			var article = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;
			var node_9 = _$_.hydrating ? _$_.hydrate_sibling() : article.nextSibling;

			{
				var consequent_4 = (__anchor) => {
					var footer = root_14();

					_$_.append(__anchor, footer);
				};

				_$_.if(node_9, (__render) => {
					if (lazy_4.value) __render(consequent_4);
				});
			}

			_$_.pop(section_1);
		}

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : section_1.nextSibling;

		button_1.__click = () => _$_.set(lazy_4, !lazy_4.value);
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

var root_16 = _$_.template(`<pre class="code">const x = 1;</pre>`, 0);
var root_17 = _$_.template(`<div class="preview">Preview content</div>`, 0);
var root_15 = _$_.template(`<div class="tabs"><div class="tab-list"><button class="tab">Code</button><button class="tab">Preview</button></div><div class="panel"><!></div></div>`, 0);

function DomElementChildrenThenSibling_render(__anchor, __block) {
	let lazy_5 = _$_.track('code', __block, '33a1e97f');
	var div_12 = root_15();

	{
		var div_13 = _$_.hydrating ? _$_.hydrate_child() : div_12.firstChild;

		{
			var button_2 = _$_.hydrating ? _$_.hydrate_child() : div_13.firstChild;

			button_2.__click = () => _$_.set(lazy_5, 'code');

			var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

			button_3.__click = () => _$_.set(lazy_5, 'preview');
		}

		_$_.pop(div_13);

		var div_14 = _$_.hydrating ? _$_.hydrate_sibling() : div_13.nextSibling;

		{
			var node_11 = _$_.hydrating ? _$_.hydrate_child() : div_14.firstChild;

			{
				var consequent_5 = (__anchor) => {
					var pre = root_16();

					_$_.append(__anchor, pre);
				};

				var alternate = (__anchor) => {
					var div_15 = root_17();

					_$_.append(__anchor, div_15);
				};

				_$_.if(node_11, (__render) => {
					if (lazy_5.value === 'code') __render(consequent_5); else __render(alternate, false);
				});
			}

			_$_.pop(div_14);
		}
	}

	_$_.render(
		(__prev) => {
			var __a = lazy_5.value === 'code' ? 'true' : 'false';

			if (__prev.a !== __a) {
				_$_.set_attribute(button_2, 'aria-selected', __prev.a = __a);
			}

			var __b = lazy_5.value === 'preview' ? 'true' : 'false';

			if (__prev.b !== __b) {
				_$_.set_attribute(button_3, 'aria-selected', __prev.b = __b);
			}
		},
		{ a: void 0, b: void 0 }
	);

	_$_.append(__anchor, div_12);
}

var root_19 = _$_.template(`<div class="container"><ul class="list"><li class="item"> </li><li class="item">Another item</li></ul><h2 class="heading">Static Heading</h2><p class="para">Static paragraph</p></div><button class="inc">Increment</button>`, 1, 2);
var root_18 = _$_.template(`<!>`, 1, 1);

function DomChildrenThenStaticSiblings_render(__anchor, __block) {
	let lazy_6 = _$_.track(0, __block, '0ea64305');
	var fragment_6 = root_18();
	var node_12 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_12, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_19();
		var div_16 = _$_.first_child_frag(fragment_7);

		{
			var ul = _$_.hydrating ? _$_.hydrate_child() : div_16.firstChild;

			{
				var li = _$_.hydrating ? _$_.hydrate_child() : ul.firstChild;

				{
					var expression_3 = _$_.hydrating ? _$_.hydrate_text() : li.firstChild;
				}
			}

			_$_.pop(ul);
		}

		_$_.pop(div_16);

		var button_4 = _$_.hydrating ? _$_.hydrate_sibling() : div_16.nextSibling;

		button_4.__click = () => _$_.update(lazy_6);

		_$_.render(
			(__prev) => {
				var __a = 'Item count: ' + String(lazy_6.value ?? '');

				if (__prev.a !== __a) {
					_$_.set_text(expression_3, __prev.a = __a);
				}
			},
			{ a: ' ' }
		);

		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

var root_20 = _$_.template(`<div class="wrapper"><ul class="features"><li><strong>Feature One</strong>: Description of feature one with <code>code</code> reference</li><li><strong>Feature Two</strong>: Another feature description</li><li><strong>Feature Three</strong>: Third feature</li></ul><h2 class="section-heading">Section Heading</h2><p class="section-content">Static paragraph with <a href="/link">a link</a> and more text.</p></div>`, 0);

function StaticListThenStaticSiblings_render(__anchor, __block) {
	var div_17 = root_20();

	_$_.append(__anchor, div_17);
}

var root_21 = _$_.template(`<span class="root-if">on</span>`, 0);
var root_22 = _$_.template(`<span class="root-if">off</span>`, 0);

function RootIfChild_render(__anchor, __block, props) {
	{
		var consequent_6 = (__anchor) => {
			var span = root_21();

			_$_.append(__anchor, span);
		};

		var alternate_1 = (__anchor) => {
			var span_1 = root_22();

			_$_.append(__anchor, span_1);
		};

		_$_.if(
			__anchor,
			(__render) => {
				if (props.on) __render(consequent_6); else __render(alternate_1, false);
			},
			true
		);
	}
}

var root_23 = _$_.template(`<span class="root-for"> </span>`, 0);

function RootForChild_render(__anchor, __block, props) {
	_$_.for_keyed(
		__anchor,
		() => props.items,
		(__anchor, pattern) => {
			var span_2 = root_23();

			{
				var expression_4 = _$_.hydrating ? _$_.hydrate_text() : span_2.firstChild;
			}

			_$_.render(
				(__prev) => {
					var __a = _$_.get(pattern);

					if (__prev.a !== __a) {
						_$_.set_text(expression_4, __prev.a = __a);
					}
				},
				{ a: ' ' }
			);

			_$_.append(__anchor, span_2);
		},
		16
	);
}

var root_24 = _$_.template(`<span class="trailing">end</span>`, 0);

function TrailingChild_render(__anchor, __block) {
	var span_3 = root_24();

	_$_.append(__anchor, span_3);
}

var props_site;
var props_site_1;
var root_25 = _$_.template(`<div class="wrapper"><div class="host"></div><button class="toggle">Toggle</button><button class="rotate">Rotate</button></div>`, 0);

function ComponentChildrenWithControlFlowRoots_render(__anchor, __block) {
	let lazy_7 = _$_.track(true, __block, 'f3e4c6ee');
	let lazy_8 = _$_.track([1, 2, 3], __block, '2bbbeeb0');
	var div_18 = root_25();

	{
		var div_19 = _$_.hydrating ? _$_.hydrate_child() : div_18.firstChild;

		{
			var append_anchor = _$_.append_into(div_19);

			_$_.render_component(RootIfChild, append_anchor, new (props_site ??= _$_.props_site(['on'], 1, 1, 0, { C: null, on: (__p) => __p[_$_.$0].value })).C(props_site, lazy_7));
			_$_.render_component(RootForChild, append_anchor, new (props_site_1 ??= _$_.props_site(['items'], 1, 1, 0, { C: null, items: (__p) => __p[_$_.$0].value })).C(props_site_1, lazy_8));
			_$_.render_component(TrailingChild, append_anchor, {});
			_$_.pop(div_19);
		}

		var button_5 = _$_.hydrating ? _$_.hydrate_sibling() : div_19.nextSibling;

		button_5.__click = () => _$_.set(lazy_7, !lazy_7.value);

		var button_6 = _$_.hydrating ? _$_.hydrate_sibling() : button_5.nextSibling;

		button_6.__click = () => _$_.set(lazy_8, [lazy_8.value[1], lazy_8.value[2], lazy_8.value[0]]);
	}

	_$_.append(__anchor, div_18);
}

import { track } from 'ripple';

export function IfWithChildren({ children }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(true, __block, 'c64714b1');
		var div = root();

		{
			var div_1 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

			div_1.__click = () => _$_.set(lazy, !lazy.value);

			var node = _$_.hydrating ? _$_.hydrate_sibling() : div_1.nextSibling;

			{
				var consequent = (__anchor) => {
					var div_2 = root_1();

					{
						var expression = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

						_$_.expression(expression, () => children);
						_$_.pop(div_2);
					}

					_$_.append(__anchor, div_2);
				};

				_$_.if(node, (__render) => {
					if (lazy.value) __render(consequent);
				});
			}

			_$_.pop(div);
		}

		_$_.append(__anchor, div);
	});
}

export function ChildItem({ text: label }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_3 = root_2();

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_text() : div_3.firstChild;

			expression_1.nodeValue = label;
		}

		_$_.append(__anchor, div_3);
	});
}

export function TestIfWithChildren() {
	return _$_.tsrx_element(TestIfWithChildren_render);
}

export function IfWithStaticChildren() {
	return _$_.tsrx_element(IfWithStaticChildren_render);
}

export function IfWithSiblingsAndChildren({ children }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track(true, __block, 'a1b8fb4c');
		var section = root_6();

		{
			var div_7 = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;

			div_7.__click = () => _$_.set(lazy_2, !lazy_2.value);
			_$_.pop(div_7);

			var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : div_7.nextSibling;

			{
				var consequent_2 = (__anchor) => {
					var div_8 = root_7();

					{
						var expression_2 = _$_.hydrating ? _$_.hydrate_child() : div_8.firstChild;

						_$_.expression(expression_2, () => children);
						_$_.pop(div_8);
					}

					_$_.append(__anchor, div_8);
				};

				_$_.if(node_4, (__render) => {
					if (lazy_2.value) __render(consequent_2);
				});
			}

			_$_.pop(section);
		}

		_$_.append(__anchor, section);
	});
}

export function TestIfWithSiblingsAndChildren() {
	return _$_.tsrx_element(TestIfWithSiblingsAndChildren_render);
}

export function ElementWithChildrenThenIf() {
	return _$_.tsrx_element(ElementWithChildrenThenIf_render);
}

export function DeepNestingThenIf() {
	return _$_.tsrx_element(DeepNestingThenIf_render);
}

export function DomElementChildrenThenSibling() {
	return _$_.tsrx_element(DomElementChildrenThenSibling_render);
}

export function DomChildrenThenStaticSiblings() {
	return _$_.tsrx_element(DomChildrenThenStaticSiblings_render);
}

export function StaticListThenStaticSiblings() {
	return _$_.tsrx_element(StaticListThenStaticSiblings_render);
}

function RootIfChild(props) {
	return _$_.tsrx_element(RootIfChild_render, props);
}

function RootForChild(props) {
	return _$_.tsrx_element(RootForChild_render, props);
}

function TrailingChild() {
	return _$_.tsrx_element(TrailingChild_render);
}

export function ComponentChildrenWithControlFlowRoots() {
	return _$_.tsrx_element(ComponentChildrenWithControlFlowRoots_render);
}

_$_.delegate(['click']);