import { h } from 'preact';

/**
 * @param {{ is: import('preact').ComponentType<any> | string | null | undefined | false, [key: string]: any }} props
 * @returns {import('preact').VNode | null}
 */
export function Dynamic({ is, ...props }) {
	return is ? h(is, props) : null;
}
