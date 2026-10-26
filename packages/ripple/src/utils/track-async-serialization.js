/**
 * Get the script element ID used for serializing/hydrating trackAsync results.
 * Used by both server and client runtimes.
 * @param {string} hash - The unique hash for this trackAsync call
 * @param {string} root_id - Namespace of the server render; empty for older server markup
 * @returns {string}
 */
export function get_track_async_script_id(hash, root_id) {
	return '__ripple_ta_' + (root_id === '' ? '' : root_id + '_') + hash;
}
