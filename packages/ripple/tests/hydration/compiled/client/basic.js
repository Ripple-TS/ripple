// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Hello World</div>`, 1, 1);
var root_1 = _$_.template(`<h1>Title</h1><p>Paragraph text</p><span>Span text</span>`, 1, 3);
var root_2 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div></div>`, 1, 1);
var root_3 = _$_.template(`<input type="text" placeholder="Enter text" disabled><a href="/link" target="_blank">Link</a>`, 1, 2);
var root_4 = _$_.template(`<span class="child">Child content</span>`, 1, 1);
var root_5 = _$_.template(`<div class="parent"><!></div>`, 1, 1);
var root_6 = _$_.template(`<div class="first">First</div>`, 1, 1);
var root_7 = _$_.template(`<div class="second">Second</div>`, 1, 1);
var root_8 = _$_.template(`<!><!>`, 1, 2);
var root_9 = _$_.template(`<div> </div>`, 1, 1);
var root_10 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<div> </div><span> </span>`, 1, 2);
var root_12 = _$_.template(`<div class="helper-item"> </div>`, 1, 1);
var root_14 = _$_.template(`<!>`, 1, 1);
var root_13 = _$_.template(`<span class="label"> </span><!>`, 1, 2);
var root_16 = _$_.template(`<div class="app-item"> </div>`, 0);
var root_15 = _$_.template(`<!><!>`, 1, 2);
var root_17 = _$_.template(`<strong class="middle">beta</strong>`, 1, 1);
var root_18 = _$_.template(`<em class="tail">epsilon</em>`, 1, 1);
var root_19 = _$_.template(`<!>`, 1, 1);
var root_20 = _$_.template(`<div class="mixed-collection"><!></div>`, 1, 1);
var root_21 = _$_.template(`<strong class="middle">beta</strong>`, 1, 1);
var root_22 = _$_.template(`<em class="tail">epsilon</em>`, 1, 1);
var root_23 = _$_.template(`<!>`, 1, 1);
var root_24 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 1, 1);
var root_25 = _$_.template(`<strong class="middle">beta</strong>`, 1, 1);
var root_26 = _$_.template(`<em class="tail">epsilon</em>`, 1, 1);
var root_27 = _$_.template(`<!>`, 1, 1);
var root_28 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 1, 1);
var root_29 = _$_.template(`<span class="primitive-tail"> ok</span>`, 1, 1);
var root_30 = _$_.template(`<!>`, 1, 1);
var root_31 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 1, 1);
var root_32 = _$_.template(`<span class="primitive-tail"> ok</span>`, 1, 1);
var root_33 = _$_.template(`<!>`, 1, 1);
var root_34 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 1, 1);
var root_35 = _$_.template(`<div class="dynamic-array-call"> </div>`, 1, 1);
var root_36 = _$_.template(`<div class="dynamic-array-track"> </div>`, 1, 1);
var root_37 = _$_.template(`<div class="dynamic-array-conditional"> </div>`, 1, 1);
var root_38 = _$_.template(`<div class="dynamic-array-logical"> </div>`, 1, 1);
var root_40 = _$_.template(`<div class="inner">from tsrx</div>`, 1, 1);
var root_39 = _$_.template(`<section class="outer"> </section>`, 1, 1);
var root_41 = _$_.template(`<!>`, 1, 1);
var root_43 = _$_.template(`<section class="native"><span class="nested-tsrx">inside nested tsrx</span></section>`, 1, 1);
var root_42 = _$_.template(`<div class="wrapper"> </div>`, 1, 1);
var root_44 = _$_.template(`<!>`, 1, 1);
var root_45 = _$_.template(`<span class="nested-tsx">inside nested tsx</span>`, 1, 1);
var root_46 = _$_.template(`<div class="native"><!></div>`, 1, 1);
var root_47 = _$_.template(`<!>`, 1, 1);
var root_48 = _$_.template(`<div class="text-prop"><!></div>`, 1, 1);
var root_49 = _$_.template(`<!><button class="show-text">Show</button>`, 1, 2);
var root_50 = _$_.template(`<h1 class="sr-only">heading</h1><p class="subtitle">first paragraph</p><p class="subtitle">second paragraph</p>`, 1, 3);
var root_51 = _$_.template(`<!><span class="sibling1"> </span><span class="sibling2"> </span>`, 1, 3);
var root_52 = _$_.template(`<h1 class="sr-only">Ripple</h1><img src="/images/logo.png" alt="Logo" class="logo"><p class="subtitle">the elegant TypeScript UI framework</p>`, 1, 3);
var root_54 = _$_.template(`<a href="/playground" class="playground-link">Playground</a>`, 0);
var root_53 = _$_.template(`<div class="social-links"><a href="https://github.com" class="github-link">GitHub</a><a href="https://discord.com" class="discord-link">Discord</a><!></div>`, 1, 1);
var root_55 = _$_.template(`<main><div class="container"><!></div></main>`, 1, 1);
var root_56 = _$_.template(`<div class="content"><p>Some content here</p></div>`, 1, 1);
var root_58 = _$_.template(`<!><!><!><!>`, 1, 4);
var root_57 = _$_.template(`<!>`, 1, 1);
var root_59 = _$_.template(`<footer class="last-child">I am the last child</footer>`, 1, 1);
var root_60 = _$_.template(`<div class="wrapper"><h1>Header</h1><p>Some content</p><!></div>`, 1, 1);
var root_61 = _$_.template(`<div class="inner"><span>Inner text</span><!></div>`, 1, 1);
var root_62 = _$_.template(`<section class="outer"><h2>Section title</h2><!></section>`, 1, 1);

