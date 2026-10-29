// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { getTrackedStatus, trackAsync } from 'ripple/server';

export const _$_server_$_ = (() => {
	var _$_server_$_ = {};

	_$_server_$_.rows = async function* rows(afterId) {
		for (let cursor = afterId + 100; cursor <= 200; cursor += 100) yield { cursor };
	};

	_$_server_$_.promisedRows = async function promisedRows(afterId) {
		return (async function* () {
			for (let cursor = afterId + 100; cursor <= 200; cursor += 100) yield { cursor };
		})();
	};

	_$_server_$_.mutation = async function mutation() {
		return 'ok';
	};

	return _$_server_$_;
})();

const rows = function (...args) {
	return _$_server_$_.rows(...args);
};

const promisedRows = function (...args) {
	return _$_server_$_.promisedRows(...args);
};

const mutation = function (...args) {
	return _$_server_$_.mutation(...args);
};

export function Direct() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				const result = _$_.track_async(
					(previous) => {
						const owner_4 = _$_.get_async_owner();

						return _$_.record_async_source(rows(previous?.cursor ?? 0), '7b39895b', owner_4);
					},
					'15w8o7g'
				);

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(result.value.cursor);
					}

					__out += '</p>';
					_$_.output_push(__out);
				});

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<b>' + _$_.escape(_$_.get_tracked_status(result).complete ? 'done' : 'open') + '</b>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(error) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<em>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(error.message);
					}

					__out += '</em>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<i>pending</i>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function Wrapped({ mutate = false }) {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				const result = _$_.track_async(
					(previous) => {
						const owner_5 = _$_.get_async_owner();

						return (async function* () {
							await Promise.resolve();

							if (mutate) await _$_.record_async_source(mutation(), '6cec4350', owner_5);

							const stream = await _$_.record_async_source(promisedRows(previous?.cursor ?? 0), '49767275', owner_5);

							for await (const value of stream) yield value;
						})();
					},
					'13q2xcq'
				);

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(result.value.cursor);
					}

					__out += '</p>';
					_$_.output_push(__out);
				});

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<b>' + _$_.escape(_$_.get_tracked_status(result).complete ? 'done' : 'open') + '</b>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(error) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<em>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(error.message);
					}

					__out += '</em>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<i>pending</i>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function Mutation() {
	return _$_.tsrx_element(() => {
		{
			const comp = Wrapped;
			const args = [{ mutate: true }];

			_$_.render_component(comp, ...args);
		}
	});
}