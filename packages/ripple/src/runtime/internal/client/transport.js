import * as devalue from 'devalue';
import { create_transport } from '../../transport.js';

export { set_transport as setTransport };

/** @type {ReturnType<typeof create_transport>} */
let transport;

/**
 * Register the application's transport before hydration, mounting or RPC.
 * @param {import('#public').Transport} [value]
 */
export function set_transport(value) {
	transport = create_transport(value);
}

/**
 * Encodes RPC arguments for the wire with the registered transport, if any.
 * @param {unknown} value
 * @returns {string}
 */
export function encode(value) {
	return devalue.stringify(value, transport?.reducers);
}

/**
 * Revives a devalue payload: the string form (RPC results, hydration
 * envelopes from a server without a transport), or the flattened array a
 * server with a transport embeds directly in a hydration envelope.
 * @param {string | unknown[]} payload
 * @returns {any}
 */
export function revive(payload) {
	var revivers = transport?.revivers;
	return typeof payload === 'string'
		? devalue.parse(payload, revivers)
		: devalue.unflatten(payload, revivers);
}