import { track } from 'ripple';

export function StaticText(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();

	__r = true;
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function MultipleElements(__anchor, _, __block) {
	_$_.push_component();

	var __r_1 = false;
	var fragment_1 = root_1();

	__r_1 = true;
	_$_.next(2);
	_$_.append(__anchor, fragment_1, true);
	_$_.pop_component();
}

export function NestedElements(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;
	var fragment_2 = root_2();
	var div_1 = _$_.first_child_frag(fragment_2);

	_$_.pop(div_1);
	__r_2 = true;
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function WithAttributes(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = false;
	var fragment_3 = root_3();

	__r_3 = true;
	_$_.next();
	_$_.append(__anchor, fragment_3, true);
	_$_.pop_component();
}

export function ChildComponent(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	var fragment_4 = root_4();

	__r_4 = true;
	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function ParentWithChild(__anchor, _, __block) {
	_$_.push_component();

	var __r_5 = false;
	var fragment_5 = root_5();
	var div_2 = _$_.first_child_frag(fragment_5);

	{
		var node = _$_.child(div_2);

		ChildComponent(node, {}, _$_.active_block);
		_$_.pop(div_2);
	}

	__r_5 = true;
	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function FirstSibling(__anchor, _, __block) {
	_$_.push_component();

	var __r_6 = false;
	var fragment_6 = root_6();

	__r_6 = true;
	_$_.append(__anchor, fragment_6);
	_$_.pop_component();
}

export function SecondSibling(__anchor, _, __block) {
	_$_.push_component();

	var __r_7 = false;
	var fragment_7 = root_7();

	__r_7 = true;
	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

export function SiblingComponents(__anchor, _, __block) {
	_$_.push_component();

	var __r_8 = false;
	var fragment_8 = root_8();
	var node_1 = _$_.first_child_frag(fragment_8);

	FirstSibling(node_1, {}, _$_.active_block);

	var node_2 = _$_.sibling(node_1);

	SecondSibling(node_2, {}, _$_.active_block);
	__r_8 = true;
	_$_.append(__anchor, fragment_8);
	_$_.pop_component();
}

export function Greeting(__anchor, props, __block) {
	_$_.push_component();

	var __r_9 = false;
	var fragment_9 = root_9();
	var div_3 = _$_.first_child_frag(fragment_9);

	{
		var expression = _$_.child(div_3, true);

		_$_.pop(div_3);
	}

	__r_9 = true;

	_$_.render(() => {
		_$_.set_text(expression, 'Hello ' + _$_.with_scope(__block, () => String(props.name)));
	});

	_$_.append(__anchor, fragment_9);
	_$_.pop_component();
}

export function WithGreeting(__anchor, _, __block) {
	_$_.push_component();

	var __r_10 = false;
	var fragment_10 = root_10();
	var node_3 = _$_.first_child_frag(fragment_10);

	Greeting(node_3, { name: "World" }, _$_.active_block);
	__r_10 = true;
	_$_.append(__anchor, fragment_10);
	_$_.pop_component();
}

export function ExpressionContent(__anchor, _, __block) {
	_$_.push_component();

	var __r_11 = false;
	const value = 42;
	const label = 'computed';
	var fragment_11 = root_11();
	var div_4 = _$_.first_child_frag(fragment_11);

	{
		var expression_1 = _$_.child(div_4);

		_$_.expression(expression_1, () => value);
		_$_.pop(div_4);
	}

	var span_1 = _$_.sibling(div_4);

	{
		var expression_2 = _$_.child(span_1);

		_$_.expression(expression_2, () => _$_.with_scope(__block, () => label.toUpperCase()));
		_$_.pop(span_1);
	}

	__r_11 = true;
	_$_.next();
	_$_.append(__anchor, fragment_11, true);
	_$_.pop_component();
}

function NestedHelperItem(__anchor, { item }, __block) {
	_$_.push_component();

	var __r_12 = false;
	var fragment_12 = root_12();
	var div_5 = _$_.first_child_frag(fragment_12);

	{
		var expression_3 = _$_.child(div_5);

		_$_.expression(expression_3, () => item);
		_$_.pop(div_5);
	}

	__r_12 = true;
	_$_.append(__anchor, fragment_12);
	_$_.pop_component();
}

function NestedTsxTsrxFragment(__anchor, { label }, __block) {
	_$_.push_component();

	var __r_13 = false;
	var fragment_13 = root_13();
	var span_2 = _$_.first_child_frag(fragment_13);

	{
		var expression_4 = _$_.child(span_2, true);

		expression_4.nodeValue = label;
		_$_.pop(span_2);
	}

	var node_4 = _$_.sibling(span_2);

	_$_.for(
		node_4,
		() => [1, 2, 3, 4],
		(__anchor, item) => {
			var fragment_14 = root_14();
			var node_5 = _$_.first_child_frag(fragment_14);

			NestedHelperItem(node_5, { item }, _$_.active_block);
			_$_.append(__anchor, fragment_14);
		},
		0
	);

	__r_13 = true;
	_$_.append(__anchor, fragment_13);
	_$_.pop_component();
}

export function NestedTsxTsrxExpressionValues(__anchor, _, __block) {
	_$_.push_component();

	var __r_14 = false;
	var fragment_15 = root_15();
	var node_6 = _$_.first_child_frag(fragment_15);

	_$_.for(
		node_6,
		() => [1, 2, 3],
		(__anchor, item) => {
			var div_6 = root_16();

			{
				var expression_5 = _$_.child(div_6);

				_$_.expression(expression_5, () => item);
				_$_.pop(div_6);
			}

			_$_.append(__anchor, div_6);
		},
		0
	);

	var node_7 = _$_.sibling(node_6);

	NestedTsxTsrxFragment(node_7, { label: "from helper" }, _$_.active_block);
	__r_14 = true;
	_$_.append(__anchor, fragment_15);
	_$_.pop_component();
}

export function MixedTsrxCollectionText(__anchor, _, __block) {
	_$_.push_component();

	var __r_15 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_16 = false;
		var fragment_18 = root_19();
		var expression_6 = _$_.first_child_frag(fragment_18);

		_$_.expression(expression_6, () => [
			'alpha ',
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_17 = false;
				var fragment_16 = root_17();

				__r_17 = true;
				_$_.append(__anchor, fragment_16);
			}),
			' gamma ',
			[
				'delta ',
				_$_.tsrx_element(function render_children(__anchor, __block) {
					var __r_18 = false;
					var fragment_17 = root_18();

					__r_18 = true;
					_$_.append(__anchor, fragment_17);
				}),
				' zeta'
			]
		]);

		__r_16 = true;
		_$_.append(__anchor, fragment_18);
	});

	var fragment_19 = root_20();
	var div_7 = _$_.first_child_frag(fragment_19);

	{
		var expression_7 = _$_.child(div_7);

		_$_.expression(expression_7, () => content);
		_$_.pop(div_7);
	}

	__r_15 = true;
	_$_.append(__anchor, fragment_19);
	_$_.pop_component();
}

export function MixedTsrxCollectionSplitServerText(__anchor, _, __block) {
	_$_.push_component();

	var __r_19 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_20 = false;
		var fragment_22 = root_23();
		var expression_8 = _$_.first_child_frag(fragment_22);

		_$_.expression(expression_8, () => [
			'alpha ',
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_21 = false;
				var fragment_20 = root_21();

				__r_21 = true;
				_$_.append(__anchor, fragment_20);
			}),
			' gamma ',
			[
				'delta ',
				_$_.tsrx_element(function render_children(__anchor, __block) {
					var __r_22 = false;
					var fragment_21 = root_22();

					__r_22 = true;
					_$_.append(__anchor, fragment_21);
				}),
				' zeta'
			]
		]);

		__r_20 = true;
		_$_.append(__anchor, fragment_22);
	});

	var fragment_23 = root_24();
	var div_8 = _$_.first_child_frag(fragment_23);

	{
		var expression_9 = _$_.child(div_8);

		_$_.expression(expression_9, () => content);
		_$_.pop(div_8);
	}

	__r_19 = true;
	_$_.append(__anchor, fragment_23);
	_$_.pop_component();
}

