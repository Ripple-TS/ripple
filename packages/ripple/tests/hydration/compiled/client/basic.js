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
var root_12 = _$_.template(`<div class="helper-item"> </div>`, 0);
var root_14 = _$_.template(`<!>`, 1, 1);
var root_13 = _$_.template(`<span class="label"> </span><!>`, 1, 2);
var root_16 = _$_.template(`<div class="app-item"> </div>`, 0);
var root_15 = _$_.template(`<!><!>`, 1, 2);
var root_17 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_18 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_19 = _$_.template(` `, 1, 1);
var root_20 = _$_.template(`<div class="mixed-collection"><!></div>`, 0);
var root_21 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_22 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_23 = _$_.template(` `, 1, 1);
var root_24 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 0);
var root_25 = _$_.template(`<strong class="middle">beta</strong>`, 0);
var root_26 = _$_.template(`<em class="tail">epsilon</em>`, 0);
var root_27 = _$_.template(` `, 1, 1);
var root_28 = _$_.template(`<div class="mixed-collection-split"><!></div>`, 0);
var root_29 = _$_.template(`<span class="primitive-tail"> ok</span>`, 0);
var root_30 = _$_.template(` `, 1, 1);
var root_31 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 0);
var root_32 = _$_.template(`<span class="primitive-tail"> ok</span>`, 0);
var root_33 = _$_.template(` `, 1, 1);
var root_34 = _$_.template(`<div class="mixed-collection-primitive"><!></div>`, 0);
var root_35 = _$_.template(`<div class="dynamic-array-call"> </div>`, 0);
var root_36 = _$_.template(`<div class="dynamic-array-track"> </div>`, 0);
var root_37 = _$_.template(`<div class="dynamic-array-conditional"> </div>`, 0);
var root_38 = _$_.template(`<div class="dynamic-array-logical"> </div>`, 0);
var root_40 = _$_.template(`<div class="inner">from tsrx</div>`, 0);
var root_39 = _$_.template(`<section class="outer"><!></section>`, 0);
var root_41 = _$_.template(`<!>`, 1, 1);
var root_43 = _$_.template(`<section class="native"><span class="nested-tsrx">inside nested tsrx</span></section>`, 0);
var root_42 = _$_.template(`<div class="wrapper"><!></div>`, 0);
var root_44 = _$_.template(`<!>`, 1, 1);
var root_45 = _$_.template(`<span class="nested-tsx">inside nested tsx</span>`, 0);
var root_46 = _$_.template(`<div class="native"><!></div>`, 0);
var root_47 = _$_.template(`<!>`, 1, 1);
var root_48 = _$_.template(`<div class="text-prop"><!></div>`, 0);
var root_49 = _$_.template(`<!><button class="show-text">Show</button>`, 1, 2);
var root_50 = _$_.template(`<h1 class="sr-only">heading</h1><p class="subtitle">first paragraph</p><p class="subtitle">second paragraph</p>`, 1, 3);
var root_51 = _$_.template(`<!><span class="sibling1"> </span><span class="sibling2"> </span>`, 1, 3);
var root_52 = _$_.template(`<h1 class="sr-only">Ripple</h1><img src="/images/logo.png" alt="Logo" class="logo"><p class="subtitle">the elegant TypeScript UI framework</p>`, 1, 3);
var root_54 = _$_.template(`<a href="/playground" class="playground-link">Playground</a>`, 0);
var root_53 = _$_.template(`<div class="social-links"><a href="https://github.com" class="github-link">GitHub</a><a href="https://discord.com" class="discord-link">Discord</a><!></div>`, 0);
var root_55 = _$_.template(`<main><div class="container"><!></div></main>`, 0);
var root_56 = _$_.template(`<div class="content"><p>Some content here</p></div>`, 0);
var root_58 = _$_.template(`<!><!><!><!>`, 1, 4);
var root_57 = _$_.template(`<!>`, 1, 1);
var root_59 = _$_.template(`<footer class="last-child">I am the last child</footer>`, 0);
var root_60 = _$_.template(`<div class="wrapper"><h1>Header</h1><p>Some content</p><!></div>`, 0);
var root_61 = _$_.template(`<div class="inner"><span>Inner text</span><!></div>`, 0);
var root_62 = _$_.template(`<section class="outer"><h2>Section title</h2><!></section>`, 0);

