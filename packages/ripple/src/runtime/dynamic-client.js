/** @import { Block } from '#client' */

import { composite } from './internal/client/composite.js';
import { with_block } from './internal/client/runtime.js';
import { tsrx_element } from './element.js';

/**
 * @typedef {Function | string | null | undefined | false} DynamicTarget
 * @typedef {{ is?: DynamicTarget, [key: string]: any }} DynamicProps
 */

/**
 * @param {DynamicProps} props
 * @returns {import('./element.js').TSRXElement}
 */
export function Dynamic(props) {
	return tsrx_element(
		/**
		 * @param {Node} anchor
		 * @param {Block | null} block
		 */
		(anchor, block) => {
			const render_dynamic = () =>
				composite(() => /** @type {DynamicTarget} */ (props?.is), anchor, props || {}, 'is');

			if (block !== null) {
				with_block(block, render_dynamic);
			} else {
				render_dynamic();
			}
		},
	);
}
