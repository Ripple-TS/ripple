// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Hello World</div>`, 0);
var root_1 = _$_.template(`<h1>Title</h1><p>Paragraph text</p><span>Span text</span>`, 1, 3);
var root_2 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div></div>`, 0);
var root_3 = _$_.template(`<input type="text" placeholder="Enter text" disabled><a href="/link" target="_blank">Link</a>`, 1, 2);
var root_4 = _$_.template(`<span class="child">Child content</span>`, 0);
var root_5 = _$_.template(`<div class="parent"><!></div>`, 0);
var root_6 = _$_.template(`<div class="first">First</div>`, 0);
var root_7 = _$_.template(`<div class="second">Second</div>`, 0);
var root_8 = _$_.template(`<!><!>`, 1, 2);
var root_9 = _$_.template(`<div> </div>`, 0);
var root_10 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<div> </div><span> </span>`, 1, 2);
var root_14 = _$_.template(`<div class="helper-item"> </div>`, 0);
var root_15 = _$_.template(`<!>`, 1, 1);
var root_13 = _$_.template(`<!>`, 1, 1);
var root_16 = _$_.template(` `, 1, 1);
var root_12 = _$_.template(`<span class="label"> </span><!>`, 1, 2);
var root_17 = _$_.template(`<div class="app-item"> </div>`, 0);
var root_18 = _$_.template(` `, 1, 1);
var root_19 = _$_.template(`<!><!>`, 1, 2);
var root_20 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_21 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_22 = _$_.template(` `, 1, 1);
var root_23 = _$_.template(`<div class="mixed-collection"><!></div>`, 0);
var root_24 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_25 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_26 = _$_.template(` `, 1, 1);
var root_27 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 0);
var root_28 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_29 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_30 = _$_.template(` `, 1, 1);
var root_31 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 0);
var root_32 = _$_.template(`<span class="primitive-tail"> ok</span>`, 0);
var root_33 = _$_.template(` `, 1, 1);
var root_34 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 0);
var root_35 = _$_.template(`<span class="primitive-tail"> ok</span>`, 0);
var root_36 = _$_.template(` `, 1, 1);
var root_37 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 0);
var root_38 = _$_.template(`<div class="dynamic-array-call"> </div>`, 0);
var root_39 = _$_.template(`<div class="dynamic-array-track"> </div>`, 0);
var root_40 = _$_.template(`<div class="dynamic-array-conditional"> </div>`, 0);
var root_41 = _$_.template(`<div class="dynamic-array-logical"> </div>`, 0);
var root_43 = _$_.template(`<div class="inner">from tsrx</div>`, 0);
var root_42 = _$_.template(`<section class="outer"><!></section>`, 0);
var root_44 = _$_.template(`<!>`, 1, 1);
var root_46 = _$_.template(`<section class="native"><span class="nested-tsrx">inside nested tsrx</span></section>`, 0);
var root_45 = _$_.template(`<div class="wrapper"><!></div>`, 0);
var root_47 = _$_.template(`<!>`, 1, 1);
var root_48 = _$_.template(`<span class="nested-tsx">inside nested tsx</span>`, 0);
var root_49 = _$_.template(`<div class="native"><!></div>`, 0);
var root_50 = _$_.template(`<!>`, 1, 1);
var root_51 = _$_.template(`<!>`, 1, 1);
var root_52 = _$_.template(`<div class="text-prop"><!></div>`, 0);
var root_53 = _$_.template(`<!><button class="show-text">Show</button>`, 1, 2);
var root_54 = _$_.template(`<h1 class="sr-only">heading</h1><p class="subtitle">first paragraph</p><p class="subtitle">second paragraph</p>`, 1, 3);
var root_55 = _$_.template(`<!><span class="sibling1"> </span><span class="sibling2"> </span>`, 1, 3);
var root_56 = _$_.template(`<h1 class="sr-only">Ripple</h1><img src="/images/logo.png" alt="Logo" class="logo"><p class="subtitle">the elegant TypeScript UI framework</p>`, 1, 3);
var root_58 = _$_.template(`<a href="/playground" class="playground-link">Playground</a>`, 0);
var root_57 = _$_.template(`<div class="social-links"><a href="https://github.com" class="github-link">GitHub</a><a href="https://discord.com" class="discord-link">Discord</a><!></div>`, 0);
var root_59 = _$_.template(`<main><div class="container"><!></div></main>`, 0);
var root_60 = _$_.template(`<div class="content"><p>Some content here</p></div>`, 0);
var root_62 = _$_.template(`<!><!><!><!>`, 1, 4);
var root_61 = _$_.template(`<!>`, 1, 1);
var root_63 = _$_.template(`<footer class="last-child">I am the last child</footer>`, 0);
var root_64 = _$_.template(`<div class="wrapper"><h1>Header</h1><p>Some content</p><!></div>`, 0);
var root_65 = _$_.template(`<div class="inner"><span>Inner text</span><!></div>`, 0);
var root_66 = _$_.template(`<section class="outer"><h2>Section title</h2><!></section>`, 0);

