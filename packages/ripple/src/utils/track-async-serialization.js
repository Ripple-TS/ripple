/**
 * Get the script element ID used for serializing/hydrating trackAsync results.
 * Used by both server and client runtimes.
 * @param {string} hash - The unique hash for this trackAsync call
 * @returns {string}
 */
export function get_track_async_script_id(hash) {
	return `__tsrx_ta_${hash}`;
}
