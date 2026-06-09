import { exclude_prop_from_object } from '@tsrx/core/runtime/language-helpers';
import { dynamic } from '@solidjs/web';

/**
 * @param {{ is: any, [key: string]: any }} props
 * @returns {any}
 */
export function Dynamic(props) {
	const Component = dynamic(() => props.is);
	return Component(exclude_prop_from_object(props, 'is'));
}
