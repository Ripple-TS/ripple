// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function IfTruthy(__output) {
	_$_.push_component();

	const show = true;

	__output.push('<!--[-->');

	if (show) {
		__output.push('<div');
		__output.push(' class="shown"');
		__output.push('>');

		{
			__output.push('Visible');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function IfFalsy(__output) {
	_$_.push_component();

	const show = false;

	__output.push('<!--[-->');

	if (show) {
		__output.push('<div');
		__output.push(' class="shown"');
		__output.push('>');

		{
			__output.push('Visible');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function IfElse(__output) {
	_$_.push_component();

	const isLoggedIn = true;

	__output.push('<!--[-->');

	if (isLoggedIn) {
		__output.push('<div');
		__output.push(' class="logged-in"');
		__output.push('>');

		{
			__output.push('Welcome back!');
		}

		__output.push('</div>');
	} else {
		__output.push('<div');
		__output.push(' class="logged-out"');
		__output.push('>');

		{
			__output.push('Please log in');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveIf(__output) {
	_$_.push_component();

	let lazy = _$_.track(true);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(lazy)) {
		__output.push('<div');
		__output.push(' class="content"');
		__output.push('>');

		{
			__output.push('Content visible');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveIfElse(__output) {
	_$_.push_component();

	let lazy_1 = _$_.track(false);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(lazy_1)) {
		__output.push('<div');
		__output.push(' class="on"');
		__output.push('>');

		{
			__output.push('ON');
		}

		__output.push('</div>');
	} else {
		__output.push('<div');
		__output.push(' class="off"');
		__output.push('>');

		{
			__output.push('OFF');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function NestedIf(__output) {
	_$_.push_component();

	let lazy_2 = _$_.track(true);
	let lazy_3 = _$_.track(true);

	__output.push('<button');
	__output.push(' class="outer-toggle"');
	__output.push('>');

	{
		__output.push('Outer');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="inner-toggle"');
	__output.push('>');

	{
		__output.push('Inner');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(lazy_2)) {
		__output.push('<div');
		__output.push(' class="outer-content"');
		__output.push('>');

		{
			__output.push('Outer');
			__output.push('<!--[-->');

			if (_$_.get(lazy_3)) {
				__output.push('<span');
				__output.push(' class="inner-content"');
				__output.push('>');

				{
					__output.push('Inner');
				}

				__output.push('</span>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function IfElseIfChain(__output) {
	_$_.push_component();

	let lazy_4 = _$_.track('loading');

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="success"');
		__output.push('>');

		{
			__output.push('Success');
		}

		__output.push('</button>');
		__output.push('<button');
		__output.push(' class="error"');
		__output.push('>');

		{
			__output.push('Error');
		}

		__output.push('</button>');
		__output.push('<button');
		__output.push(' class="loading"');
		__output.push('>');

		{
			__output.push('Loading');
		}

		__output.push('</button>');
		__output.push('<!--[-->');

		if (_$_.get(lazy_4) === 'loading') {
			__output.push('<div');
			__output.push(' class="state"');
			__output.push('>');

			{
				__output.push('Loading...');
			}

			__output.push('</div>');
		} else {
			__output.push('<!--[-->');

			if (_$_.get(lazy_4) === 'success') {
				__output.push('<div');
				__output.push(' class="state"');
				__output.push('>');

				{
					__output.push('Success!');
				}

				__output.push('</div>');
			} else {
				__output.push('<div');
				__output.push(' class="state"');
				__output.push('>');

				{
					__output.push('Error occurred');
				}

				__output.push('</div>');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}