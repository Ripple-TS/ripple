/**
 * Framework-agnostic CSS scoping utilities shared between the `@tsrx/react`
 * and `@tsrx/solid` transforms. These walk the template AST and annotate
 * template nodes with a hash class so scope-qualified selectors (e.g.
 * `.foo.hash`) match after rendering.
 */

import { walk } from 'zimmerframe';
import * as b from '../utils/builders.js';

/**
 * Mark every selector inside the stylesheet as "used" so `renderStylesheets`
 * does not comment it out. We skip selector-pruning because component
 * boundaries can be dynamic — any selector authored inside the component's
 * `<style>` block is considered intentional.
 *
 * @param {any} stylesheet
 * @returns {any}
 */
export function prepare_stylesheet_for_render(stylesheet) {
	walk(stylesheet, null, {
		_(node, { next }) {
			if (node && node.metadata && typeof node.metadata === 'object') {
				node.metadata.used = true;
				if (node.type === 'RelativeSelector' && !node.metadata.is_global) {
					node.metadata.scoped = true;
				}
			}
			return next();
		},
	});
	return stylesheet;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_style_element(node) {
	return (
		node &&
		node.type === 'Element' &&
		node.id &&
		node.id.type === 'Identifier' &&
		node.id.name === 'style'
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_composite_element(node) {
	if (!node || node.type !== 'Element' || !node.id) {
		return false;
	}

	if (node.id.type === 'Identifier') {
		return /^[A-Z]/.test(node.id.name);
	}

	return node.id.type === 'MemberExpression';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_style_jsx_element(node) {
	const name = node?.openingElement?.name;
	return node?.type === 'JSXElement' && name?.type === 'JSXIdentifier' && name.name === 'style';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_composite_jsx_element(node) {
	const name = node?.openingElement?.name;
	if (node?.type !== 'JSXElement' || !name) {
		return false;
	}

	if (name.type === 'JSXIdentifier') {
		return /^[A-Z]/.test(name.name);
	}

	return name.type === 'JSXMemberExpression';
}

/**
 * Recursively walk `Element` nodes within a TSRX fragment and add the hash
 * class name so scope-qualified selectors (e.g. `.foo.hash`) match.
 *
 * @param {any} node
 * @param {string} hash
 * @param {'class' | 'className'} [jsx_class_attr_name='class']
 * @param {boolean} [preserve_style_elements=false]
 * @returns {any}
 */
export function annotate_with_hash(
	node,
	hash,
	jsx_class_attr_name = 'class',
	preserve_style_elements = false,
) {
	if (!node || typeof node !== 'object') return node;
	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		return node;
	}

	if (node.type === 'Element') {
		if (preserve_style_elements && is_style_element(node)) {
			node.children = [];
			return node;
		}
		if (!is_style_element(node) && !is_composite_element(node)) {
			add_hash_class(node, hash);
		}
		if (Array.isArray(node.children)) {
			node.children = node.children
				.filter((/** @type {any} */ child) => preserve_style_elements || !is_style_element(child))
				.map((/** @type {any} */ child) =>
					annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements),
				);
		}
		return node;
	}

	if (node.type === 'JSXElement') {
		if (!is_style_jsx_element(node) && !is_composite_jsx_element(node)) {
			add_hash_class_to_jsx_element(node, hash, jsx_class_attr_name);
		}
		if (Array.isArray(node.children)) {
			node.children = node.children.map((/** @type {any} */ child) =>
				annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements),
			);
		}
		return node;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata' || key === 'css') {
			continue;
		}

		const value = node[key];
		if (Array.isArray(value)) {
			node[key] = value.map((/** @type {any} */ child) =>
				annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements),
			);
		} else if (value && typeof value === 'object') {
			node[key] = annotate_with_hash(value, hash, jsx_class_attr_name, preserve_style_elements);
		}
	}

	return node;
}

/**
 * @param {any} component
 * @param {string} hash
 * @param {'class' | 'className'} [jsx_class_attr_name='class']
 * @param {boolean} [preserve_style_elements=false]
 * @returns {void}
 */
export function annotate_component_with_hash(
	component,
	hash,
	jsx_class_attr_name = 'class',
	preserve_style_elements = false,
) {
	/** @type {any[]} */
	const body = component.body;
	component.body = body
		.filter((/** @type {any} */ child) => preserve_style_elements || !is_style_element(child))
		.map((/** @type {any} */ child) =>
			annotate_with_hash(child, hash, jsx_class_attr_name, preserve_style_elements),
		);
}

/**
 * Ensure the element carries a `class` attribute containing the scoping hash.
 *
 * @param {any} element
 * @param {string} hash
 * @returns {void}
 */
export function add_hash_class(element, hash) {
	const attrs = element.attributes || (element.attributes = []);
	const existing = attrs.find(
		(/** @type {any} */ a) =>
			a.type === 'Attribute' &&
			a.name &&
			a.name.type === 'Identifier' &&
			(a.name.name === 'class' || a.name.name === 'className'),
	);

	if (!existing) {
		attrs.push({
			type: 'Attribute',
			name: b.id('class'),
			value: { type: 'Literal', value: hash, raw: JSON.stringify(hash) },
		});
		return;
	}

	const value = existing.value;
	if (!value) {
		existing.value = { type: 'Literal', value: hash, raw: JSON.stringify(hash) };
		return;
	}

	if (value.type === 'Literal' && typeof value.value === 'string') {
		const merged = `${value.value} ${hash}`;
		value.value = merged;
		value.raw = JSON.stringify(merged);
		return;
	}

	// Dynamic expression. Concatenate at runtime via template literal.
	const expression = value.type === 'JSXExpressionContainer' ? value.expression : value;
	existing.value = b.template([b.quasi('', false), b.quasi(` ${hash}`, true)], [expression]);
}

/**
 * @param {any} element
 * @param {string} hash
 * @param {'class' | 'className'} jsx_class_attr_name
 * @returns {void}
 */
function add_hash_class_to_jsx_element(element, hash, jsx_class_attr_name) {
	const attrs = element.openingElement?.attributes || (element.openingElement.attributes = []);
	const existing = attrs.find(
		(/** @type {any} */ attr) =>
			attr?.type === 'JSXAttribute' &&
			attr.name?.type === 'JSXIdentifier' &&
			(attr.name.name === 'class' || attr.name.name === 'className'),
	);

	if (!existing) {
		const hash_literal = b.literal(hash);
		/** @type {any} */ (hash_literal).raw = JSON.stringify(hash);
		attrs.push(b.jsx_attribute(b.jsx_id(jsx_class_attr_name), hash_literal));
		return;
	}

	if (existing.name.name !== jsx_class_attr_name) {
		existing.name = {
			type: 'JSXIdentifier',
			name: jsx_class_attr_name,
			metadata: {
				...(existing.name.metadata || { path: [] }),
				source_name: existing.name.name,
				source_length: existing.name.name.length,
			},
		};
	}

	const value = existing.value;
	if (!value) {
		existing.value = { type: 'Literal', value: hash, raw: JSON.stringify(hash) };
		return;
	}

	if (value.type === 'Literal' && typeof value.value === 'string') {
		const merged = `${value.value} ${hash}`;
		value.value = merged;
		value.raw = JSON.stringify(merged);
		return;
	}

	const expression = value.type === 'JSXExpressionContainer' ? value.expression : value;
	existing.value = b.jsx_expression_container(
		b.template([b.quasi('', false), b.quasi(` ${hash}`, true)], [expression]),
	);
}
