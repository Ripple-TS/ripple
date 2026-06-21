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

			__out += '<section class="root-catch"><p class="root-error">' + _$_.escape(error.message) + '</p><button class="root-reset">retry</button></section>';
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
		let lazy = _$_.track_async(() => Promise.resolve('root async value'), 'd6bf9e33');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-async-value">' + _$_.escape(lazy.value) + '</p>';
			_$_.output_push(__out);
		});
	});
}

export function RootAsyncRejects() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track_async(() => Promise.reject(new Error('root async failed')), 'd2fe7b64');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-async-value">' + _$_.escape(lazy_1.value) + '</p>';
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
		let lazy_2 = _$_.track_async(() => Promise.resolve(['alpha', 'beta', 'gamma']), 'b3d31627');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="items"><!--[-->';

			for (let item of lazy_2.value) {
				__out += '<li>' + _$_.escape(item) + '</li>';
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
		let lazy_3 = _$_.track_async(() => Promise.resolve('ready'), '15ea8758');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="resolved">' + _$_.escape(lazy_3.value) + '</div>';
			_$_.output_push(__out);
		});
	});
}