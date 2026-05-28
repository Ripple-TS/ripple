// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Content</div>`, 1, 1);
var root_1 = _$_.template(`<div><span> </span></div>`, 1, 1);
var root_3 = _$_.template(`<meta name="description" content="Page description"><link rel="stylesheet" href="/styles.css">`, 1, 2);
var root_2 = _$_.template(`<div>Page content</div>`, 1, 1);
var root_5 = _$_.template(`<meta name="description">`, 0);
var root_4 = _$_.template(`<div> </div>`, 1, 1);
var root_6 = _$_.template(`<div> </div>`, 1, 1);
var root_7 = _$_.template(`<div>Empty title test</div>`, 1, 1);
var root_8 = _$_.template(`<div> </div>`, 1, 1);
var root_9 = _$_.template(`<div><span> </span></div>`, 1, 1);
var root_11 = _$_.template(`<meta name="author" content="Test Author">`, 0);
var root_10 = _$_.template(`<div>Content</div>`, 1, 1);
var root_12 = _$_.template(`<div>Styled content</div>`, 1, 1);

import { track } from 'ripple';

export function StaticTitle(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();

	__r = true;

	_$_.head('76c21c4e', (__anchor) => {
		_$_.document.title = 'Static Test Title';
	});

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function ReactiveTitle(__anchor, _, __block) {
	_$_.push_component();

	var __r_1 = false;
	let lazy = _$_.track('Initial Title', __block, 'cbca63e3');
	var fragment_1 = root_1();
	var div_1 = _$_.first_child_frag(fragment_1);

	{
		var span_1 = _$_.child(div_1);

		{
			var expression = _$_.child(span_1);

			_$_.expression(expression, () => lazy.value);
			_$_.pop(span_1);
		}
	}

	_$_.pop(div_1);
	__r_1 = true;

	_$_.head('78265d64', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = lazy.value;
		});
	});

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function MultipleHeadElements(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;
	var fragment_2 = root_2();

	__r_2 = true;

	_$_.head('a7b97e5a', (__anchor) => {
		var fragment_3 = root_3();

		_$_.document.title = 'Page Title';
		_$_.next();
		_$_.append(__anchor, fragment_3, true);
	});

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function ReactiveMetaTags(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = false;
	let lazy_1 = _$_.track('Initial description', __block, '38bfa3b2');
	var fragment_4 = root_4();
	var div_2 = _$_.first_child_frag(fragment_4);

	{
		var expression_1 = _$_.child(div_2);

		_$_.expression(expression_1, () => lazy_1.value);
		_$_.pop(div_2);
	}

	__r_3 = true;

	_$_.head('fdf06c86', (__anchor) => {
		var meta_1 = root_5();

		_$_.document.title = 'My Page';
		_$_.set_attribute(meta_1, 'content');
		_$_.append(__anchor, meta_1);
	});

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function TitleWithTemplate(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	let lazy_2 = _$_.track('World', __block, 'f3925cd5');
	var fragment_5 = root_6();
	var div_3 = _$_.first_child_frag(fragment_5);

	{
		var expression_2 = _$_.child(div_3);

		_$_.expression(expression_2, () => lazy_2.value);
		_$_.pop(div_3);
	}

	__r_4 = true;

	_$_.head('4852577d', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = `Hello ${lazy_2.value}!`;
		});
	});

	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function EmptyTitle(__anchor, _, __block) {
	_$_.push_component();

	var __r_5 = false;
	var fragment_6 = root_7();

	__r_5 = true;

	_$_.head('19986e85', (__anchor) => {
		_$_.document.title = '';
	});

	_$_.append(__anchor, fragment_6);
	_$_.pop_component();
}

export function ConditionalTitle(__anchor, _, __block) {
	_$_.push_component();

	var __r_6 = false;
	let lazy_3 = _$_.track(true, __block, 'ff71bf1f');
	let lazy_4 = _$_.track('Main Page', __block, '7cd7d671');
	var fragment_7 = root_8();
	var div_4 = _$_.first_child_frag(fragment_7);

	{
		var expression_3 = _$_.child(div_4);

		_$_.expression(expression_3, () => lazy_4.value);
		_$_.pop(div_4);
	}

	__r_6 = true;

	_$_.head('b2720318', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = lazy_3.value ? 'App - ' + lazy_4.value : lazy_4.value;
		});
	});

	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

export function ComputedTitle(__anchor, _, __block) {
	_$_.push_component();

	var __r_7 = false;
	let lazy_5 = _$_.track(0, __block, 'b6a48610');
	let prefix = 'Count: ';
	var fragment_8 = root_9();
	var div_5 = _$_.first_child_frag(fragment_8);

	{
		var span_2 = _$_.child(div_5);

		{
			var expression_4 = _$_.child(span_2);

			_$_.expression(expression_4, () => lazy_5.value);
			_$_.pop(span_2);
		}
	}

	_$_.pop(div_5);
	__r_7 = true;

	_$_.head('8ed5e9bf', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = prefix + lazy_5.value;
		});
	});

	_$_.append(__anchor, fragment_8);
	_$_.pop_component();
}

export function MultipleHeadBlocks(__anchor, _, __block) {
	_$_.push_component();

	var __r_8 = false;
	var fragment_9 = root_10();

	__r_8 = true;

	_$_.head('0264dbec', (__anchor) => {
		_$_.document.title = 'First Head';
	});

	_$_.head('f4080c5e', (__anchor) => {
		var meta_2 = root_11();

		_$_.append(__anchor, meta_2);
	});

	_$_.append(__anchor, fragment_9);
	_$_.pop_component();
}

export function HeadWithStyle(__anchor, _, __block) {
	_$_.push_component();

	var __r_9 = false;
	var fragment_10 = root_12();

	__r_9 = true;

	_$_.head('d1c770f8', (__anchor) => {
		_$_.document.title = 'Styled Page';
	});

	_$_.append(__anchor, fragment_10);
	_$_.pop_component();
}