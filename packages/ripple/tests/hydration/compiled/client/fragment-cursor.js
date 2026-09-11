// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<i class="leaf">leaf</i>`, 0);

function Leaf_render(__anchor, __block) {
	var i = root();

	_$_.append(__anchor, i);
}

Leaf[_$_.$r] = Leaf_render;

var root_2 = _$_.template(`<div class="count"> </div><button class="inc">inc</button><button class="dec">dec</button>`, 1, 3);

function render(__prev) {
	var __a = __prev._lazy.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression, __prev.a = __a);
	}
}

var root_1 = _$_.template(`<!>`, 1, 1);

function TrailingNavigatedElements_render(__anchor, __block) {
	let lazy = _$_.track(0, __block, 'a695c021');
	var fragment = root_1();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_2();
		var div = _$_.first_child_frag(fragment_1);

		{
			var expression = _$_.hydrating ? _$_.hydrate_text() : div.firstChild;
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : div.nextSibling;

		button.__click = () => _$_.update(lazy);

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = () => _$_.update(lazy, -1);
		_$_.render(render, { a: ' ', _lazy: lazy, _expression: expression });
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

TrailingNavigatedElements[_$_.$r] = TrailingNavigatedElements_render;

var root_4 = _$_.template(`<div class="host">static</div><button class="inc">inc</button><button class="dec">dec</button>`, 1, 3);
var root_3 = _$_.template(`<!>`, 1, 1);

function TrailingStaticNavigatedElements_render(__anchor, __block) {
	let lazy_1 = _$_.track(0, __block, '0afd9398');
	var fragment_2 = root_3();
	var node_1 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_4();
		var div_1 = _$_.first_child_frag(fragment_3);
		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : div_1.nextSibling;

		button_2.__click = () => _$_.update(lazy_1);

		var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

		button_3.__click = () => _$_.update(lazy_1, -1);
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

TrailingStaticNavigatedElements[_$_.$r] = TrailingStaticNavigatedElements_render;

var root_6 = _$_.template(`<div class="host">static</div><button class="inc">inc</button><div class="a">a</div><div class="b">b</div>`, 1, 4);
var root_5 = _$_.template(`<!>`, 1, 1);

function NavigatedThenStatic_render(__anchor, __block) {
	let lazy_2 = _$_.track(0, __block, '3cea07db');
	var fragment_4 = root_5();
	var node_2 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_6();
		var div_2 = _$_.first_child_frag(fragment_5);
		var button_4 = _$_.hydrating ? _$_.hydrate_sibling() : div_2.nextSibling;

		button_4.__click = () => _$_.update(lazy_2);
		_$_.next(2);
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

NavigatedThenStatic[_$_.$r] = NavigatedThenStatic_render;

var root_8 = _$_.template(`<button class="inc">inc</button><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_7 = _$_.template(`<!>`, 1, 1);

function LeadingNavigatedThenStatic_render(__anchor, __block) {
	let lazy_3 = _$_.track(0, __block, '8ca89613');
	var fragment_6 = root_7();
	var node_3 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_8();
		var button_5 = _$_.first_child_frag(fragment_7);

		button_5.__click = () => _$_.update(lazy_3);
		_$_.next(2);
		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

LeadingNavigatedThenStatic[_$_.$r] = LeadingNavigatedThenStatic_render;

var root_10 = _$_.template(`<div class="host">static</div><div class="wrap"><button class="inc">inc</button></div>`, 1, 2);
var root_9 = _$_.template(`<!>`, 1, 1);

function TrailingNestedNavigated_render(__anchor, __block) {
	let lazy_4 = _$_.track(0, __block, 'f0f5a337');
	var fragment_8 = root_9();
	var node_4 = _$_.first_child_frag(fragment_8);

	_$_.expression(node_4, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_9 = root_10();
		var div_4 = _$_.first_child_frag(fragment_9);
		var div_3 = _$_.hydrating ? _$_.hydrate_sibling() : div_4.nextSibling;

		{
			var button_6 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;

			button_6.__click = () => _$_.update(lazy_4);
		}

		_$_.hydrating && _$_.pop(div_3);
		_$_.append(__anchor, fragment_9);
	}));

	_$_.append(__anchor, fragment_8);
}

TrailingNestedNavigated[_$_.$r] = TrailingNestedNavigated_render;

var root_12 = _$_.template(`<div class="wrap"><button class="inc">inc</button></div><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_11 = _$_.template(`<!>`, 1, 1);

function NestedNavigatedThenStatic_render(__anchor, __block) {
	let lazy_5 = _$_.track(0, __block, '2a6293f9');
	var fragment_10 = root_11();
	var node_5 = _$_.first_child_frag(fragment_10);

	_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_11 = root_12();
		var div_5 = _$_.first_child_frag(fragment_11);

		{
			var button_7 = _$_.hydrating ? _$_.hydrate_child() : div_5.firstChild;

			button_7.__click = () => _$_.update(lazy_5);
		}

		_$_.hydrating && _$_.pop(div_5);
		_$_.next(2);
		_$_.append(__anchor, fragment_11);
	}));

	_$_.append(__anchor, fragment_10);
}

NestedNavigatedThenStatic[_$_.$r] = NestedNavigatedThenStatic_render;

var root_14 = _$_.template(` <div class="a">a</div><div class="b">b</div>`, 1, 3);

function render_1(__prev) {
	var __a = __prev._lazy_6.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_1, __prev.a = __a);
	}
}

var root_13 = _$_.template(`<!>`, 1, 1);

function TrackedTextThenStatic_render(__anchor, __block) {
	let lazy_6 = _$_.track(0, __block, 'db93f6f0');
	var fragment_12 = root_13();
	var node_6 = _$_.first_child_frag(fragment_12);

	_$_.expression(node_6, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_13 = root_14();
		var expression_1 = _$_.first_child_frag(fragment_13, true);

		_$_.next(2);
		_$_.render(render_1, { a: ' ', _lazy_6: lazy_6, _expression_1: expression_1 });
		_$_.append(__anchor, fragment_13);
	}));

	_$_.append(__anchor, fragment_12);
}

TrackedTextThenStatic[_$_.$r] = TrackedTextThenStatic_render;

var root_16 = _$_.template(`<div class="a">a</div><div class="b">b</div> `, 1, 3);

function render_2(__prev) {
	var __a = __prev._lazy_7.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_2, __prev.a = __a);
	}
}

var root_15 = _$_.template(`<!>`, 1, 1);

function StaticThenTrackedText_render(__anchor, __block) {
	let lazy_7 = _$_.track(0, __block, '84cf2507');
	var fragment_14 = root_15();
	var node_7 = _$_.first_child_frag(fragment_14);

	_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_15 = root_16();
		var div_7 = _$_.first_child_frag(fragment_15);
		var div_6 = _$_.hydrating ? _$_.hydrate_sibling() : div_7.nextSibling;
		var expression_2 = _$_.hydrating ? _$_.hydrate_sibling(true) : div_6.nextSibling;

		_$_.render(render_2, { a: ' ', _lazy_7: lazy_7, _expression_2: expression_2 });
		_$_.append(__anchor, fragment_15);
	}));

	_$_.append(__anchor, fragment_14);
}

StaticThenTrackedText[_$_.$r] = StaticThenTrackedText_render;

var root_18 = _$_.template(`<div class="a">a</div><div class="wrap"><span>x</span></div><div class="b">b</div><div class="c">c</div>`, 1, 4);
var root_17 = _$_.template(`<!>`, 1, 1);

function StaticNestedThenStatic_render(__anchor, __block) {
	var fragment_16 = root_17();
	var node_8 = _$_.first_child_frag(fragment_16);

	_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_17 = root_18();

		_$_.next(3);
		_$_.append(__anchor, fragment_17);
	}));

	_$_.append(__anchor, fragment_16);
}

StaticNestedThenStatic[_$_.$r] = StaticNestedThenStatic_render;

var root_20 = _$_.template(`<div class="a">a</div><div class="b">b</div><div class="c">c</div>`, 1, 3);
var root_19 = _$_.template(`<!>`, 1, 1);

function AllStatic_render(__anchor, __block) {
	var fragment_18 = root_19();
	var node_9 = _$_.first_child_frag(fragment_18);

	_$_.expression(node_9, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_19 = root_20();

		_$_.next(2);
		_$_.append(__anchor, fragment_19);
	}));

	_$_.append(__anchor, fragment_18);
}

AllStatic[_$_.$r] = AllStatic_render;

var root_22 = _$_.template(`<div class="a">a</div><div class="count"> </div>`, 1, 2);

function render_3(__prev) {
	var __a = __prev._lazy_8.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_3, __prev.a = __a);
	}
}

var root_21 = _$_.template(`<!>`, 1, 1);

function TrailingDynamicChild_render(__anchor, __block) {
	let lazy_8 = _$_.track(0, __block, '9be343a7');
	var fragment_20 = root_21();
	var node_10 = _$_.first_child_frag(fragment_20);

	_$_.expression(node_10, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_21 = root_22();
		var div_9 = _$_.first_child_frag(fragment_21);
		var div_8 = _$_.hydrating ? _$_.hydrate_sibling() : div_9.nextSibling;

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_text() : div_8.firstChild;
		}

		_$_.render(render_3, { a: ' ', _lazy_8: lazy_8, _expression_3: expression_3 });
		_$_.append(__anchor, fragment_21);
	}));

	_$_.append(__anchor, fragment_20);
}

TrailingDynamicChild[_$_.$r] = TrailingDynamicChild_render;

var root_24 = _$_.template(`<div class="count"> </div><div class="a">a</div><div class="b">b</div>`, 1, 3);

function render_4(__prev) {
	var __a = __prev._lazy_9.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_4, __prev.a = __a);
	}
}

