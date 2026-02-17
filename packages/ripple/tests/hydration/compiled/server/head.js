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
	__output.push('<!--1h8nm28-->');
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
	__output.push('<!--9v67ol-->');
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
	__output.push('<!--166unm-->');
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
	__output.push('<!--3o3mh2-->');
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
	__output.push('<!--kwo3k6-->');
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
	__output.push('<!--c2i5xr-->');
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
	__output.push('<!--1h2z3z5-->');
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
	__output.push('<!--14rv3le-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('First Head');
	}

	__output.push('</title>');
	__output.push('<!--1eh1mn5-->');
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
	__output.push('<!--1dxk6yg-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('Styled Page');
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}