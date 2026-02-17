import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/ssr';

export function StaticTitle(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Content');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--715ba079-->');
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

	let title = track('Initial Title');

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<span');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(title)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--fcdc2a31-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(title)));
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
	__output.push('<!--8ef71c34-->');
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

	let description = track('Initial description');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(description)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--e45bdfb1-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('My Page');
	}

	__output.push('</title>');
	__output.push('<meta');
	__output.push(' name="description"');
	__output.push(_$_.attr('content', _$_.get(description), false));
	__output.push(' />');
	__output.target = null;
	_$_.pop_component();
}

export function TitleWithTemplate(__output) {
	_$_.push_component();

	let name = track('World');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(name)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--79bc040e-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(`Hello ${_$_.get(name)}!`));
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
	__output.push('<!--c33e06a8-->');
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

	let showPrefix = track(true);
	let title = track('Main Page');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(title)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--3dd834ef-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(showPrefix) ? 'App - ' + _$_.get(title) : _$_.get(title)));
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}

export function ComputedTitle(__output) {
	_$_.push_component();

	let count = track(0);
	let prefix = 'Count: ';

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<span');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(count)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--a115fab8-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push(_$_.escape(prefix + _$_.get(count)));
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
	__output.push('<!--901bd859-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('First Head');
	}

	__output.push('</title>');
	__output.push('<!--61ac6d56-->');
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
	__output.push('<!--7351ed56-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('Styled Page');
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}