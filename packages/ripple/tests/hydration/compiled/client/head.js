// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div>Content</div>`, 0);
var root = _$_.template(`<!>`, 1, 1);

function StaticTitle_render(__anchor, __block) {
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var div = root_1();

		_$_.head('6e1f1b90', (__anchor) => {
			_$_.document.title = 'Static Test Title';
		});

		_$_.append(__anchor, div);
	}));

	_$_.append(__anchor, fragment);
}

StaticTitle.$r = StaticTitle_render;

var root_3 = _$_.template(`<div><span> </span></div>`, 0);
var root_2 = _$_.template(`<!>`, 1, 1);

function ReactiveTitle_render(__anchor, __block) {
	let lazy = _$_.track('Initial Title', __block, 'cbca63e3');
	var fragment_1 = root_2();
	var node_1 = _$_.first_child_frag(fragment_1);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var div_1 = root_3();

		{
			var span = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

			{
				var expression = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

				_$_.expression(expression, () => lazy.value);
				_$_.hydrating && _$_.pop(span);
			}
		}

		_$_.head('91435bee', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = lazy.value;
			});
		});

		_$_.append(__anchor, div_1);
	}));

	_$_.append(__anchor, fragment_1);
}

ReactiveTitle.$r = ReactiveTitle_render;

var root_6 = _$_.template(`<meta name="description" content="Page description"><link rel="stylesheet" href="/styles.css">`, 1, 2);
var root_5 = _$_.template(`<div>Page content</div>`, 0);
var root_4 = _$_.template(`<!>`, 1, 1);

function MultipleHeadElements_render(__anchor, __block) {
	var fragment_2 = root_4();
	var node_2 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
		var div_2 = root_5();

		_$_.head('07a54928', (__anchor) => {
			var fragment_3 = root_6();

			_$_.document.title = 'Page Title';
			_$_.next();
			_$_.append(__anchor, fragment_3);
		});

		_$_.append(__anchor, div_2);
	}));

	_$_.append(__anchor, fragment_2);
}

MultipleHeadElements.$r = MultipleHeadElements_render;

var root_9 = _$_.template(`<meta name="description">`, 0);
var root_8 = _$_.template(`<div> </div>`, 0);
var root_7 = _$_.template(`<!>`, 1, 1);

function ReactiveMetaTags_render(__anchor, __block) {
	let lazy_1 = _$_.track('Initial description', __block, '38bfa3b2');
	var fragment_4 = root_7();
	var node_3 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var div_3 = root_8();

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;

			_$_.expression(expression_1, () => lazy_1.value);
			_$_.hydrating && _$_.pop(div_3);
		}

		_$_.head('4ca6a546', (__anchor) => {
			var meta = root_9();

			_$_.document.title = 'My Page';
			_$_.set_attribute(meta, 'content');
			_$_.append(__anchor, meta);
		});

		_$_.append(__anchor, div_3);
	}));

	_$_.append(__anchor, fragment_4);
}

ReactiveMetaTags.$r = ReactiveMetaTags_render;

var root_11 = _$_.template(`<div> </div>`, 0);
var root_10 = _$_.template(`<!>`, 1, 1);

function TitleWithTemplate_render(__anchor, __block) {
	let lazy_2 = _$_.track('World', __block, 'f3925cd5');
	var fragment_5 = root_10();
	var node_4 = _$_.first_child_frag(fragment_5);

	_$_.expression(node_4, () => _$_.tsrx_element((__anchor, __block) => {
		var div_4 = root_11();

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

			_$_.expression(expression_2, () => lazy_2.value);
			_$_.hydrating && _$_.pop(div_4);
		}

		_$_.head('10dc944d', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = `Hello ${lazy_2.value}!`;
			});
		});

		_$_.append(__anchor, div_4);
	}));

	_$_.append(__anchor, fragment_5);
}

TitleWithTemplate.$r = TitleWithTemplate_render;

var root_13 = _$_.template(`<div>Empty title test</div>`, 0);
var root_12 = _$_.template(`<!>`, 1, 1);

function EmptyTitle_render(__anchor, __block) {
	var fragment_6 = root_12();
	var node_5 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
		var div_5 = root_13();

		_$_.head('13ba9873', (__anchor) => {
			_$_.document.title = '';
		});

		_$_.append(__anchor, div_5);
	}));

	_$_.append(__anchor, fragment_6);
}

EmptyTitle.$r = EmptyTitle_render;

var root_15 = _$_.template(`<div> </div>`, 0);
var root_14 = _$_.template(`<!>`, 1, 1);

