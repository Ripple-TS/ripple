// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><!></div>`, 0);
var root_1 = _$_.template(`<div class="layout">before<!>after</div>`, 0);
var root_2 = _$_.template(`<div class="single">single</div>`, 0);
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

export function Layout(__props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_1 = root();

		{
			var expression = _$_.child(div_1);

			_$_.expression(expression, () => __props.children);
			_$_.pop(div_1);
		}

		_$_.append(__anchor, div_1);
	});
}

export function TextWrappedLayout(__props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_2 = root_1();

		{
			var expression_2 = _$_.child(div_2);
			var expression_1 = _$_.sibling(expression_2);

			_$_.expression(expression_1, () => __props.children);
			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

export function SingleChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_3 = root_2();

		_$_.append(__anchor, div_3);
	});
}

export function MultiRootChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment = root_3();

		_$_.next();
		_$_.append(__anchor, fragment, true);
	});
}

export function EmptyLayout() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_4();
		var node = _$_.first_child_frag(fragment_1);

		_$_.render_component(Layout, node, {});
		_$_.append(__anchor, fragment_1);
	});
}

export function LayoutWithSingleChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_2 = root_5();
		var node_1 = _$_.first_child_frag(fragment_2);

		_$_.render_component(Layout, node_1, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_3 = root_6();
				var node_2 = _$_.first_child_frag(fragment_3);

				_$_.render_component(SingleChild, node_2, {});
				_$_.append(__anchor, fragment_3);
			})
		});

		_$_.append(__anchor, fragment_2);
	});
}

export function LayoutWithMultipleChildren() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_4 = root_7();
		var node_3 = _$_.first_child_frag(fragment_4);

		_$_.render_component(Layout, node_3, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_5 = root_8();
				var node_4 = _$_.first_child_frag(fragment_5);

				_$_.render_component(SingleChild, node_4, {});
				_$_.append(__anchor, fragment_5);
			})
		});

		_$_.append(__anchor, fragment_4);
	});
}

export function LayoutWithMultiRootChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_6 = root_9();
		var node_5 = _$_.first_child_frag(fragment_6);

		_$_.render_component(Layout, node_5, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_7 = root_10();
				var node_6 = _$_.first_child_frag(fragment_7);

				_$_.render_component(MultiRootChild, node_6, {});
				_$_.append(__anchor, fragment_7);
			})
		});

		_$_.append(__anchor, fragment_6);
	});
}

export function LayoutWithTextAroundChildren() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_8 = root_11();
		var node_7 = _$_.first_child_frag(fragment_8);

		_$_.render_component(TextWrappedLayout, node_7, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_9 = root_12();
				var node_8 = _$_.first_child_frag(fragment_9);

				_$_.render_component(SingleChild, node_8, {});
				_$_.append(__anchor, fragment_9);
			})
		});

		_$_.append(__anchor, fragment_8);
	});
}