var root_23 = _$_.template(`<!>`, 1, 1);

function DynamicChildThenStatic_render(__anchor, __block) {
	let lazy_9 = _$_.track(0, __block, 'c76dd5a9');
	var fragment_22 = root_23();
	var node_11 = _$_.first_child_frag(fragment_22);

	_$_.expression(node_11, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_23 = root_24();
		var div_10 = _$_.first_child_frag(fragment_23);

		{
			var expression_4 = _$_.hydrating ? _$_.hydrate_text() : div_10.firstChild;
		}

		_$_.next(2);
		_$_.render(render_4, { a: ' ', _lazy_9: lazy_9, _expression_4: expression_4 });
		_$_.append(__anchor, fragment_23);
	}));

	_$_.append(__anchor, fragment_22);
}

DynamicChildThenStatic[_$_.$r] = DynamicChildThenStatic_render;

var root_27 = _$_.template(`<b class="if">x</b>`, 0);

function consequent(__anchor, lazy_10) {
	var b = root_27();

	_$_.append(__anchor, b);
}

function if_1(lazy_10) {
	if (lazy_10.value >= 0) return consequent;
}

var root_26 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_25 = _$_.template(`<!>`, 1, 1);

function IfThenStatic_render(__anchor, __block) {
	let lazy_10 = _$_.track(0, __block, 'fb175ecd');
	var fragment_24 = root_25();
	var node_13 = _$_.first_child_frag(fragment_24);

	_$_.expression(node_13, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_25 = root_26();
		var node_12 = _$_.first_child_frag(fragment_25);

		_$_.if(node_12, if_1, false, lazy_10);
		_$_.next(2);
		_$_.append(__anchor, fragment_25);
	}));

	_$_.append(__anchor, fragment_24);
}

IfThenStatic[_$_.$r] = IfThenStatic_render;

var root_30 = _$_.template(`<b class="if">x</b>`, 0);

function consequent_1(__anchor, lazy_11) {
	var b_1 = root_30();

	_$_.append(__anchor, b_1);
}

function if_2(lazy_11) {
	if (lazy_11.value >= 0) return consequent_1;
}

var root_29 = _$_.template(`<div class="a">a</div><div class="b">b</div><!>`, 1, 3);
var root_28 = _$_.template(`<!>`, 1, 1);

function StaticThenIf_render(__anchor, __block) {
	let lazy_11 = _$_.track(0, __block, 'c8563a58');
	var fragment_26 = root_28();
	var node_15 = _$_.first_child_frag(fragment_26);

	_$_.expression(node_15, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_27 = root_29();
		var div_12 = _$_.first_child_frag(fragment_27);
		var div_11 = _$_.hydrating ? _$_.hydrate_sibling() : div_12.nextSibling;
		var node_14 = _$_.hydrating ? _$_.hydrate_sibling() : div_11.nextSibling;

		_$_.if(node_14, if_2, false, lazy_11);
		_$_.append(__anchor, fragment_27);
	}));

	_$_.append(__anchor, fragment_26);
}

StaticThenIf[_$_.$r] = StaticThenIf_render;

var root_32 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_31 = _$_.template(`<!>`, 1, 1);

function CompThenStatic_render(__anchor, __block) {
	var fragment_28 = root_31();
	var node_17 = _$_.first_child_frag(fragment_28);

	_$_.expression(node_17, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_29 = root_32();
		var node_16 = _$_.first_child_frag(fragment_29);

		_$_.render_component(Leaf, node_16, {});
		_$_.next(2);
		_$_.append(__anchor, fragment_29);
	}));

	_$_.append(__anchor, fragment_28);
}

CompThenStatic[_$_.$r] = CompThenStatic_render;

var root_34 = _$_.template(`<div class="a">a</div><div class="b">b</div><!>`, 1, 3);
var root_33 = _$_.template(`<!>`, 1, 1);

function StaticThenComp_render(__anchor, __block) {
	var fragment_30 = root_33();
	var node_19 = _$_.first_child_frag(fragment_30);

	_$_.expression(node_19, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_31 = root_34();
		var div_14 = _$_.first_child_frag(fragment_31);
		var div_13 = _$_.hydrating ? _$_.hydrate_sibling() : div_14.nextSibling;
		var node_18 = _$_.hydrating ? _$_.hydrate_sibling() : div_13.nextSibling;

		_$_.render_component(Leaf, node_18, {});
		_$_.append(__anchor, fragment_31);
	}));

	_$_.append(__anchor, fragment_30);
}

StaticThenComp[_$_.$r] = StaticThenComp_render;

var root_36 = _$_.template(`<!><!>`, 1, 2);
var root_35 = _$_.template(`<!>`, 1, 1);

function SiblingComps_render(__anchor, __block) {
	var fragment_32 = root_35();
	var node_22 = _$_.first_child_frag(fragment_32);

	_$_.expression(node_22, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_33 = root_36();
		var node_20 = _$_.first_child_frag(fragment_33);

		_$_.render_component(Leaf, node_20, {});

		var node_21 = _$_.hydrating ? _$_.hydrate_sibling() : node_20.nextSibling;

		_$_.render_component(Leaf, node_21, {});
		_$_.append(__anchor, fragment_33);
	}));

	_$_.append(__anchor, fragment_32);
}

SiblingComps[_$_.$r] = SiblingComps_render;

var root_37 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_5(__prev) {
	var __a = __prev._lazy_12.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_5, __prev.a = __a);
	}
}

function WrapTrailingNavigatedElements_render(__anchor, __block) {
	let lazy_12 = _$_.track(0, __block, '1032dbec');
	var div_15 = root_37();

	{
		var node_23 = _$_.hydrating ? _$_.hydrate_child() : div_15.firstChild;

		_$_.render_component(TrailingNavigatedElements, node_23, {});

		var span = _$_.hydrating ? _$_.hydrate_sibling() : node_23.nextSibling;

		{
			var expression_5 = _$_.hydrating ? _$_.hydrate_text() : span.firstChild;
		}

		var button_8 = _$_.hydrating ? _$_.hydrate_sibling() : span.nextSibling;

		button_8.__click = () => _$_.update(lazy_12);
		_$_.hydrating && _$_.pop(div_15);
	}

	_$_.render(render_5, { a: ' ', _lazy_12: lazy_12, _expression_5: expression_5 });
	_$_.append(__anchor, div_15);
}

WrapTrailingNavigatedElements[_$_.$r] = WrapTrailingNavigatedElements_render;

var root_38 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_6(__prev) {
	var __a = __prev._lazy_13.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_6, __prev.a = __a);
	}
}

function WrapTrailingStaticNavigatedElements_render(__anchor, __block) {
	let lazy_13 = _$_.track(0, __block, 'c2e2a938');
	var div_16 = root_38();

	{
		var node_24 = _$_.hydrating ? _$_.hydrate_child() : div_16.firstChild;

		_$_.render_component(TrailingStaticNavigatedElements, node_24, {});

		var span_1 = _$_.hydrating ? _$_.hydrate_sibling() : node_24.nextSibling;

		{
			var expression_6 = _$_.hydrating ? _$_.hydrate_text() : span_1.firstChild;
		}

		var button_9 = _$_.hydrating ? _$_.hydrate_sibling() : span_1.nextSibling;

		button_9.__click = () => _$_.update(lazy_13);
		_$_.hydrating && _$_.pop(div_16);
	}

	_$_.render(render_6, { a: ' ', _lazy_13: lazy_13, _expression_6: expression_6 });
	_$_.append(__anchor, div_16);
}

WrapTrailingStaticNavigatedElements[_$_.$r] = WrapTrailingStaticNavigatedElements_render;

var root_39 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_7(__prev) {
	var __a = __prev._lazy_14.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_7, __prev.a = __a);
	}
}

function WrapNavigatedThenStatic_render(__anchor, __block) {
	let lazy_14 = _$_.track(0, __block, 'b4046e87');
	var div_17 = root_39();

	{
		var node_25 = _$_.hydrating ? _$_.hydrate_child() : div_17.firstChild;

		_$_.render_component(NavigatedThenStatic, node_25, {});

		var span_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_25.nextSibling;

		{
			var expression_7 = _$_.hydrating ? _$_.hydrate_text() : span_2.firstChild;
		}

		var button_10 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;

		button_10.__click = () => _$_.update(lazy_14);
		_$_.hydrating && _$_.pop(div_17);
	}

	_$_.render(render_7, { a: ' ', _lazy_14: lazy_14, _expression_7: expression_7 });
	_$_.append(__anchor, div_17);
}

WrapNavigatedThenStatic[_$_.$r] = WrapNavigatedThenStatic_render;

var root_40 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_8(__prev) {
	var __a = __prev._lazy_15.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_8, __prev.a = __a);
	}
}

function WrapLeadingNavigatedThenStatic_render(__anchor, __block) {
	let lazy_15 = _$_.track(0, __block, 'bed7f7ef');
	var div_18 = root_40();

	{
		var node_26 = _$_.hydrating ? _$_.hydrate_child() : div_18.firstChild;

		_$_.render_component(LeadingNavigatedThenStatic, node_26, {});

		var span_3 = _$_.hydrating ? _$_.hydrate_sibling() : node_26.nextSibling;

		{
			var expression_8 = _$_.hydrating ? _$_.hydrate_text() : span_3.firstChild;
		}

		var button_11 = _$_.hydrating ? _$_.hydrate_sibling() : span_3.nextSibling;

		button_11.__click = () => _$_.update(lazy_15);
		_$_.hydrating && _$_.pop(div_18);
	}

	_$_.render(render_8, { a: ' ', _lazy_15: lazy_15, _expression_8: expression_8 });
	_$_.append(__anchor, div_18);
}