import { track } from 'ripple';

export function StaticText() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_1 = root();

		_$_.append(__anchor, div_1);
	});
}

export function MultipleElements() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment = root_1();

		_$_.next(2);
		_$_.append(__anchor, fragment, true);
	});
}

export function NestedElements() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_2 = root_2();

		_$_.append(__anchor, div_2);
	});
}

export function WithAttributes() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_3();

		_$_.next();
		_$_.append(__anchor, fragment_1, true);
	});
}

export function ChildComponent() {
	return _$_.tsrx_element((__anchor, __block) => {
		var span_1 = root_4();

		_$_.append(__anchor, span_1);
	});
}

export function ParentWithChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_3 = root_5();

		{
			var node = _$_.child(div_3);

			_$_.render_component(ChildComponent, node, {});
			_$_.pop(div_3);
		}

		_$_.append(__anchor, div_3);
	});
}

export function FirstSibling() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_4 = root_6();

		_$_.append(__anchor, div_4);
	});
}

export function SecondSibling() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_5 = root_7();

		_$_.append(__anchor, div_5);
	});
}

export function SiblingComponents() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_2 = root_8();
		var node_1 = _$_.first_child_frag(fragment_2);

		_$_.render_component(FirstSibling, node_1, {});

		var node_2 = _$_.sibling(node_1);

		_$_.render_component(SecondSibling, node_2, {});
		_$_.append(__anchor, fragment_2);
	});
}

export function Greeting(props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_6 = root_9();

		{
			var expression = _$_.child(div_6, true);

			_$_.pop(div_6);
		}

		_$_.render(() => {
			_$_.set_text(expression, 'Hello ' + _$_.with_scope(__block, () => String(props.name)));
		});

		_$_.append(__anchor, div_6);
	});
}

export function WithGreeting() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_10();
		var node_3 = _$_.first_child_frag(fragment_3);

		_$_.render_component(Greeting, node_3, { name: "World" });
		_$_.append(__anchor, fragment_3);
	});
}

export function ExpressionContent() {
	return _$_.tsrx_element((__anchor, __block) => {
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
	});
}

function NestedHelperItem({ item }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_8 = root_12();

		{
			var expression_3 = _$_.child(div_8);

			_$_.expression(expression_3, () => item);
			_$_.pop(div_8);
		}

		_$_.append(__anchor, div_8);
	});
}

function NestedTsxTsrxFragment({ label }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_13();
		var span_3 = _$_.first_child_frag(fragment_5);

		{
			var expression_4 = _$_.child(span_3, true);

			expression_4.nodeValue = label;
			_$_.pop(span_3);
		}

		var node_4 = _$_.sibling(span_3);

		_$_.for(
			node_4,
			() => [1, 2, 3, 4],
			(__anchor, item) => {
				var fragment_6 = root_14();
				var node_5 = _$_.first_child_frag(fragment_6);

				_$_.render_component(NestedHelperItem, node_5, { item });
				_$_.append(__anchor, fragment_6);
			},
			0
		);

		_$_.append(__anchor, fragment_5);
	});
}

export function NestedTsxTsrxExpressionValues() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_15();
		var node_6 = _$_.first_child_frag(fragment_7);

		_$_.for(
			node_6,
			() => [1, 2, 3],
			(__anchor, item) => {
				var div_9 = root_16();

				{
					var expression_5 = _$_.child(div_9);

					_$_.expression(expression_5, () => item);
					_$_.pop(div_9);
				}

				_$_.append(__anchor, div_9);
			},
			0
		);

		var node_7 = _$_.sibling(node_6);

		_$_.render_component(NestedTsxTsrxFragment, node_7, { label: "from helper" });
		_$_.append(__anchor, fragment_7);
	});
}

