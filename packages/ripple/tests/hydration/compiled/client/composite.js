import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><!></div>`, 0);
var root_1 = _$_.template(`<div class="single">single</div>`, 0);
var root_2 = _$_.template(`<h1>title</h1><p>description</p>`, 1);
var root_3 = _$_.template(`<!>`, 1);
var root_5 = _$_.template(`<!>`, 1);
var root_4 = _$_.template(`<!>`, 1);
var root_7 = _$_.template(`<!><div class="extra">extra</div>`, 1);
var root_6 = _$_.template(`<!>`, 1);
var root_9 = _$_.template(`<!>`, 1);
var root_8 = _$_.template(`<!>`, 1);

export function Layout(__anchor, __props, __block) {
	_$_.push_component();

	var div_1 = root();

	{
		var node = _$_.child(div_1);

		_$_.composite(() => __props.children, node, {});
		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function SingleChild(__anchor, _, __block) {
	_$_.push_component();

	var div_2 = root_1();

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function MultiRootChild(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root_2();

	_$_.next();
	_$_.append(__anchor, fragment, true);
	_$_.pop_component();
}

export function EmptyLayout(__anchor, _, __block) {
	_$_.push_component();

	var fragment_1 = root_3();
	var node_1 = _$_.first_child_frag(fragment_1);

	Layout(node_1, {}, _$_.active_block);
	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function LayoutWithSingleChild(__anchor, _, __block) {
	_$_.push_component();

	var fragment_2 = root_4();
	var node_2 = _$_.first_child_frag(fragment_2);

	Layout(
		node_2,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_3 = root_5();
				var node_3 = _$_.first_child_frag(fragment_3);

				SingleChild(node_3, {}, _$_.active_block);
				_$_.append(__anchor, fragment_3);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function LayoutWithMultipleChildren(__anchor, _, __block) {
	_$_.push_component();

	var fragment_4 = root_6();
	var node_4 = _$_.first_child_frag(fragment_4);

	Layout(
		node_4,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_5 = root_7();
				var node_5 = _$_.first_child_frag(fragment_5);

				SingleChild(node_5, {}, _$_.active_block);
				_$_.append(__anchor, fragment_5);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function LayoutWithMultiRootChild(__anchor, _, __block) {
	_$_.push_component();

	var fragment_6 = root_8();
	var node_6 = _$_.first_child_frag(fragment_6);

	Layout(
		node_6,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_7 = root_9();
				var node_7 = _$_.first_child_frag(fragment_7);

				MultiRootChild(node_7, {}, _$_.active_block);
				_$_.append(__anchor, fragment_7);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_6);
	_$_.pop_component();
}