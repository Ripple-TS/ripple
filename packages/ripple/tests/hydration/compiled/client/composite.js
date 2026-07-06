// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><!></div>`, 0);
var root_1 = _$_.template(`<div class="layout">before<!>after</div>`, 0);
var root_2 = _$_.template(`<div class="single">single</div>`, 0);
var root_4 = _$_.template(`<h1>title</h1><p>description</p>`, 1, 2);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_5 = _$_.template(`<!><div class="extra">extra</div>`, 1, 2);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<!>`, 1, 1);

export function Layout(__props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div = root();

		{
			var expression = _$_.child(div);

			_$_.expression(expression, () => __props.children);
			_$_.pop(div);
		}

		_$_.append(__anchor, div);
	});
}

export function TextWrappedLayout(__props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_1 = root_1();

		{
			var expression_2 = _$_.child(div_1);
			var expression_1 = _$_.sibling(expression_2);

			_$_.expression(expression_1, () => __props.children);
			_$_.pop(div_1);
		}

		_$_.append(__anchor, div_1);
	});
}

export function SingleChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_2 = root_2();

		_$_.append(__anchor, div_2);
	});
}

export function MultiRootChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment = root_3();
		var node = _$_.first_child_frag(fragment);

		_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_4();

			_$_.next();
			_$_.append(__anchor, fragment_1, true);
		}));

		_$_.append(__anchor, fragment);
	});
}

export function EmptyLayout() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Layout, __anchor, {});
	});
}

export function LayoutWithSingleChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Layout, __anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(SingleChild, __anchor, {});
			})
		});
	});
}

export function LayoutWithMultipleChildren() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Layout, __anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_2 = root_5();
				var node_1 = _$_.first_child_frag(fragment_2);

				_$_.render_component(SingleChild, node_1, {});
				_$_.append(__anchor, fragment_2);
			})
		});
	});
}

export function LayoutWithMultiRootChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Layout, __anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(MultiRootChild, __anchor, {});
			})
		});
	});
}

export function LayoutWithTextAroundChildren() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(TextWrappedLayout, __anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(SingleChild, __anchor, {});
			})
		});
	});
}

export function DynamicTagElement() {
	return _$_.tsrx_element((__anchor, __block) => {
		const Tag = 'section';
		var fragment_3 = root_6();
		var node_2 = _$_.first_child_frag(fragment_3);

		_$_.composite(() => Tag, node_2, {
			class: "host",
			children: _$_.tsrx_element((__anchor, __block) => {
				var expression_3 = _$_.text('hello');

				_$_.append(__anchor, expression_3);
			})
		});

		_$_.append(__anchor, fragment_3);
	});
}

export function DynamicTagComponent() {
	return _$_.tsrx_element((__anchor, __block) => {
		const Comp = SingleChild;

		_$_.render_component(Layout, __anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_4 = root_7();
				var node_3 = _$_.first_child_frag(fragment_4);

				_$_.composite(() => Comp, node_3, {});
				_$_.append(__anchor, fragment_4);
			})
		});
	});
}