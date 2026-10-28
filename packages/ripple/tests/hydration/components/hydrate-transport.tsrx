import { Hydrate, trackAsync } from 'ripple';
import { interaction } from 'ripple/hydration';
import { Money } from '../fixtures/money.js';

export let fetches = 0;
export const transport = {
	Money: {
		encode: (value: unknown) => value instanceof Money && [value.amount, value.currency],
		decode: ([amount, currency]: [number, string]) => new Money(amount, currency),
	},
};
function Child() @{
	const money = trackAsync(async () => {
		fetches++;
		return new Money(12, 'USD');
	});
	<button>{money.value.format()}</button>
}
export function App() {
	return <Hydrate when={interaction({ events: 'click' })}>
		<Child />
	</Hydrate>;
}
