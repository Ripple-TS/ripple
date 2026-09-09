import { create_transport } from '../../transport.js';
import { set_track_async_transport } from './index.js';

export { set_transport as setTransport };

/** @type {ReturnType<typeof create_transport>} */
export let transport;

/**
 * Register the application's transport before rendering or serving RPC.
 * @param {import('#public').Transport} [value]
 */
export function set_transport(value) {
	transport = create_transport(value);
	set_track_async_transport(transport?.reducers);
}