export function MixedTsrxCollectionText() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var fragment_8 = root_19();
			var expression_6 = _$_.first_child_frag(fragment_8);

			_$_.expression(expression_6, () => [
				'alpha ',
				_$_.tsrx_element((__anchor, __block) => {
					var strong_1 = root_17();

					_$_.append(__anchor, strong_1);
				}),
				' gamma ',
				[
					'delta ',
					_$_.tsrx_element((__anchor, __block) => {
						var em_1 = root_18();

						_$_.append(__anchor, em_1);
					}),
					' zeta'
				]
			]);

			_$_.append(__anchor, fragment_8);
		});

		var div_10 = root_20();

		{
			var expression_7 = _$_.child(div_10);

			_$_.expression(expression_7, () => content);
			_$_.pop(div_10);
		}

		_$_.append(__anchor, div_10);
	});
}

export function MixedTsrxCollectionSplitServerText() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var fragment_9 = root_23();
			var expression_8 = _$_.first_child_frag(fragment_9);

			_$_.expression(expression_8, () => [
				'alpha ',
				_$_.tsrx_element((__anchor, __block) => {
					var strong_2 = root_21();

					_$_.append(__anchor, strong_2);
				}),
				' gamma ',
				[
					'delta ',
					_$_.tsrx_element((__anchor, __block) => {
						var em_2 = root_22();

						_$_.append(__anchor, em_2);
					}),
					' zeta'
				]
			]);

			_$_.append(__anchor, fragment_9);
		});

		var div_11 = root_24();

		{
			var expression_9 = _$_.child(div_11);

			_$_.expression(expression_9, () => content);
			_$_.pop(div_11);
		}

		_$_.append(__anchor, div_11);
	});
}

export function MixedTsrxCollectionSplitClientText() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var fragment_10 = root_27();
			var expression_10 = _$_.first_child_frag(fragment_10);

			_$_.expression(expression_10, () => [
				'alpha ',
				_$_.tsrx_element((__anchor, __block) => {
					var strong_3 = root_25();

					_$_.append(__anchor, strong_3);
				}),
				' gamma ',
				[
					'changed ',
					_$_.tsrx_element((__anchor, __block) => {
						var em_3 = root_26();

						_$_.append(__anchor, em_3);
					}),
					' zeta'
				]
			]);

			_$_.append(__anchor, fragment_10);
		});

		var div_12 = root_28();

		{
			var expression_11 = _$_.child(div_12);

			_$_.expression(expression_11, () => content);
			_$_.pop(div_12);
		}

		_$_.append(__anchor, div_12);
	});
}

export function MixedTsrxCollectionPrimitiveServerText() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var fragment_11 = root_30();
			var expression_12 = _$_.first_child_frag(fragment_11);

			_$_.expression(expression_12, () => [
				'count: ',
				1,
				' / ',
				true,
				_$_.tsrx_element((__anchor, __block) => {
					var span_4 = root_29();

					_$_.append(__anchor, span_4);
				})
			]);

			_$_.append(__anchor, fragment_11);
		});

		var div_13 = root_31();

		{
			var expression_13 = _$_.child(div_13);

			_$_.expression(expression_13, () => content);
			_$_.pop(div_13);
		}

		_$_.append(__anchor, div_13);
	});
}

export function MixedTsrxCollectionPrimitiveClientText() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var fragment_12 = root_33();
			var expression_14 = _$_.first_child_frag(fragment_12);

			_$_.expression(expression_14, () => [
				'count: ',
				2,
				' / ',
				false,
				_$_.tsrx_element((__anchor, __block) => {
					var span_5 = root_32();

					_$_.append(__anchor, span_5);
				})
			]);

			_$_.append(__anchor, fragment_12);
		});

		var div_14 = root_34();

		{
			var expression_15 = _$_.child(div_14);

			_$_.expression(expression_15, () => content);
			_$_.pop(div_14);
		}

		_$_.append(__anchor, div_14);
	});
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = _$_.with_scope(__block, createPrimitiveItems);
		var div_15 = root_35();

		{
			var expression_16 = _$_.child(div_15);

			_$_.expression(expression_16, () => items);
			_$_.pop(div_15);
		}

		_$_.append(__anchor, div_15);
	});
}

