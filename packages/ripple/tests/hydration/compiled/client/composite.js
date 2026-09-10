// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="layout"><!></div>`, 0);

function Layout_render(__anchor, __block, __props) {
	var div = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.expression(expression, () => __props.children);
		_$_.hydrating && _$_.pop(div);
	}

	_$_.append(__anchor, div);
}

Layout[_$_.$r] = Layout_render;

var root_1 = _$_.template(`<div class="layout">before<!>after</div>`, 0);

function TextWrappedLayout_render(__anchor, __block, __props) {
	var div_1 = root_1();

	{
		var expression_2 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;
		var expression_1 = _$_.hydrating ? _$_.hydrate_sibling() : expression_2.nextSibling;

		_$_.expression(expression_1, () => __props.children);
		_$_.hydrating && _$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
}

TextWrappedLayout[_$_.$r] = TextWrappedLayout_render;

var root_2 = _$_.template(`<div class="single">single</div>`, 0);

function SingleChild_render(__anchor, __block) {
	var div_2 = root_2();

	_$_.append(__anchor, div_2);
}

SingleChild[_$_.$r] = SingleChild_render;

var root_4 = _$_.template(`<h1>title</h1><p>description</p>`, 1, 2);
var root_3 = _$_.template(`<!>`, 1, 1);

function MultiRootChild_render(__anchor, __block) {
	var fragment = root_3();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_4();

		_$_.next();
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

MultiRootChild[_$_.$r] = MultiRootChild_render;

function EmptyLayout_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {});
}

EmptyLayout[_$_.$r] = EmptyLayout_render;

function LayoutWithSingleChild_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(SingleChild, __anchor, {});
		})
	});
}

LayoutWithSingleChild[_$_.$r] = LayoutWithSingleChild_render;

var root_5 = _$_.template(`<!><div class="extra">extra</div>`, 1, 2);

function LayoutWithMultipleChildren_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_2 = root_5();
			var node_1 = _$_.first_child_frag(fragment_2);

			_$_.render_component(SingleChild, node_1, {});
			_$_.next();
			_$_.append(__anchor, fragment_2);
		})
	});
}

LayoutWithMultipleChildren[_$_.$r] = LayoutWithMultipleChildren_render;

function LayoutWithMultiRootChild_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(MultiRootChild, __anchor, {});
		})
	});
}

LayoutWithMultiRootChild[_$_.$r] = LayoutWithMultiRootChild_render;

function LayoutWithTextAroundChildren_render(__anchor, __block) {
	_$_.render_component(TextWrappedLayout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(SingleChild, __anchor, {});
		})
	});
}

LayoutWithTextAroundChildren[_$_.$r] = LayoutWithTextAroundChildren_render;

var root_6 = _$_.template(`<!>`, 1, 1);

function DynamicTagElement_render(__anchor, __block) {
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
}

DynamicTagElement[_$_.$r] = DynamicTagElement_render;

var root_7 = _$_.template(`<!>`, 1, 1);

function DynamicTagComponent_render(__anchor, __block) {
	const Comp = SingleChild;

	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_4 = root_7();
			var node_3 = _$_.first_child_frag(fragment_4);

			_$_.composite(() => Comp, node_3, {});
			_$_.append(__anchor, fragment_4);
		})
	});
}

DynamicTagComponent[_$_.$r] = DynamicTagComponent_render;

export function Layout(__props) {
	return _$_.tsrx_element(Layout_render, __props);
}

export function TextWrappedLayout(__props) {
	return _$_.tsrx_element(TextWrappedLayout_render, __props);
}

export function SingleChild() {
	return _$_.tsrx_element(SingleChild_render);
}

export function MultiRootChild() {
	return _$_.tsrx_element(MultiRootChild_render);
}

export function EmptyLayout() {
	return _$_.tsrx_element(EmptyLayout_render);
}

export function LayoutWithSingleChild() {
	return _$_.tsrx_element(LayoutWithSingleChild_render);
}

export function LayoutWithMultipleChildren() {
	return _$_.tsrx_element(LayoutWithMultipleChildren_render);
}

export function LayoutWithMultiRootChild() {
	return _$_.tsrx_element(LayoutWithMultiRootChild_render);
}

export function LayoutWithTextAroundChildren() {
	return _$_.tsrx_element(LayoutWithTextAroundChildren_render);
}

export function DynamicTagElement() {
	return _$_.tsrx_element(DynamicTagElement_render);
}

export function DynamicTagComponent() {
	return _$_.tsrx_element(DynamicTagComponent_render);
}