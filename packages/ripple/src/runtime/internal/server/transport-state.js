import { create_transport } from '../../transport.js';

/** @type {ReturnType<typeof create_transport>} */
export let transport;

/** @param {import('#public').Transport} [value] */
export function setTransport(value) {
	transport = create_transport(value);
}
