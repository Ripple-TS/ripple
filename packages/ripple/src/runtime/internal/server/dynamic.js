import { is_void_element } from '@tsrx/core/runtime/html';
import { exclude_prop_from_object } from '@tsrx/core/runtime/language-helpers';
import {
	escape,
	get,
	is_tsrx_element,
	output_push,
	render_component,
	render_tsrx_element,
	spread_attrs,
	spread_inner_html,
} from './index.js';
import { tsrx_element } from '../../element.js';

/**
 * @param {any} value
 * @returns {void}
 */
function render_child(value) {
	value = get(value);

	if (is_tsrx_element(value)) {
		render_tsrx_element(value);
	} else if (Array.isArray(value)) {
		for (const item of value) {
			render_child(item);
		}
	} else if (value != null) {
		output_push(escape(value));
	}
}

/**
 * @param {string} tag
 * @param {Record<string, any>} props
 * @returns {void}
 */
function render_element(tag, props) {
	output_push(`<${tag}`);
	output_push(spread_attrs(props, undefined, 'is'));

	if (is_void_element(tag)) {
		output_push(' />');
		return;
	}

	output_push('>');

	const inner_html = spread_inner_html(props);
	if (inner_html !== undefined) {
		output_push(inner_html);
	} else {
		render_child(props.children);
	}

	output_push(`</${tag}>`);
}

/**
 * @param {{ is?: Function | string | null | undefined | false, [key: string]: any }} props
 * @returns {import('../../element.js').TSRXElement}
 */
export function dynamic_element(props) {
	return tsrx_element(() => {
		const component = get(props?.is);
		if (component == null || component === false) {
			return;
		}

		const dynamic_props = props || {};

		if (typeof component === 'function') {
			render_component(component, exclude_prop_from_object(dynamic_props, 'is'));
		} else if (is_tsrx_element(component)) {
			throw new TypeError('Invalid component type: received a TSRXElement value.');
		} else {
			render_element(String(component), dynamic_props);
		}
	});
}
