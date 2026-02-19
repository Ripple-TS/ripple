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