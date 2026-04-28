import { Fragment } from './vue-runtime-shim.js';
import { h } from './vue-jsx-vapor-shim.js';

/**
 * @param {any} type
 * @param {{ children?: any, 'v-slots'?: any, key?: any }} props
 * @param {any} key
 * @returns {any}
 */
function jsx(type, props, key) {
	const { children, 'v-slots': vSlots } = props;
	delete props.children;
	delete props['v-slots'];
	if (arguments.length > 2) props.key = key;
	return h(type, props, vSlots || children);
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
