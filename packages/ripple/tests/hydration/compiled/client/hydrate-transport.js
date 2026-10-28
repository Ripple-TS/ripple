// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('button', null, ' ');

function Child_render(__anchor, __block) {
	const money = _$_.track_async(
		async () => {
			fetches++;

			return _$_.with_scope(__block, () => new Money(12, 'USD'));
		},
		__block,
		'b2nj4m'
	);

	var button = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : button.firstChild;

		_$_.expression(expression, () => _$_.with_scope(__block, () => money.value.format()));
		_$_.hydrating && _$_.pop(button);
	}

	_$_.append(__anchor, button);
}

Child[_$_.$r] = Child_render;

import { Hydrate, trackAsync } from 'ripple';
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
	return _$_.tsrx_element(Child_render);
}

export function App() {
	var __block = _$_.scope();

	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Hydrate, __anchor, {
			when: _$_.with_scope(__block, () => interaction({ events: 'click' })),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Child, __anchor, {});
			})
		});
	});
}