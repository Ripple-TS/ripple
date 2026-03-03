// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function StaticTitle(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Content');
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--df6gdi-->');
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

	let title = _$_.track('Initial Title');

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
	__output.push('<!--13wropz-->');
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
	__output.push('<!--jbv4cs-->');
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

	let description = _$_.track('Initial description');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(description)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--t794k2-->');
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

	let name = _$_.track('World');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(name)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--betaue-->');
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
	__output.push('<!--11sq4o6-->');
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

	let showPrefix = _$_.track(true);
	let title = _$_.track('Main Page');

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(title)));
	}

	__output.push('</div>');
	__output.target = 'head';
	__output.push('<!--xxkmhn-->');
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

	let count = _$_.track(0);
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
	__output.push('<!--1hj0can-->');
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
	__output.push('<!--15ucmy3-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('First Head');
	}

	__output.push('</title>');
	__output.push('<!--1xolofp-->');
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
	__output.push('<!--q5et2p-->');
	__output.push('<title');
	__output.push('>');

	{
		__output.push('Styled Page');
	}

	__output.push('</title>');
	__output.target = null;
	_$_.pop_component();
}