export function DynamicArrayFromTrack() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(['start:', ['one', 2], true, null, false, ':end'], __block, 'b5de6402');
		var div_16 = root_36();

		{
			var expression_17 = _$_.child(div_16);

			_$_.expression(expression_17, () => lazy.value);
			_$_.pop(div_16);
		}

		_$_.append(__anchor, div_16);
	});
}

export function DynamicArrayFromConditional() {
	return _$_.tsrx_element((__anchor, __block) => {
		const condition = true;

		const items = condition
			? ['start:', ['one', 2], true, null, false, ':end']
			: ['fallback'];

		var div_17 = root_37();

		{
			var expression_18 = _$_.child(div_17);

			_$_.expression(expression_18, () => items);
			_$_.pop(div_17);
		}

		_$_.append(__anchor, div_17);
	});
}

export function DynamicArrayFromLogical() {
	return _$_.tsrx_element((__anchor, __block) => {
		const condition = true;
		const items = condition && ['start:', ['one', 2], true, null, false, ':end'];
		var div_18 = root_38();

		{
			var expression_19 = _$_.child(div_18);

			_$_.expression(expression_19, () => items);
			_$_.pop(div_18);
		}

		_$_.append(__anchor, div_18);
	});
}

export function NestedTsrxInsideTopLevelTsxExpression() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var section_1 = root_39();

			{
				var expression_20 = _$_.child(section_1);

				_$_.expression(expression_20, () => _$_.tsrx_element((__anchor, __block) => {
					var div_19 = root_40();

					_$_.append(__anchor, div_19);
				}));

				_$_.pop(section_1);
			}

			_$_.append(__anchor, section_1);
		});

		var fragment_13 = root_41();
		var expression_21 = _$_.first_child_frag(fragment_13);

		_$_.expression(expression_21, () => content);
		_$_.append(__anchor, fragment_13);
	});
}

export function NestedTsrxElementsInsideTopLevelTsxValue() {
	return _$_.tsrx_element((__anchor, __block) => {
		const content = _$_.tsrx_element((__anchor, __block) => {
			var div_20 = root_42();

			{
				var expression_22 = _$_.child(div_20);

				_$_.expression(expression_22, () => _$_.tsrx_element((__anchor, __block) => {
					var section_2 = root_43();

					_$_.append(__anchor, section_2);
				}));

				_$_.pop(div_20);
			}

			_$_.append(__anchor, div_20);
		});

		var fragment_14 = root_44();
		var expression_23 = _$_.first_child_frag(fragment_14);

		_$_.expression(expression_23, () => content);
		_$_.append(__anchor, fragment_14);
	});
}

export function TsxDeclaredBeforeTopLevelTsx() {
	return _$_.tsrx_element((__anchor, __block) => {
		const nested = _$_.tsrx_element((__anchor, __block) => {
			var span_6 = root_45();

			_$_.append(__anchor, span_6);
		});

		const content = _$_.tsrx_element((__anchor, __block) => {
			var div_21 = root_46();

			{
				var expression_24 = _$_.child(div_21);

				_$_.expression(expression_24, () => nested);
				_$_.pop(div_21);
			}

			_$_.append(__anchor, div_21);
		});

		var fragment_15 = root_47();
		var expression_25 = _$_.first_child_frag(fragment_15);

		_$_.expression(expression_25, () => content);
		_$_.append(__anchor, fragment_15);
	});
}

function TextProp(__props) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_22 = root_48();

		{
			var expression_26 = _$_.child(div_22);

			_$_.expression(expression_26, () => __props.children);
			_$_.pop(div_22);
		}

		_$_.append(__anchor, div_22);
	});
}