export function MixedTsrxCollectionSplitClientText(__anchor, _, __block) {
	_$_.push_component();

	var __r_23 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_24 = false;
		var fragment_26 = root_27();
		var expression_10 = _$_.first_child_frag(fragment_26);

		_$_.expression(expression_10, () => [
			'alpha ',
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_25 = false;
				var fragment_24 = root_25();

				__r_25 = true;
				_$_.append(__anchor, fragment_24);
			}),
			' gamma ',
			[
				'changed ',
				_$_.tsrx_element(function render_children(__anchor, __block) {
					var __r_26 = false;
					var fragment_25 = root_26();

					__r_26 = true;
					_$_.append(__anchor, fragment_25);
				}),
				' zeta'
			]
		]);

		__r_24 = true;
		_$_.append(__anchor, fragment_26);
	});

	var fragment_27 = root_28();
	var div_9 = _$_.first_child_frag(fragment_27);

	{
		var expression_11 = _$_.child(div_9);

		_$_.expression(expression_11, () => content);
		_$_.pop(div_9);
	}

	__r_23 = true;
	_$_.append(__anchor, fragment_27);
	_$_.pop_component();
}

export function MixedTsrxCollectionPrimitiveServerText(__anchor, _, __block) {
	_$_.push_component();

	var __r_27 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_28 = false;
		var fragment_29 = root_30();
		var expression_12 = _$_.first_child_frag(fragment_29);

		_$_.expression(expression_12, () => [
			'count: ',
			1,
			' / ',
			true,
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_29 = false;
				var fragment_28 = root_29();

				__r_29 = true;
				_$_.append(__anchor, fragment_28);
			})
		]);

		__r_28 = true;
		_$_.append(__anchor, fragment_29);
	});

	var fragment_30 = root_31();
	var div_10 = _$_.first_child_frag(fragment_30);

	{
		var expression_13 = _$_.child(div_10);

		_$_.expression(expression_13, () => content);
		_$_.pop(div_10);
	}

	__r_27 = true;
	_$_.append(__anchor, fragment_30);
	_$_.pop_component();
}

