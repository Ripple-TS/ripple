/** @import { Block } from '#client' */

import { composite } from './internal/client/composite.js';
import { tsrx_element } from './element.js';

/**
 * @param {{ is?: Function | string | null | undefined | false, [key: string]: any }} props
 * @returns {import('./element.js').TSRXElement}
 */
export function Dynamic(props) {
	return tsrx_element(
		/**
		 * @param {Node} anchor
		 * @param {Block | null} block
		 */
		(anchor, block) => {
			composite(() => /** @type {any} */ (props?.is), anchor, props || {}, 'is', block);
		},
	);
}
