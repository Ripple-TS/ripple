// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Hello World</div>`, 0);

function StaticText_render(__anchor, __block) {
	var div = root();

	_$_.append(__anchor, div);
}

StaticText.$r = StaticText_render;

var root_2 = _$_.template(`<h1>Title</h1><p>Paragraph text</p><span>Span text</span>`, 1, 3);
var root_1 = _$_.template(`<!>`, 1, 1);

function MultipleElements_render(__anchor, __block) {
	var fragment = root_1();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_2();

		_$_.next(2);
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

MultipleElements.$r = MultipleElements_render;

var root_3 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div></div>`, 0);

function NestedElements_render(__anchor, __block) {
	var div_1 = root_3();

	_$_.append(__anchor, div_1);
}

NestedElements.$r = NestedElements_render;

var root_5 = _$_.template(`<input type="text" placeholder="Enter text" disabled><a href="/link" target="_blank">Link</a>`, 1, 2);
var root_4 = _$_.template(`<!>`, 1, 1);

function WithAttributes_render(__anchor, __block) {
	var fragment_2 = root_4();
	var node_1 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_5();

		_$_.next();
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

WithAttributes.$r = WithAttributes_render;

var root_6 = _$_.template(`<span class="child">Child content</span>`, 0);

function ChildComponent_render(__anchor, __block) {
	var span = root_6();

	_$_.append(__anchor, span);
}

ChildComponent.$r = ChildComponent_render;

var root_7 = _$_.template(`<div class="parent"></div>`, 0);

function ParentWithChild_render(__anchor, __block) {
	var div_2 = root_7();

	{
		var append_anchor = _$_.append_into(div_2);

		_$_.render_component(ChildComponent, append_anchor, {});
		_$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

ParentWithChild.$r = ParentWithChild_render;

var root_8 = _$_.template(`<div class="first">First</div>`, 0);

function FirstSibling_render(__anchor, __block) {
	var div_3 = root_8();

	_$_.append(__anchor, div_3);
}

FirstSibling.$r = FirstSibling_render;

var root_9 = _$_.template(`<div class="second">Second</div>`, 0);

function SecondSibling_render(__anchor, __block) {
	var div_4 = root_9();

	_$_.append(__anchor, div_4);
}

SecondSibling.$r = SecondSibling_render;

var root_11 = _$_.template(`<!><!>`, 1, 2);
var root_10 = _$_.template(`<!>`, 1, 1);

function SiblingComponents_render(__anchor, __block) {
	var fragment_4 = root_10();
	var node_4 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_4, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_11();
		var node_2 = _$_.first_child_frag(fragment_5);

		_$_.render_component(FirstSibling, node_2, {});

		var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : node_2.nextSibling;

		_$_.render_component(SecondSibling, node_3, {});
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

SiblingComponents.$r = SiblingComponents_render;

var root_12 = _$_.template(`<div> </div>`, 0);

function render(__prev) {
	var __a = 'Hello ' + __prev._props.name;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression, __prev.a = __a);
	}
}

function Greeting_render(__anchor, __block, props) {
	var div_5 = root_12();

	{
		var expression = _$_.hydrating ? _$_.hydrate_text() : div_5.firstChild;
	}

	_$_.render(render, { a: ' ', _props: props, _expression: expression });
	_$_.append(__anchor, div_5);
}

Greeting.$r = Greeting_render;

function WithGreeting_render(__anchor, __block) {
	_$_.render_component(Greeting, __anchor, { name: "World" });
}

WithGreeting.$r = WithGreeting_render;

var root_14 = _$_.template(`<div> </div><span> </span>`, 1, 2);
var root_13 = _$_.template(`<!>`, 1, 1);

function ExpressionContent_render(__anchor, __block) {
	const value = 42;
	const label = 'computed';
	var fragment_6 = root_13();
	var node_5 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_14();
		var div_6 = _$_.first_child_frag(fragment_7);

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_text() : div_6.firstChild;

			expression_1.nodeValue = value;
		}

		var span_1 = _$_.hydrating ? _$_.hydrate_sibling() : div_6.nextSibling;

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_child() : span_1.firstChild;

			_$_.expression(expression_2, () => _$_.with_scope(__block, () => label.toUpperCase()));
			_$_.pop(span_1);
		}

		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

ExpressionContent.$r = ExpressionContent_render;

var root_15 = _$_.template(`<div class="helper-item"> </div>`, 0);
var root_17 = _$_.template(`<span class="label"> </span><!>`, 1, 2);
var root_16 = _$_.template(`<!>`, 1, 1);
var root_19 = _$_.template(`<div class="app-item"> </div>`, 0);
var root_18 = _$_.template(`<div class="nested-expression-values"><!></div>`, 0);

function NestedTsxTsrxExpressionValues_render(__anchor, __block) {
	var div_8 = root_18();

	{
		var node_8 = _$_.hydrating ? _$_.hydrate_child() : div_8.firstChild;

		_$_.for(
			node_8,
			() => [1, 2, 3],
			(__anchor, item) => {
				var div_9 = root_19();

				{
					var expression_5 = _$_.hydrating ? _$_.hydrate_child() : div_9.firstChild;

					_$_.expression(expression_5, () => item);
					_$_.pop(div_9);
				}

				_$_.append(__anchor, div_9);
			},
			0
		);

		var node_9 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(div_8);

		_$_.render_component(NestedTsxTsrxFragment, node_9, { label: "from helper" });
		_$_.pop(div_8);
	}

	_$_.append(__anchor, div_8);
}

NestedTsxTsrxExpressionValues.$r = NestedTsxTsrxExpressionValues_render;

var root_20 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_21 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_22 = _$_.template(` `, 1, 1);
var root_23 = _$_.template(`<div class="mixed-collection"><!></div>`, 0);

function MixedTsrxCollectionText_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var fragment_10 = root_22();
		var expression_6 = _$_.first_child_frag(fragment_10);

		_$_.expression(expression_6, () => [
			'alpha ',
			_$_.tsrx_element((__anchor, __block) => {
				var strong = root_20();

				_$_.append(__anchor, strong);
			}),
			' gamma ',
			[
				'delta ',
				_$_.tsrx_element((__anchor, __block) => {
					var em = root_21();

					_$_.append(__anchor, em);
				}),
				' zeta'
			]
		]);

		_$_.append(__anchor, fragment_10);
	});

	var div_10 = root_23();

	{
		var expression_7 = _$_.hydrating ? _$_.hydrate_child() : div_10.firstChild;

		_$_.expression(expression_7, () => content);
		_$_.pop(div_10);
	}

	_$_.append(__anchor, div_10);
}

MixedTsrxCollectionText.$r = MixedTsrxCollectionText_render;

var root_24 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_25 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_26 = _$_.template(` `, 1, 1);
var root_27 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 0);

function MixedTsrxCollectionSplitServerText_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var fragment_11 = root_26();
		var expression_8 = _$_.first_child_frag(fragment_11);

		_$_.expression(expression_8, () => [
			'alpha ',
			_$_.tsrx_element((__anchor, __block) => {
				var strong_1 = root_24();

				_$_.append(__anchor, strong_1);
			}),
			' gamma ',
			[
				'delta ',
				_$_.tsrx_element((__anchor, __block) => {
					var em_1 = root_25();

					_$_.append(__anchor, em_1);
				}),
				' zeta'
			]
		]);

		_$_.append(__anchor, fragment_11);
	});

	var div_11 = root_27();

	{
		var expression_9 = _$_.hydrating ? _$_.hydrate_child() : div_11.firstChild;

		_$_.expression(expression_9, () => content);
		_$_.pop(div_11);
	}

	_$_.append(__anchor, div_11);
}

MixedTsrxCollectionSplitServerText.$r = MixedTsrxCollectionSplitServerText_render;

var root_28 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_29 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_30 = _$_.template(` `, 1, 1);
var root_31 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 0);

function MixedTsrxCollectionSplitClientText_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var fragment_12 = root_30();
		var expression_10 = _$_.first_child_frag(fragment_12);

		_$_.expression(expression_10, () => [
			'alpha ',
			_$_.tsrx_element((__anchor, __block) => {
				var strong_2 = root_28();

				_$_.append(__anchor, strong_2);
			}),
			' gamma ',
			[
				'changed ',
				_$_.tsrx_element((__anchor, __block) => {
					var em_2 = root_29();

					_$_.append(__anchor, em_2);
				}),
				' zeta'
			]
		]);

		_$_.append(__anchor, fragment_12);
	});

	var div_12 = root_31();

	{
		var expression_11 = _$_.hydrating ? _$_.hydrate_child() : div_12.firstChild;

		_$_.expression(expression_11, () => content);
		_$_.pop(div_12);
	}

	_$_.append(__anchor, div_12);
}

MixedTsrxCollectionSplitClientText.$r = MixedTsrxCollectionSplitClientText_render;

var root_32 = _$_.template(`<span class="primitive-tail"> ok</span>`, 0);
var root_33 = _$_.template(` `, 1, 1);
var root_34 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 0);

function MixedTsrxCollectionPrimitiveServerText_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var fragment_13 = root_33();
		var expression_12 = _$_.first_child_frag(fragment_13);

		_$_.expression(expression_12, () => [
			'count: ',
			1,
			' / ',
			true,
			_$_.tsrx_element((__anchor, __block) => {
				var span_3 = root_32();

				_$_.append(__anchor, span_3);
			})
		]);

		_$_.append(__anchor, fragment_13);
	});

	var div_13 = root_34();

	{
		var expression_13 = _$_.hydrating ? _$_.hydrate_child() : div_13.firstChild;

		_$_.expression(expression_13, () => content);
		_$_.pop(div_13);
	}

	_$_.append(__anchor, div_13);
}

MixedTsrxCollectionPrimitiveServerText.$r = MixedTsrxCollectionPrimitiveServerText_render;

var root_35 = _$_.template(`<span class="primitive-tail"> ok</span>`, 0);
var root_36 = _$_.template(` `, 1, 1);
var root_37 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 0);

function MixedTsrxCollectionPrimitiveClientText_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var fragment_14 = root_36();
		var expression_14 = _$_.first_child_frag(fragment_14);

		_$_.expression(expression_14, () => [
			'count: ',
			2,
			' / ',
			false,
			_$_.tsrx_element((__anchor, __block) => {
				var span_4 = root_35();

				_$_.append(__anchor, span_4);
			})
		]);

		_$_.append(__anchor, fragment_14);
	});

	var div_14 = root_37();

	{
		var expression_15 = _$_.hydrating ? _$_.hydrate_child() : div_14.firstChild;

		_$_.expression(expression_15, () => content);
		_$_.pop(div_14);
	}

	_$_.append(__anchor, div_14);
}

MixedTsrxCollectionPrimitiveClientText.$r = MixedTsrxCollectionPrimitiveClientText_render;

var root_38 = _$_.template(`<div class="dynamic-array-call"> </div>`, 0);

function DynamicArrayFromCall_render(__anchor, __block) {
	const items = _$_.with_scope(__block, createPrimitiveItems);
	var div_15 = root_38();

	{
		var expression_16 = _$_.hydrating ? _$_.hydrate_child() : div_15.firstChild;

		_$_.expression(expression_16, () => items);
		_$_.pop(div_15);
	}

	_$_.append(__anchor, div_15);
}

DynamicArrayFromCall.$r = DynamicArrayFromCall_render;

var root_39 = _$_.template(`<div class="dynamic-array-track"> </div>`, 0);

function DynamicArrayFromTrack_render(__anchor, __block) {
	let lazy = _$_.track(['start:', ['one', 2], true, null, false, ':end'], __block, 'b5de6402');
	var div_16 = root_39();

	{
		var expression_17 = _$_.hydrating ? _$_.hydrate_child() : div_16.firstChild;

		_$_.expression(expression_17, () => lazy.value);
		_$_.pop(div_16);
	}

	_$_.append(__anchor, div_16);
}

DynamicArrayFromTrack.$r = DynamicArrayFromTrack_render;

var root_40 = _$_.template(`<div class="dynamic-array-conditional"> </div>`, 0);

function DynamicArrayFromConditional_render(__anchor, __block) {
	const condition = true;

	const items = condition
		? ['start:', ['one', 2], true, null, false, ':end']
		: ['fallback'];

	var div_17 = root_40();

	{
		var expression_18 = _$_.hydrating ? _$_.hydrate_child() : div_17.firstChild;

		_$_.expression(expression_18, () => items);
		_$_.pop(div_17);
	}

	_$_.append(__anchor, div_17);
}

DynamicArrayFromConditional.$r = DynamicArrayFromConditional_render;

var root_41 = _$_.template(`<div class="dynamic-array-logical"> </div>`, 0);

function DynamicArrayFromLogical_render(__anchor, __block) {
	const condition = true;
	const items = condition && ['start:', ['one', 2], true, null, false, ':end'];
	var div_18 = root_41();

	{
		var expression_19 = _$_.hydrating ? _$_.hydrate_child() : div_18.firstChild;

		_$_.expression(expression_19, () => items);
		_$_.pop(div_18);
	}

	_$_.append(__anchor, div_18);
}

DynamicArrayFromLogical.$r = DynamicArrayFromLogical_render;

var root_42 = _$_.template(`<section class="outer"><div class="inner">from tsrx</div></section>`, 0);
var root_44 = _$_.template(`<!>`, 1, 1);
var root_43 = _$_.template(`<!>`, 1, 1);

function NestedTsrxInsideTopLevelTsxExpression_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var section = root_42();

		_$_.append(__anchor, section);
	});

	var fragment_15 = root_43();
	var node_10 = _$_.first_child_frag(fragment_15);

	_$_.expression(node_10, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_16 = root_44();
		var expression_20 = _$_.first_child_frag(fragment_16);

		_$_.expression(expression_20, () => content);
		_$_.append(__anchor, fragment_16);
	}));

	_$_.append(__anchor, fragment_15);
}

NestedTsrxInsideTopLevelTsxExpression.$r = NestedTsrxInsideTopLevelTsxExpression_render;

var root_45 = _$_.template(`<div class="wrapper"><section class="native"><span class="nested-tsrx">inside nested tsrx</span></section></div>`, 0);
var root_47 = _$_.template(`<!>`, 1, 1);
var root_46 = _$_.template(`<!>`, 1, 1);

function NestedTsrxElementsInsideTopLevelTsxValue_render(__anchor, __block) {
	const content = _$_.tsrx_element((__anchor, __block) => {
		var div_19 = root_45();

		_$_.append(__anchor, div_19);
	});

	var fragment_17 = root_46();
	var node_11 = _$_.first_child_frag(fragment_17);

	_$_.expression(node_11, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_18 = root_47();
		var expression_21 = _$_.first_child_frag(fragment_18);

		_$_.expression(expression_21, () => content);
		_$_.append(__anchor, fragment_18);
	}));

	_$_.append(__anchor, fragment_17);
}

NestedTsrxElementsInsideTopLevelTsxValue.$r = NestedTsrxElementsInsideTopLevelTsxValue_render;

var root_48 = _$_.template(`<span class="nested-tsx">inside nested tsx</span>`, 0);
var root_49 = _$_.template(`<div class="native"> </div>`, 0);
var root_51 = _$_.template(`<!>`, 1, 1);
var root_50 = _$_.template(`<!>`, 1, 1);

function TsxDeclaredBeforeTopLevelTsx_render(__anchor, __block) {
	const nested = _$_.tsrx_element((__anchor, __block) => {
		var span_5 = root_48();

		_$_.append(__anchor, span_5);
	});

	const content = _$_.tsrx_element((__anchor, __block) => {
		var div_20 = root_49();

		{
			var expression_22 = _$_.hydrating ? _$_.hydrate_child() : div_20.firstChild;

			_$_.expression(expression_22, () => nested);
			_$_.pop(div_20);
		}

		_$_.append(__anchor, div_20);
	});

	var fragment_19 = root_50();
	var node_12 = _$_.first_child_frag(fragment_19);

	_$_.expression(node_12, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_20 = root_51();
		var expression_23 = _$_.first_child_frag(fragment_20);

		_$_.expression(expression_23, () => content);
		_$_.append(__anchor, fragment_20);
	}));

	_$_.append(__anchor, fragment_19);
}

TsxDeclaredBeforeTopLevelTsx.$r = TsxDeclaredBeforeTopLevelTsx_render;

var root_52 = _$_.template(`<div class="text-prop"><!></div>`, 0);

function TextProp_render(__anchor, __block, __props) {
	var div_21 = root_52();

	{
		var expression_24 = _$_.hydrating ? _$_.hydrate_child() : div_21.firstChild;

		_$_.expression(expression_24, () => __props.children);
		_$_.pop(div_21);
	}

	_$_.append(__anchor, div_21);
}

TextProp.$r = TextProp_render;

var root_53 = _$_.template(`<div class="text-prop"><!></div>`, 0);

function TypedTextProp_render(__anchor, __block, __props) {
	var div_22 = root_53();

	{
		var expression_25 = _$_.hydrating ? _$_.hydrate_child() : div_22.firstChild;

		_$_.expression(expression_25, () => __props.children);
		_$_.pop(div_22);
	}

	_$_.append(__anchor, div_22);
}

TypedTextProp.$r = TypedTextProp_render;

var props_site;
var root_55 = _$_.template(`<!><button class="show-text">Show</button>`, 1, 2);
var root_54 = _$_.template(`<!>`, 1, 1);

function TextPropWithToggle_render(__anchor, __block) {
	let lazy_1 = _$_.track(false, __block, '1ba81c3b');
	var fragment_21 = root_54();
	var node_14 = _$_.first_child_frag(fragment_21);

	_$_.expression(node_14, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_22 = root_55();
		var node_13 = _$_.first_child_frag(fragment_22);

		_$_.render_component(TextProp, node_13, new (props_site ??= _$_.props_site(['children'], 1, 1, 0, {
			C: null,
			children: (__p) => _$_.normalize_children(__p[_$_.$0].value ? 'hello' : '')
		})).C(props_site, lazy_1));

		var button = _$_.hydrating ? _$_.hydrate_sibling() : node_13.nextSibling;

		button.__click = () => _$_.set(lazy_1, true);
		_$_.append(__anchor, fragment_22);
	}));

	_$_.append(__anchor, fragment_21);
}

TextPropWithToggle.$r = TextPropWithToggle_render;

var props_site_1;
var root_57 = _$_.template(`<!><button class="show-text">Show</button>`, 1, 2);
var root_56 = _$_.template(`<!>`, 1, 1);

function TypedTextPropWithToggle_render(__anchor, __block) {
	let lazy_2 = _$_.track(false, __block, '649e2af0');
	var fragment_23 = root_56();
	var node_16 = _$_.first_child_frag(fragment_23);

	_$_.expression(node_16, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_24 = root_57();
		var node_15 = _$_.first_child_frag(fragment_24);

		_$_.render_component(TypedTextProp, node_15, new (props_site_1 ??= _$_.props_site(['children'], 1, 1, 0, {
			C: null,
			children: (__p) => _$_.normalize_children(__p[_$_.$0].value ? 'hello' : '')
		})).C(props_site_1, lazy_2));

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : node_15.nextSibling;

		button_1.__click = () => _$_.set(lazy_2, true);
		_$_.append(__anchor, fragment_24);
	}));

	_$_.append(__anchor, fragment_23);
}

TypedTextPropWithToggle.$r = TypedTextPropWithToggle_render;

var root_59 = _$_.template(`<h1 class="sr-only">heading</h1><p class="subtitle">first paragraph</p><p class="subtitle">second paragraph</p>`, 1, 3);
var root_58 = _$_.template(`<!>`, 1, 1);

function StaticHeader_render(__anchor, __block) {
	var fragment_25 = root_58();
	var node_17 = _$_.first_child_frag(fragment_25);

	_$_.expression(node_17, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_26 = root_59();

		_$_.next(2);
		_$_.append(__anchor, fragment_26);
	}));

	_$_.append(__anchor, fragment_25);
}

StaticHeader.$r = StaticHeader_render;

var root_61 = _$_.template(`<!><span class="sibling1"> </span><span class="sibling2"> </span>`, 1, 3);
var root_60 = _$_.template(`<!>`, 1, 1);

function StaticChildWithSiblings_render(__anchor, __block) {
	const foo = 'bar';
	var fragment_27 = root_60();
	var node_19 = _$_.first_child_frag(fragment_27);

	_$_.expression(node_19, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_28 = root_61();
		var node_18 = _$_.first_child_frag(fragment_28);

		_$_.render_component(StaticHeader, node_18, {});

		var span_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_18.nextSibling;

		{
			var expression_26 = _$_.hydrating ? _$_.hydrate_text() : span_6.firstChild;

			expression_26.nodeValue = foo;
		}

		var span_7 = _$_.hydrating ? _$_.hydrate_sibling() : span_6.nextSibling;

		{
			var expression_27 = _$_.hydrating ? _$_.hydrate_text() : span_7.firstChild;

			expression_27.nodeValue = foo;
		}

		_$_.append(__anchor, fragment_28);
	}));

	_$_.append(__anchor, fragment_27);
}

StaticChildWithSiblings.$r = StaticChildWithSiblings_render;

var root_63 = _$_.template(`<h1 class="sr-only">Ripple</h1><img src="/images/logo.png" alt="Logo" class="logo"><p class="subtitle">the elegant TypeScript UI framework</p>`, 1, 3);
var root_62 = _$_.template(`<!>`, 1, 1);

function Header_render(__anchor, __block) {
	var fragment_29 = root_62();
	var node_20 = _$_.first_child_frag(fragment_29);

	_$_.expression(node_20, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_30 = root_63();

		_$_.next(2);
		_$_.append(__anchor, fragment_30);
	}));

	_$_.append(__anchor, fragment_29);
}

Header.$r = Header_render;

var root_65 = _$_.template(`<a href="/playground" class="playground-link">Playground</a>`, 0);
var root_64 = _$_.template(`<div class="social-links"><a href="https://github.com" class="github-link">GitHub</a><a href="https://discord.com" class="discord-link">Discord</a><!></div>`, 0);
var root_66 = _$_.template(`<main><div class="container"><!></div></main>`, 0);
var root_67 = _$_.template(`<div class="content"><p>Some content here</p></div>`, 0);

function Content_render(__anchor, __block) {
	var div_25 = root_67();

	_$_.append(__anchor, div_25);
}

Content.$r = Content_render;

var root_68 = _$_.template(`<!><!><!><!>`, 1, 4);

function WebsiteIndex_render(__anchor, __block) {
	_$_.render_component(Layout, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_31 = root_68();
			var node_21 = _$_.first_child_frag(fragment_31);

			_$_.render_component(Header, node_21, {});

			var node_22 = _$_.hydrating ? _$_.hydrate_sibling() : node_21.nextSibling;

			_$_.render_component(Actions, node_22, { playgroundVisible: true });

			var node_23 = _$_.hydrating ? _$_.hydrate_sibling() : node_22.nextSibling;

			_$_.render_component(Content, node_23, {});

			var node_24 = _$_.hydrating ? _$_.hydrate_sibling() : node_23.nextSibling;

			_$_.render_component(Actions, node_24, { playgroundVisible: false });
			_$_.append(__anchor, fragment_31);
		})
	});
}

WebsiteIndex.$r = WebsiteIndex_render;

var root_69 = _$_.template(`<footer class="last-child">I am the last child</footer>`, 0);

function LastChild_render(__anchor, __block) {
	var footer = root_69();

	_$_.append(__anchor, footer);
}

LastChild.$r = LastChild_render;

var root_70 = _$_.template(`<div class="wrapper"><h1>Header</h1><p>Some content</p></div>`, 0);

function ComponentAsLastSibling_render(__anchor, __block) {
	var div_26 = root_70();

	{
		var h1 = _$_.hydrating ? _$_.hydrate_child() : div_26.firstChild;
		var p = _$_.hydrating ? _$_.hydrate_sibling() : h1.nextSibling;
		var node_25 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(div_26);

		_$_.render_component(LastChild, node_25, {});
		_$_.pop(div_26);
	}

	_$_.append(__anchor, div_26);
}

ComponentAsLastSibling.$r = ComponentAsLastSibling_render;

var root_71 = _$_.template(`<div class="inner"><span>Inner text</span></div>`, 0);

function InnerContent_render(__anchor, __block) {
	var div_27 = root_71();

	{
		var span_8 = _$_.hydrating ? _$_.hydrate_child() : div_27.firstChild;
		var node_26 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(div_27);

		_$_.render_component(LastChild, node_26, {});
		_$_.pop(div_27);
	}

	_$_.append(__anchor, div_27);
}

InnerContent.$r = InnerContent_render;

var root_72 = _$_.template(`<section class="outer"><h2>Section title</h2></section>`, 0);

function NestedComponentAsLastSibling_render(__anchor, __block) {
	var section_1 = root_72();

	{
		var h2 = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;
		var node_27 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(section_1);

		_$_.render_component(InnerContent, node_27, {});
		_$_.pop(section_1);
	}

	_$_.append(__anchor, section_1);
}

NestedComponentAsLastSibling.$r = NestedComponentAsLastSibling_render;

var root_73 = _$_.template(`<div> </div>`, 0);

function render_1(__prev) {
	var __a = "label: " + String(_$_.with_scope(__prev.___block, fetchLabel));

	if (__prev.a !== __a) {
		_$_.set_text(__prev._text, __prev.a = __a);
	}
}

function TextTailExpression_render(__anchor, __block) {
	var div_28 = root_73();

	{
		var text = _$_.hydrating ? _$_.hydrate_text() : div_28.firstChild;
	}

	_$_.render(render_1, { a: ' ', ___block: __block, _text: text });
	_$_.append(__anchor, div_28);
}

TextTailExpression.$r = TextTailExpression_render;

var root_74 = _$_.template(`<div> </div>`, 0);

function render_2(__prev) {
	var __a = 'frag-' + String(_$_.with_scope(__prev.___block, fetchLabel));

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_30, __prev.a = __a);
	}
}

function FragmentTailExpression_render(__anchor, __block) {
	var div_29 = root_74();

	{
		var expression_30 = _$_.hydrating ? _$_.hydrate_text() : div_29.firstChild;
	}

	_$_.render(render_2, { a: ' ', ___block: __block, _expression_30: expression_30 });
	_$_.append(__anchor, div_29);
}

FragmentTailExpression.$r = FragmentTailExpression_render;

var root_75 = _$_.template(`<div>frag-<span>tail</span></div>`, 0);

function FragmentChildOnly_render(__anchor, __block) {
	var div_30 = root_75();

	{
		_$_.pop(div_30);
	}

	_$_.append(__anchor, div_30);
}

FragmentChildOnly.$r = FragmentChildOnly_render;

var root_77 = _$_.template(`<!><p>after-opaque</p>`, 1, 2);
var root_76 = _$_.template(`<!>`, 1, 1);

function OpaqueLead_render(__anchor, __block, props) {
	var fragment_32 = root_76();
	var node_28 = _$_.first_child_frag(fragment_32);

	_$_.expression(node_28, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_33 = root_77();
		var expression_31 = _$_.first_child_frag(fragment_33);

		_$_.expression(expression_31, () => props.header);
		_$_.next();
		_$_.append(__anchor, fragment_33);
	}));

	_$_.append(__anchor, fragment_32);
}

OpaqueLead.$r = OpaqueLead_render;

var root_78 = _$_.template(`<div></div>`, 0);

function FragmentLeadsWithOpaqueValue_render(__anchor, __block) {
	var div_31 = root_78();

	{
		var append_anchor_1 = _$_.append_into(div_31);

		_$_.render_component(OpaqueLead, append_anchor_1, { header: 'H' });
		_$_.pop(div_31);
	}

	_$_.append(__anchor, div_31);
}

FragmentLeadsWithOpaqueValue.$r = FragmentLeadsWithOpaqueValue_render;

var root_80 = _$_.template(` <p>after-call</p>`, 1, 2);

function render_3(__prev) {
	var __a = String(_$_.with_scope(__prev.___block, fetchLabel));

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_32, __prev.a = __a);
	}
}

var root_79 = _$_.template(`<!>`, 1, 1);

function PrimitiveCallLead_render(__anchor, __block) {
	var fragment_34 = root_79();
	var node_29 = _$_.first_child_frag(fragment_34);

	_$_.expression(node_29, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_35 = root_80();
		var expression_32 = _$_.first_child_frag(fragment_35, true);

		_$_.next();
		_$_.render(render_3, { a: ' ', ___block: __block, _expression_32: expression_32 });
		_$_.append(__anchor, fragment_35);
	}));

	_$_.append(__anchor, fragment_34);
}

PrimitiveCallLead.$r = PrimitiveCallLead_render;

var root_81 = _$_.template(`<div></div>`, 0);

function FragmentLeadsWithPrimitiveCall_render(__anchor, __block) {
	var div_32 = root_81();

	{
		var append_anchor_2 = _$_.append_into(div_32);

		_$_.render_component(PrimitiveCallLead, append_anchor_2, {});
		_$_.pop(div_32);
	}

	_$_.append(__anchor, div_32);
}

FragmentLeadsWithPrimitiveCall.$r = FragmentLeadsWithPrimitiveCall_render;

var root_83 = _$_.template(`<div class="primitive-calls"> </div><button>update</button>`, 1, 2);

function render_4(__prev) {
	var __a = "sum: " + (String(Number(__prev._lazy_3.value) + Number(__prev._lazy_3.value) ?? '') + ("; big: " + String(_$_.with_scope(__prev.___block, () => BigInt(__prev._lazy_3.value)) ?? '')));

	if (__prev.a !== __a) {
		_$_.set_text(__prev._text_1, __prev.a = __a);
	}
}

var root_82 = _$_.template(`<!>`, 1, 1);

function PrimitiveTextCalls_render(__anchor, __block) {
	let lazy_3 = _$_.track(2, __block, 'ba719d47');
	var fragment_36 = root_82();
	var node_30 = _$_.first_child_frag(fragment_36);

	_$_.expression(node_30, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_37 = root_83();
		var div_33 = _$_.first_child_frag(fragment_37);

		{
			var text_1 = _$_.hydrating ? _$_.hydrate_text() : div_33.firstChild;
		}

		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : div_33.nextSibling;

		button_2.__click = () => _$_.update(lazy_3);
		_$_.render(render_4, { a: ' ', _lazy_3: lazy_3, ___block: __block, _text_1: text_1 });
		_$_.append(__anchor, fragment_37);
	}));

	_$_.append(__anchor, fragment_36);
}

PrimitiveTextCalls.$r = PrimitiveTextCalls_render;

var root_84 = _$_.template(`<b>string</b>`, 0);
var root_85 = _$_.template(`<b>number</b>`, 0);
var root_86 = _$_.template(`<b>bigint</b>`, 0);
var root_87 = _$_.template(`<b>date</b>`, 0);
var root_89 = _$_.template(`<p>before<!>after</p><p>before<!>after</p><p>before<!>after</p><p>before<!>after</p>`, 1, 4);
var root_88 = _$_.template(`<!>`, 1, 1);

function ShadowedTextCalls_render(__anchor, __block) {
	const String = () => _$_.tsrx_element((__anchor, __block) => {
		var b = root_84();

		_$_.append(__anchor, b);
	});

	const Number = () => _$_.tsrx_element((__anchor, __block) => {
		var b_1 = root_85();

		_$_.append(__anchor, b_1);
	});

	const BigInt = () => _$_.tsrx_element((__anchor, __block) => {
		var b_2 = root_86();

		_$_.append(__anchor, b_2);
	});

	const Date = () => _$_.tsrx_element((__anchor, __block) => {
		var b_3 = root_87();

		_$_.append(__anchor, b_3);
	});

	var fragment_38 = root_88();
	var node_31 = _$_.first_child_frag(fragment_38);

	_$_.expression(node_31, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_39 = root_89();
		var p_1 = _$_.first_child_frag(fragment_39);

		{
			var text_2 = _$_.hydrating ? _$_.hydrate_child() : p_1.firstChild;
			var expression_33 = _$_.hydrating ? _$_.hydrate_sibling() : text_2.nextSibling;

			_$_.render_tsrx_element(_$_.with_scope(__block, String), expression_33, __block);
			_$_.pop(p_1);
		}

		var p_2 = _$_.hydrating ? _$_.hydrate_sibling() : p_1.nextSibling;

		{
			var text_3 = _$_.hydrating ? _$_.hydrate_child() : p_2.firstChild;
			var expression_34 = _$_.hydrating ? _$_.hydrate_sibling() : text_3.nextSibling;

			_$_.render_tsrx_element(_$_.with_scope(__block, Number), expression_34, __block);
			_$_.pop(p_2);
		}

		var p_3 = _$_.hydrating ? _$_.hydrate_sibling() : p_2.nextSibling;

		{
			var text_4 = _$_.hydrating ? _$_.hydrate_child() : p_3.firstChild;
			var expression_35 = _$_.hydrating ? _$_.hydrate_sibling() : text_4.nextSibling;

			_$_.render_tsrx_element(_$_.with_scope(__block, BigInt), expression_35, __block);
			_$_.pop(p_3);
		}

		var p_4 = _$_.hydrating ? _$_.hydrate_sibling() : p_3.nextSibling;

		{
			var text_5 = _$_.hydrating ? _$_.hydrate_child() : p_4.firstChild;
			var expression_36 = _$_.hydrating ? _$_.hydrate_sibling() : text_5.nextSibling;

			_$_.render_tsrx_element(_$_.with_scope(__block, Date), expression_36, __block);
			_$_.pop(p_4);
		}

		_$_.append(__anchor, fragment_39);
	}));

	_$_.append(__anchor, fragment_38);
}

ShadowedTextCalls.$r = ShadowedTextCalls_render;

import { track } from 'ripple';

export function StaticText() {
	return _$_.tsrx_element(StaticText_render);
}

export function MultipleElements() {
	return _$_.tsrx_element(MultipleElements_render);
}

export function NestedElements() {
	return _$_.tsrx_element(NestedElements_render);
}

export function WithAttributes() {
	return _$_.tsrx_element(WithAttributes_render);
}

export function ChildComponent() {
	return _$_.tsrx_element(ChildComponent_render);
}

export function ParentWithChild() {
	return _$_.tsrx_element(ParentWithChild_render);
}

export function FirstSibling() {
	return _$_.tsrx_element(FirstSibling_render);
}

export function SecondSibling() {
	return _$_.tsrx_element(SecondSibling_render);
}

export function SiblingComponents() {
	return _$_.tsrx_element(SiblingComponents_render);
}

export function Greeting(props) {
	return _$_.tsrx_element(Greeting_render, props);
}

export function WithGreeting() {
	return _$_.tsrx_element(WithGreeting_render);
}

export function ExpressionContent() {
	return _$_.tsrx_element(ExpressionContent_render);
}

function NestedHelperItem({ item }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_7 = root_15();

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_text() : div_7.firstChild;

			expression_3.nodeValue = item;
		}

		_$_.append(__anchor, div_7);
	});
}

function NestedTsxTsrxFragment({ label }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_8 = root_16();
		var node_7 = _$_.first_child_frag(fragment_8);

		_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_9 = root_17();
			var span_2 = _$_.first_child_frag(fragment_9);

			{
				var expression_4 = _$_.hydrating ? _$_.hydrate_text() : span_2.firstChild;

				expression_4.nodeValue = label;
			}

			var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;

			_$_.for(
				node_6,
				() => [1, 2, 3, 4],
				(__anchor, item) => {
					_$_.render_component(NestedHelperItem, __anchor, { item });
				},
				0
			);

			_$_.append(__anchor, fragment_9);
		}));

		_$_.append(__anchor, fragment_8);
	});
}

export function NestedTsxTsrxExpressionValues() {
	return _$_.tsrx_element(NestedTsxTsrxExpressionValues_render);
}

export function MixedTsrxCollectionText() {
	return _$_.tsrx_element(MixedTsrxCollectionText_render);
}

export function MixedTsrxCollectionSplitServerText() {
	return _$_.tsrx_element(MixedTsrxCollectionSplitServerText_render);
}

export function MixedTsrxCollectionSplitClientText() {
	return _$_.tsrx_element(MixedTsrxCollectionSplitClientText_render);
}

export function MixedTsrxCollectionPrimitiveServerText() {
	return _$_.tsrx_element(MixedTsrxCollectionPrimitiveServerText_render);
}

export function MixedTsrxCollectionPrimitiveClientText() {
	return _$_.tsrx_element(MixedTsrxCollectionPrimitiveClientText_render);
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall() {
	return _$_.tsrx_element(DynamicArrayFromCall_render);
}

export function DynamicArrayFromTrack() {
	return _$_.tsrx_element(DynamicArrayFromTrack_render);
}

export function DynamicArrayFromConditional() {
	return _$_.tsrx_element(DynamicArrayFromConditional_render);
}

export function DynamicArrayFromLogical() {
	return _$_.tsrx_element(DynamicArrayFromLogical_render);
}

export function NestedTsrxInsideTopLevelTsxExpression() {
	return _$_.tsrx_element(NestedTsrxInsideTopLevelTsxExpression_render);
}

export function NestedTsrxElementsInsideTopLevelTsxValue() {
	return _$_.tsrx_element(NestedTsrxElementsInsideTopLevelTsxValue_render);
}

export function TsxDeclaredBeforeTopLevelTsx() {
	return _$_.tsrx_element(TsxDeclaredBeforeTopLevelTsx_render);
}

function TextProp(__props) {
	return _$_.tsrx_element(TextProp_render, __props);
}

function TypedTextProp(__props) {
	return _$_.tsrx_element(TypedTextProp_render, __props);
}

export function TextPropWithToggle() {
	return _$_.tsrx_element(TextPropWithToggle_render);
}

export function TypedTextPropWithToggle() {
	return _$_.tsrx_element(TypedTextPropWithToggle_render);
}

function StaticHeader() {
	return _$_.tsrx_element(StaticHeader_render);
}

export function StaticChildWithSiblings() {
	return _$_.tsrx_element(StaticChildWithSiblings_render);
}

function Header() {
	return _$_.tsrx_element(Header_render);
}

function Actions({ playgroundVisible = false }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_23 = root_64();

		{
			var a_2 = _$_.hydrating ? _$_.hydrate_child() : div_23.firstChild;
			var a_1 = _$_.hydrating ? _$_.hydrate_sibling() : a_2.nextSibling;
			var expression_28 = _$_.hydrating ? _$_.hydrate_sibling() : a_1.nextSibling;

			_$_.expression(expression_28, () => playgroundVisible
				? _$_.tsrx_element((__anchor, __block) => {
					var a = root_65();

					_$_.append(__anchor, a);
				})
				: null);

			_$_.pop(div_23);
		}

		_$_.append(__anchor, div_23);
	});
}

function Layout({ children }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var main = root_66();

		{
			var div_24 = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;

			{
				var expression_29 = _$_.hydrating ? _$_.hydrate_child() : div_24.firstChild;

				_$_.expression(expression_29, () => children);
				_$_.pop(div_24);
			}
		}

		_$_.append(__anchor, main);
	});
}

function Content() {
	return _$_.tsrx_element(Content_render);
}

export function WebsiteIndex() {
	return _$_.tsrx_element(WebsiteIndex_render);
}

function LastChild() {
	return _$_.tsrx_element(LastChild_render);
}

export function ComponentAsLastSibling() {
	return _$_.tsrx_element(ComponentAsLastSibling_render);
}

function InnerContent() {
	return _$_.tsrx_element(InnerContent_render);
}

export function NestedComponentAsLastSibling() {
	return _$_.tsrx_element(NestedComponentAsLastSibling_render);
}

function fetchLabel() {
	return 'fetched';
}

export function TextTailExpression() {
	return _$_.tsrx_element(TextTailExpression_render);
}

export function FragmentTailExpression() {
	return _$_.tsrx_element(FragmentTailExpression_render);
}

export function FragmentChildOnly() {
	return _$_.tsrx_element(FragmentChildOnly_render);
}

function OpaqueLead(props) {
	return _$_.tsrx_element(OpaqueLead_render, props);
}

export function FragmentLeadsWithOpaqueValue() {
	return _$_.tsrx_element(FragmentLeadsWithOpaqueValue_render);
}

function PrimitiveCallLead() {
	return _$_.tsrx_element(PrimitiveCallLead_render);
}

export function FragmentLeadsWithPrimitiveCall() {
	return _$_.tsrx_element(FragmentLeadsWithPrimitiveCall_render);
}

export function PrimitiveTextCalls() {
	return _$_.tsrx_element(PrimitiveTextCalls_render);
}

export function ShadowedTextCalls() {
	return _$_.tsrx_element(ShadowedTextCalls_render);
}

_$_.delegate(['click']);