export function MixedTsrxCollectionPrimitiveClientText(__anchor, _, __block) {
	_$_.push_component();

	var __r_30 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_31 = false;
		var fragment_32 = root_33();
		var expression_14 = _$_.first_child_frag(fragment_32);

		_$_.expression(expression_14, () => [
			'count: ',
			2,
			' / ',
			false,
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_32 = false;
				var fragment_31 = root_32();

				__r_32 = true;
				_$_.append(__anchor, fragment_31);
			})
		]);

		__r_31 = true;
		_$_.append(__anchor, fragment_32);
	});

	var fragment_33 = root_34();
	var div_11 = _$_.first_child_frag(fragment_33);

	{
		var expression_15 = _$_.child(div_11);

		_$_.expression(expression_15, () => content);
		_$_.pop(div_11);
	}

	__r_30 = true;
	_$_.append(__anchor, fragment_33);
	_$_.pop_component();
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall(__anchor, _, __block) {
	_$_.push_component();

	var __r_33 = false;
	const items = _$_.with_scope(__block, createPrimitiveItems);
	var fragment_34 = root_35();
	var div_12 = _$_.first_child_frag(fragment_34);

	{
		var expression_16 = _$_.child(div_12);

		_$_.expression(expression_16, () => items);
		_$_.pop(div_12);
	}

	__r_33 = true;
	_$_.append(__anchor, fragment_34);
	_$_.pop_component();
}