import { track } from 'ripple';

export function StaticText(__anchor, _, __block) {
	_$_.push_component();

	var div_1 = root();

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function MultipleElements(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root_1();

	_$_.next(2);
	_$_.append(__anchor, fragment, true);
	_$_.pop_component();
}

export function NestedElements(__anchor, _, __block) {
	_$_.push_component();

	var div_2 = root_2();

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function WithAttributes(__anchor, _, __block) {
	_$_.push_component();

	var fragment_1 = root_3();

	_$_.next();
	_$_.append(__anchor, fragment_1, true);
	_$_.pop_component();
}

export function ChildComponent(__anchor, _, __block) {
	_$_.push_component();

	var span_1 = root_4();

	_$_.append(__anchor, span_1);
	_$_.pop_component();
}

export function ParentWithChild(__anchor, _, __block) {
	_$_.push_component();

	var div_3 = root_5();

	{
		var node = _$_.child(div_3);

		ChildComponent(node, {}, _$_.active_block);
		_$_.pop(div_3);
	}

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function FirstSibling(__anchor, _, __block) {
	_$_.push_component();

	var div_4 = root_6();

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function SecondSibling(__anchor, _, __block) {
	_$_.push_component();

	var div_5 = root_7();

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function SiblingComponents(__anchor, _, __block) {
	_$_.push_component();

	var fragment_2 = root_8();
	var node_1 = _$_.first_child_frag(fragment_2);

	FirstSibling(node_1, {}, _$_.active_block);

	var node_2 = _$_.sibling(node_1);

	SecondSibling(node_2, {}, _$_.active_block);
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function Greeting(__anchor, props, __block) {
	_$_.push_component();

	var div_6 = root_9();

	{
		var expression = _$_.child(div_6);

		_$_.expression(expression, () => 'Hello ' + _$_.with_scope(__block, () => String(props.name)));
		_$_.pop(div_6);
	}

	_$_.append(__anchor, div_6);
	_$_.pop_component();
}

export function WithGreeting(__anchor, _, __block) {
	_$_.push_component();

	var fragment_3 = root_10();
	var node_3 = _$_.first_child_frag(fragment_3);

	Greeting(node_3, { name: "World" }, _$_.active_block);
	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function ExpressionContent(__anchor, _, __block) {
	_$_.push_component();

	const value = 42;
	const label = 'computed';
	var fragment_4 = root_11();
	var div_7 = _$_.first_child_frag(fragment_4);

	{
		var expression_1 = _$_.child(div_7);

		_$_.expression(expression_1, () => value);
		_$_.pop(div_7);
	}

	var span_2 = _$_.sibling(div_7);

	{
		var expression_2 = _$_.child(span_2);

		_$_.expression(expression_2, () => _$_.with_scope(__block, () => label.toUpperCase()));
		_$_.pop(span_2);
	}

	_$_.next();
	_$_.append(__anchor, fragment_4, true);
	_$_.pop_component();
}

function makeNestedTsxTsrxFragment(label) {
	var __block = _$_.scope();

	return _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_5 = root_12();
		var span_3 = _$_.first_child_frag(fragment_5);

		{
			var expression_3 = _$_.child(span_3);

			_$_.expression(expression_3, () => label);
			_$_.pop(span_3);
		}

		const test = _$_.tsrx_element(function render_children(__anchor, __block) {
			var fragment_8 = root_16();
			var expression_6 = _$_.first_child_frag(fragment_8);

			_$_.expression(expression_6, () => _$_.with_scope(__block, () => [1, 2, 3, 4].map((item) => _$_.tsrx_element(function render_children(__anchor, __block) {
				var fragment_6 = root_13();
				var node_4 = _$_.first_child_frag(fragment_6);

				_$_.expression(node_4, () => _$_.tsrx_element(function render_children(__anchor, __block) {
					var fragment_7 = root_15();
					var expression_5 = _$_.first_child_frag(fragment_7);

					_$_.expression(expression_5, () => _$_.tsrx_element(function render_children(__anchor, __block) {
						var div_8 = root_14();

						{
							var expression_4 = _$_.child(div_8);

							_$_.expression(expression_4, () => item);
							_$_.pop(div_8);
						}

						_$_.append(__anchor, div_8);
					}));

					_$_.append(__anchor, fragment_7);
				}));

				_$_.append(__anchor, fragment_6);
			}))));

			_$_.append(__anchor, fragment_8);
		});

		var expression_7 = _$_.sibling(span_3);

		_$_.expression(expression_7, () => test);
		_$_.append(__anchor, fragment_5);
	});
}

export function NestedTsxTsrxExpressionValues(__anchor, _, __block) {
	_$_.push_component();

	var fragment_10 = root_19();
	var expression_10 = _$_.first_child_frag(fragment_10);

	_$_.expression(expression_10, () => _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_9 = root_18();
		var expression_9 = _$_.first_child_frag(fragment_9);

		_$_.expression(expression_9, () => _$_.with_scope(__block, () => [1, 2, 3].map((item) => _$_.tsrx_element(function render_children(__anchor, __block) {
			var div_9 = root_17();

			{
				var expression_8 = _$_.child(div_9);

				_$_.expression(expression_8, () => item);
				_$_.pop(div_9);
			}

			_$_.append(__anchor, div_9);
		}))));

		_$_.append(__anchor, fragment_9);
	}));

	var expression_11 = _$_.sibling(expression_10);

	_$_.expression(expression_11, () => _$_.with_scope(__block, () => makeNestedTsxTsrxFragment('from helper')));
	_$_.append(__anchor, fragment_10);
	_$_.pop_component();
}

export function MixedTsrxCollectionText(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_11 = root_22();
		var expression_12 = _$_.first_child_frag(fragment_11);

		_$_.expression(expression_12, () => [
			'alpha ',
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var strong = root_20();

				_$_.append(__anchor, strong);
			}),
			' gamma ',
			[
				'delta ',
				_$_.tsrx_element(function render_children(__anchor, __block) {
					var em = root_21();

					_$_.append(__anchor, em);
				}),
				' zeta'
			]
		]);

		_$_.append(__anchor, fragment_11);
	});

	var div_10 = root_23();

	{
		var expression_13 = _$_.child(div_10);

		_$_.expression(expression_13, () => content);
		_$_.pop(div_10);
	}

	_$_.append(__anchor, div_10);
	_$_.pop_component();
}

