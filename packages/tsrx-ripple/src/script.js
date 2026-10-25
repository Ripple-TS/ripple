// @ts-check

/** @import * as AST from 'estree'; */

import { get_attribute_name, get_attribute_value, get_element_attributes } from './template-ast.js';

// https://mimesniff.spec.whatwg.org/#javascript-mime-type
const javascript_mime_types = new Set([
	'application/ecmascript',
	'application/javascript',
	'application/x-ecmascript',
	'application/x-javascript',
	'text/ecmascript',
	'text/javascript',
	'text/javascript1.0',
	'text/javascript1.1',
	'text/javascript1.2',
	'text/javascript1.3',
	'text/javascript1.4',
	'text/javascript1.5',
	'text/jscript',
	'text/livescript',
	'text/x-ecmascript',
	'text/x-javascript',
]);

/**
 * Whether a script has an unambiguous, statically known data MIME type.
 * Spreads and duplicate type attributes could change the effective type.
 * @param {AST.TSRXJSXElement} node
 * @returns {boolean}
 */
export function is_data_script(node) {
	let type = null;
	for (const attribute of get_element_attributes(node)) {
		if (attribute.type === 'JSXSpreadAttribute') return false;
		if (get_attribute_name(attribute).toLowerCase() !== 'type') continue;
		if (type !== null) return false;
		const value = get_attribute_value(attribute);
		if (value?.type !== 'Literal' || typeof value.value !== 'string') return false;
		type = value.value;
	}
	if (type === null) return false;

	// Require a MIME essence, excluding special script kinds such as module,
	// importmap, and speculationrules. Parameters do not change the essence.
	const essence = type.split(';', 1)[0].trim().toLowerCase();
	return (
		/^[!#$%&'*+.^_`|~0-9a-z-]+\/[!#$%&'*+.^_`|~0-9a-z-]+$/.test(essence) &&
		!javascript_mime_types.has(essence)
	);
}