WrapLeadingNavigatedThenStatic[_$_.$r] = WrapLeadingNavigatedThenStatic_render;

var root_41 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_9(__prev) {
	var __a = __prev._lazy_16.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_9, __prev.a = __a);
	}
}

function WrapTrailingNestedNavigated_render(__anchor, __block) {
	let lazy_16 = _$_.track(0, __block, 'eddbe7bc');
	var div_19 = root_41();

	{
		var node_27 = _$_.hydrating ? _$_.hydrate_child() : div_19.firstChild;

		_$_.render_component(TrailingNestedNavigated, node_27, {});

		var span_4 = _$_.hydrating ? _$_.hydrate_sibling() : node_27.nextSibling;

		{
			var expression_9 = _$_.hydrating ? _$_.hydrate_text() : span_4.firstChild;
		}

		var button_12 = _$_.hydrating ? _$_.hydrate_sibling() : span_4.nextSibling;

		button_12.__click = () => _$_.update(lazy_16);
		_$_.hydrating && _$_.pop(div_19);
	}

	_$_.render(render_9, { a: ' ', _lazy_16: lazy_16, _expression_9: expression_9 });
	_$_.append(__anchor, div_19);
}

WrapTrailingNestedNavigated[_$_.$r] = WrapTrailingNestedNavigated_render;

var root_42 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_10(__prev) {
	var __a = __prev._lazy_17.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_10, __prev.a = __a);
	}
}

function WrapNestedNavigatedThenStatic_render(__anchor, __block) {
	let lazy_17 = _$_.track(0, __block, '1bdc4523');
	var div_20 = root_42();

	{
		var node_28 = _$_.hydrating ? _$_.hydrate_child() : div_20.firstChild;

		_$_.render_component(NestedNavigatedThenStatic, node_28, {});

		var span_5 = _$_.hydrating ? _$_.hydrate_sibling() : node_28.nextSibling;

		{
			var expression_10 = _$_.hydrating ? _$_.hydrate_text() : span_5.firstChild;
		}

		var button_13 = _$_.hydrating ? _$_.hydrate_sibling() : span_5.nextSibling;

		button_13.__click = () => _$_.update(lazy_17);
		_$_.hydrating && _$_.pop(div_20);
	}

	_$_.render(render_10, { a: ' ', _lazy_17: lazy_17, _expression_10: expression_10 });
	_$_.append(__anchor, div_20);
}

WrapNestedNavigatedThenStatic[_$_.$r] = WrapNestedNavigatedThenStatic_render;

var root_43 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_11(__prev) {
	var __a = __prev._lazy_18.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_11, __prev.a = __a);
	}
}

function WrapTrackedTextThenStatic_render(__anchor, __block) {
	let lazy_18 = _$_.track(0, __block, '97e02c24');
	var div_21 = root_43();

	{
		var node_29 = _$_.hydrating ? _$_.hydrate_child() : div_21.firstChild;

		_$_.render_component(TrackedTextThenStatic, node_29, {});

		var span_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_29.nextSibling;

		{
			var expression_11 = _$_.hydrating ? _$_.hydrate_text() : span_6.firstChild;
		}

		var button_14 = _$_.hydrating ? _$_.hydrate_sibling() : span_6.nextSibling;

		button_14.__click = () => _$_.update(lazy_18);
		_$_.hydrating && _$_.pop(div_21);
	}

	_$_.render(render_11, { a: ' ', _lazy_18: lazy_18, _expression_11: expression_11 });
	_$_.append(__anchor, div_21);
}

WrapTrackedTextThenStatic[_$_.$r] = WrapTrackedTextThenStatic_render;

var root_44 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_12(__prev) {
	var __a = __prev._lazy_19.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_12, __prev.a = __a);
	}
}

function WrapStaticThenTrackedText_render(__anchor, __block) {
	let lazy_19 = _$_.track(0, __block, 'd5526861');
	var div_22 = root_44();

	{
		var node_30 = _$_.hydrating ? _$_.hydrate_child() : div_22.firstChild;

		_$_.render_component(StaticThenTrackedText, node_30, {});

		var span_7 = _$_.hydrating ? _$_.hydrate_sibling() : node_30.nextSibling;

		{
			var expression_12 = _$_.hydrating ? _$_.hydrate_text() : span_7.firstChild;
		}

		var button_15 = _$_.hydrating ? _$_.hydrate_sibling() : span_7.nextSibling;

		button_15.__click = () => _$_.update(lazy_19);
		_$_.hydrating && _$_.pop(div_22);
	}

	_$_.render(render_12, { a: ' ', _lazy_19: lazy_19, _expression_12: expression_12 });
	_$_.append(__anchor, div_22);
}

WrapStaticThenTrackedText[_$_.$r] = WrapStaticThenTrackedText_render;

var root_45 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_13(__prev) {
	var __a = __prev._lazy_20.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_13, __prev.a = __a);
	}
}

function WrapStaticNestedThenStatic_render(__anchor, __block) {
	let lazy_20 = _$_.track(0, __block, '7e2d3fad');
	var div_23 = root_45();

	{
		var node_31 = _$_.hydrating ? _$_.hydrate_child() : div_23.firstChild;

		_$_.render_component(StaticNestedThenStatic, node_31, {});

		var span_8 = _$_.hydrating ? _$_.hydrate_sibling() : node_31.nextSibling;

		{
			var expression_13 = _$_.hydrating ? _$_.hydrate_text() : span_8.firstChild;
		}

		var button_16 = _$_.hydrating ? _$_.hydrate_sibling() : span_8.nextSibling;

		button_16.__click = () => _$_.update(lazy_20);
		_$_.hydrating && _$_.pop(div_23);
	}

	_$_.render(render_13, { a: ' ', _lazy_20: lazy_20, _expression_13: expression_13 });
	_$_.append(__anchor, div_23);
}

WrapStaticNestedThenStatic[_$_.$r] = WrapStaticNestedThenStatic_render;

var root_46 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_14(__prev) {
	var __a = __prev._lazy_21.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_14, __prev.a = __a);
	}
}

function WrapAllStatic_render(__anchor, __block) {
	let lazy_21 = _$_.track(0, __block, 'b894f45a');
	var div_24 = root_46();

	{
		var node_32 = _$_.hydrating ? _$_.hydrate_child() : div_24.firstChild;

		_$_.render_component(AllStatic, node_32, {});

		var span_9 = _$_.hydrating ? _$_.hydrate_sibling() : node_32.nextSibling;

		{
			var expression_14 = _$_.hydrating ? _$_.hydrate_text() : span_9.firstChild;
		}

		var button_17 = _$_.hydrating ? _$_.hydrate_sibling() : span_9.nextSibling;

		button_17.__click = () => _$_.update(lazy_21);
		_$_.hydrating && _$_.pop(div_24);
	}

	_$_.render(render_14, { a: ' ', _lazy_21: lazy_21, _expression_14: expression_14 });
	_$_.append(__anchor, div_24);
}

WrapAllStatic[_$_.$r] = WrapAllStatic_render;

var root_47 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_15(__prev) {
	var __a = __prev._lazy_22.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_15, __prev.a = __a);
	}
}

function WrapTrailingDynamicChild_render(__anchor, __block) {
	let lazy_22 = _$_.track(0, __block, '038446ca');
	var div_25 = root_47();

	{
		var node_33 = _$_.hydrating ? _$_.hydrate_child() : div_25.firstChild;

		_$_.render_component(TrailingDynamicChild, node_33, {});

		var span_10 = _$_.hydrating ? _$_.hydrate_sibling() : node_33.nextSibling;

		{
			var expression_15 = _$_.hydrating ? _$_.hydrate_text() : span_10.firstChild;
		}

		var button_18 = _$_.hydrating ? _$_.hydrate_sibling() : span_10.nextSibling;

		button_18.__click = () => _$_.update(lazy_22);
		_$_.hydrating && _$_.pop(div_25);
	}

	_$_.render(render_15, { a: ' ', _lazy_22: lazy_22, _expression_15: expression_15 });
	_$_.append(__anchor, div_25);
}

WrapTrailingDynamicChild[_$_.$r] = WrapTrailingDynamicChild_render;

var root_48 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_16(__prev) {
	var __a = __prev._lazy_23.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_16, __prev.a = __a);
	}
}

function WrapDynamicChildThenStatic_render(__anchor, __block) {
	let lazy_23 = _$_.track(0, __block, '3ec460c3');
	var div_26 = root_48();

	{
		var node_34 = _$_.hydrating ? _$_.hydrate_child() : div_26.firstChild;

		_$_.render_component(DynamicChildThenStatic, node_34, {});

		var span_11 = _$_.hydrating ? _$_.hydrate_sibling() : node_34.nextSibling;

		{
			var expression_16 = _$_.hydrating ? _$_.hydrate_text() : span_11.firstChild;
		}

		var button_19 = _$_.hydrating ? _$_.hydrate_sibling() : span_11.nextSibling;

		button_19.__click = () => _$_.update(lazy_23);
		_$_.hydrating && _$_.pop(div_26);
	}

	_$_.render(render_16, { a: ' ', _lazy_23: lazy_23, _expression_16: expression_16 });
	_$_.append(__anchor, div_26);
}

WrapDynamicChildThenStatic[_$_.$r] = WrapDynamicChildThenStatic_render;

var root_49 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_17(__prev) {
	var __a = __prev._lazy_24.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_17, __prev.a = __a);
	}
}

