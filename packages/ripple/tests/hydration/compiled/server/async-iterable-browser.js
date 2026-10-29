// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Hydrate, getTrackedStatus, track, trackAsync } from 'ripple/server';
import { condition } from 'ripple/hydration';

export const _$_server_$_ = (() => {
	var _$_server_$_ = {};

	_$_server_$_.rows = async function* rows(afterId) {
		while (afterId < 400) {
			const rows = Array.from({ length: 100 }, (_, i) => ({ id: afterId + i + 1 }));

			afterId += 100;
			yield { cursor: afterId, rows };
			await new Promise((resolve) => setTimeout(resolve, 25));
		}
	};

	return _$_server_$_;
})();

const rows = function (...args) {
	return _$_server_$_.rows(...args);
};

async function* accumulate(previous) {
	const owner_3 = _$_.get_async_owner();
	let snapshot = previous ?? { cursor: 0, rows: [] };

	await Promise.resolve();

	const batches = await _$_.record_async_source(rows(snapshot.cursor), 'b2009f9a', owner_3);

	for await (const batch of batches) {
		snapshot = {
			cursor: batch.cursor,
			rows: [...snapshot.rows, ...batch.rows]
		};

		yield snapshot;
	}
}

function Rows() {
	return _$_.tsrx_element(() => {
		const result = _$_.track_async(accumulate, 'rto02u');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<input id="draft" defaultValue="server" /><p id="cursor">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(result.value.cursor);
			}

			__out += '</p><p id="status">' + _$_.escape(_$_.get_tracked_status(result).complete ? 'done' : 'open') + '</p><ul><!--[-->';

			for (const row of result.value.rows) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(row.id);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		const enabled = _$_.track(false, 'l665hp');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button>activate</button>';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: condition(() => enabled.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Rows;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			_$_.output_push(__out);
		});
	});
}