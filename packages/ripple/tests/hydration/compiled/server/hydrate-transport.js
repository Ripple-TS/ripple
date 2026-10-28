// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Hydrate, trackAsync } from 'ripple/server';
import { interaction } from 'ripple/hydration';
import { Money } from '../fixtures/money.js';

export let fetches = 0;

export const transport = {
	Money: {
		encode: (value) => value instanceof Money && [value.amount, value.currency],
		decode: ([amount, currency]) => new Money(amount, currency)
	}
};

function Child() {
	return _$_.tsrx_element(() => {
		const money = _$_.track_async(
			async () => {
				fetches++;

				return new Money(12, 'USD');
			},
			'b2nj4m'
		);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(money.value.format());
			}

			__out += '</button>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		{
			const comp = Hydrate;

			const args = [
				{
					when: interaction({ events: 'click' }),
					children: _$_.tsrx_element(() => {
						return _$_.tsrx_element(() => {
							{
								const comp = Child;
								const args = [{}];

								_$_.render_component(comp, ...args);
							}
						});
					})
				}
			];

			_$_.render_component(comp, ...args);
		}
	});
}