export function TextPropWithToggle() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(false, __block, '1ba81c3b');
		var fragment_16 = root_49();
		var node_8 = _$_.first_child_frag(fragment_16);

		_$_.render_component(TextProp, node_8, {
			get children() {
				return _$_.normalize_children(lazy_1.value ? 'hello' : '');
			}
		});

		var button_1 = _$_.sibling(node_8);

		button_1.__click = () => _$_.set(lazy_1, true);
		_$_.append(__anchor, fragment_16);
	});
}

function StaticHeader() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_17 = root_50();

		_$_.next(2);
		_$_.append(__anchor, fragment_17, true);
	});
}

export function StaticChildWithSiblings() {
	return _$_.tsrx_element((__anchor, __block) => {
		const foo = 'bar';
		var fragment_18 = root_51();
		var node_9 = _$_.first_child_frag(fragment_18);

		_$_.render_component(StaticHeader, node_9, {});

		var span_7 = _$_.sibling(node_9);

		{
			var expression_27 = _$_.child(span_7, true);

			expression_27.nodeValue = foo;
			_$_.pop(span_7);
		}

		var span_8 = _$_.sibling(span_7);

		{
			var expression_28 = _$_.child(span_8, true);

			expression_28.nodeValue = foo;
			_$_.pop(span_8);
		}

		_$_.next();
		_$_.append(__anchor, fragment_18, true);
	});
}

function Header() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_19 = root_52();

		_$_.next(2);
		_$_.append(__anchor, fragment_19, true);
	});
}

function Actions({ playgroundVisible = false }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_23 = root_53();

		{
			var a_2 = _$_.child(div_23);
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

			_$_.pop(div_23);
		}

		_$_.append(__anchor, div_23);
	});
}

function Layout({ children }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var main_1 = root_55();

		{
			var div_24 = _$_.child(main_1);

			{
				var expression_29 = _$_.child(div_24);

				_$_.expression(expression_29, () => children);
				_$_.pop(div_24);
			}
		}

		_$_.append(__anchor, main_1);
	});
}

function Content() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_25 = root_56();

		_$_.append(__anchor, div_25);
	});
}

export function WebsiteIndex() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_20 = root_57();
		var node_11 = _$_.first_child_frag(fragment_20);

		_$_.render_component(Layout, node_11, {
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_21 = root_58();
				var node_12 = _$_.first_child_frag(fragment_21);

				_$_.render_component(Header, node_12, {});

				var node_13 = _$_.sibling(node_12);

				_$_.render_component(Actions, node_13, { playgroundVisible: true });

				var node_14 = _$_.sibling(node_13);

				_$_.render_component(Content, node_14, {});

				var node_15 = _$_.sibling(node_14);

				_$_.render_component(Actions, node_15, { playgroundVisible: false });
				_$_.append(__anchor, fragment_21);
			})
		});

		_$_.append(__anchor, fragment_20);
	});
}

function LastChild() {
	return _$_.tsrx_element((__anchor, __block) => {
		var footer_1 = root_59();

		_$_.append(__anchor, footer_1);
	});
}

export function ComponentAsLastSibling() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_26 = root_60();

		{
			var h1_1 = _$_.child(div_26);
			var p_1 = _$_.sibling(h1_1);
			var node_16 = _$_.sibling(p_1);

			_$_.render_component(LastChild, node_16, {});
			_$_.pop(div_26);
		}

		_$_.append(__anchor, div_26);
	});
}

function InnerContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_27 = root_61();

		{
			var span_9 = _$_.child(div_27);
			var node_17 = _$_.sibling(span_9);

			_$_.render_component(LastChild, node_17, {});
			_$_.pop(div_27);
		}

		_$_.append(__anchor, div_27);
	});
}

export function NestedComponentAsLastSibling() {
	return _$_.tsrx_element((__anchor, __block) => {
		var section_3 = root_62();

		{
			var h2_1 = _$_.child(section_3);
			var node_18 = _$_.sibling(h2_1);

			_$_.render_component(InnerContent, node_18, {});
			_$_.pop(section_3);
		}

		_$_.append(__anchor, section_3);
	});
}

_$_.delegate(['click']);