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
		const title = _$_.track('Initial Title', '1kjlv4z');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(title.value);
			}

			__out += '</span></div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--56ee4dab--><title>' + _$_.escape(title.value) + '</title>';
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
			__out += '<!--a718096c--><title>Page Title</title><meta name="description" content="Page description" /><link rel="stylesheet" href="/styles.css" />';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ReactiveMetaTags() {
	return _$_.tsrx_element(() => {
		const description = _$_.track('Initial description', 'fqug8i');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(description.value);
			}

			__out += '</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--c297b350--><title>My Page</title><meta name="description"' + _$_.attr('content', description.value, false) + ' />';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function TitleWithTemplate() {
	return _$_.tsrx_element(() => {
		const name = _$_.track('World', '1vkyx91');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(name.value);
			}

			__out += '</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--9ab2373c--><title>' + _$_.escape(`Hello ${name.value}!`) + '</title>';
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
			__out += '<!--50cc7ae2--><title></title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ConditionalTitle() {
	return _$_.tsrx_element(() => {
		const showPrefix = _$_.track(true, '1yvk8in');
		const title = _$_.track('Main Page', 'yn0twx');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(title.value);
			}

			__out += '</div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--0877ba8e--><title>' + _$_.escape(showPrefix.value ? 'App - ' + title.value : title.value) + '</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function ComputedTitle() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, '1eod79s');
		let prefix = 'Count: ';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span>' + _$_.escape(count.value) + '</span></div>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--60e9fce1--><title>' + _$_.escape(prefix + count.value) + '</title>';
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
			__out += '<!--e56fc100--><title>First Head</title><!--ba797fb2--><meta name="author" content="Test Author" />';
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
			__out += '<!--872692a0--><title>Styled Page</title>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}