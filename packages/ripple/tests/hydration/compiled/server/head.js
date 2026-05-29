// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticTitle() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('Content');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--10f9ad59-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push('Static Test Title');
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}

export function ReactiveTitle() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track('Initial Title', 'cbca63e3');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy.value));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--13811860-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(lazy.value));
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}

export function MultipleHeadElements() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('Page content');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--478d48ee-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push('Page Title');
		}

		_$_.output_push('</title>');
		_$_.output_push('<meta');
		_$_.output_push(' name="description"');
		_$_.output_push(' content="Page description"');
		_$_.output_push(' />');
		_$_.output_push('<link');
		_$_.output_push(' rel="stylesheet"');
		_$_.output_push(' href="/styles.css"');
		_$_.output_push(' />');
		_$_.set_output_target(null);
	});
}

export function ReactiveMetaTags() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track('Initial description', '38bfa3b2');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_1.value));
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--36dd8c9f-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push('My Page');
		}

		_$_.output_push('</title>');
		_$_.output_push('<meta');
		_$_.output_push(' name="description"');
		_$_.output_push(_$_.attr('content', lazy_1.value, false));
		_$_.output_push(' />');
		_$_.set_output_target(null);
	});
}

export function TitleWithTemplate() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track('World', 'f3925cd5');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_2.value));
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--bf58d07e-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(`Hello ${lazy_2.value}!`));
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}

export function EmptyTitle() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('Empty title test');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--146bbd6b-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push('');
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}

export function ConditionalTitle() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(true, 'ff71bf1f');
		let lazy_4 = _$_.track('Main Page', '7cd7d671');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_4.value));
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--79341264-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(lazy_3.value ? 'App - ' + lazy_4.value : lazy_4.value));
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}

export function ComputedTitle() {
	return _$_.tsrx_element(() => {
		let lazy_5 = _$_.track(0, 'b6a48610');
		let prefix = 'Count: ';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_5.value));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--624d9ef2-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(prefix + lazy_5.value));
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}

export function MultipleHeadBlocks() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('Content');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--111100ce-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push('First Head');
		}

		_$_.output_push('</title>');
		_$_.output_push('<!--423883ee-->');
		_$_.output_push('<meta');
		_$_.output_push(' name="author"');
		_$_.output_push(' content="Test Author"');
		_$_.output_push(' />');
		_$_.set_output_target(null);
	});
}

export function HeadWithStyle() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('Styled content');
			}

			_$_.output_push('</div>');
		});

		_$_.set_output_target('head');
		_$_.output_push('<!--f3524d73-->');
		_$_.output_push('<title');
		_$_.output_push('>');

		{
			_$_.output_push('Styled Page');
		}

		_$_.output_push('</title>');
		_$_.set_output_target(null);
	});
}