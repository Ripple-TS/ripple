/** @import { Transport } from '#public' */

/**
 * Build the devalue tables once at registration. An empty transport retains
 * the default serialization path, including raw JSON hydration envelopes.
 * @param {Transport | undefined} transport
 */
export function create_transport(transport) {
	const entries = Object.entries(transport ?? {});
	if (entries.length === 0) return undefined;

	/** @type {Record<string, (value: any) => any>} */
	const reducers = Object.create(null);
	/** @type {Record<string, (value: any) => any>} */
	const revivers = Object.create(null);
	for (const [name, { encode, decode }] of entries) {
		reducers[name] = encode;
		revivers[name] = decode;
	}
	return { reducers, revivers };
}
