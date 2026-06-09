import { dynamic } from '@solidjs/web';

/**
 * @param {Record<PropertyKey, any>} props
 * @returns {Record<PropertyKey, any>}
 */
function omit_is(props) {
	const rest = {};
	for (const key of Reflect.ownKeys(props)) {
		if (key === 'is') continue;
		const descriptor = Object.getOwnPropertyDescriptor(props, key);
		if (!descriptor?.enumerable) continue;
		Object.defineProperty(rest, key, {
			enumerable: true,
			get() {
				return props[key];
			},
		});
	}
	return rest;
}

/**
 * @param {{ is: any, [key: string]: any }} props
 * @returns {any}
 */
export function Dynamic(props) {
	const Component = dynamic(() => props.is);
	return Component(omit_is(props));
}
