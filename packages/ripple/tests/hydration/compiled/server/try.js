// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { trackAsync } from 'ripple/server';

export function RootPending() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<p');
			_$_.output_push(' class="root-pending"');
			_$_.output_push('>');

			{
				_$_.output_push('root loading...');
			}

			_$_.output_push('</p>');
		});
	});
}

export function RootCatch({ error, reset }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<section');
			_$_.output_push(' class="root-catch"');
			_$_.output_push('>');

			{
				_$_.output_push('<p');
				_$_.output_push(' class="root-error"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(error.message));
				}

				_$_.output_push('</p>');
				_$_.output_push('<button');
				_$_.output_push(' class="root-reset"');
				_$_.output_push('>');

				{
					_$_.output_push('retry');
				}

				_$_.output_push('</button>');
			}

			_$_.output_push('</section>');
		});
	});
}

export function RootThrows() {
	return _$_.tsrx_element(() => {
		throw new Error('root exploded');

		_$_.regular_block(() => {
			_$_.output_push('<p');
			_$_.output_push('>');

			{
				_$_.output_push('should not render');
			}

			_$_.output_push('</p>');
		});
	});
}

export function RootAsyncDirect() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track_async(() => Promise.resolve('root async value'), 'd6bf9e33');

		_$_.regular_block(() => {
			_$_.output_push('<p');
			_$_.output_push(' class="root-async-value"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy.value));
			}

			_$_.output_push('</p>');
		});
	});
}

export function RootAsyncRejects() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track_async(() => Promise.reject(new Error('root async failed')), 'd2fe7b64');

		_$_.regular_block(() => {
			_$_.output_push('<p');
			_$_.output_push(' class="root-async-value"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_1.value));
			}

			_$_.output_push('</p>');
		});
	});
}

export function AsyncListInTryPending() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				_$_.output_push('<!--[-->');

				_$_.regular_block(() => {
					{
						const comp = AsyncList;
						const args = [{}];

						_$_.render_component(comp, ...args);
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
	});
}

function AsyncList() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track_async(() => Promise.resolve(['alpha', 'beta', 'gamma']), 'b3d31627');

		_$_.regular_block(() => {
			_$_.output_push('<ul');
			_$_.output_push(' class="items"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--[-->');

				for (let item of lazy_2.value) {
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
	});
}

export function AsyncTryWithLeadingSibling() {
	return _$_.tsrx_element(() => {
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

						_$_.render_component(comp, ...args);
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
	});
}

function AsyncContent() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track_async(() => Promise.resolve('ready'), '15ea8758');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="resolved"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_3.value));
			}

			_$_.output_push('</div>');
		});
	});
}