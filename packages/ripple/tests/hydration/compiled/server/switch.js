import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function SwitchStatic(__output) {
	_$_.push_component();

	const status = 'success';

	__output.push('<!--[-->');

	switch (status) {
		case 'success':
			__output.push('<div');
			__output.push(' class="status-success"');
			__output.push('>');
			{
				__output.push('Success');
			}
			__output.push('</div>');
			break;

		case 'error':
			__output.push('<div');
			__output.push(' class="status-error"');
			__output.push('>');
			{
				__output.push('Error');
			}
			__output.push('</div>');
			break;

		default:
			__output.push('<div');
			__output.push(' class="status-unknown"');
			__output.push('>');
			{
				__output.push('Unknown');
			}
			__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function SwitchReactive(__output) {
	_$_.push_component();

	let status = track('a');

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	switch (_$_.get(status)) {
		case 'a':
			__output.push('<div');
			__output.push(' class="case-a"');
			__output.push('>');
			{
				__output.push('Case A');
			}
			__output.push('</div>');
			break;

		case 'b':
			__output.push('<div');
			__output.push(' class="case-b"');
			__output.push('>');
			{
				__output.push('Case B');
			}
			__output.push('</div>');
			break;

		default:
			__output.push('<div');
			__output.push(' class="case-c"');
			__output.push('>');
			{
				__output.push('Case C');
			}
			__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function SwitchFallthrough(__output) {
	_$_.push_component();

	const val = 1;

	__output.push('<!--[-->');

	switch (val) {
		case 1:

		case 2:
			__output.push('<div');
			__output.push(' class="case-1-2"');
			__output.push('>');
			{
				__output.push('1 or 2');
			}
			__output.push('</div>');
			break;

		default:
			__output.push('<div');
			__output.push(' class="case-other"');
			__output.push('>');
			{
				__output.push('Other');
			}
			__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}