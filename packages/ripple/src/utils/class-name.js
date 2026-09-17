/**
 * clsx-style class composition, shared by the client and server renderers: a
 * string as it is, a truthy number, the truthy items of an array, the keys of
 * an object with truthy values, nested arrays flattened, everything else
 * dropped.
 * @param {any} value
 * @returns {string}
 */
export function class_name(value) {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value !== 'object' || value === null) {
		return typeof value === 'number' && value ? '' + value : '';
	}
	var str = '';
	if (Array.isArray(value)) {
		for (var i = 0; i < value.length; i++) {
			var item = value[i] && class_name(value[i]);
			if (item) str = str ? str + ' ' + item : item;
		}
	} else {
		for (var key in value) {
			if (value[key]) str = str ? str + ' ' + key : key;
		}
	}
	return str;
}