export function MixedTsrxCollectionSplitServerText(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_12 = root_26();
		var expression_14 = _$_.first_child_frag(fragment_12);

		_$_.expression(expression_14, () => [
			'alpha ',
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var strong_1 = root_24();

				_$_.append(__anchor, strong_1);
			}),
			' gamma ',
			[
				'delta ',
				_$_.tsrx_element(function render_children(__anchor, __block) {
					var em_1 = root_25();

					_$_.append(__anchor, em_1);
				}),
				' zeta'
			]
		]);

		_$_.append(__anchor, fragment_12);
	});

	var div_11 = root_27();

	{
		var expression_15 = _$_.child(div_11);

		_$_.expression(expression_15, () => content);
		_$_.pop(div_11);
	}

	_$_.append(__anchor, div_11);
	_$_.pop_component();
}

export function MixedTsrxCollectionSplitClientText(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_13 = root_30();
		var expression_16 = _$_.first_child_frag(fragment_13);

		_$_.expression(expression_16, () => [
			'alpha ',
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var strong_2 = root_28();

				_$_.append(__anchor, strong_2);
			}),
			' gamma ',
			[
				'changed ',
				_$_.tsrx_element(function render_children(__anchor, __block) {
					var em_2 = root_29();

					_$_.append(__anchor, em_2);
				}),
				' zeta'
			]
		]);

		_$_.append(__anchor, fragment_13);
	});

	var div_12 = root_31();

	{
		var expression_17 = _$_.child(div_12);

		_$_.expression(expression_17, () => content);
		_$_.pop(div_12);
	}

	_$_.append(__anchor, div_12);
	_$_.pop_component();
}

