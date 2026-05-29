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

export function StaticTitle() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_1 = root();

		_$_.head('10f9ad59', (__anchor) => {
			_$_.document.title = 'Static Test Title';
		});

		_$_.append(__anchor, div_1);
	});
}

export function ReactiveTitle() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track('Initial Title', __block, 'cbca63e3');
		var div_2 = root_1();

		{
			var span_1 = _$_.child(div_2);

			{
				var expression = _$_.child(span_1);

				_$_.expression(expression, () => lazy.value);
				_$_.pop(span_1);
			}
		}

		_$_.head('13811860', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = lazy.value;
			});
		});

		_$_.append(__anchor, div_2);
	});
}

export function MultipleHeadElements() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_3 = root_2();

		_$_.head('478d48ee', (__anchor) => {
			var fragment = root_3();

			_$_.document.title = 'Page Title';
			_$_.next();
			_$_.append(__anchor, fragment, true);
		});

		_$_.append(__anchor, div_3);
	});
}

export function ReactiveMetaTags() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track('Initial description', __block, '38bfa3b2');
		var div_4 = root_4();

		{
			var expression_1 = _$_.child(div_4);

			_$_.expression(expression_1, () => lazy_1.value);
			_$_.pop(div_4);
		}

		_$_.head('36dd8c9f', (__anchor) => {
			var meta_1 = root_5();

			_$_.document.title = 'My Page';
			_$_.set_attribute(meta_1, 'content');
			_$_.append(__anchor, meta_1);
		});

		_$_.append(__anchor, div_4);
	});
}

export function TitleWithTemplate() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track('World', __block, 'f3925cd5');
		var div_5 = root_6();

		{
			var expression_2 = _$_.child(div_5);

			_$_.expression(expression_2, () => lazy_2.value);
			_$_.pop(div_5);
		}

		_$_.head('bf58d07e', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = `Hello ${lazy_2.value}!`;
			});
		});

		_$_.append(__anchor, div_5);
	});
}

export function EmptyTitle() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_6 = root_7();

		_$_.head('146bbd6b', (__anchor) => {
			_$_.document.title = '';
		});

		_$_.append(__anchor, div_6);
	});
}

export function ConditionalTitle() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track(true, __block, 'ff71bf1f');
		let lazy_4 = _$_.track('Main Page', __block, '7cd7d671');
		var div_7 = root_8();

		{
			var expression_3 = _$_.child(div_7);

			_$_.expression(expression_3, () => lazy_4.value);
			_$_.pop(div_7);
		}

		_$_.head('79341264', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = lazy_3.value ? 'App - ' + lazy_4.value : lazy_4.value;
			});
		});

		_$_.append(__anchor, div_7);
	});
}

export function ComputedTitle() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_5 = _$_.track(0, __block, 'b6a48610');
		let prefix = 'Count: ';
		var div_8 = root_9();

		{
			var span_2 = _$_.child(div_8);

			{
				var expression_4 = _$_.child(span_2);

				_$_.expression(expression_4, () => lazy_5.value);
				_$_.pop(span_2);
			}
		}

		_$_.head('624d9ef2', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = prefix + lazy_5.value;
			});
		});

		_$_.append(__anchor, div_8);
	});
}

export function MultipleHeadBlocks() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_9 = root_10();

		_$_.head('111100ce', (__anchor) => {
			_$_.document.title = 'First Head';
		});

		_$_.head('423883ee', (__anchor) => {
			var meta_2 = root_11();

			_$_.append(__anchor, meta_2);
		});

		_$_.append(__anchor, div_9);
	});
}

export function HeadWithStyle() {
	return _$_.tsrx_element((__anchor, __block) => {
		var div_10 = root_12();

		_$_.head('f3524d73', (__anchor) => {
			_$_.document.title = 'Styled Page';
		});

		_$_.append(__anchor, div_10);
	});
}