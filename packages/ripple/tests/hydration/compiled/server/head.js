// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticTitle() {
	_$_.push_component();

	var __r = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Content');
		}

		_$_.output_push('</div>');
	});

	__r = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--76c21c4e-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('Static Test Title');
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function ReactiveTitle() {
	_$_.push_component();

	var __r_1 = false;
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

	__r_1 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--78265d64-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(lazy.value));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function MultipleHeadElements() {
	_$_.push_component();

	var __r_2 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Page content');
		}

		_$_.output_push('</div>');
	});

	__r_2 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--a7b97e5a-->');
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
	_$_.pop_component();
}

export function ReactiveMetaTags() {
	_$_.push_component();

	var __r_3 = false;
	let lazy_1 = _$_.track('Initial description', '38bfa3b2');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(lazy_1.value));
		}

		_$_.output_push('</div>');
	});

	__r_3 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--fdf06c86-->');
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
	_$_.pop_component();
}

export function TitleWithTemplate() {
	_$_.push_component();

	var __r_4 = false;
	let lazy_2 = _$_.track('World', 'f3925cd5');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(lazy_2.value));
		}

		_$_.output_push('</div>');
	});

	__r_4 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--4852577d-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(`Hello ${lazy_2.value}!`));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function EmptyTitle() {
	_$_.push_component();

	var __r_5 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Empty title test');
		}

		_$_.output_push('</div>');
	});

	__r_5 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--19986e85-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('');
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function ConditionalTitle() {
	_$_.push_component();

	var __r_6 = false;
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

	__r_6 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--b2720318-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(lazy_3.value ? 'App - ' + lazy_4.value : lazy_4.value));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function ComputedTitle() {
	_$_.push_component();

	var __r_7 = false;
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

	__r_7 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--8ed5e9bf-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(prefix + lazy_5.value));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function MultipleHeadBlocks() {
	_$_.push_component();

	var __r_8 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Content');
		}

		_$_.output_push('</div>');
	});

	__r_8 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--0264dbec-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('First Head');
	}

	_$_.output_push('</title>');
	_$_.output_push('<!--f4080c5e-->');
	_$_.output_push('<meta');
	_$_.output_push(' name="author"');
	_$_.output_push(' content="Test Author"');
	_$_.output_push(' />');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function HeadWithStyle() {
	_$_.push_component();

	var __r_9 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Styled content');
		}

		_$_.output_push('</div>');
	});

	__r_9 = true;
	_$_.set_output_target('head');
	_$_.output_push('<!--d1c770f8-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('Styled Page');
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}