export function MixedTsrxCollectionPrimitiveServerText(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_14 = root_33();
		var expression_18 = _$_.first_child_frag(fragment_14);

		_$_.expression(expression_18, () => [
			'count: ',
			1,
			' / ',
			true,
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var span_4 = root_32();

				_$_.append(__anchor, span_4);
			})
		]);

		_$_.append(__anchor, fragment_14);
	});

	var div_13 = root_34();

	{
		var expression_19 = _$_.child(div_13);

		_$_.expression(expression_19, () => content);
		_$_.pop(div_13);
	}

	_$_.append(__anchor, div_13);
	_$_.pop_component();
}

export function MixedTsrxCollectionPrimitiveClientText(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_15 = root_36();
		var expression_20 = _$_.first_child_frag(fragment_15);

		_$_.expression(expression_20, () => [
			'count: ',
			2,
			' / ',
			false,
			_$_.tsrx_element(function render_children(__anchor, __block) {
				var span_5 = root_35();

				_$_.append(__anchor, span_5);
			})
		]);

		_$_.append(__anchor, fragment_15);
	});

	var div_14 = root_37();

	{
		var expression_21 = _$_.child(div_14);

		_$_.expression(expression_21, () => content);
		_$_.pop(div_14);
	}

	_$_.append(__anchor, div_14);
	_$_.pop_component();
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall(__anchor, _, __block) {
	_$_.push_component();

	const items = _$_.with_scope(__block, createPrimitiveItems);
	var div_15 = root_38();

	{
		var expression_22 = _$_.child(div_15);

		_$_.expression(expression_22, () => items);
		_$_.pop(div_15);
	}

	_$_.append(__anchor, div_15);
	_$_.pop_component();
}

export function DynamicArrayFromTrack(__anchor, _, __block) {
	_$_.push_component();

	let lazy = _$_.track(['start:', ['one', 2], true, null, false, ':end'], __block, 'b5de6402');
	var div_16 = root_39();

	{
		var expression_23 = _$_.child(div_16);

		_$_.expression(expression_23, () => lazy.value);
		_$_.pop(div_16);
	}

	_$_.append(__anchor, div_16);
	_$_.pop_component();
}

export function DynamicArrayFromConditional(__anchor, _, __block) {
	_$_.push_component();

	const condition = true;

	const items = condition
		? ['start:', ['one', 2], true, null, false, ':end']
		: ['fallback'];

	var div_17 = root_40();

	{
		var expression_24 = _$_.child(div_17);

		_$_.expression(expression_24, () => items);
		_$_.pop(div_17);
	}

	_$_.append(__anchor, div_17);
	_$_.pop_component();
}

export function DynamicArrayFromLogical(__anchor, _, __block) {
	_$_.push_component();

	const condition = true;
	const items = condition && ['start:', ['one', 2], true, null, false, ':end'];
	var div_18 = root_41();

	{
		var expression_25 = _$_.child(div_18);

		_$_.expression(expression_25, () => items);
		_$_.pop(div_18);
	}

	_$_.append(__anchor, div_18);
	_$_.pop_component();
}

