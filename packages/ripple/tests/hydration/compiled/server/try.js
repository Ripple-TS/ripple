// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

var _$_hoisted_async;
var _$_hoisted_async_1;

import { trackAsync } from 'ripple/server';

export function AsyncListInTryPending(__output) {
	_$_.push_component();

	{
		const comp = AsyncList;
		const args = [__output, {}];

		comp(...args);
	}

	_$_.pop_component();
}

function AsyncList(__output) {
	_$_.push_component();

	let items = (_$_hoisted_async = _$_hoisted_async ?? _$_.track_async(() => Promise.resolve(['alpha', 'beta', 'gamma']), void 0, false));

	__output.push('<ul');
	__output.push(' class="items"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (let item of _$_.get(items)) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function AsyncTryWithLeadingSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="before"');
	__output.push('>');

	{
		__output.push('before');
	}

	__output.push('</div>');

	{
		const comp = AsyncContent;
		const args = [__output, {}];

		comp(...args);
	}

	_$_.pop_component();
}

function AsyncContent(__output) {
	_$_.push_component();

	let value = (_$_hoisted_async_1 = _$_hoisted_async_1 ?? _$_.track_async(() => Promise.resolve('ready'), void 0, false));

	__output.push('<div');
	__output.push(' class="resolved"');
	__output.push('>');

	{
		__output.push(_$_.escape(value));
	}

	__output.push('</div>');
	_$_.pop_component();
}