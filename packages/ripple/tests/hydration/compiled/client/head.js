import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div>Content</div>`, 0);
var root_1 = _$_.template(`<div><span> </span></div>`, 0);
var root_3 = _$_.template(`<meta name="description" content="Page description"><link rel="stylesheet" href="/styles.css">`, 1);
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

	_$_.head('qwqurq', (__anchor) => {
		_$_.document.title = 'Static Test Title';
	});

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function ReactiveTitle(__anchor, _, __block) {
	_$_.push_component();

	let title = track('Initial Title', void 0, void 0, __block);
	var div_2 = root_1();

	{
		var span_1 = _$_.child(div_2);

		{
			var text = _$_.child(span_1, true);

			_$_.pop(span_1);
		}
	}

	_$_.head('1h8nm28', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = _$_.get(title);
		});
	});

	_$_.render(() => {
		_$_.set_text(text, _$_.get(title));
	});

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function MultipleHeadElements(__anchor, _, __block) {
	_$_.push_component();

	var div_3 = root_2();

	_$_.head('9v67ol', (__anchor) => {
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

	let description = track('Initial description', void 0, void 0, __block);
	var div_4 = root_4();

	{
		var text_1 = _$_.child(div_4, true);

		_$_.pop(div_4);
	}

	_$_.head('166unm', (__anchor) => {
		var meta_1 = root_5();

		_$_.document.title = 'My Page';
		_$_.set_attribute(meta_1, 'content');
		_$_.append(__anchor, meta_1);
	});

	_$_.render(() => {
		_$_.set_text(text_1, _$_.get(description));
	});

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function TitleWithTemplate(__anchor, _, __block) {
	_$_.push_component();

	let name = track('World', void 0, void 0, __block);
	var div_5 = root_6();

	{
		var text_2 = _$_.child(div_5, true);

		_$_.pop(div_5);
	}

	_$_.head('3o3mh2', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = `Hello ${_$_.get(name)}!`;
		});
	});

	_$_.render(() => {
		_$_.set_text(text_2, _$_.get(name));
	});

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function EmptyTitle(__anchor, _, __block) {
	_$_.push_component();

	var div_6 = root_7();

	_$_.head('kwo3k6', (__anchor) => {
		_$_.document.title = '';
	});

	_$_.append(__anchor, div_6);
	_$_.pop_component();
}

export function ConditionalTitle(__anchor, _, __block) {
	_$_.push_component();

	let showPrefix = track(true, void 0, void 0, __block);
	let title = track('Main Page', void 0, void 0, __block);
	var div_7 = root_8();

	{
		var text_3 = _$_.child(div_7, true);

		_$_.pop(div_7);
	}

	_$_.head('c2i5xr', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = _$_.get(showPrefix) ? 'App - ' + _$_.get(title) : _$_.get(title);
		});
	});

	_$_.render(() => {
		_$_.set_text(text_3, _$_.get(title));
	});

	_$_.append(__anchor, div_7);
	_$_.pop_component();
}

export function ComputedTitle(__anchor, _, __block) {
	_$_.push_component();

	let count = track(0, void 0, void 0, __block);
	let prefix = 'Count: ';
	var div_8 = root_9();

	{
		var span_2 = _$_.child(div_8);

		{
			var text_4 = _$_.child(span_2, true);

			_$_.pop(span_2);
		}
	}

	_$_.head('1h2z3z5', (__anchor) => {
		_$_.render(() => {
			_$_.document.title = prefix + _$_.get(count);
		});
	});

	_$_.render(() => {
		_$_.set_text(text_4, _$_.get(count));
	});

	_$_.append(__anchor, div_8);
	_$_.pop_component();
}

export function MultipleHeadBlocks(__anchor, _, __block) {
	_$_.push_component();

	var div_9 = root_10();

	_$_.head('14rv3le', (__anchor) => {
		_$_.document.title = 'First Head';
	});

	_$_.head('1eh1mn5', (__anchor) => {
		var meta_2 = root_11();

		_$_.append(__anchor, meta_2);
	});

	_$_.append(__anchor, div_9);
	_$_.pop_component();
}

export function HeadWithStyle(__anchor, _, __block) {
	_$_.push_component();

	var div_10 = root_12();

	_$_.head('1dxk6yg', (__anchor) => {
		_$_.document.title = 'Styled Page';
	});

	_$_.append(__anchor, div_10);
	_$_.pop_component();
}