export function DynamicArrayFromTrack(__anchor, _, __block) {
	_$_.push_component();

	var __r_34 = false;
	let lazy = _$_.track(['start:', ['one', 2], true, null, false, ':end'], __block, 'b5de6402');
	var fragment_35 = root_36();
	var div_13 = _$_.first_child_frag(fragment_35);

	{
		var expression_17 = _$_.child(div_13);

		_$_.expression(expression_17, () => lazy.value);
		_$_.pop(div_13);
	}

	__r_34 = true;
	_$_.append(__anchor, fragment_35);
	_$_.pop_component();
}

export function DynamicArrayFromConditional(__anchor, _, __block) {
	_$_.push_component();

	var __r_35 = false;
	const condition = true;

	const items = condition
		? ['start:', ['one', 2], true, null, false, ':end']
		: ['fallback'];

	var fragment_36 = root_37();
	var div_14 = _$_.first_child_frag(fragment_36);

	{
		var expression_18 = _$_.child(div_14);

		_$_.expression(expression_18, () => items);
		_$_.pop(div_14);
	}

	__r_35 = true;
	_$_.append(__anchor, fragment_36);
	_$_.pop_component();
}

export function DynamicArrayFromLogical(__anchor, _, __block) {
	_$_.push_component();

	var __r_36 = false;
	const condition = true;
	const items = condition && ['start:', ['one', 2], true, null, false, ':end'];
	var fragment_37 = root_38();
	var div_15 = _$_.first_child_frag(fragment_37);

	{
		var expression_19 = _$_.child(div_15);

		_$_.expression(expression_19, () => items);
		_$_.pop(div_15);
	}

	__r_36 = true;
	_$_.append(__anchor, fragment_37);
	_$_.pop_component();
}

export function NestedTsrxInsideTopLevelTsxExpression(__anchor, _, __block) {
	_$_.push_component();

	var __r_37 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_38 = false;
		var fragment_38 = root_39();
		var section_1 = _$_.first_child_frag(fragment_38);

		{
			var expression_20 = _$_.child(section_1);

			_$_.expression(expression_20, () => _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_39 = false;
				var fragment_39 = root_40();

				__r_39 = true;
				_$_.append(__anchor, fragment_39);
			}));

			_$_.pop(section_1);
		}

		__r_38 = true;
		_$_.append(__anchor, fragment_38);
	});

	var fragment_40 = root_41();
	var expression_21 = _$_.first_child_frag(fragment_40);

	_$_.expression(expression_21, () => content);
	__r_37 = true;
	_$_.append(__anchor, fragment_40);
	_$_.pop_component();
}

export function NestedTsrxElementsInsideTopLevelTsxValue(__anchor, _, __block) {
	_$_.push_component();

	var __r_40 = false;

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_41 = false;
		var fragment_41 = root_42();
		var div_16 = _$_.first_child_frag(fragment_41);

		{
			var expression_22 = _$_.child(div_16);

			_$_.expression(expression_22, () => _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_42 = false;
				var fragment_42 = root_43();
				var section_2 = _$_.first_child_frag(fragment_42);

				_$_.pop(section_2);
				__r_42 = true;
				_$_.append(__anchor, fragment_42);
			}));

			_$_.pop(div_16);
		}

		__r_41 = true;
		_$_.append(__anchor, fragment_41);
	});

	var fragment_43 = root_44();
	var expression_23 = _$_.first_child_frag(fragment_43);

	_$_.expression(expression_23, () => content);
	__r_40 = true;
	_$_.append(__anchor, fragment_43);
	_$_.pop_component();
}

