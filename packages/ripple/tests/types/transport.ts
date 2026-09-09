import { setTransport, type Transport, type Transporter } from 'ripple';
import { setTransport as setServerTransport } from 'ripple/server';
import { setTransport as registerTransport } from 'ripple/transport';
import { defineConfig } from '@ripple-ts/vite-plugin';

class Money {
	constructor(
		public amount: number,
		public currency: string,
	) {}
}

const money: Transporter<Money, [number, string]> = {
	encode: (value) => value instanceof Money && [value.amount, value.currency],
	decode: ([amount, currency]) => new Money(amount, currency),
};
const transport: Transport = { Money: money };
defineConfig({ transport });
defineConfig({
	transport: {
		Money: {
			encode: (value) => value instanceof Money && [value.amount, value.currency],
			decode: ([amount, currency]) => new Money(amount, currency),
		},
	},
});
setTransport(transport);
setServerTransport(transport);
registerTransport(transport);
setTransport();
setServerTransport({});

// @ts-expect-error Every handler needs both directions.
defineConfig({ transport: { Money: { encode: () => false } } });
const invalid: Transporter<Money, [number, string]> = {
	...money,
	// @ts-expect-error A decoder must accept the encoded representation.
	decode: (data: number) => new Money(data, 'USD'),
};
void invalid;
