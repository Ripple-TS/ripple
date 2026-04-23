// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { trackAsync } from 'ripple/server';

export function AsyncListInTryPending() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				{
					const comp = AsyncList;
					const args = [{}];

					comp(...args);
				}
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

function AsyncList() {
	_$_.push_component();

	let lazy = _$_.track_async(() => Promise.resolve(['alpha', 'beta', 'gamma']), 'd6bf9e33');

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="items"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (let item of _$_.get(lazy)) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function AsyncTryWithLeadingSibling() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="before"');
		_$_.output_push('>');

		{
			_$_.output_push('before');
		}

		_$_.output_push('</div>');
	});

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				{
					const comp = AsyncContent;
					const args = [{}];

					comp(...args);
				}
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading async content');
				}

				_$_.output_push('</div>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

function AsyncContent() {
	_$_.push_component();

	let lazy_1 = _$_.track_async(() => Promise.resolve('ready'), 'd2fe7b64');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="resolved"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_1)));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}