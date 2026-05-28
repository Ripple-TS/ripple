// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><!></div>`, 1, 1);
var root_1 = _$_.template(`<div class="layout">before<!>after</div>`, 1, 1);
var root_2 = _$_.template(`<div class="single">single</div>`, 1, 1);
var root_3 = _$_.template(`<h1>title</h1><p>description</p>`, 1, 2);
var root_4 = _$_.template(`<!>`, 1, 1);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_5 = _$_.template(`<!>`, 1, 1);
var root_8 = _$_.template(`<!><div class="extra">extra</div>`, 1, 2);
var root_7 = _$_.template(`<!>`, 1, 1);
var root_10 = _$_.template(`<!>`, 1, 1);
var root_9 = _$_.template(`<!>`, 1, 1);
var root_12 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<!>`, 1, 1);

export function Layout(__anchor, __props, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();
	var div_1 = _$_.first_child_frag(fragment);

	{
		var expression = _$_.child(div_1);

		_$_.expression(expression, () => __props.children);
		_$_.pop(div_1);
	}

	__r = true;
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function TextWrappedLayout(__anchor, __props, __block) {
	_$_.push_component();

	var __r_1 = false;
	var fragment_1 = root_1();
	var div_2 = _$_.first_child_frag(fragment_1);

	{
		var expression_2 = _$_.child(div_2);
		var expression_1 = _$_.sibling(expression_2);

		_$_.expression(expression_1, () => __props.children);
		_$_.pop(div_2);
	}

	__r_1 = true;
	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function SingleChild(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;
	var fragment_2 = root_2();

	__r_2 = true;
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function MultiRootChild(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = false;
	var fragment_3 = root_3();

	__r_3 = true;
	_$_.next();
	_$_.append(__anchor, fragment_3, true);
	_$_.pop_component();
}

export function EmptyLayout(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	var fragment_4 = root_4();
	var node = _$_.first_child_frag(fragment_4);

	Layout(node, {}, _$_.active_block);
	__r_4 = true;
	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function LayoutWithSingleChild(__anchor, _, __block) {
	_$_.push_component();

	var __r_5 = false;
	var fragment_5 = root_5();
	var node_1 = _$_.first_child_frag(fragment_5);

	Layout(
		node_1,
		{
			children: _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_6 = false;
				var fragment_6 = root_6();
				var node_2 = _$_.first_child_frag(fragment_6);

				SingleChild(node_2, {}, _$_.active_block);
				__r_6 = true;
				_$_.append(__anchor, fragment_6);
			})
		},
		_$_.active_block
	);

	__r_5 = true;
	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function LayoutWithMultipleChildren(__anchor, _, __block) {
	_$_.push_component();

	var __r_7 = false;
	var fragment_7 = root_7();
	var node_3 = _$_.first_child_frag(fragment_7);

	Layout(
		node_3,
		{
			children: _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_8 = false;
				var fragment_8 = root_8();
				var node_4 = _$_.first_child_frag(fragment_8);

				SingleChild(node_4, {}, _$_.active_block);
				__r_8 = true;
				_$_.append(__anchor, fragment_8);
			})
		},
		_$_.active_block
	);

	__r_7 = true;
	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

export function LayoutWithMultiRootChild(__anchor, _, __block) {
	_$_.push_component();

	var __r_9 = false;
	var fragment_9 = root_9();
	var node_5 = _$_.first_child_frag(fragment_9);

	Layout(
		node_5,
		{
			children: _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_10 = false;
				var fragment_10 = root_10();
				var node_6 = _$_.first_child_frag(fragment_10);

				MultiRootChild(node_6, {}, _$_.active_block);
				__r_10 = true;
				_$_.append(__anchor, fragment_10);
			})
		},
		_$_.active_block
	);

	__r_9 = true;
	_$_.append(__anchor, fragment_9);
	_$_.pop_component();
}

export function LayoutWithTextAroundChildren(__anchor, _, __block) {
	_$_.push_component();

	var __r_11 = false;
	var fragment_11 = root_11();
	var node_7 = _$_.first_child_frag(fragment_11);

	TextWrappedLayout(
		node_7,
		{
			children: _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_12 = false;
				var fragment_12 = root_12();
				var node_8 = _$_.first_child_frag(fragment_12);

				SingleChild(node_8, {}, _$_.active_block);
				__r_12 = true;
				_$_.append(__anchor, fragment_12);
			})
		},
		_$_.active_block
	);

	__r_11 = true;
	_$_.append(__anchor, fragment_11);
	_$_.pop_component();
}