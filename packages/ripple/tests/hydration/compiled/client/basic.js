import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Hello World</div>`, 0);
var root_1 = _$_.template(`<h1>Title</h1><p>Paragraph text</p><span>Span text</span>`, 1);
var root_2 = _$_.template(`<div class="outer"><div class="inner"><span>Nested content</span></div></div>`, 0);
var root_3 = _$_.template(`<input type="text" placeholder="Enter text" disabled><a href="/link" target="_blank">Link</a>`, 1);
var root_4 = _$_.template(`<span class="child">Child content</span>`, 0);
var root_5 = _$_.template(`<div class="parent"><!></div>`, 0);
var root_6 = _$_.template(`<div class="first">First</div>`, 0);
var root_7 = _$_.template(`<div class="second">Second</div>`, 0);
var root_8 = _$_.template(`<!><!>`, 1);
var root_9 = _$_.template(`<div> </div>`, 0);
var root_10 = _$_.template(`<!>`, 1);
var root_11 = _$_.template(`<div> </div><span> </span>`, 1);
var root_12 = _$_.template(`<h1 class="sr-only">heading</h1><p class="subtitle">first paragraph</p><p class="subtitle">second paragraph</p>`, 1);
var root_13 = _$_.template(`<!><span class="sibling1"> </span><span class="sibling2"> </span>`, 1);
var root_14 = _$_.template(`<h1 class="sr-only">Ripple</h1><img src="/images/logo.png" alt="Logo" class="logo"><p class="subtitle">the elegant TypeScript UI framework</p>`, 1);
var root_16 = _$_.template(`<a href="/playground" class="playground-link">Playground</a>`, 0);
var root_15 = _$_.template(`<div class="social-links"><a href="https://github.com" class="github-link">GitHub</a><a href="https://discord.com" class="discord-link">Discord</a><!></div>`, 0);
var root_17 = _$_.template(`<main><div class="container"><!></div></main>`, 0);
var root_18 = _$_.template(`<div class="content"><p>Some content here</p></div>`, 0);
var root_20 = _$_.template(`<!><!><!><!>`, 1);
var root_19 = _$_.template(`<!>`, 1);
var root_21 = _$_.template(`<footer class="last-child">I am the last child</footer>`, 0);
var root_22 = _$_.template(`<div class="wrapper"><h1>Header</h1><p>Some content</p><!></div>`, 0);
var root_23 = _$_.template(`<div class="inner"><span>Inner text</span><!></div>`, 0);
var root_24 = _$_.template(`<section class="outer"><h2>Section title</h2><!></section>`, 0);

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
		var text_1 = _$_.child(div_6, true);

		_$_.pop(div_6);
	}

	_$_.render(() => {
		_$_.set_text(text_1, 'Hello ' + _$_.with_scope(__block, () => String(props.name)));
	});

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
	const text = 'computed';
	var fragment_4 = root_11();
	var div_7 = _$_.first_child_frag(fragment_4);

	{
		var text_2 = _$_.child(div_7, true);

		text_2.nodeValue = value;
		_$_.pop(div_7);
	}

	var span_2 = _$_.sibling(div_7);

	{
		var text_3 = _$_.child(span_2, true);

		_$_.pop(span_2);
	}

	_$_.next();

	_$_.render(() => {
		_$_.set_text(text_3, _$_.with_scope(__block, () => text.toUpperCase()));
	});

	_$_.append(__anchor, fragment_4, true);
	_$_.pop_component();
}

function StaticHeader(__anchor, _, __block) {
	_$_.push_component();

	var fragment_5 = root_12();

	_$_.next(2);
	_$_.append(__anchor, fragment_5, true);
	_$_.pop_component();
}

export function StaticChildWithSiblings(__anchor, _, __block) {
	_$_.push_component();

	const foo = 'bar';
	var fragment_6 = root_13();
	var node_4 = _$_.first_child_frag(fragment_6);

	StaticHeader(node_4, {}, _$_.active_block);

	var span_3 = _$_.sibling(node_4);

	{
		var text_4 = _$_.child(span_3, true);

		text_4.nodeValue = foo;
		_$_.pop(span_3);
	}

	var span_4 = _$_.sibling(span_3);

	{
		var text_5 = _$_.child(span_4, true);

		text_5.nodeValue = foo;
		_$_.pop(span_4);
	}

	_$_.next();
	_$_.append(__anchor, fragment_6, true);
	_$_.pop_component();
}

function Header(__anchor, _, __block) {
	_$_.push_component();

	var fragment_7 = root_14();

	_$_.next(2);
	_$_.append(__anchor, fragment_7, true);
	_$_.pop_component();
}

function Actions(__anchor, __props, __block) {
	_$_.push_component();

	var div_8 = root_15();

	{
		var a_2 = _$_.child(div_8);
		var a_1 = _$_.sibling(a_2);
		var node_5 = _$_.sibling(a_1);

		{
			var consequent = (__anchor) => {
				var a_3 = root_16();

				_$_.append(__anchor, a_3);
			};

			_$_.if(node_5, (__render) => {
				if (_$_.get(_$_.fallback(__props.playgroundVisible, false))) __render(consequent);
			});
		}

		_$_.pop(div_8);
	}

	_$_.append(__anchor, div_8);
	_$_.pop_component();
}

function Layout(__anchor, __props, __block) {
	_$_.push_component();

	var main_1 = root_17();

	{
		var div_9 = _$_.child(main_1);

		{
			var node_6 = _$_.child(div_9);

			_$_.composite(() => __props.children, node_6, {});
			_$_.pop(div_9);
		}
	}

	_$_.append(__anchor, main_1);
	_$_.pop_component();
}

function Content(__anchor, _, __block) {
	_$_.push_component();

	var div_10 = root_18();

	_$_.append(__anchor, div_10);
	_$_.pop_component();
}

export function WebsiteIndex(__anchor, _, __block) {
	_$_.push_component();

	var fragment_8 = root_19();
	var node_7 = _$_.first_child_frag(fragment_8);

	Layout(
		node_7,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_9 = root_20();
				var node_8 = _$_.first_child_frag(fragment_9);

				Header(node_8, {}, _$_.active_block);

				var node_9 = _$_.sibling(node_8);

				Actions(node_9, { playgroundVisible: true }, _$_.active_block);

				var node_10 = _$_.sibling(node_9);

				Content(node_10, {}, _$_.active_block);

				var node_11 = _$_.sibling(node_10);

				Actions(node_11, { playgroundVisible: false }, _$_.active_block);
				_$_.append(__anchor, fragment_9);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_8);
	_$_.pop_component();
}

function LastChild(__anchor, _, __block) {
	_$_.push_component();

	var footer_1 = root_21();

	_$_.append(__anchor, footer_1);
	_$_.pop_component();
}

export function ComponentAsLastSibling(__anchor, _, __block) {
	_$_.push_component();

	var div_11 = root_22();

	{
		var h1_1 = _$_.child(div_11);
		var p_1 = _$_.sibling(h1_1);
		var node_12 = _$_.sibling(p_1);

		LastChild(node_12, {}, _$_.active_block);
		_$_.pop(div_11);
	}

	_$_.append(__anchor, div_11);
	_$_.pop_component();
}

function InnerContent(__anchor, _, __block) {
	_$_.push_component();

	var div_12 = root_23();

	{
		var span_5 = _$_.child(div_12);
		var node_13 = _$_.sibling(span_5);

		LastChild(node_13, {}, _$_.active_block);
		_$_.pop(div_12);
	}

	_$_.append(__anchor, div_12);
	_$_.pop_component();
}

export function NestedComponentAsLastSibling(__anchor, _, __block) {
	_$_.push_component();

	var section_1 = root_24();

	{
		var h2_1 = _$_.child(section_1);
		var node_14 = _$_.sibling(h2_1);

		InnerContent(node_14, {}, _$_.active_block);
		_$_.pop(section_1);
	}

	_$_.append(__anchor, section_1);
	_$_.pop_component();
}