function WrapIfThenStatic_render(__anchor, __block) {
	let lazy_24 = _$_.track(0, __block, '95b417dd');
	var div_27 = root_49();

	{
		var node_35 = _$_.hydrating ? _$_.hydrate_child() : div_27.firstChild;

		_$_.render_component(IfThenStatic, node_35, {});

		var span_12 = _$_.hydrating ? _$_.hydrate_sibling() : node_35.nextSibling;

		{
			var expression_17 = _$_.hydrating ? _$_.hydrate_text() : span_12.firstChild;
		}

		var button_20 = _$_.hydrating ? _$_.hydrate_sibling() : span_12.nextSibling;

		button_20.__click = () => _$_.update(lazy_24);
		_$_.hydrating && _$_.pop(div_27);
	}

	_$_.render(render_17, { a: ' ', _lazy_24: lazy_24, _expression_17: expression_17 });
	_$_.append(__anchor, div_27);
}

WrapIfThenStatic[_$_.$r] = WrapIfThenStatic_render;

var root_50 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_18(__prev) {
	var __a = __prev._lazy_25.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_18, __prev.a = __a);
	}
}

function WrapStaticThenIf_render(__anchor, __block) {
	let lazy_25 = _$_.track(0, __block, '1f01fa6f');
	var div_28 = root_50();

	{
		var node_36 = _$_.hydrating ? _$_.hydrate_child() : div_28.firstChild;

		_$_.render_component(StaticThenIf, node_36, {});

		var span_13 = _$_.hydrating ? _$_.hydrate_sibling() : node_36.nextSibling;

		{
			var expression_18 = _$_.hydrating ? _$_.hydrate_text() : span_13.firstChild;
		}

		var button_21 = _$_.hydrating ? _$_.hydrate_sibling() : span_13.nextSibling;

		button_21.__click = () => _$_.update(lazy_25);
		_$_.hydrating && _$_.pop(div_28);
	}

	_$_.render(render_18, { a: ' ', _lazy_25: lazy_25, _expression_18: expression_18 });
	_$_.append(__anchor, div_28);
}

WrapStaticThenIf[_$_.$r] = WrapStaticThenIf_render;

var root_51 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_19(__prev) {
	var __a = __prev._lazy_26.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_19, __prev.a = __a);
	}
}

function WrapCompThenStatic_render(__anchor, __block) {
	let lazy_26 = _$_.track(0, __block, 'e6bdb91d');
	var div_29 = root_51();

	{
		var node_37 = _$_.hydrating ? _$_.hydrate_child() : div_29.firstChild;

		_$_.render_component(CompThenStatic, node_37, {});

		var span_14 = _$_.hydrating ? _$_.hydrate_sibling() : node_37.nextSibling;

		{
			var expression_19 = _$_.hydrating ? _$_.hydrate_text() : span_14.firstChild;
		}

		var button_22 = _$_.hydrating ? _$_.hydrate_sibling() : span_14.nextSibling;

		button_22.__click = () => _$_.update(lazy_26);
		_$_.hydrating && _$_.pop(div_29);
	}

	_$_.render(render_19, { a: ' ', _lazy_26: lazy_26, _expression_19: expression_19 });
	_$_.append(__anchor, div_29);
}

WrapCompThenStatic[_$_.$r] = WrapCompThenStatic_render;

var root_52 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_20(__prev) {
	var __a = __prev._lazy_27.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_20, __prev.a = __a);
	}
}

function WrapStaticThenComp_render(__anchor, __block) {
	let lazy_27 = _$_.track(0, __block, '89d5704c');
	var div_30 = root_52();

	{
		var node_38 = _$_.hydrating ? _$_.hydrate_child() : div_30.firstChild;

		_$_.render_component(StaticThenComp, node_38, {});

		var span_15 = _$_.hydrating ? _$_.hydrate_sibling() : node_38.nextSibling;

		{
			var expression_20 = _$_.hydrating ? _$_.hydrate_text() : span_15.firstChild;
		}

		var button_23 = _$_.hydrating ? _$_.hydrate_sibling() : span_15.nextSibling;

		button_23.__click = () => _$_.update(lazy_27);
		_$_.hydrating && _$_.pop(div_30);
	}

	_$_.render(render_20, { a: ' ', _lazy_27: lazy_27, _expression_20: expression_20 });
	_$_.append(__anchor, div_30);
}

WrapStaticThenComp[_$_.$r] = WrapStaticThenComp_render;

var root_53 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_21(__prev) {
	var __a = __prev._lazy_28.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_21, __prev.a = __a);
	}
}

function WrapSiblingComps_render(__anchor, __block) {
	let lazy_28 = _$_.track(0, __block, 'c5c51af6');
	var div_31 = root_53();

	{
		var node_39 = _$_.hydrating ? _$_.hydrate_child() : div_31.firstChild;

		_$_.render_component(SiblingComps, node_39, {});

		var span_16 = _$_.hydrating ? _$_.hydrate_sibling() : node_39.nextSibling;

		{
			var expression_21 = _$_.hydrating ? _$_.hydrate_text() : span_16.firstChild;
		}

		var button_24 = _$_.hydrating ? _$_.hydrate_sibling() : span_16.nextSibling;

		button_24.__click = () => _$_.update(lazy_28);
		_$_.hydrating && _$_.pop(div_31);
	}

	_$_.render(render_21, { a: ' ', _lazy_28: lazy_28, _expression_21: expression_21 });
	_$_.append(__anchor, div_31);
}

WrapSiblingComps[_$_.$r] = WrapSiblingComps_render;

var root_55 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_54 = _$_.template(`<!>`, 1, 1);

function UntrackedTextThenStatic_render(__anchor, __block) {
	const label = 'label';
	var fragment_34 = root_54();
	var node_40 = _$_.first_child_frag(fragment_34);

	_$_.expression(node_40, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_35 = root_55();
		var expression_22 = _$_.first_child_frag(fragment_35);

		_$_.expression(expression_22, () => _$_.with_scope(__block, () => label.toUpperCase()));
		_$_.next(2);
		_$_.append(__anchor, fragment_35);
	}));

	_$_.append(__anchor, fragment_34);
}

UntrackedTextThenStatic[_$_.$r] = UntrackedTextThenStatic_render;

var root_58 = _$_.template(`<span class="x">x</span><span class="y">y</span>`, 1, 2);
var root_57 = _$_.template(`<div class="a">a</div><!><div class="b">b</div><div class="c">c</div>`, 1, 4);
var root_56 = _$_.template(`<!>`, 1, 1);

function NestedFragmentThenStatic_render(__anchor, __block) {
	var fragment_36 = root_56();
	var node_42 = _$_.first_child_frag(fragment_36);

	_$_.expression(node_42, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_37 = root_57();
		var div_32 = _$_.first_child_frag(fragment_37);
		var node_41 = _$_.hydrating ? _$_.hydrate_sibling() : div_32.nextSibling;

		_$_.expression(node_41, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_38 = root_58();

			_$_.next();
			_$_.append(__anchor, fragment_38);
		}));

		_$_.next(2);
		_$_.append(__anchor, fragment_37);
	}));

	_$_.append(__anchor, fragment_36);
}

NestedFragmentThenStatic[_$_.$r] = NestedFragmentThenStatic_render;

var root_61 = _$_.template(`<span class="x">x</span><button class="inc">inc</button>`, 1, 2);
var root_60 = _$_.template(`<div class="count"> </div><!>`, 1, 2);

function render_22(__prev) {
	var __a = __prev._lazy_29.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_23, __prev.a = __a);
	}
}

var root_59 = _$_.template(`<!>`, 1, 1);

function TrailingNestedFragment_render(__anchor, __block) {
	let lazy_29 = _$_.track(0, __block, '82cbc65f');
	var fragment_39 = root_59();
	var node_44 = _$_.first_child_frag(fragment_39);

	_$_.expression(node_44, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_40 = root_60();
		var div_33 = _$_.first_child_frag(fragment_40);

		{
			var expression_23 = _$_.hydrating ? _$_.hydrate_text() : div_33.firstChild;
		}

		var node_43 = _$_.hydrating ? _$_.hydrate_sibling() : div_33.nextSibling;

		_$_.expression(node_43, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_41 = root_61();
			var span_17 = _$_.first_child_frag(fragment_41);
			var button_25 = _$_.hydrating ? _$_.hydrate_sibling() : span_17.nextSibling;

			button_25.__click = () => _$_.update(lazy_29);
			_$_.append(__anchor, fragment_41);
		}));

		_$_.render(render_22, { a: ' ', _lazy_29: lazy_29, _expression_23: expression_23 });
		_$_.append(__anchor, fragment_40);
	}));

	_$_.append(__anchor, fragment_39);
}

TrailingNestedFragment[_$_.$r] = TrailingNestedFragment_render;

var root_64 = _$_.template(`<b class="item"> </b>`, 0);
var root_63 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_62 = _$_.template(`<!>`, 1, 1);

function ForThenStatic_render(__anchor, __block) {
	const items = [1, 2];
	var fragment_42 = root_62();
	var node_46 = _$_.first_child_frag(fragment_42);

	_$_.expression(node_46, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_43 = root_63();
		var node_45 = _$_.first_child_frag(fragment_43);

		_$_.for(
			node_45,
			() => items,
			(__anchor, item) => {
				var b_2 = root_64();

				{
					var expression_24 = _$_.hydrating ? _$_.hydrate_child() : b_2.firstChild;

					_$_.expression(expression_24, () => item);
					_$_.hydrating && _$_.pop(b_2);
				}

				_$_.append(__anchor, b_2);
			},
			0
		);

		_$_.next(2);
		_$_.append(__anchor, fragment_43);
	}));

	_$_.append(__anchor, fragment_42);
}

ForThenStatic[_$_.$r] = ForThenStatic_render;

var root_67 = _$_.template(`<b class="zero">zero</b>`, 0);
var root_68 = _$_.template(`<b class="other">other</b>`, 0);
var root_66 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_65 = _$_.template(`<!>`, 1, 1);

