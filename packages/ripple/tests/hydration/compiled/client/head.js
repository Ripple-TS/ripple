// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Content</div>`, 0);
var root_1 = _$_.template(`<div><span> </span></div>`, 0);
var root_3 = _$_.template(`<meta name="description" content="Page description"><link rel="stylesheet" href="/styles.css">`, 1, 2);
var root_2 = _$_.template(`<div>Page content</div>`, 0);
var root_5 = _$_.template(`<meta name="description">`, 0);
var root_4 = _$_.template(`<div> </div>`, 0);
var root_6 = _$_.template(`<div> </div>`, 0);
var root_7 = _$_.template(`<div>Empty title test</div>`, 0);
var root_8 = _$_.template(`<div> </div>`, 0);
var root_9 = _$_.template(`<div><span> </span></div>`, 0);
var root_11 = _$_.template(`<meta name="author" content="Test Author">`, 0);
var root_10 = _$_.template(`<div>Content</div>`, 0);
var root_12 = _$_.template(`<div>Styled content</div>`, 0);

import { track } from 'ripple';

export function StaticTitle(__anchor, _, __block) {
	_$_.push_component();

	var div_1 = root();

	_$_.head('p76zx7', (__anchor) => {
		_$_.document.title = 'Static Test Title';
	});

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function ReactiveTitle(__anchor, _, __block) {
	_$_.push_component();

	let lazy = _$_.track('Initial Title', void 0, void 0, __block);
	var div_2 = root_1();

	{
		var span_1 = _$_.child(div_2);

		{
			var expression = _$_.child(span_1, true);

			_$_.expression(expression, () => _$_.get(lazy));
			_$_.pop(span_1);
		}
	}

	_$_.head('1nb8jjx', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = _$_.get(lazy);
		});
	});

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function MultipleHeadElements(__anchor, _, __block) {
	_$_.push_component();

	var div_3 = root_2();

	_$_.head('8n8nfd', (__anchor) => {
		var fragment = root_3();

		_$_.document.title = 'Page Title';
		_$_.next();
		_$_.append(__anchor, fragment, true);
	});

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function ReactiveMetaTags(__anchor, _, __block) {
	_$_.push_component();

	let lazy_1 = _$_.track('Initial description', void 0, void 0, __block);
	var div_4 = root_4();

	{
		var expression_1 = _$_.child(div_4, true);

		_$_.expression(expression_1, () => _$_.get(lazy_1));
		_$_.pop(div_4);
	}

	_$_.head('1u7li02', (__anchor) => {
		var meta_1 = root_5();

		_$_.document.title = 'My Page';
		_$_.set_attribute(meta_1, 'content');
		_$_.append(__anchor, meta_1);
	});

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function TitleWithTemplate(__anchor, _, __block) {
	_$_.push_component();

	let lazy_2 = _$_.track('World', void 0, void 0, __block);
	var div_5 = root_6();

	{
		var expression_2 = _$_.child(div_5, true);

		_$_.expression(expression_2, () => _$_.get(lazy_2));
		_$_.pop(div_5);
	}

	_$_.head('1wzb5pb', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = `Hello ${_$_.get(lazy_2)}!`;
		});
	});

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function EmptyTitle(__anchor, _, __block) {
	_$_.push_component();

	var div_6 = root_7();

	_$_.head('1vtxclq', (__anchor) => {
		_$_.document.title = '';
	});

	_$_.append(__anchor, div_6);
	_$_.pop_component();
}

export function ConditionalTitle(__anchor, _, __block) {
	_$_.push_component();

	let lazy_3 = _$_.track(true, void 0, void 0, __block);
	let lazy_4 = _$_.track('Main Page', void 0, void 0, __block);
	var div_7 = root_8();

	{
		var expression_3 = _$_.child(div_7, true);

		_$_.expression(expression_3, () => _$_.get(lazy_4));
		_$_.pop(div_7);
	}

	_$_.head('23prgg', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = _$_.get(lazy_3) ? 'App - ' + _$_.get(lazy_4) : _$_.get(lazy_4);
		});
	});

	_$_.append(__anchor, div_7);
	_$_.pop_component();
}

export function ComputedTitle(__anchor, _, __block) {
	_$_.push_component();

	let lazy_5 = _$_.track(0, void 0, void 0, __block);
	let prefix = 'Count: ';
	var div_8 = root_9();

	{
		var span_2 = _$_.child(div_8);

		{
			var expression_4 = _$_.child(span_2, true);

			_$_.expression(expression_4, () => _$_.get(lazy_5));
			_$_.pop(span_2);
		}
	}

	_$_.head('dlz6ig', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = prefix + _$_.get(lazy_5);
		});
	});

	_$_.append(__anchor, div_8);
	_$_.pop_component();
}

export function MultipleHeadBlocks(__anchor, _, __block) {
	_$_.push_component();

	var div_9 = root_10();

	_$_.head('143y0j8', (__anchor) => {
		_$_.document.title = 'First Head';
	});

	_$_.head('ejrkl6', (__anchor) => {
		var meta_2 = root_11();

		_$_.append(__anchor, meta_2);
	});

	_$_.append(__anchor, div_9);
	_$_.pop_component();
}

export function HeadWithStyle(__anchor, _, __block) {
	_$_.push_component();

	var div_10 = root_12();

	_$_.head('1k4vrqu', (__anchor) => {
		_$_.document.title = 'Styled Page';
	});

	_$_.append(__anchor, div_10);
	_$_.pop_component();
}