export function TsxDeclaredBeforeTopLevelTsx(__anchor, _, __block) {
	_$_.push_component();

	var __r_43 = false;

	const nested = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_44 = false;
		var fragment_44 = root_45();

		__r_44 = true;
		_$_.append(__anchor, fragment_44);
	});

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var __r_45 = false;
		var fragment_45 = root_46();
		var div_17 = _$_.first_child_frag(fragment_45);

		{
			var expression_24 = _$_.child(div_17);

			_$_.expression(expression_24, () => nested);
			_$_.pop(div_17);
		}

		__r_45 = true;
		_$_.append(__anchor, fragment_45);
	});

	var fragment_46 = root_47();
	var expression_25 = _$_.first_child_frag(fragment_46);

	_$_.expression(expression_25, () => content);
	__r_43 = true;
	_$_.append(__anchor, fragment_46);
	_$_.pop_component();
}

function TextProp(__anchor, __props, __block) {
	_$_.push_component();

	var __r_46 = false;
	var fragment_47 = root_48();
	var div_18 = _$_.first_child_frag(fragment_47);

	{
		var expression_26 = _$_.child(div_18);

		_$_.expression(expression_26, () => __props.children);
		_$_.pop(div_18);
	}

	__r_46 = true;
	_$_.append(__anchor, fragment_47);
	_$_.pop_component();
}

export function TextPropWithToggle(__anchor, _, __block) {
	_$_.push_component();

	var __r_47 = false;
	let lazy_1 = _$_.track(false, __block, '1ba81c3b');
	var fragment_48 = root_49();
	var node_8 = _$_.first_child_frag(fragment_48);

	TextProp(
		node_8,
		{
			get children() {
				return _$_.normalize_children(lazy_1.value ? 'hello' : '');
			}
		},
		_$_.active_block
	);

	var button_1 = _$_.sibling(node_8);

	button_1.__click = () => _$_.set(lazy_1, true);
	__r_47 = true;
	_$_.append(__anchor, fragment_48);
	_$_.pop_component();
}

function StaticHeader(__anchor, _, __block) {
	_$_.push_component();

	var __r_48 = false;
	var fragment_49 = root_50();

	__r_48 = true;
	_$_.next(2);
	_$_.append(__anchor, fragment_49, true);
	_$_.pop_component();
}

export function StaticChildWithSiblings(__anchor, _, __block) {
	_$_.push_component();

	var __r_49 = false;
	const foo = 'bar';
	var fragment_50 = root_51();
	var node_9 = _$_.first_child_frag(fragment_50);

	StaticHeader(node_9, {}, _$_.active_block);

	var span_3 = _$_.sibling(node_9);

	{
		var expression_27 = _$_.child(span_3, true);

		expression_27.nodeValue = foo;
		_$_.pop(span_3);
	}

	var span_4 = _$_.sibling(span_3);

	{
		var expression_28 = _$_.child(span_4, true);

		expression_28.nodeValue = foo;
		_$_.pop(span_4);
	}

	__r_49 = true;
	_$_.next();
	_$_.append(__anchor, fragment_50, true);
	_$_.pop_component();
}

function Header(__anchor, _, __block) {
	_$_.push_component();

	var __r_50 = false;
	var fragment_51 = root_52();

	__r_50 = true;
	_$_.next(2);
	_$_.append(__anchor, fragment_51, true);
	_$_.pop_component();
}

function Actions(__anchor, { playgroundVisible = false }, __block) {
	_$_.push_component();

	var __r_51 = false;
	var fragment_52 = root_53();
	var div_19 = _$_.first_child_frag(fragment_52);

	{
		var a_2 = _$_.child(div_19);
		var a_1 = _$_.sibling(a_2);
		var node_10 = _$_.sibling(a_1);

		{
			var consequent = (__anchor) => {
				var a_3 = root_54();

				_$_.append(__anchor, a_3);
			};

			_$_.if(node_10, (__render) => {
				if (playgroundVisible) __render(consequent);
			});
		}

		_$_.pop(div_19);
	}

	__r_51 = true;
	_$_.append(__anchor, fragment_52);
	_$_.pop_component();
}

