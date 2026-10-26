/**
 * Creates a runtime identifier with 64 random bits, encoded in at most
 * 13 base-36 characters, using the Web Crypto API shared by server runtimes.
 * @returns {string}
 */
export function create_random_id() {
	var random = globalThis.crypto.getRandomValues(new Uint32Array(2));
	return ((BigInt(random[0]) << 32n) | BigInt(random[1])).toString(36);
}
