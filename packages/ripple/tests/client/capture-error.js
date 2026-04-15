/**
 * @param {() => void} fn
 * @returns {boolean}
 */
export function did_error(fn) {
	try {
		fn();
		return false;
	} catch {
		return true;
	}
}
