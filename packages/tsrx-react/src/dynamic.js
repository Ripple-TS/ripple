import { createElement } from 'react';

/**
 * @param {{ is: import('react').ElementType | null | undefined | false, [key: string]: any }} props
 * @returns {import('react').ReactElement | null}
 */
export function Dynamic({ is, ...props }) {
	return is ? createElement(is, props) : null;
}
