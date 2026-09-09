import { create_transport } from '../../transport.js';

export { set_transport as setTransport };

/** @type {ReturnType<typeof create_transport>} */
export let transport;

/**
 * Register the application's transport before hydration, mounting or RPC.
 * @param {import('#public').Transport} [value]
 */
export function set_transport(value) {
	transport = create_transport(value);
}
