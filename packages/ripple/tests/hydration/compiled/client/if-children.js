// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class=content><!>`);

function consequent(__anchor, { a: expanded, b: children }) {
	var div_2 = root_1();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		_$_.expression(expression, () => children);
		_$_.hydrating && _$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

function if_1({ a: expanded, b: children }) {
	if (expanded.value) return consequent;
}

var root = _$_.template(`<div class=container><div role=button class=header>Toggle`);

function IfWithChildren_render(__anchor, __block, { children }) {
	const expanded = _$_.track(true, __block, '1j0jg6p');
	var div = root();

	{
		var div_1 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		div_1.__click = () => expanded.value = !expanded.value;

		var node = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(div, true);

		_$_.if(node, if_1, false, { a: expanded, b: children });
		_$_.hydrating && _$_.pop(div);
	}

	_$_.append(__anchor, div);
}

IfWithChildren[_$_.$r] = IfWithChildren_render;

var root_2 = _$_.template_el('div', ['class', 'item']);

function ChildItem_render(__anchor, __block, { text: label }) {
	var div_3 = root_2();

	{
		div_3.textContent = label;
	}

	_$_.append(__anchor, div_3);
}

ChildItem[_$_.$r] = ChildItem_render;

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

TestIfWithChildren[_$_.$r] = TestIfWithChildren_render;

var root_5 = _$_.template(`<div class=content><span>Static child 1</span><span>Static child 2`);

function consequent_1(__anchor, expanded) {
	var div_6 = root_5();

	_$_.append(__anchor, div_6);
}

function if_2(expanded) {
	if (expanded.value) return consequent_1;
}

var root_4 = _$_.template(`<div class=container><div role=button class=header>Toggle`);

function IfWithStaticChildren_render(__anchor, __block) {
	const expanded = _$_.track(true, __block, 'gkm3jr');
	var div_4 = root_4();

	{
		var div_5 = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

		div_5.__click = () => expanded.value = !expanded.value;

		var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(div_4, true);

		_$_.if(node_3, if_2, false, expanded);
		_$_.hydrating && _$_.pop(div_4);
	}

	_$_.append(__anchor, div_4);
}

IfWithStaticChildren[_$_.$r] = IfWithStaticChildren_render;

var root_7 = _$_.template(`<div class=items><!>`);

function consequent_2(__anchor, { a: expanded, b: children }) {
	var div_8 = root_7();

	{
		var expression_2 = _$_.hydrating ? _$_.hydrate_child() : div_8.firstChild;

		_$_.expression(expression_2, () => children);
		_$_.hydrating && _$_.pop(div_8);
	}

	_$_.append(__anchor, div_8);
}

function if_3({ a: expanded, b: children }) {
	if (expanded.value) return consequent_2;
}

var root_6 = _$_.template(`<section class=group><div role=button class=item><div class=indicator></div><h2 class=text>Title</h2><div class=caret><svg xmlns=http://www.w3.org/2000/svg width=18 height=18 viewBox="0 0 24 24"><path d="m9 18 6-6-6-6">`);

function IfWithSiblingsAndChildren_render(__anchor, __block, { children }) {
	const expanded = _$_.track(true, __block, '18vegr0');
	var section = root_6();

	{
		var div_7 = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;

		div_7.__click = () => expanded.value = !expanded.value;
		_$_.hydrating && _$_.pop(div_7);

		var node_4 = _$_.hydrating
			? _$_.hydrate_sibling()
			: _$_.append_into(section, true);

		_$_.if(node_4, if_3, false, { a: expanded, b: children });
		_$_.hydrating && _$_.pop(section);
	}

	_$_.append(__anchor, section);
}

IfWithSiblingsAndChildren[_$_.$r] = IfWithSiblingsAndChildren_render;

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

TestIfWithSiblingsAndChildren[_$_.$r] = TestIfWithSiblingsAndChildren_render;

var root_11 = _$_.template_el('div', ['class', 'conditional'], 'Conditional content');

function consequent_3(__anchor, show) {
	var div_11 = root_11();

	_$_.append(__anchor, div_11);
}

function if_4(show) {
	if (show.value) return consequent_3;
}

var root_10 = _$_.template(`<div class=wrapper><div class=nested-parent><div class=nested-child><span class=deep>Deep content</span></div></div></div><button class=toggle>Toggle`, 1, 2);
var root_9 = _$_.template(`<!>`, 1, 1);

function ElementWithChildrenThenIf_render(__anchor, __block) {
	const show = _$_.track(true, __block, 'ymw5ff');
	var fragment_2 = root_9();
	var node_8 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_10();
		var div_9 = _$_.first_child_frag(fragment_3);

		{
			var div_10 = _$_.hydrating ? _$_.hydrate_child() : div_9.firstChild;
			var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(div_9, true);

			_$_.if(node_7, if_4, false, show);
			_$_.hydrating && _$_.pop(div_9);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : div_9.nextSibling;

		button.__click = () => show.value = !show.value;
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

ElementWithChildrenThenIf[_$_.$r] = ElementWithChildrenThenIf_render;

var root_14 = _$_.template_el('footer', ['class', 'footer'], 'Footer');

function consequent_4(__anchor, visible) {
	var footer = root_14();

	_$_.append(__anchor, footer);
}

function if_5(visible) {
	if (visible.value) return consequent_4;
}

var root_13 = _$_.template(`<section class=outer><article class=middle><div class=inner><p class=leaf><strong>Bold</strong><em>Italic</em></p></div></article></section><button class=btn>Toggle`, 1, 2);
var root_12 = _$_.template(`<!>`, 1, 1);

function DeepNestingThenIf_render(__anchor, __block) {
	const visible = _$_.track(true, __block, '14k9o72');
	var fragment_4 = root_12();
	var node_10 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_10, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_13();
		var section_1 = _$_.first_child_frag(fragment_5);

		{
			var article = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;

			var node_9 = _$_.hydrating
				? _$_.hydrate_sibling()
				: _$_.append_into(section_1, true);

			_$_.if(node_9, if_5, false, visible);
			_$_.hydrating && _$_.pop(section_1);
		}

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : section_1.nextSibling;

		button_1.__click = () => visible.value = !visible.value;
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

DeepNestingThenIf[_$_.$r] = DeepNestingThenIf_render;

var root_16 = _$_.template(`<pre class=code>const x = 1;`);
var root_17 = _$_.template_el('div', ['class', 'preview'], 'Preview content');

function consequent_5(__anchor, activeTab) {
	var pre = root_16();

	_$_.append(__anchor, pre);
}

function alternate(__anchor, activeTab) {
	var div_15 = root_17();

	_$_.append(__anchor, div_15);
}

function if_6(activeTab) {
	if (activeTab.value === 'code') return consequent_5; else return alternate;
}

var root_15 = _$_.template(`<div class=tabs><div class=tab-list><button class=tab>Code</button><button class=tab>Preview</button></div><div class=panel><!>`);

function render(__prev) {
	var __a = __prev._a.value === 'code' ? 'true' : 'false';

	if (__prev.a !== __a) {
		_$_.set_attribute(__prev._b, 'aria-selected', __prev.a = __a);
	}

	var __b = __prev._a.value === 'preview' ? 'true' : 'false';

	if (__prev.b !== __b) {
		_$_.set_attribute(__prev._c, 'aria-selected', __prev.b = __b);
	}
}

function DomElementChildrenThenSibling_render(__anchor, __block) {
	const activeTab = _$_.track('code', __block, 'ebqq2n');
	var div_12 = root_15();

	{
		var div_13 = _$_.hydrating ? _$_.hydrate_child() : div_12.firstChild;

		{
			var button_2 = _$_.hydrating ? _$_.hydrate_child() : div_13.firstChild;

			button_2.__click = () => activeTab.value = 'code';

			var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

			button_3.__click = () => activeTab.value = 'preview';
		}

		_$_.hydrating && _$_.pop(div_13);

		var div_14 = _$_.hydrating ? _$_.hydrate_sibling() : div_13.nextSibling;

		{
			var node_11 = _$_.hydrating ? _$_.hydrate_child() : div_14.firstChild;

			_$_.if(node_11, if_6, false, activeTab);
			_$_.hydrating && _$_.pop(div_14);
		}
	}

	_$_.render(render, {
		a: void 0,
		b: void 0,
		_a: activeTab,
		_b: button_2,
		_c: button_3
	});

	_$_.append(__anchor, div_12);
}

DomElementChildrenThenSibling[_$_.$r] = DomElementChildrenThenSibling_render;

var root_19 = _$_.template(`<div class=container><ul class=list><li class=item></li><li class=item>Another item</li></ul><h2 class=heading>Static Heading</h2><p class=para>Static paragraph</p></div><button class=inc>Increment`, 1, 2);

function render_1(__prev) {
	var __a = 'Item count: ' + String(__prev._a.value ?? '');

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_18 = _$_.template(`<!>`, 1, 1);

function DomChildrenThenStaticSiblings_render(__anchor, __block) {
	const count = _$_.track(0, __block, '42buv9');
	var fragment_6 = root_18();
	var node_12 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_12, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_19();
		var div_16 = _$_.first_child_frag(fragment_7);

		{
			var ul = _$_.hydrating ? _$_.hydrate_child() : div_16.firstChild;

			{
				var li = _$_.hydrating ? _$_.hydrate_child() : ul.firstChild;
			}

			_$_.hydrating && _$_.pop(ul);
		}

		_$_.hydrating && _$_.pop(div_16);

		var button_4 = _$_.hydrating ? _$_.hydrate_sibling() : div_16.nextSibling;

		button_4.__click = () => count.value++;
		_$_.render(render_1, { a: '', _a: count, _b: li });
		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

DomChildrenThenStaticSiblings[_$_.$r] = DomChildrenThenStaticSiblings_render;

var root_20 = _$_.template(`<div class=wrapper><ul class=features><li><strong>Feature One</strong>: Description of feature one with <code>code</code> reference</li><li><strong>Feature Two</strong>: Another feature description</li><li><strong>Feature Three</strong>: Third feature</li></ul><h2 class=section-heading>Section Heading</h2><p class=section-content>Static paragraph with <a href=/link>a link</a> and more text.`);

function StaticListThenStaticSiblings_render(__anchor, __block) {
	var div_17 = root_20();

	_$_.append(__anchor, div_17);
}

StaticListThenStaticSiblings[_$_.$r] = StaticListThenStaticSiblings_render;

var root_21 = _$_.template_el('span', ['class', 'root-if'], 'on');
var root_22 = _$_.template_el('span', ['class', 'root-if'], 'off');

function consequent_6(__anchor, props) {
	var span = root_21();

	_$_.append(__anchor, span);
}

function alternate_1(__anchor, props) {
	var span_1 = root_22();

	_$_.append(__anchor, span_1);
}

function if_7(props) {
	if (props.on.value) return consequent_6; else return alternate_1;
}

function RootIfChild_render(__anchor, __block, props) {
	_$_.if(__anchor, if_7, true, props);
}

RootIfChild[_$_.$r] = RootIfChild_render;

var root_23 = _$_.template_el('span', ['class', 'root-for']);

function render_2(__prev) {
	var __a = __prev.$item;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function RootForChild_render(__anchor, __block, props) {
	_$_.for_keyed(
		__anchor,
		() => props.items.value,
		(__anchor, pattern) => {
			var span_2 = root_23();

			_$_.item({ a: '', $item: pattern, _b: span_2 });
			_$_.append(__anchor, span_2);
		},
		144,
		void 0,
		void 0,
		void 0,
		render_2
	);
}

RootForChild[_$_.$r] = RootForChild_render;

var root_24 = _$_.template_el('span', ['class', 'trailing'], 'end');

function TrailingChild_render(__anchor, __block) {
	var span_3 = root_24();

	_$_.append(__anchor, span_3);
}

TrailingChild[_$_.$r] = TrailingChild_render;

var root_25 = _$_.template(`<div class=wrapper><div class=host></div><button class=toggle>Toggle</button><button class=rotate>Rotate`);

function ComponentChildrenWithControlFlowRoots_render(__anchor, __block) {
	const on = _$_.track(true, __block, '1vo6ory');
	const items = _$_.track([1, 2, 3], __block, 'c4uisw');
	var div_18 = root_25();

	{
		var div_19 = _$_.hydrating ? _$_.hydrate_child() : div_18.firstChild;

		{
			var append_anchor = _$_.append_into(div_19);

			_$_.render_component(RootIfChild, append_anchor, { on });
			_$_.render_component(RootForChild, append_anchor, { items });
			_$_.render_component(TrailingChild, append_anchor, {});
			_$_.hydrating && _$_.pop(div_19);
		}

		var button_5 = _$_.hydrating ? _$_.hydrate_sibling() : div_19.nextSibling;

		button_5.__click = () => on.value = !on.value;

		var button_6 = _$_.hydrating ? _$_.hydrate_sibling() : button_5.nextSibling;

		button_6.__click = () => items.value = [items.value[1], items.value[2], items.value[0]];
	}

	_$_.append(__anchor, div_18);
}

ComponentChildrenWithControlFlowRoots[_$_.$r] = ComponentChildrenWithControlFlowRoots_render;

import { track } from 'ripple';

export function IfWithChildren(__props) {
	return _$_.tsrx_element(IfWithChildren_render, __props);
}

export function ChildItem(__props) {
	return _$_.tsrx_element(ChildItem_render, __props);
}

export function TestIfWithChildren() {
	return _$_.tsrx_element(TestIfWithChildren_render);
}

export function IfWithStaticChildren() {
	return _$_.tsrx_element(IfWithStaticChildren_render);
}

export function IfWithSiblingsAndChildren(__props) {
	return _$_.tsrx_element(IfWithSiblingsAndChildren_render, __props);
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