function SwitchThenStatic_render(__anchor, __block) {
	let lazy_30 = _$_.track(0, __block, '800f9ff3');
	var fragment_44 = root_65();
	var node_48 = _$_.first_child_frag(fragment_44);

	_$_.expression(node_48, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_45 = root_66();
		var node_47 = _$_.first_child_frag(fragment_45);

		{
			var switch_case_0 = (__anchor) => {
				var b_3 = root_67();

				_$_.append(__anchor, b_3);
			};

			var switch_case_default = (__anchor) => {
				var b_4 = root_68();

				_$_.append(__anchor, b_4);
			};

			_$_.switch(node_47, () => {
				var result = [];

				switch (lazy_30.value) {
					case 0:
						result.push(switch_case_0);
						return result;

					default:
						result.push(switch_case_default);
						return result;
				}
			});
		}

		_$_.next(2);
		_$_.append(__anchor, fragment_45);
	}));

	_$_.append(__anchor, fragment_44);
}

SwitchThenStatic[_$_.$r] = SwitchThenStatic_render;

var root_71 = _$_.template(`<b class="try">try</b>`, 0);
var root_72 = _$_.template(`<b class="catch">catch</b>`, 0);
var root_70 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_69 = _$_.template(`<!>`, 1, 1);

function TryThenStatic_render(__anchor, __block) {
	var fragment_46 = root_69();
	var node_50 = _$_.first_child_frag(fragment_46);

	_$_.expression(node_50, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_47 = root_70();
		var node_49 = _$_.first_child_frag(fragment_47);

		_$_.try(
			node_49,
			(__anchor) => {
				var b_5 = root_71();

				_$_.append(__anchor, b_5);
			},
			(__anchor, e) => {
				var b_6 = root_72();

				_$_.append(__anchor, b_6);
			}
		);

		_$_.next(2);
		_$_.append(__anchor, fragment_47);
	}));

	_$_.append(__anchor, fragment_46);
}

TryThenStatic[_$_.$r] = TryThenStatic_render;

var root_74 = _$_.template(`<style>.styled { color: red; }</style><div class="styled a">a</div><div class="styled b">b</div>`, 1, 3);
var root_73 = _$_.template(`<!>`, 1, 1);

function StyleThenStatic_render(__anchor, __block) {
	var fragment_48 = root_73();
	var node_51 = _$_.first_child_frag(fragment_48);

	_$_.expression(node_51, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_49 = root_74();
		var style = _$_.first_child_frag(fragment_49);

		{
			_$_.hydrating && _$_.pop(style);
		}

		_$_.next(2);
		_$_.append(__anchor, fragment_49);
	}));

	_$_.append(__anchor, fragment_48);
}

StyleThenStatic[_$_.$r] = StyleThenStatic_render;

var root_76 = _$_.template(`<b class="item"> </b>`, 0);
var root_77 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_75 = _$_.template(`<!>`, 1, 1);

function CollectionThenStatic_render(__anchor, __block) {
	const items = [1, 2];
	var fragment_50 = root_75();
	var node_52 = _$_.first_child_frag(fragment_50);

	_$_.expression(node_52, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_51 = root_77();
		var expression_26 = _$_.first_child_frag(fragment_51);

		_$_.expression(expression_26, () => _$_.with_scope(__block, () => items.map((item) => _$_.tsrx_element((__anchor, __block) => {
			var b_7 = root_76();

			{
				var expression_25 = _$_.hydrating ? _$_.hydrate_child() : b_7.firstChild;

				_$_.expression(expression_25, () => item);
				_$_.hydrating && _$_.pop(b_7);
			}

			_$_.append(__anchor, b_7);
		}))));

		_$_.next(2);
		_$_.append(__anchor, fragment_51);
	}));

	_$_.append(__anchor, fragment_50);
}

CollectionThenStatic[_$_.$r] = CollectionThenStatic_render;

var root_79 = _$_.template(`<b class="inline">inline</b>`, 0);
var root_80 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_78 = _$_.template(`<!>`, 1, 1);

function InlineElementThenStatic_render(__anchor, __block) {
	var fragment_52 = root_78();
	var node_53 = _$_.first_child_frag(fragment_52);

	_$_.expression(node_53, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_53 = root_80();
		var expression_27 = _$_.first_child_frag(fragment_53);

		_$_.expression(expression_27, () => _$_.tsrx_element((__anchor, __block) => {
			var b_8 = root_79();

			_$_.append(__anchor, b_8);
		}));

		_$_.next(2);
		_$_.append(__anchor, fragment_53);
	}));

	_$_.append(__anchor, fragment_52);
}

InlineElementThenStatic[_$_.$r] = InlineElementThenStatic_render;

var root_81 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_23(__prev) {
	var __a = __prev._lazy_31.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_28, __prev.a = __a);
	}
}

function WrapUntrackedTextThenStatic_render(__anchor, __block) {
	let lazy_31 = _$_.track(0, __block, '3a78abea');
	var div_34 = root_81();

	{
		var node_54 = _$_.hydrating ? _$_.hydrate_child() : div_34.firstChild;

		_$_.render_component(UntrackedTextThenStatic, node_54, {});

		var span_18 = _$_.hydrating ? _$_.hydrate_sibling() : node_54.nextSibling;

		{
			var expression_28 = _$_.hydrating ? _$_.hydrate_text() : span_18.firstChild;
		}

		var button_26 = _$_.hydrating ? _$_.hydrate_sibling() : span_18.nextSibling;

		button_26.__click = () => _$_.update(lazy_31);
		_$_.hydrating && _$_.pop(div_34);
	}

	_$_.render(render_23, { a: ' ', _lazy_31: lazy_31, _expression_28: expression_28 });
	_$_.append(__anchor, div_34);
}

WrapUntrackedTextThenStatic[_$_.$r] = WrapUntrackedTextThenStatic_render;

var root_82 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_24(__prev) {
	var __a = __prev._lazy_32.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_29, __prev.a = __a);
	}
}

function WrapNestedFragmentThenStatic_render(__anchor, __block) {
	let lazy_32 = _$_.track(0, __block, 'db289d00');
	var div_35 = root_82();

	{
		var node_55 = _$_.hydrating ? _$_.hydrate_child() : div_35.firstChild;

		_$_.render_component(NestedFragmentThenStatic, node_55, {});

		var span_19 = _$_.hydrating ? _$_.hydrate_sibling() : node_55.nextSibling;

		{
			var expression_29 = _$_.hydrating ? _$_.hydrate_text() : span_19.firstChild;
		}

		var button_27 = _$_.hydrating ? _$_.hydrate_sibling() : span_19.nextSibling;

		button_27.__click = () => _$_.update(lazy_32);
		_$_.hydrating && _$_.pop(div_35);
	}

	_$_.render(render_24, { a: ' ', _lazy_32: lazy_32, _expression_29: expression_29 });
	_$_.append(__anchor, div_35);
}

WrapNestedFragmentThenStatic[_$_.$r] = WrapNestedFragmentThenStatic_render;

var root_83 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_25(__prev) {
	var __a = __prev._lazy_33.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_30, __prev.a = __a);
	}
}

function WrapTrailingNestedFragment_render(__anchor, __block) {
	let lazy_33 = _$_.track(0, __block, 'bb509235');
	var div_36 = root_83();

	{
		var node_56 = _$_.hydrating ? _$_.hydrate_child() : div_36.firstChild;

		_$_.render_component(TrailingNestedFragment, node_56, {});

		var span_20 = _$_.hydrating ? _$_.hydrate_sibling() : node_56.nextSibling;

		{
			var expression_30 = _$_.hydrating ? _$_.hydrate_text() : span_20.firstChild;
		}

		var button_28 = _$_.hydrating ? _$_.hydrate_sibling() : span_20.nextSibling;

		button_28.__click = () => _$_.update(lazy_33);
		_$_.hydrating && _$_.pop(div_36);
	}

	_$_.render(render_25, { a: ' ', _lazy_33: lazy_33, _expression_30: expression_30 });
	_$_.append(__anchor, div_36);
}

WrapTrailingNestedFragment[_$_.$r] = WrapTrailingNestedFragment_render;

var root_84 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_26(__prev) {
	var __a = __prev._lazy_34.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_31, __prev.a = __a);
	}
}

function WrapForThenStatic_render(__anchor, __block) {
	let lazy_34 = _$_.track(0, __block, 'a715e40a');
	var div_37 = root_84();

	{
		var node_57 = _$_.hydrating ? _$_.hydrate_child() : div_37.firstChild;

		_$_.render_component(ForThenStatic, node_57, {});

		var span_21 = _$_.hydrating ? _$_.hydrate_sibling() : node_57.nextSibling;

		{
			var expression_31 = _$_.hydrating ? _$_.hydrate_text() : span_21.firstChild;
		}

		var button_29 = _$_.hydrating ? _$_.hydrate_sibling() : span_21.nextSibling;

		button_29.__click = () => _$_.update(lazy_34);
		_$_.hydrating && _$_.pop(div_37);
	}

	_$_.render(render_26, { a: ' ', _lazy_34: lazy_34, _expression_31: expression_31 });
	_$_.append(__anchor, div_37);
}

WrapForThenStatic[_$_.$r] = WrapForThenStatic_render;

var root_85 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_27(__prev) {
	var __a = __prev._lazy_35.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_32, __prev.a = __a);
	}
}

function WrapSwitchThenStatic_render(__anchor, __block) {
	let lazy_35 = _$_.track(0, __block, 'a598ad9f');
	var div_38 = root_85();

	{
		var node_58 = _$_.hydrating ? _$_.hydrate_child() : div_38.firstChild;

		_$_.render_component(SwitchThenStatic, node_58, {});

		var span_22 = _$_.hydrating ? _$_.hydrate_sibling() : node_58.nextSibling;

		{
			var expression_32 = _$_.hydrating ? _$_.hydrate_text() : span_22.firstChild;
		}

		var button_30 = _$_.hydrating ? _$_.hydrate_sibling() : span_22.nextSibling;

		button_30.__click = () => _$_.update(lazy_35);
		_$_.hydrating && _$_.pop(div_38);
	}

	_$_.render(render_27, { a: ' ', _lazy_35: lazy_35, _expression_32: expression_32 });
	_$_.append(__anchor, div_38);
}

