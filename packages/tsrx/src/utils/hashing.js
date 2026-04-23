import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

const regex_return_characters = /\r/g;

/**
 * Fast non-cryptographic string hash (djb2, base36).
 *
 * Cheap and small, producing 4–7 chars — good for high-volume identifiers like
 * CSS class-name prefixes where the output multiplies across every scoped rule
 * and DOM reference in the shipped bundle. Trivially reversible for short
 * inputs, so never use this for hashes derived from server-only data that
 * ships to the client (absolute file paths, function ids, etc.) — use
 * {@link strong_hash} for those.
 * @param {string} str
 * @returns {string}
 */
export function simple_hash(str) {
	str = str.replace(regex_return_characters, '');
	let hash = 5381;
	let i = str.length;

	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return (hash >>> 0).toString(36);
}

/**
 * Cryptographic string hash — 8-char hex SHA-256 prefix.
 *
 * We use a pure-JS SHA-256 so this runs in browser workers (e.g. Monaco)
 * without a `node:crypto` dependency.
 *
 * SHA-256 is pre-image-resistant, so a hash emitted into a client bundle (e.g.
 * an RPC id derived from an absolute server-file path) can't be inverted to
 * recover the original path. An attacker with a list of candidate paths could
 * still confirm a guess by rehashing — the 8-char truncation keeps these ids
 * short and is fine for identification, not for authentication.
 * @param {string} str
 * @returns {string}
 */
export function strong_hash(str) {
	return bytesToHex(sha256(utf8ToBytes(str.replace(regex_return_characters, '')))).slice(0, 8);
}
