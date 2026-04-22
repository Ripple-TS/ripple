// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticTitle() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Content');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--o6otu9-->');
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

	let lazy = _$_.track('Initial Title', 'cbca63e3');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<span');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(_$_.get(lazy)));
			}

			_$_.output_push('</span>');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--1kaaszj-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(_$_.get(lazy)));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function MultipleHeadElements() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Page content');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--9nqthf-->');
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

	let lazy_1 = _$_.track('Initial description', '38bfa3b2');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_1)));
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--1v7o69o-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('My Page');
	}

	_$_.output_push('</title>');
	_$_.output_push('<meta');
	_$_.output_push(' name="description"');
	_$_.output_push(_$_.attr('content', _$_.get(lazy_1), false));
	_$_.output_push(' />');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function TitleWithTemplate() {
	_$_.push_component();

	let lazy_2 = _$_.track('World', 'f3925cd5');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_2)));
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--za44d-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(`Hello ${_$_.get(lazy_2)}!`));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function EmptyTitle() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Empty title test');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--1st5x80-->');
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

	let lazy_3 = _$_.track(true, 'ff71bf1f');
	let lazy_4 = _$_.track('Main Page', '7cd7d671');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_4)));
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--54ijvi-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(_$_.get(lazy_3) ? 'App - ' + _$_.get(lazy_4) : _$_.get(lazy_4)));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function ComputedTitle() {
	_$_.push_component();

	let lazy_5 = _$_.track(0, 'b6a48610');
	let prefix = 'Count: ';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<span');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(_$_.get(lazy_5)));
			}

			_$_.output_push('</span>');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--h5jm3a-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push(_$_.escape(prefix + _$_.get(lazy_5)));
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function MultipleHeadBlocks() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Content');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--133vcai-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('First Head');
	}

	_$_.output_push('</title>');
	_$_.output_push('<!--fju8tw-->');
	_$_.output_push('<meta');
	_$_.output_push(' name="author"');
	_$_.output_push(' content="Test Author"');
	_$_.output_push(' />');
	_$_.set_output_target(null);
	_$_.pop_component();
}

export function HeadWithStyle() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Styled content');
		}

		_$_.output_push('</div>');
	});

	_$_.set_output_target('head');
	_$_.output_push('<!--1iodql4-->');
	_$_.output_push('<title');
	_$_.output_push('>');

	{
		_$_.output_push('Styled Page');
	}

	_$_.output_push('</title>');
	_$_.set_output_target(null);
	_$_.pop_component();
}