export function NestedTsrxInsideTopLevelTsxExpression(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var section_1 = root_42();

		{
			var expression_26 = _$_.child(section_1);

			_$_.expression(expression_26, () => _$_.tsrx_element(function render_children(__anchor, __block) {
				var div_19 = root_43();

				_$_.append(__anchor, div_19);
			}));

			_$_.pop(section_1);
		}

		_$_.append(__anchor, section_1);
	});

	var fragment_16 = root_44();
	var expression_27 = _$_.first_child_frag(fragment_16);

	_$_.expression(expression_27, () => content);
	_$_.append(__anchor, fragment_16);
	_$_.pop_component();
}

export function NestedTsrxElementsInsideTopLevelTsxValue(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var div_20 = root_45();

		{
			var expression_28 = _$_.child(div_20);

			_$_.expression(expression_28, () => _$_.tsrx_element(function render_children(__anchor, __block) {
				var section_2 = root_46();

				_$_.append(__anchor, section_2);
			}));

			_$_.pop(div_20);
		}

		_$_.append(__anchor, div_20);
	});

	var fragment_17 = root_47();
	var expression_29 = _$_.first_child_frag(fragment_17);

	_$_.expression(expression_29, () => content);
	_$_.append(__anchor, fragment_17);
	_$_.pop_component();
}

export function TsxDeclaredInsideNestedTsrxFromTopLevelTsx(__anchor, _, __block) {
	_$_.push_component();

	const content = _$_.tsrx_element(function render_children(__anchor, __block) {
		var fragment_18 = root_50();
		var expression_31 = _$_.first_child_frag(fragment_18);

		_$_.expression(expression_31, () => _$_.tsrx_element(function render_children(__anchor, __block) {
			const nested = _$_.tsrx_element(function render_children(__anchor, __block) {
				var span_6 = root_48();

				_$_.append(__anchor, span_6);
			});

			var div_21 = root_49();

			{
				var expression_30 = _$_.child(div_21);

				_$_.expression(expression_30, () => nested);
				_$_.pop(div_21);
			}

			_$_.append(__anchor, div_21);
		}));

		_$_.append(__anchor, fragment_18);
	});

	var fragment_19 = root_51();
	var expression_32 = _$_.first_child_frag(fragment_19);

	_$_.expression(expression_32, () => content);
	_$_.append(__anchor, fragment_19);
	_$_.pop_component();
}

function TextProp(__anchor, __props, __block) {
	_$_.push_component();

	var div_22 = root_52();

	{
		var expression_33 = _$_.child(div_22);

		_$_.expression(expression_33, () => __props.children);
		_$_.pop(div_22);
	}

	_$_.append(__anchor, div_22);
	_$_.pop_component();
}

export function TextPropWithToggle(__anchor, _, __block) {
	_$_.push_component();

	let lazy_1 = _$_.track(false, __block, '1ba81c3b');
	var fragment_20 = root_53();
	var node_5 = _$_.first_child_frag(fragment_20);

	TextProp(
		node_5,
		{
			get children() {
				return _$_.normalize_children(lazy_1.value ? 'hello' : '');
			}
		},
		_$_.active_block
	);

	var button_1 = _$_.sibling(node_5);

	button_1.__click = () => _$_.set(lazy_1, true);
	_$_.append(__anchor, fragment_20);
	_$_.pop_component();
}

function StaticHeader(__anchor, _, __block) {
	_$_.push_component();

	var fragment_21 = root_54();

	_$_.next(2);
	_$_.append(__anchor, fragment_21, true);
	_$_.pop_component();
}

export function StaticChildWithSiblings(__anchor, _, __block) {
	_$_.push_component();

	const foo = 'bar';
	var fragment_22 = root_55();
	var node_6 = _$_.first_child_frag(fragment_22);

	StaticHeader(node_6, {}, _$_.active_block);

	var span_7 = _$_.sibling(node_6);

	{
		var expression_34 = _$_.child(span_7);

		_$_.expression(expression_34, () => foo);
		_$_.pop(span_7);
	}

	var span_8 = _$_.sibling(span_7);

	{
		var expression_35 = _$_.child(span_8);

		_$_.expression(expression_35, () => foo);
		_$_.pop(span_8);
	}

	_$_.next();
	_$_.append(__anchor, fragment_22, true);
	_$_.pop_component();
}

