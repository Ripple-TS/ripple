import { transport, setTransport as set_state } from './transport-state.js';
import { set_track_async_transport } from './index.js';

export { set_transport as setTransport };

export { transport } from './transport-state.js';

/**
 * Register the application's transport before rendering or serving RPC.
 * @param {import('#public').Transport} [value]
 */
export function set_transport(value) {
	set_state(value);
	set_track_async_transport(transport?.reducers);
}
