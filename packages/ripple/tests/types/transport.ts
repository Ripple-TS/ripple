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
defineConfig({ transport: ['transport', '/src/transport.ts'] });
defineConfig({ transport: '/src/transport.ts' });
defineConfig({
	rootBoundary: { pending: '/src/Loading.tsrx', catch: ['ErrorScreen', '/src/screens.tsrx'] },
});
// @ts-expect-error The config names the transport module; the browser imports it.
defineConfig({ transport });
// @ts-expect-error The config names each root boundary component's module.
defineConfig({ rootBoundary: { pending: () => {} } });
setTransport(transport);
setServerTransport(transport);
registerTransport(transport);
setTransport();
setServerTransport({});

// @ts-expect-error Every handler needs both directions.
setTransport({ Money: { encode: () => false } });
const invalid: Transporter<Money, [number, string]> = {
	...money,
	// @ts-expect-error A decoder must accept the encoded representation.
	decode: (data: number) => new Money(data, 'USD'),
};
void invalid;