function Header(__anchor, _, __block) {
	_$_.push_component();

	var fragment_23 = root_56();

	_$_.next(2);
	_$_.append(__anchor, fragment_23, true);
	_$_.pop_component();
}

function Actions(__anchor, { playgroundVisible = false }, __block) {
	_$_.push_component();

	var div_23 = root_57();

	{
		var a_2 = _$_.child(div_23);
		var a_1 = _$_.sibling(a_2);
		var node_7 = _$_.sibling(a_1);

		{
			var consequent = (__anchor) => {
				var a_3 = root_58();

				_$_.append(__anchor, a_3);
			};

			_$_.if(node_7, (__render) => {
				if (playgroundVisible) __render(consequent);
			});
		}

		_$_.pop(div_23);
	}

	_$_.append(__anchor, div_23);
	_$_.pop_component();
}

function Layout(__anchor, { children }, __block) {
	_$_.push_component();

	var main_1 = root_59();

	{
		var div_24 = _$_.child(main_1);

		{
			var expression_36 = _$_.child(div_24);

			_$_.expression(expression_36, () => children);
			_$_.pop(div_24);
		}
	}

	_$_.append(__anchor, main_1);
	_$_.pop_component();
}

function Content(__anchor, _, __block) {
	_$_.push_component();

	var div_25 = root_60();

	_$_.append(__anchor, div_25);
	_$_.pop_component();
}

export function WebsiteIndex(__anchor, _, __block) {
	_$_.push_component();

	var fragment_24 = root_61();
	var node_8 = _$_.first_child_frag(fragment_24);

	Layout(
		node_8,
		{
			children: _$_.tsrx_element(function render_children(__anchor, __block) {
				var fragment_25 = root_62();
				var node_9 = _$_.first_child_frag(fragment_25);

				Header(node_9, {}, _$_.active_block);

				var node_10 = _$_.sibling(node_9);

				Actions(node_10, { playgroundVisible: true }, _$_.active_block);

				var node_11 = _$_.sibling(node_10);

				Content(node_11, {}, _$_.active_block);

				var node_12 = _$_.sibling(node_11);

				Actions(node_12, { playgroundVisible: false }, _$_.active_block);
				_$_.append(__anchor, fragment_25);
			})
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_24);
	_$_.pop_component();
}

function LastChild(__anchor, _, __block) {
	_$_.push_component();

	var footer_1 = root_63();

	_$_.append(__anchor, footer_1);
	_$_.pop_component();
}

export function ComponentAsLastSibling(__anchor, _, __block) {
	_$_.push_component();

	var div_26 = root_64();

	{
		var h1_1 = _$_.child(div_26);
		var p_1 = _$_.sibling(h1_1);
		var node_13 = _$_.sibling(p_1);

		LastChild(node_13, {}, _$_.active_block);
		_$_.pop(div_26);
	}

	_$_.append(__anchor, div_26);
	_$_.pop_component();
}

function InnerContent(__anchor, _, __block) {
	_$_.push_component();

	var div_27 = root_65();

	{
		var span_9 = _$_.child(div_27);
		var node_14 = _$_.sibling(span_9);

		LastChild(node_14, {}, _$_.active_block);
		_$_.pop(div_27);
	}

	_$_.append(__anchor, div_27);
	_$_.pop_component();
}

export function NestedComponentAsLastSibling(__anchor, _, __block) {
	_$_.push_component();

	var section_3 = root_66();

	{
		var h2_1 = _$_.child(section_3);
		var node_15 = _$_.sibling(h2_1);

		InnerContent(node_15, {}, _$_.active_block);
		_$_.pop(section_3);
	}

	_$_.append(__anchor, section_3);
	_$_.pop_component();
}

_$_.delegate(['click']);