WrapSwitchThenStatic[_$_.$r] = WrapSwitchThenStatic_render;

var root_86 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_28(__prev) {
	var __a = __prev._lazy_36.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_33, __prev.a = __a);
	}
}

function WrapTryThenStatic_render(__anchor, __block) {
	let lazy_36 = _$_.track(0, __block, '1030b116');
	var div_39 = root_86();

	{
		var node_59 = _$_.hydrating ? _$_.hydrate_child() : div_39.firstChild;

		_$_.render_component(TryThenStatic, node_59, {});

		var span_23 = _$_.hydrating ? _$_.hydrate_sibling() : node_59.nextSibling;

		{
			var expression_33 = _$_.hydrating ? _$_.hydrate_text() : span_23.firstChild;
		}

		var button_31 = _$_.hydrating ? _$_.hydrate_sibling() : span_23.nextSibling;

		button_31.__click = () => _$_.update(lazy_36);
		_$_.hydrating && _$_.pop(div_39);
	}

	_$_.render(render_28, { a: ' ', _lazy_36: lazy_36, _expression_33: expression_33 });
	_$_.append(__anchor, div_39);
}

WrapTryThenStatic[_$_.$r] = WrapTryThenStatic_render;

var root_87 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_29(__prev) {
	var __a = __prev._lazy_37.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_34, __prev.a = __a);
	}
}

function WrapStyleThenStatic_render(__anchor, __block) {
	let lazy_37 = _$_.track(0, __block, 'f35d8716');
	var div_40 = root_87();

	{
		var node_60 = _$_.hydrating ? _$_.hydrate_child() : div_40.firstChild;

		_$_.render_component(StyleThenStatic, node_60, {});

		var span_24 = _$_.hydrating ? _$_.hydrate_sibling() : node_60.nextSibling;

		{
			var expression_34 = _$_.hydrating ? _$_.hydrate_text() : span_24.firstChild;
		}

		var button_32 = _$_.hydrating ? _$_.hydrate_sibling() : span_24.nextSibling;

		button_32.__click = () => _$_.update(lazy_37);
		_$_.hydrating && _$_.pop(div_40);
	}

	_$_.render(render_29, { a: ' ', _lazy_37: lazy_37, _expression_34: expression_34 });
	_$_.append(__anchor, div_40);
}

WrapStyleThenStatic[_$_.$r] = WrapStyleThenStatic_render;

var root_88 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_30(__prev) {
	var __a = __prev._lazy_38.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_35, __prev.a = __a);
	}
}

function WrapCollectionThenStatic_render(__anchor, __block) {
	let lazy_38 = _$_.track(0, __block, 'b1e7a298');
	var div_41 = root_88();

	{
		var node_61 = _$_.hydrating ? _$_.hydrate_child() : div_41.firstChild;

		_$_.render_component(CollectionThenStatic, node_61, {});

		var span_25 = _$_.hydrating ? _$_.hydrate_sibling() : node_61.nextSibling;

		{
			var expression_35 = _$_.hydrating ? _$_.hydrate_text() : span_25.firstChild;
		}

		var button_33 = _$_.hydrating ? _$_.hydrate_sibling() : span_25.nextSibling;

		button_33.__click = () => _$_.update(lazy_38);
		_$_.hydrating && _$_.pop(div_41);
	}

	_$_.render(render_30, { a: ' ', _lazy_38: lazy_38, _expression_35: expression_35 });
	_$_.append(__anchor, div_41);
}

WrapCollectionThenStatic[_$_.$r] = WrapCollectionThenStatic_render;

var root_89 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_31(__prev) {
	var __a = __prev._lazy_39.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_36, __prev.a = __a);
	}
}

function WrapInlineElementThenStatic_render(__anchor, __block) {
	let lazy_39 = _$_.track(0, __block, 'df10dc38');
	var div_42 = root_89();

	{
		var node_62 = _$_.hydrating ? _$_.hydrate_child() : div_42.firstChild;

		_$_.render_component(InlineElementThenStatic, node_62, {});

		var span_26 = _$_.hydrating ? _$_.hydrate_sibling() : node_62.nextSibling;

		{
			var expression_36 = _$_.hydrating ? _$_.hydrate_text() : span_26.firstChild;
		}

		var button_34 = _$_.hydrating ? _$_.hydrate_sibling() : span_26.nextSibling;

		button_34.__click = () => _$_.update(lazy_39);
		_$_.hydrating && _$_.pop(div_42);
	}

	_$_.render(render_31, { a: ' ', _lazy_39: lazy_39, _expression_36: expression_36 });
	_$_.append(__anchor, div_42);
}

WrapInlineElementThenStatic[_$_.$r] = WrapInlineElementThenStatic_render;

var root_91 = _$_.template(`<b class="if">x</b>`, 0);

function consequent_2(__anchor, lazy_40) {
	var b_9 = root_91();

	_$_.append(__anchor, b_9);
}

function if_3(lazy_40) {
	if (lazy_40.value >= 0) return consequent_2;
}

var root_90 = _$_.template(`<!>`, 1, 1);

function IfOnly_render(__anchor, __block) {
	let lazy_40 = _$_.track(0, __block, 'c6afe814');
	var fragment_54 = root_90();
	var node_63 = _$_.first_child_frag(fragment_54);

	_$_.expression(node_63, () => _$_.tsrx_element((__anchor, __block) => {
		_$_.if(__anchor, if_3, true, lazy_40);
	}));

	_$_.append(__anchor, fragment_54);
}

IfOnly[_$_.$r] = IfOnly_render;

var root_94 = _$_.template(`<b class="if">x</b>`, 0);

function consequent_3(__anchor, lazy_41) {
	var b_10 = root_94();

	_$_.append(__anchor, b_10);
}

function if_4(lazy_41) {
	if (lazy_41.value >= 0) return consequent_3;
}

var root_93 = _$_.template(`<!><div class="a">a</div>`, 1, 2);
var root_92 = _$_.template(`<!>`, 1, 1);

function IfThenOne_render(__anchor, __block) {
	let lazy_41 = _$_.track(0, __block, 'c3b63525');
	var fragment_55 = root_92();
	var node_65 = _$_.first_child_frag(fragment_55);

	_$_.expression(node_65, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_56 = root_93();
		var node_64 = _$_.first_child_frag(fragment_56);

		_$_.if(node_64, if_4, false, lazy_41);
		_$_.next();
		_$_.append(__anchor, fragment_56);
	}));

	_$_.append(__anchor, fragment_55);
}

IfThenOne[_$_.$r] = IfThenOne_render;

var root_96 = _$_.template(`<b class="if">x</b>`, 0);

function consequent_4(__anchor, lazy_42) {
	var b_11 = root_96();

	_$_.append(__anchor, b_11);
}

function if_5(lazy_42) {
	if (lazy_42.value >= 0) return consequent_4;
}

var root_95 = _$_.template(`<div class="root"><!></div>`, 0);

function SingleRootWithIf_render(__anchor, __block) {
	let lazy_42 = _$_.track(0, __block, '63d962e3');
	var div_43 = root_95();

	{
		var node_66 = _$_.hydrating ? _$_.hydrate_child() : div_43.firstChild;

		_$_.if(node_66, if_5, false, lazy_42);
		_$_.hydrating && _$_.pop(div_43);
	}

	_$_.append(__anchor, div_43);
}

SingleRootWithIf[_$_.$r] = SingleRootWithIf_render;

var root_97 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_32(__prev) {
	var __a = __prev._lazy_43.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_37, __prev.a = __a);
	}
}

function WrapIfOnly_render(__anchor, __block) {
	let lazy_43 = _$_.track(0, __block, '83c8f19d');
	var div_44 = root_97();

	{
		var node_67 = _$_.hydrating ? _$_.hydrate_child() : div_44.firstChild;

		_$_.render_component(IfOnly, node_67, {});

		var span_27 = _$_.hydrating ? _$_.hydrate_sibling() : node_67.nextSibling;

		{
			var expression_37 = _$_.hydrating ? _$_.hydrate_text() : span_27.firstChild;
		}

		var button_35 = _$_.hydrating ? _$_.hydrate_sibling() : span_27.nextSibling;

		button_35.__click = () => _$_.update(lazy_43);
		_$_.hydrating && _$_.pop(div_44);
	}

	_$_.render(render_32, { a: ' ', _lazy_43: lazy_43, _expression_37: expression_37 });
	_$_.append(__anchor, div_44);
}

WrapIfOnly[_$_.$r] = WrapIfOnly_render;

var root_98 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_33(__prev) {
	var __a = __prev._lazy_44.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_38, __prev.a = __a);
	}
}

function WrapIfThenOne_render(__anchor, __block) {
	let lazy_44 = _$_.track(0, __block, '2cee9a57');
	var div_45 = root_98();

	{
		var node_68 = _$_.hydrating ? _$_.hydrate_child() : div_45.firstChild;

		_$_.render_component(IfThenOne, node_68, {});

		var span_28 = _$_.hydrating ? _$_.hydrate_sibling() : node_68.nextSibling;

		{
			var expression_38 = _$_.hydrating ? _$_.hydrate_text() : span_28.firstChild;
		}

		var button_36 = _$_.hydrating ? _$_.hydrate_sibling() : span_28.nextSibling;

		button_36.__click = () => _$_.update(lazy_44);
		_$_.hydrating && _$_.pop(div_45);
	}

	_$_.render(render_33, { a: ' ', _lazy_44: lazy_44, _expression_38: expression_38 });
	_$_.append(__anchor, div_45);
}

