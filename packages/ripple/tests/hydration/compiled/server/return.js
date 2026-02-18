import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function EarlyReturnStaticTrue(__output) {
	_$_.push_component();

	var __r = false;

	__output.push('<!--[-->');

	if (true) {
		__output.push('<div');
		__output.push(' class="before"');
		__output.push('>');

		{
			__output.push('Before');
		}

		__output.push('</div>');
		__r = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('After');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function EarlyReturnStaticFalse(__output) {
	_$_.push_component();

	var __r_1 = false;

	__output.push('<!--[-->');

	if (false) {
		__output.push('<div');
		__output.push(' class="before"');
		__output.push('>');

		{
			__output.push('Before');
		}

		__output.push('</div>');
		__r_1 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_1) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('After');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveEarlyReturn(__output) {
	_$_.push_component();

	var __r_2 = false;
	let stop = track(true);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(stop)) {
		__output.push('<div');
		__output.push(' class="stop"');
		__output.push('>');

		{
			__output.push('Stopped');
		}

		__output.push('</div>');
		__r_2 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_2) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('After');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveLoneReturn(__output) {
	_$_.push_component();

	var __r_3 = false;
	let stop = track(true);

	__output.push('<button');
	__output.push(' class="toggle-lone"');
	__output.push('>');

	{
		__output.push('Toggle lone');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(stop)) {
		__r_3 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_3) {
		__output.push('<div');
		__output.push(' class="after-lone"');
		__output.push('>');

		{
			__output.push('After lone');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}