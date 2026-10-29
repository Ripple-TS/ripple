/** @import { ViewTransitionClass } from '#public' */

/** @param {unknown} name @returns {name is string} */
export function valid_name(name) {
	return (
		typeof name === 'string' &&
		/^-?[_a-zA-Z][\w-]*$/.test(name) &&
		!/^(none|auto|root|inherit|initial|unset|revert|revert-layer)$/.test(name) &&
		!name.startsWith('ripple-vt-') &&
		!name.includes('--ripple-')
	);
}

/** @param {ViewTransitionClass | undefined} value @param {readonly string[]} types @returns {string | undefined} */
export function resolve_class(value, types) {
	if (typeof value !== 'object' || value === null) return value;
	var values = types.filter((type) => Object.hasOwn(value, type)).map((type) => value[type]);
	if (values.length === 0) return value.default;
	if (values.includes('none')) return 'none';
	return values.filter((value) => value !== 'auto').join(' ') || 'auto';
}
