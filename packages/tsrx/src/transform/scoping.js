/**
 * Framework-agnostic CSS scoping utilities shared between the `@tsrx/react`
 * and `@tsrx/solid` transforms. These walk the template AST and annotate
 * `Element` nodes with a hash class so scope-qualified selectors
 * (e.g. `.foo.hash`) match after rendering.
 */

import { walk } from 'zimmerframe';

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
 * Recursively walk `Element` nodes within a component body and add the hash
 * class name so scope-qualified selectors (e.g. `.foo.hash`) match.
 *
 * @param {any} node
 * @param {string} hash
 * @returns {any}
 */
export function annotate_with_hash(node, hash) {
	if (!node || typeof node !== 'object') return node;
	if (
		node.type === 'Component' ||
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		return node;
	}

	if (node.type === 'Element') {
		if (!is_style_element(node) && !is_composite_element(node)) {
			add_hash_class(node, hash);
		}
		if (Array.isArray(node.children)) {
			node.children = node.children
				.filter((/** @type {any} */ child) => !is_style_element(child))
				.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
		}
		return node;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata' || key === 'css') {
			continue;
		}

		const value = node[key];
		if (Array.isArray(value)) {
			node[key] = value.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
		} else if (value && typeof value === 'object') {
			node[key] = annotate_with_hash(value, hash);
		}
	}

	return node;
}

/**
 * @param {any} component
 * @param {string} hash
 * @returns {void}
 */
export function annotate_component_with_hash(component, hash) {
	/** @type {any[]} */
	const body = component.body;
	component.body = body
		.filter((/** @type {any} */ child) => !is_style_element(child))
		.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
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
			name: { type: 'Identifier', name: 'class' },
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
		existing.value = { type: 'Literal', value: merged, raw: JSON.stringify(merged) };
		return;
	}

	// Dynamic expression. Concatenate at runtime via template literal.
	const expression = value.type === 'JSXExpressionContainer' ? value.expression : value;
	existing.value = {
		type: 'TemplateLiteral',
		expressions: [expression],
		quasis: [
			{
				type: 'TemplateElement',
				value: { raw: '', cooked: '' },
				tail: false,
			},
			{
				type: 'TemplateElement',
				value: { raw: ` ${hash}`, cooked: ` ${hash}` },
				tail: true,
			},
		],
	};
}
