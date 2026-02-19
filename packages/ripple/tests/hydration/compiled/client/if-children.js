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

_$_.delegate(['click']);