function Layout(__anchor, { children }, __block) {
	_$_.push_component();

	var __r_52 = false;
	var fragment_53 = root_55();
	var main_1 = _$_.first_child_frag(fragment_53);

	{
		var div_20 = _$_.child(main_1);

		{
			var expression_29 = _$_.child(div_20);

			_$_.expression(expression_29, () => children);
			_$_.pop(div_20);
		}
	}

	_$_.pop(main_1);
	__r_52 = true;
	_$_.append(__anchor, fragment_53);
	_$_.pop_component();
}

function Content(__anchor, _, __block) {
	_$_.push_component();

	var __r_53 = false;
	var fragment_54 = root_56();
	var div_21 = _$_.first_child_frag(fragment_54);

	_$_.pop(div_21);
	__r_53 = true;
	_$_.append(__anchor, fragment_54);
	_$_.pop_component();
}

export function WebsiteIndex(__anchor, _, __block) {
	_$_.push_component();

	var __r_54 = false;
	var fragment_55 = root_57();
	var node_11 = _$_.first_child_frag(fragment_55);

	Layout(
		node_11,
		{
			children: _$_.tsrx_element(function render_children(__anchor, __block) {
				var __r_55 = false;
				var fragment_56 = root_58();
				var node_12 = _$_.first_child_frag(fragment_56);

				Header(node_12, {}, _$_.active_block);

				var node_13 = _$_.sibling(node_12);

				Actions(node_13, { playgroundVisible: true }, _$_.active_block);

				var node_14 = _$_.sibling(node_13);

				Content(node_14, {}, _$_.active_block);

				var node_15 = _$_.sibling(node_14);

				Actions(node_15, { playgroundVisible: false }, _$_.active_block);
				__r_55 = true;
				_$_.append(__anchor, fragment_56);
			})
		},
		_$_.active_block
	);

	__r_54 = true;
	_$_.append(__anchor, fragment_55);
	_$_.pop_component();
}

function LastChild(__anchor, _, __block) {
	_$_.push_component();

	var __r_56 = false;
	var fragment_57 = root_59();

	__r_56 = true;
	_$_.append(__anchor, fragment_57);
	_$_.pop_component();
}

export function ComponentAsLastSibling(__anchor, _, __block) {
	_$_.push_component();

	var __r_57 = false;
	var fragment_58 = root_60();
	var div_22 = _$_.first_child_frag(fragment_58);

	{
		var h1_1 = _$_.child(div_22);
		var p_1 = _$_.sibling(h1_1);
		var node_16 = _$_.sibling(p_1);

		LastChild(node_16, {}, _$_.active_block);
		_$_.pop(div_22);
	}

	__r_57 = true;
	_$_.append(__anchor, fragment_58);
	_$_.pop_component();
}

function InnerContent(__anchor, _, __block) {
	_$_.push_component();

	var __r_58 = false;
	var fragment_59 = root_61();
	var div_23 = _$_.first_child_frag(fragment_59);

	{
		var span_5 = _$_.child(div_23);
		var node_17 = _$_.sibling(span_5);

		LastChild(node_17, {}, _$_.active_block);
		_$_.pop(div_23);
	}

	__r_58 = true;
	_$_.append(__anchor, fragment_59);
	_$_.pop_component();
}

export function NestedComponentAsLastSibling(__anchor, _, __block) {
	_$_.push_component();

	var __r_59 = false;
	var fragment_60 = root_62();
	var section_3 = _$_.first_child_frag(fragment_60);

	{
		var h2_1 = _$_.child(section_3);
		var node_18 = _$_.sibling(h2_1);

		InnerContent(node_18, {}, _$_.active_block);
		_$_.pop(section_3);
	}

	__r_59 = true;
	_$_.append(__anchor, fragment_60);
	_$_.pop_component();
}

_$_.delegate(['click']);