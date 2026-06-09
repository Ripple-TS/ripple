import { exclude_prop_from_object } from '@tsrx/core/runtime/language-helpers';
import { createNodes, h } from 'vue-jsx-vapor';

/**
 * @param {{ is?: any, [key: string]: any }} props
 * @param {{ slots?: any }} [context]
 * @returns {any}
 */
export function Dynamic(props, context) {
	return createNodes(() => {
		const component = props?.is;
		return component
			? h(component, exclude_prop_from_object(props, 'is'), context?.slots ?? props?.children)
			: null;
	});
}