WrapIfThenOne[_$_.$r] = WrapIfThenOne_render;

var root_99 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_34(__prev) {
	var __a = __prev._lazy_45.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_39, __prev.a = __a);
	}
}

function WrapSingleRootWithIf_render(__anchor, __block) {
	let lazy_45 = _$_.track(0, __block, 'c179a57b');
	var div_46 = root_99();

	{
		var node_69 = _$_.hydrating ? _$_.hydrate_child() : div_46.firstChild;

		_$_.render_component(SingleRootWithIf, node_69, {});

		var span_29 = _$_.hydrating ? _$_.hydrate_sibling() : node_69.nextSibling;

		{
			var expression_39 = _$_.hydrating ? _$_.hydrate_text() : span_29.firstChild;
		}

		var button_37 = _$_.hydrating ? _$_.hydrate_sibling() : span_29.nextSibling;

		button_37.__click = () => _$_.update(lazy_45);
		_$_.hydrating && _$_.pop(div_46);
	}

	_$_.render(render_34, { a: ' ', _lazy_45: lazy_45, _expression_39: expression_39 });
	_$_.append(__anchor, div_46);
}

WrapSingleRootWithIf[_$_.$r] = WrapSingleRootWithIf_render;

var root_100 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_35(__prev) {
	var __a = __prev._lazy_46.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_41, __prev.a = __a);
	}
}

function ExprThenSiblingInDiv_render(__anchor, __block) {
	let lazy_46 = _$_.track(0, __block, 'db1d59ee');
	const label = 'label';
	var div_47 = root_100();

	{
		var expression_40 = _$_.hydrating ? _$_.hydrate_child() : div_47.firstChild;

		_$_.expression(expression_40, () => _$_.with_scope(__block, () => label.toUpperCase()));

		var span_30 = _$_.hydrating ? _$_.hydrate_sibling() : expression_40.nextSibling;

		{
			var expression_41 = _$_.hydrating ? _$_.hydrate_text() : span_30.firstChild;
		}

		var button_38 = _$_.hydrating ? _$_.hydrate_sibling() : span_30.nextSibling;

		button_38.__click = () => _$_.update(lazy_46);
		_$_.hydrating && _$_.pop(div_47);
	}

	_$_.render(render_35, { a: ' ', _lazy_46: lazy_46, _expression_41: expression_41 });
	_$_.append(__anchor, div_47);
}

ExprThenSiblingInDiv[_$_.$r] = ExprThenSiblingInDiv_render;

var root_103 = _$_.template(`<b class="if">x</b><i class="if2">y</i>`, 1, 2);

function consequent_5(__anchor, lazy_47) {
	var fragment_59 = root_103();

	_$_.next();
	_$_.append(__anchor, fragment_59);
}

function if_6(lazy_47) {
	if (lazy_47.value >= 0) return consequent_5;
}

var root_102 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_101 = _$_.template(`<!>`, 1, 1);

function IfTwoThenStatic_render(__anchor, __block) {
	let lazy_47 = _$_.track(0, __block, 'd8310b12');
	var fragment_57 = root_101();
	var node_71 = _$_.first_child_frag(fragment_57);

	_$_.expression(node_71, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_58 = root_102();
		var node_70 = _$_.first_child_frag(fragment_58);

		_$_.if(node_70, if_6, false, lazy_47);
		_$_.next(2);
		_$_.append(__anchor, fragment_58);
	}));

	_$_.append(__anchor, fragment_57);
}

IfTwoThenStatic[_$_.$r] = IfTwoThenStatic_render;

var root_105 = _$_.template(`<b class="if">x</b><i class="if2">y</i>`, 1, 2);

function consequent_6(__anchor, lazy_48) {
	var fragment_60 = root_105();

	_$_.next();
	_$_.append(__anchor, fragment_60);
}

function if_7(lazy_48) {
	if (lazy_48.value >= 0) return consequent_6;
}

var root_104 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_36(__prev) {
	var __a = __prev._lazy_48.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_42, __prev.a = __a);
	}
}

function IfTwoInDiv_render(__anchor, __block) {
	let lazy_48 = _$_.track(0, __block, '0c602c2f');
	var div_48 = root_104();

	{
		var node_72 = _$_.hydrating ? _$_.hydrate_child() : div_48.firstChild;

		_$_.if(node_72, if_7, false, lazy_48);

		var span_31 = _$_.hydrating ? _$_.hydrate_sibling() : node_72.nextSibling;

		{
			var expression_42 = _$_.hydrating ? _$_.hydrate_text() : span_31.firstChild;
		}

		var button_39 = _$_.hydrating ? _$_.hydrate_sibling() : span_31.nextSibling;

		button_39.__click = () => _$_.update(lazy_48);
		_$_.hydrating && _$_.pop(div_48);
	}

	_$_.render(render_36, { a: ' ', _lazy_48: lazy_48, _expression_42: expression_42 });
	_$_.append(__anchor, div_48);
}

IfTwoInDiv[_$_.$r] = IfTwoInDiv_render;

var root_106 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_37(__prev) {
	var __a = __prev._lazy_49.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_43, __prev.a = __a);
	}
}

function WrapIfTwoThenStatic_render(__anchor, __block) {
	let lazy_49 = _$_.track(0, __block, 'cd8f8438');
	var div_49 = root_106();

	{
		var node_73 = _$_.hydrating ? _$_.hydrate_child() : div_49.firstChild;

		_$_.render_component(IfTwoThenStatic, node_73, {});

		var span_32 = _$_.hydrating ? _$_.hydrate_sibling() : node_73.nextSibling;

		{
			var expression_43 = _$_.hydrating ? _$_.hydrate_text() : span_32.firstChild;
		}

		var button_40 = _$_.hydrating ? _$_.hydrate_sibling() : span_32.nextSibling;

		button_40.__click = () => _$_.update(lazy_49);
		_$_.hydrating && _$_.pop(div_49);
	}

	_$_.render(render_37, { a: ' ', _lazy_49: lazy_49, _expression_43: expression_43 });
	_$_.append(__anchor, div_49);
}

WrapIfTwoThenStatic[_$_.$r] = WrapIfTwoThenStatic_render;

var root_108 = _$_.template(`<b class="item"> </b><i class="sep">|</i>`, 1, 2);
var root_107 = _$_.template(`<div class="outer"><!><span class="after">after</span></div>`, 0);

function ForTwoNodeItems_render(__anchor, __block) {
	const items = [1, 2];
	var div_50 = root_107();

	{
		var node_74 = _$_.hydrating ? _$_.hydrate_child() : div_50.firstChild;

		_$_.for(
			node_74,
			() => items,
			(__anchor, item) => {
				var fragment_61 = root_108();
				var b_12 = _$_.first_child_frag(fragment_61);

				{
					var expression_44 = _$_.hydrating ? _$_.hydrate_child() : b_12.firstChild;

					_$_.expression(expression_44, () => item);
					_$_.hydrating && _$_.pop(b_12);
				}

				_$_.next();
				_$_.append(__anchor, fragment_61);
			},
			0
		);

		_$_.hydrating && _$_.pop(div_50);
	}

	_$_.append(__anchor, div_50);
}

ForTwoNodeItems[_$_.$r] = ForTwoNodeItems_render;

var root_109 = _$_.template(`<b class="made">made</b>`, 0);
var root_111 = _$_.template(`<!><div class="a">a</div><div class="b">b</div>`, 1, 3);
var root_110 = _$_.template(`<!>`, 1, 1);

function StaticCallThenStatic_render(__anchor, __block) {
	const makeB = () => _$_.tsrx_element((__anchor, __block) => {
		var b_13 = root_109();

		_$_.append(__anchor, b_13);
	});

	var fragment_62 = root_110();
	var node_75 = _$_.first_child_frag(fragment_62);

	_$_.expression(node_75, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_63 = root_111();
		var expression_45 = _$_.first_child_frag(fragment_63);

		_$_.render_tsrx_element(_$_.with_scope(__block, makeB), expression_45, __block);
		_$_.next(2);
		_$_.append(__anchor, fragment_63);
	}));

	_$_.append(__anchor, fragment_62);
}

StaticCallThenStatic[_$_.$r] = StaticCallThenStatic_render;

var root_113 = _$_.template(`<div class="a">a</div><style>.styled2 { color: blue; }</style><div class="styled2 b">b</div><div class="styled2 c">c</div>`, 1, 4);
var root_112 = _$_.template(`<!>`, 1, 1);

function StaticThenStyleThenStatic_render(__anchor, __block) {
	var fragment_64 = root_112();
	var node_76 = _$_.first_child_frag(fragment_64);

	_$_.expression(node_76, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_65 = root_113();
		var div_51 = _$_.first_child_frag(fragment_65);
		var style_1 = _$_.hydrating ? _$_.hydrate_sibling() : div_51.nextSibling;

		{
			_$_.hydrating && _$_.pop(style_1);
		}

		_$_.next(2);
		_$_.append(__anchor, fragment_65);
	}));

	_$_.append(__anchor, fragment_64);
}

StaticThenStyleThenStatic[_$_.$r] = StaticThenStyleThenStatic_render;

var root_114 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_38(__prev) {
	var __a = __prev._lazy_50.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_46, __prev.a = __a);
	}
}

