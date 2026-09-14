import { is_void_element } from '@tsrx/core/runtime/html';
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
	output_push(spread_attrs(props));

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
 * Renders a dynamic tag (`<{tag} />`): a component function, a tag name, or
 * nothing when the tag is `null`, `undefined`, or `false`. The compiler passes
 * the tag and the element's own props separately, so the props never carry
 * the tag.
 * @param {any} tag
 * @param {Record<string, any>} props
 * @returns {void}
 */
export function dynamic_element(tag, props) {
	const component = get(tag);
	if (component == null || component === false) {
		return;
	}

	if (typeof component === 'function') {
		render_component(component, props);
	} else if (is_tsrx_element(component)) {
		throw new TypeError('Invalid component type: received a TSRXElement value.');
	} else {
		render_element(String(component), props);
	}
}
