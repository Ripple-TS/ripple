// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticTitle(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Content');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--qwqurq-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('Static Test Title');
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function ReactiveTitle(__output) {
	_$_.push_component();

	let lazy = _$_.track('Initial Title');

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<span');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--9zxmq0-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy)));
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function MultipleHeadElements(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Page content');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--16pnxms-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('Page Title');
	}

	__output.push('</title>');
	__output.push('<meta');
	__output.push(' name="description"');
	__output.push(' content="Page description"');
	__output.push(' />');
	__output.push('<link');
	__output.push(' rel="stylesheet"');
	__output.push(' href="/styles.css"');
	__output.push(' />');
	__output.target = null;
	_$_.pop_component();
}

export function ReactiveMetaTags(__output) {
	_$_.push_component();

	let lazy_1 = _$_.track('Initial description');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_1)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--w5ribf-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('My Page');
	}

	__output.push('</title>');
	__output.push('<meta');
	__output.push(' name="description"');
	__output.push(_$_.attr('content', _$_.get(lazy_1), false));
	__output.push(' />');
	__output.target = null;
	_$_.pop_component();
}

export function TitleWithTemplate(__output) {
	_$_.push_component();

	let lazy_2 = _$_.track('World');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_2)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--2ch862-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(`Hello ${_$_.get(lazy_2)}!`));
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function EmptyTitle(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Empty title test');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--u2seuf-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('');
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function ConditionalTitle(__output) {
	_$_.push_component();

	let lazy_3 = _$_.track(true);
	let lazy_4 = _$_.track('Main Page');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_4)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--a0y861-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_3) ? 'App - ' + _$_.get(lazy_4) : _$_.get(lazy_4)));
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function ComputedTitle(__output) {
	_$_.push_component();

	let lazy_5 = _$_.track(0);
	let prefix = 'Count: ';

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<span');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_5)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--1bmcw8x-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(prefix + _$_.get(lazy_5)));
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function MultipleHeadBlocks(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Content');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--1lpoxil-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('First Head');
	}

	__output.push('</title>');
	__output.push('<!--n4z677-->');
	__output.push('<meta');
	__output.push(' name="author"');
	__output.push(' content="Test Author"');
	__output.push(' />');
	__output.target = null;
	_$_.pop_component();
}

export function HeadWithStyle(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Styled content');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--7j37lr-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('Styled Page');
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}