function WrapStaticCallThenStatic_render(__anchor, __block) {
	let lazy_50 = _$_.track(0, __block, '4513c76f');
	var div_52 = root_114();

	{
		var node_77 = _$_.hydrating ? _$_.hydrate_child() : div_52.firstChild;

		_$_.render_component(StaticCallThenStatic, node_77, {});

		var span_33 = _$_.hydrating ? _$_.hydrate_sibling() : node_77.nextSibling;

		{
			var expression_46 = _$_.hydrating ? _$_.hydrate_text() : span_33.firstChild;
		}

		var button_41 = _$_.hydrating ? _$_.hydrate_sibling() : span_33.nextSibling;

		button_41.__click = () => _$_.update(lazy_50);
		_$_.hydrating && _$_.pop(div_52);
	}

	_$_.render(render_38, { a: ' ', _lazy_50: lazy_50, _expression_46: expression_46 });
	_$_.append(__anchor, div_52);
}

WrapStaticCallThenStatic[_$_.$r] = WrapStaticCallThenStatic_render;

var root_115 = _$_.template(`<div class="outer"><!><span class="after"> </span><button class="outer-inc">outer</button></div>`, 0);

function render_39(__prev) {
	var __a = __prev._lazy_51.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_47, __prev.a = __a);
	}
}

function WrapStaticThenStyleThenStatic_render(__anchor, __block) {
	let lazy_51 = _$_.track(0, __block, '5d5162df');
	var div_53 = root_115();

	{
		var node_78 = _$_.hydrating ? _$_.hydrate_child() : div_53.firstChild;

		_$_.render_component(StaticThenStyleThenStatic, node_78, {});

		var span_34 = _$_.hydrating ? _$_.hydrate_sibling() : node_78.nextSibling;

		{
			var expression_47 = _$_.hydrating ? _$_.hydrate_text() : span_34.firstChild;
		}

		var button_42 = _$_.hydrating ? _$_.hydrate_sibling() : span_34.nextSibling;

		button_42.__click = () => _$_.update(lazy_51);
		_$_.hydrating && _$_.pop(div_53);
	}

	_$_.render(render_39, { a: ' ', _lazy_51: lazy_51, _expression_47: expression_47 });
	_$_.append(__anchor, div_53);
}

WrapStaticThenStyleThenStatic[_$_.$r] = WrapStaticThenStyleThenStatic_render;

import { track } from 'ripple';

function Leaf() {
	return _$_.tsrx_element(Leaf_render);
}

export function TrailingNavigatedElements() {
	return _$_.tsrx_element(TrailingNavigatedElements_render);
}

export function TrailingStaticNavigatedElements() {
	return _$_.tsrx_element(TrailingStaticNavigatedElements_render);
}

export function NavigatedThenStatic() {
	return _$_.tsrx_element(NavigatedThenStatic_render);
}

export function LeadingNavigatedThenStatic() {
	return _$_.tsrx_element(LeadingNavigatedThenStatic_render);
}

export function TrailingNestedNavigated() {
	return _$_.tsrx_element(TrailingNestedNavigated_render);
}

export function NestedNavigatedThenStatic() {
	return _$_.tsrx_element(NestedNavigatedThenStatic_render);
}

export function TrackedTextThenStatic() {
	return _$_.tsrx_element(TrackedTextThenStatic_render);
}

export function StaticThenTrackedText() {
	return _$_.tsrx_element(StaticThenTrackedText_render);
}

export function StaticNestedThenStatic() {
	return _$_.tsrx_element(StaticNestedThenStatic_render);
}

export function AllStatic() {
	return _$_.tsrx_element(AllStatic_render);
}

export function TrailingDynamicChild() {
	return _$_.tsrx_element(TrailingDynamicChild_render);
}

export function DynamicChildThenStatic() {
	return _$_.tsrx_element(DynamicChildThenStatic_render);
}

export function IfThenStatic() {
	return _$_.tsrx_element(IfThenStatic_render);
}

export function StaticThenIf() {
	return _$_.tsrx_element(StaticThenIf_render);
}

export function CompThenStatic() {
	return _$_.tsrx_element(CompThenStatic_render);
}

export function StaticThenComp() {
	return _$_.tsrx_element(StaticThenComp_render);
}

export function SiblingComps() {
	return _$_.tsrx_element(SiblingComps_render);
}

export function WrapTrailingNavigatedElements() {
	return _$_.tsrx_element(WrapTrailingNavigatedElements_render);
}

export function WrapTrailingStaticNavigatedElements() {
	return _$_.tsrx_element(WrapTrailingStaticNavigatedElements_render);
}

export function WrapNavigatedThenStatic() {
	return _$_.tsrx_element(WrapNavigatedThenStatic_render);
}

export function WrapLeadingNavigatedThenStatic() {
	return _$_.tsrx_element(WrapLeadingNavigatedThenStatic_render);
}

export function WrapTrailingNestedNavigated() {
	return _$_.tsrx_element(WrapTrailingNestedNavigated_render);
}

export function WrapNestedNavigatedThenStatic() {
	return _$_.tsrx_element(WrapNestedNavigatedThenStatic_render);
}

export function WrapTrackedTextThenStatic() {
	return _$_.tsrx_element(WrapTrackedTextThenStatic_render);
}

export function WrapStaticThenTrackedText() {
	return _$_.tsrx_element(WrapStaticThenTrackedText_render);
}

export function WrapStaticNestedThenStatic() {
	return _$_.tsrx_element(WrapStaticNestedThenStatic_render);
}

export function WrapAllStatic() {
	return _$_.tsrx_element(WrapAllStatic_render);
}

export function WrapTrailingDynamicChild() {
	return _$_.tsrx_element(WrapTrailingDynamicChild_render);
}

export function WrapDynamicChildThenStatic() {
	return _$_.tsrx_element(WrapDynamicChildThenStatic_render);
}

export function WrapIfThenStatic() {
	return _$_.tsrx_element(WrapIfThenStatic_render);
}

export function WrapStaticThenIf() {
	return _$_.tsrx_element(WrapStaticThenIf_render);
}

export function WrapCompThenStatic() {
	return _$_.tsrx_element(WrapCompThenStatic_render);
}

export function WrapStaticThenComp() {
	return _$_.tsrx_element(WrapStaticThenComp_render);
}

export function WrapSiblingComps() {
	return _$_.tsrx_element(WrapSiblingComps_render);
}

export function UntrackedTextThenStatic() {
	return _$_.tsrx_element(UntrackedTextThenStatic_render);
}

export function NestedFragmentThenStatic() {
	return _$_.tsrx_element(NestedFragmentThenStatic_render);
}

export function TrailingNestedFragment() {
	return _$_.tsrx_element(TrailingNestedFragment_render);
}

export function ForThenStatic() {
	return _$_.tsrx_element(ForThenStatic_render);
}

export function SwitchThenStatic() {
	return _$_.tsrx_element(SwitchThenStatic_render);
}

export function TryThenStatic() {
	return _$_.tsrx_element(TryThenStatic_render);
}

export function StyleThenStatic() {
	return _$_.tsrx_element(StyleThenStatic_render);
}

export function CollectionThenStatic() {
	return _$_.tsrx_element(CollectionThenStatic_render);
}

export function InlineElementThenStatic() {
	return _$_.tsrx_element(InlineElementThenStatic_render);
}

export function WrapUntrackedTextThenStatic() {
	return _$_.tsrx_element(WrapUntrackedTextThenStatic_render);
}

export function WrapNestedFragmentThenStatic() {
	return _$_.tsrx_element(WrapNestedFragmentThenStatic_render);
}

export function WrapTrailingNestedFragment() {
	return _$_.tsrx_element(WrapTrailingNestedFragment_render);
}

export function WrapForThenStatic() {
	return _$_.tsrx_element(WrapForThenStatic_render);
}

export function WrapSwitchThenStatic() {
	return _$_.tsrx_element(WrapSwitchThenStatic_render);
}

export function WrapTryThenStatic() {
	return _$_.tsrx_element(WrapTryThenStatic_render);
}

export function WrapStyleThenStatic() {
	return _$_.tsrx_element(WrapStyleThenStatic_render);
}

export function WrapCollectionThenStatic() {
	return _$_.tsrx_element(WrapCollectionThenStatic_render);
}

export function WrapInlineElementThenStatic() {
	return _$_.tsrx_element(WrapInlineElementThenStatic_render);
}

export function IfOnly() {
	return _$_.tsrx_element(IfOnly_render);
}

export function IfThenOne() {
	return _$_.tsrx_element(IfThenOne_render);
}

export function SingleRootWithIf() {
	return _$_.tsrx_element(SingleRootWithIf_render);
}

export function WrapIfOnly() {
	return _$_.tsrx_element(WrapIfOnly_render);
}

export function WrapIfThenOne() {
	return _$_.tsrx_element(WrapIfThenOne_render);
}

export function WrapSingleRootWithIf() {
	return _$_.tsrx_element(WrapSingleRootWithIf_render);
}

export function ExprThenSiblingInDiv() {
	return _$_.tsrx_element(ExprThenSiblingInDiv_render);
}

export function IfTwoThenStatic() {
	return _$_.tsrx_element(IfTwoThenStatic_render);
}

export function IfTwoInDiv() {
	return _$_.tsrx_element(IfTwoInDiv_render);
}

export function WrapIfTwoThenStatic() {
	return _$_.tsrx_element(WrapIfTwoThenStatic_render);
}

export function ForTwoNodeItems() {
	return _$_.tsrx_element(ForTwoNodeItems_render);
}

export function StaticCallThenStatic() {
	return _$_.tsrx_element(StaticCallThenStatic_render);
}

export function StaticThenStyleThenStatic() {
	return _$_.tsrx_element(StaticThenStyleThenStatic_render);
}

export function WrapStaticCallThenStatic() {
	return _$_.tsrx_element(WrapStaticCallThenStatic_render);
}

export function WrapStaticThenStyleThenStatic() {
	return _$_.tsrx_element(WrapStaticThenStyleThenStatic_render);
}

_$_.delegate(['click']);