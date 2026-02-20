import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="content"><!></div>`, 0);
var root = _$_.template(`<div class="container"><div role="button" class="header">Toggle</div><!></div>`, 0);
var root_2 = _$_.template(`<div class="item"> </div>`, 0);
var root_4 = _$_.template(`<!><!>`, 1);
var root_3 = _$_.template(`<!>`, 1);
var root_6 = _$_.template(`<div class="content"><span>Static child 1</span><span>Static child 2</span></div>`, 0);
var root_5 = _$_.template(`<div class="container"><div role="button" class="header">Toggle</div><!></div>`, 0);
var root_8 = _$_.template(`<div class="items"><!></div>`, 0);
var root_7 = _$_.template(`<section class="group"><div role="button" class="item"><div class="indicator"></div><h2 class="text">Title</h2><div class="caret"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg></div></div><!></section>`, 0);
var root_10 = _$_.template(`<!><!>`, 1);
var root_9 = _$_.template(`<!>`, 1);
var root_12 = _$_.template(`<div class="conditional">Conditional content</div>`, 0);
var root_11 = _$_.template(`<div class="wrapper"><div class="nested-parent"><div class="nested-child"><span class="deep">Deep content</span></div></div><!></div><button class="toggle">Toggle</button>`, 1);
var root_14 = _$_.template(`<footer class="footer">Footer</footer>`, 0);
var root_13 = _$_.template(`<section class="outer"><article class="middle"><div class="inner"><p class="leaf"><strong>Bold</strong><em>Italic</em></p></div></article><!></section><button class="btn">Toggle</button>`, 1);
var root_16 = _$_.template(`<pre class="code">const x = 1;</pre>`, 0);
var root_17 = _$_.template(`<div class="preview">Preview content</div>`, 0);
var root_15 = _$_.template(`<div class="tabs"><div class="tab-list"><button class="tab">Code</button><button class="tab">Preview</button></div><div class="panel"><!></div></div>`, 0);
var root_18 = _$_.template(`<div class="container"><ul class="list"><li class="item"> </li><li class="item">Another item</li></ul><h2 class="heading">Static Heading</h2><p class="para">Static paragraph</p></div><button class="inc">Increment</button>`, 1);
var root_19 = _$_.template(`<div class="wrapper"><ul class="features"><li><strong>Feature One</strong>: Description of feature one with <code>code</code> reference</li><li><strong>Feature Two</strong>: Another feature description</li><li><strong>Feature Three</strong>: Third feature</li></ul><h2 class="section-heading">Section Heading</h2><p class="section-content">Static paragraph with <a href="/link">a link</a> and more text.</p></div>`, 0);

import { track } from 'ripple';

export function IfWithChildren(__anchor, __props, __block) {
	_$_.push_component();

	let expanded = track(true, void 0, void 0, __block);
	var div_1 = root();

	{
		var div_2 = _$_.child(div_1);

		div_2.__click = () => _$_.set(expanded, !_$_.get(expanded));

		var node = _$_.sibling(div_2);

		{
			var consequent = (__anchor) => {
				var div_3 = root_1();

				{
					var node_1 = _$_.child(div_3);

					_$_.composite(() => __props.children, node_1, {});
					_$_.pop(div_3);
				}

				_$_.append(__anchor, div_3);
			};

			_$_.if(node, (__render) => {
				if (_$_.get(expanded)) __render(consequent);
			});
		}

		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function ChildItem(__anchor, __props, __block) {
	_$_.push_component();

	var div_4 = root_2();

	{
		var text_1 = _$_.child(div_4, true);

		_$_.pop(div_4);
	}

	_$_.render(() => {
		_$_.set_text(text_1, __props.text);
	});

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function TestIfWithChildren(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root_3();
	var node_2 = _$_.first_child_frag(fragment);

	IfWithChildren(
		node_2,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_1 = root_4();
				var node_3 = _$_.first_child_frag(fragment_1);

				ChildItem(node_3, { text: "Item 1" }, _$_.active_block);

				var node_4 = _$_.sibling(node_3);

				ChildItem(node_4, { text: "Item 2" }, _$_.active_block);
				_$_.append(__anchor, fragment_1);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function IfWithStaticChildren(__anchor, _, __block) {
	_$_.push_component();

	let expanded = track(true, void 0, void 0, __block);
	var div_5 = root_5();

	{
		var div_6 = _$_.child(div_5);

		div_6.__click = () => _$_.set(expanded, !_$_.get(expanded));

		var node_5 = _$_.sibling(div_6);

		{
			var consequent_1 = (__anchor) => {
				var div_7 = root_6();

				_$_.append(__anchor, div_7);
			};

			_$_.if(node_5, (__render) => {
				if (_$_.get(expanded)) __render(consequent_1);
			});
		}

		_$_.pop(div_5);
	}

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function IfWithSiblingsAndChildren(__anchor, __props, __block) {
	_$_.push_component();

	let expanded = track(true, void 0, void 0, __block);
	var section_1 = root_7();

	{
		var div_8 = _$_.child(section_1);

		div_8.__click = () => _$_.set(expanded, !_$_.get(expanded));
		_$_.pop(div_8);

		var node_6 = _$_.sibling(div_8);

		{
			var consequent_2 = (__anchor) => {
				var div_9 = root_8();

				{
					var node_7 = _$_.child(div_9);

					_$_.composite(() => __props.children, node_7, {});
					_$_.pop(div_9);
				}

				_$_.append(__anchor, div_9);
			};

			_$_.if(node_6, (__render) => {
				if (_$_.get(expanded)) __render(consequent_2);
			});
		}

		_$_.pop(section_1);
	}

	_$_.append(__anchor, section_1);
	_$_.pop_component();
}

export function TestIfWithSiblingsAndChildren(__anchor, _, __block) {
	_$_.push_component();

	var fragment_2 = root_9();
	var node_8 = _$_.first_child_frag(fragment_2);

	IfWithSiblingsAndChildren(
		node_8,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_3 = root_10();
				var node_9 = _$_.first_child_frag(fragment_3);

				ChildItem(node_9, { text: "Item A" }, _$_.active_block);

				var node_10 = _$_.sibling(node_9);

				ChildItem(node_10, { text: "Item B" }, _$_.active_block);
				_$_.append(__anchor, fragment_3);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function ElementWithChildrenThenIf(__anchor, _, __block) {
	_$_.push_component();

	let show = track(true, void 0, void 0, __block);
	var fragment_4 = root_11();
	var div_11 = _$_.first_child_frag(fragment_4);

	{
		var div_10 = _$_.child(div_11);

		_$_.pop(div_10);

		var node_11 = _$_.sibling(div_10);

		{
			var consequent_3 = (__anchor) => {
				var div_12 = root_12();

				_$_.append(__anchor, div_12);
			};

			_$_.if(node_11, (__render) => {
				if (_$_.get(show)) __render(consequent_3);
			});
		}

		_$_.pop(div_11);
	}

	var button_1 = _$_.sibling(div_11);

	button_1.__click = () => _$_.set(show, !_$_.get(show));
	_$_.next();
	_$_.append(__anchor, fragment_4, true);
	_$_.pop_component();
}

export function DeepNestingThenIf(__anchor, _, __block) {
	_$_.push_component();

	let visible = track(true, void 0, void 0, __block);
	var fragment_5 = root_13();
	var section_2 = _$_.first_child_frag(fragment_5);

	{
		var article_1 = _$_.child(section_2);

		_$_.pop(article_1);

		var node_12 = _$_.sibling(article_1);

		{
			var consequent_4 = (__anchor) => {
				var footer_1 = root_14();

				_$_.append(__anchor, footer_1);
			};

			_$_.if(node_12, (__render) => {
				if (_$_.get(visible)) __render(consequent_4);
			});
		}

		_$_.pop(section_2);
	}

	var button_2 = _$_.sibling(section_2);

	button_2.__click = () => _$_.set(visible, !_$_.get(visible));
	_$_.next();
	_$_.append(__anchor, fragment_5, true);
	_$_.pop_component();
}

export function DomElementChildrenThenSibling(__anchor, _, __block) {
	_$_.push_component();

	let activeTab = track('code', void 0, void 0, __block);
	var div_13 = root_15();

	{
		var div_14 = _$_.child(div_13);

		{
			var button_3 = _$_.child(div_14);

			button_3.__click = () => _$_.set(activeTab, 'code');

			var button_4 = _$_.sibling(button_3);

			button_4.__click = () => _$_.set(activeTab, 'preview');
		}

		_$_.pop(div_14);

		var div_15 = _$_.sibling(div_14);

		{
			var node_13 = _$_.child(div_15);

			{
				var consequent_5 = (__anchor) => {
					var pre_1 = root_16();

					_$_.append(__anchor, pre_1);
				};

				var alternate = (__anchor) => {
					var div_16 = root_17();

					_$_.append(__anchor, div_16);
				};

				_$_.if(node_13, (__render) => {
					if (_$_.get(activeTab) === 'code') __render(consequent_5); else __render(alternate, false);
				});
			}

			_$_.pop(div_15);
		}
	}

	_$_.render(
		(__prev) => {
			var __a = _$_.get(activeTab) === 'code' ? 'true' : 'false';

			if (__prev.a !== __a) {
				_$_.set_attribute(button_3, 'aria-selected', __prev.a = __a);
			}

			var __b = _$_.get(activeTab) === 'preview' ? 'true' : 'false';

			if (__prev.b !== __b) {
				_$_.set_attribute(button_4, 'aria-selected', __prev.b = __b);
			}
		},
		{ a: void 0, b: void 0 }
	);

	_$_.append(__anchor, div_13);
	_$_.pop_component();
}

export function DomChildrenThenStaticSiblings(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	var fragment_6 = root_18();
	var div_17 = _$_.first_child_frag(fragment_6);

	{
		var ul_1 = _$_.child(div_17);

		{
			var li_1 = _$_.child(ul_1);

			{
				var text_2 = _$_.child(li_1, true);

				_$_.pop(li_1);
			}
		}
	}

	_$_.pop(div_17);

	var button_5 = _$_.sibling(div_17);

	button_5.__click = () => _$_.update(count);
	_$_.next();

	_$_.render(() => {
		_$_.set_text(text_2, 'Item count: ' + _$_.with_scope(__block, () => String(_$_.get(count))));
	});

	_$_.append(__anchor, fragment_6, true);
	_$_.pop_component();
}

export function StaticListThenStaticSiblings(__anchor, _, __block) {
	_$_.push_component();

	var div_18 = root_19();

	_$_.append(__anchor, div_18);
	_$_.pop_component();
}

_$_.delegate(['click']);