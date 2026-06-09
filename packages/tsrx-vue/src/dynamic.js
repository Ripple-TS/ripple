import { createNodes, h } from 'vue-jsx-vapor';

/**
 * @param {Record<PropertyKey, any> | null | undefined} props
 * @returns {Record<PropertyKey, any>}
 */
function omit_is(props) {
	const rest = {};
	if (!props) return rest;

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
 * @param {{ is?: any, [key: string]: any }} props
 * @param {{ slots?: any }} [context]
 * @returns {any}
 */
export function Dynamic(props, context) {
	return createNodes(() => {
		const component = props?.is;
		return component ? h(component, omit_is(props), context?.slots ?? props?.children) : null;
	});
}
