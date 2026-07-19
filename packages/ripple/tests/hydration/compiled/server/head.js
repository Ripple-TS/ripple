// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticTitle() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>Content</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--6e1f1b90--><title>Static Test Title</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ReactiveTitle() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track('Initial Title', 'cbca63e3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span>' + _$_.escape(lazy.value) + '</span></div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--91435bee--><title>' + _$_.escape(lazy.value) + '</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function MultipleHeadElements() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>Page content</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--07a54928--><title>Page Title</title><meta name="description" content="Page description" /><link rel="stylesheet" href="/styles.css" />';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ReactiveMetaTags() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track('Initial description', '38bfa3b2');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + _$_.escape(lazy_1.value) + '</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--4ca6a546--><title>My Page</title><meta name="description"' + _$_.attr('content', lazy_1.value, false) + ' />';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function TitleWithTemplate() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track('World', 'f3925cd5');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + _$_.escape(lazy_2.value) + '</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--10dc944d--><title>' + _$_.escape(`Hello ${lazy_2.value}!`) + '</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function EmptyTitle() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>Empty title test</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--13ba9873--><title></title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ConditionalTitle() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(true, 'ff71bf1f');
		let lazy_4 = _$_.track('Main Page', '7cd7d671');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + _$_.escape(lazy_4.value) + '</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--4b39c36b--><title>' + _$_.escape(lazy_3.value ? 'App - ' + lazy_4.value : lazy_4.value) + '</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ComputedTitle() {
	return _$_.tsrx_element(() => {
		let lazy_5 = _$_.track(0, 'b6a48610');
		let prefix = 'Count: ';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span>' + _$_.escape(lazy_5.value) + '</span></div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--92c79d98--><title>' + _$_.escape(prefix + lazy_5.value) + '</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function MultipleHeadBlocks() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>Content</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--e50b427b--><title>First Head</title><!--68467dce--><meta name="author" content="Test Author" />';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function HeadWithStyle() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>Styled content</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--3a8578a5--><title>Styled Page</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}