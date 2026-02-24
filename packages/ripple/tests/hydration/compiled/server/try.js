// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export async function AsyncListInTryPending(__output) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<!--[-->');

		var __pending_pos = __output.body.length;

		__output.push('<p');
		__output.push(' class="loading"');
		__output.push('>');

		{
			__output.push('loading...');
		}

		__output.push('</p>');

		await _$_.async(async () => {
			__output.body = __output.body.slice(0, __pending_pos);

			{
				const comp = AsyncList;
				const args = [__output, {}];

				await comp(...args);
			}
		});

		__output.push('<!--]-->');
		_$_.pop_component();
	});
}

AsyncListInTryPending.async = true;

async function AsyncList(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		let items = await Promise.resolve(['alpha', 'beta', 'gamma']);

		if (_$_.aborted()) return;

		__output.push('<ul');
		__output.push(' class="items"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (let item of items) {
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
	});
}

AsyncList.async = true;

export async function AsyncTryWithLeadingSibling(__output) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="before"');
		__output.push('>');

		{
			__output.push('before');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		var __pending_pos_1 = __output.body.length;

		__output.push('<div');
		__output.push(' class="loading"');
		__output.push('>');

		{
			__output.push('loading async content');
		}

		__output.push('</div>');

		await _$_.async(async () => {
			__output.body = __output.body.slice(0, __pending_pos_1);

			{
				const comp = AsyncContent;
				const args = [__output, {}];

				await comp(...args);
			}
		});

		__output.push('<!--]-->');
		_$_.pop_component();
	});
}

AsyncTryWithLeadingSibling.async = true;

async function AsyncContent(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		let value = await Promise.resolve('ready');

		if (_$_.aborted()) return;

		__output.push('<div');
		__output.push(' class="resolved"');
		__output.push('>');

		{
			__output.push(_$_.escape(value));
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

AsyncContent.async = true;