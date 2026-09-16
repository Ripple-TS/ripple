// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { trackAsync } from 'ripple/server';

export function RootPending() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-pending">root loading...</p>';
			_$_.output_push(__out);
		});
	});
}

export function RootCatch({ error, reset }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="root-catch"><p class="root-error">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(error.message);
			}

			__out += '</p><button class="root-reset">retry</button></section>';
			_$_.output_push(__out);
		});
	});
}

export function RootThrows() {
	return _$_.tsrx_element(() => {
		throw new Error('root exploded');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p>should not render</p>';
			_$_.output_push(__out);
		});
	});
}

export function RootAsyncDirect() {
	return _$_.tsrx_element(() => {
		const value = _$_.track_async(() => Promise.resolve('root async value'), '1nl29mb');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-async-value">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function RootAsyncRejects() {
	return _$_.tsrx_element(() => {
		const value = _$_.track_async(() => Promise.reject(new Error('root async failed')), '1mjk6zo');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-async-value">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncListInTryPending() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = AsyncList;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null,
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="loading">loading...</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

function AsyncList() {
	return _$_.tsrx_element(() => {
		const items = _$_.track_async(() => Promise.resolve(['alpha', 'beta', 'gamma']), '1dw7tpj');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="items"><!--[-->';

			for (let item of items.value) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncTryWithLeadingSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="before">before</div>';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[-->';

					{
						const comp = AsyncContent;
						const args = [{}];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}

					__out += '<!--]-->';
					_$_.output_push(__out);
				},
				null,
				() => {
					let __out = '';

					__out += '<!--[--><div class="loading">loading async content</div><!--]-->';
					_$_.output_push(__out);
				}
			);

			_$_.output_push(__out);
		});
	});
}

function AsyncContent() {
	return _$_.tsrx_element(() => {
		const value = _$_.track_async(() => Promise.resolve('ready'), '62wwns');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="resolved">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}