function ConditionalTitle_render(__anchor, __block) {
	let lazy_3 = _$_.track(true, __block, 'ff71bf1f');
	let lazy_4 = _$_.track('Main Page', __block, '7cd7d671');
	var fragment_7 = root_14();
	var node_6 = _$_.first_child_frag(fragment_7);

	_$_.expression(node_6, () => _$_.tsrx_element((__anchor, __block) => {
		var div_6 = root_15();

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_child() : div_6.firstChild;

			_$_.expression(expression_3, () => lazy_4.value);
			_$_.hydrating && _$_.pop(div_6);
		}

		_$_.head('4b39c36b', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = lazy_3.value ? 'App - ' + lazy_4.value : lazy_4.value;
			});
		});

		_$_.append(__anchor, div_6);
	}));

	_$_.append(__anchor, fragment_7);
}

ConditionalTitle.$r = ConditionalTitle_render;

var root_17 = _$_.template(`<div><span> </span></div>`, 0);

function render(__prev) {
	var __a = __prev._lazy_5.value;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_4, __prev.a = __a);
	}
}

var root_16 = _$_.template(`<!>`, 1, 1);

function ComputedTitle_render(__anchor, __block) {
	let lazy_5 = _$_.track(0, __block, 'b6a48610');
	let prefix = 'Count: ';
	var fragment_8 = root_16();
	var node_7 = _$_.first_child_frag(fragment_8);

	_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
		var div_7 = root_17();

		{
			var span_1 = _$_.hydrating ? _$_.hydrate_child() : div_7.firstChild;

			{
				var expression_4 = _$_.hydrating ? _$_.hydrate_text() : span_1.firstChild;
			}
		}

		_$_.head('92c79d98', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = prefix + lazy_5.value;
			});
		});

		_$_.render(render, { a: ' ', _lazy_5: lazy_5, _expression_4: expression_4 });
		_$_.append(__anchor, div_7);
	}));

	_$_.append(__anchor, fragment_8);
}

ComputedTitle.$r = ComputedTitle_render;

var root_20 = _$_.template(`<meta name="author" content="Test Author">`, 0);
var root_19 = _$_.template(`<div>Content</div>`, 0);
var root_18 = _$_.template(`<!>`, 1, 1);

function MultipleHeadBlocks_render(__anchor, __block) {
	var fragment_9 = root_18();
	var node_8 = _$_.first_child_frag(fragment_9);

	_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
		var div_8 = root_19();

		_$_.head('e50b427b', (__anchor) => {
			_$_.document.title = 'First Head';
		});

		_$_.head('68467dce', (__anchor) => {
			var meta_1 = root_20();

			_$_.append(__anchor, meta_1);
		});

		_$_.append(__anchor, div_8);
	}));

	_$_.append(__anchor, fragment_9);
}

MultipleHeadBlocks.$r = MultipleHeadBlocks_render;

var root_22 = _$_.template(`<div>Styled content</div>`, 0);
var root_21 = _$_.template(`<!>`, 1, 1);

function HeadWithStyle_render(__anchor, __block) {
	var fragment_10 = root_21();
	var node_9 = _$_.first_child_frag(fragment_10);

	_$_.expression(node_9, () => _$_.tsrx_element((__anchor, __block) => {
		var div_9 = root_22();

		_$_.head('3a8578a5', (__anchor) => {
			_$_.document.title = 'Styled Page';
		});

		_$_.append(__anchor, div_9);
	}));

	_$_.append(__anchor, fragment_10);
}

HeadWithStyle.$r = HeadWithStyle_render;

import { track } from 'ripple';

export function StaticTitle() {
	return _$_.tsrx_element(StaticTitle_render);
}

export function ReactiveTitle() {
	return _$_.tsrx_element(ReactiveTitle_render);
}

export function MultipleHeadElements() {
	return _$_.tsrx_element(MultipleHeadElements_render);
}

export function ReactiveMetaTags() {
	return _$_.tsrx_element(ReactiveMetaTags_render);
}

export function TitleWithTemplate() {
	return _$_.tsrx_element(TitleWithTemplate_render);
}

export function EmptyTitle() {
	return _$_.tsrx_element(EmptyTitle_render);
}

export function ConditionalTitle() {
	return _$_.tsrx_element(ConditionalTitle_render);
}

export function ComputedTitle() {
	return _$_.tsrx_element(ComputedTitle_render);
}

export function MultipleHeadBlocks() {
	return _$_.tsrx_element(MultipleHeadBlocks_render);
}

export function HeadWithStyle() {
	return _$_.tsrx_element(HeadWithStyle_render);
}