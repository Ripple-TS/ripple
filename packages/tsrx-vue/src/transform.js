/** @import { JsxPlatform } from '@tsrx/core/types' */

import {
	builders,
	clone_identifier,
	componentToFunctionDeclaration,
	createJsxTransform,
	create_compile_error,
	identifier_to_jsx_name,
	setLocation,
} from '@tsrx/core';

/**
 * Minimal Vue platform descriptor consumed by `createJsxTransform`.
 *
 * Vue largely reuses the shared JSX lowering while wrapping compiled
 * components in `defineVaporComponent(...)` and handling its extra imports.
 * Async component bodies still stay explicitly unsupported.
 *
 * @type {JsxPlatform}
 */
const vue_platform = {
	name: 'Vue',
	imports: {
		suspense: 'vue',
		errorBoundary: '@tsrx/vue/error-boundary',
	},
	jsx: {
		rewriteClassAttr: false,
		acceptedTsxKinds: ['vue'],
	},
	validation: {
		requireUseServerForAwait: true,
		scanUseServerDirectiveForAwaitWithCustomValidator: false,
		unsupportedTryPendingMessage:
			'Vue TSRX does not support `pending` blocks in component templates yet. Vue Suspense uses fallback slots rather than a `fallback` prop, so `try { ... } pending { ... }` cannot be lowered correctly for this target yet.',
	},
	hooks: {
		initialState: () => ({
			needs_define_vapor_component: false,
		}),
		canHoistStaticNode(node) {
			return !contains_component_jsx(node);
		},
		preprocessElementAttributes(attrs, ctx, element) {
			return preprocess_ref_attributes(attrs, element, ctx);
		},
		transformElementChildren(node, walked_children, raw_children, attributes) {
			return rewrite_host_text_or_html_children(node, walked_children, raw_children, attributes);
		},
		validateComponentAwait(await_expression) {
			throw create_compile_error(
				await_expression,
				'`await` is not yet supported in Vue TSRX components.',
			);
		},
		componentToFunction(component, ctx, helper_state) {
			ctx.needs_define_vapor_component = true;
			return component_to_vapor_component_declaration(component, ctx, helper_state);
		},
		injectImports(program, ctx) {
			inject_vue_imports(program, ctx);
		},
	},
};

export const transform = createJsxTransform(vue_platform);

/**
 * @param {any} component
 * @param {any} transform_context
 * @param {any} helper_state
 * @returns {any}
 */
function component_to_vapor_component_declaration(component, transform_context, helper_state) {
	const fn = componentToFunctionDeclaration(component, transform_context, helper_state);
	const meta = fn.metadata || { path: [] };
	const generated_helpers = helper_state?.helpers || [];
	const generated_statics = helper_state?.statics || [];
	const call = setLocation(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'Identifier',
				name: 'defineVaporComponent',
				metadata: { path: [] },
			},
			arguments: [function_declaration_to_expression(fn)],
			optional: false,
			metadata: {
				path: [],
				generated_helpers,
				generated_statics,
			},
		}),
		component,
	);

	if (component.default || !component.id) {
		return call;
	}

	return setLocation(
		/** @type {any} */ ({
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: clone_identifier(component.id),
					init: call,
					metadata: { path: [] },
				},
			],
			metadata: {
				path: [],
				generated_helpers,
				generated_statics,
			},
		}),
		component,
	);
}

/**
 * @param {any} fn
 * @returns {any}
 */
function function_declaration_to_expression(fn) {
	return {
		...fn,
		type: 'FunctionExpression',
		metadata: {
			...(fn.metadata || {}),
			path: fn.metadata?.path || [],
		},
	};
}

/**
 * @param {any} node
 * @param {string} feature
 * @returns {Error}
 */
function unsupported_vue_feature(node, feature) {
	return create_compile_error(node, `${feature} are not yet supported in Vue TSRX.`);
}

/**
 * @param {any[]} attrs
 * @param {any} element
 * @param {any} transform_context
 * @returns {any[]}
 */
function preprocess_ref_attributes(attrs, element, transform_context) {
	/** @type {any[]} */
	const result = [];
	/** @type {any[]} */
	const ref_attrs = [];

	for (const attr of attrs) {
		if (!attr) continue;
		if (attr.type === 'RefAttribute') {
			ref_attrs.push(attr);
			continue;
		}
		result.push(attr);
	}

	if (ref_attrs.length > 0 && is_component_like_element(element)) {
		throw create_compile_error(
			ref_attrs[0],
			'`{ref ...}` on the Vue target is only supported on host elements. Vue component refs resolve to component instances rather than the rendered DOM node, so Ripple-style component refs are not supported here.',
		);
	}

	if (ref_attrs.length === 1) {
		result.push(ref_attrs[0]);
	} else if (ref_attrs.length > 1) {
		result.push({
			type: 'RefAttribute',
			argument: create_combined_ref_callback(ref_attrs),
			loc: ref_attrs[0].loc,
			metadata: { path: [] },
		});
	}

	return result;
}

/**
 * @param {any[]} ref_attrs
 * @returns {any}
 */
function create_combined_ref_callback(ref_attrs) {
	const node_id = {
		type: 'Identifier',
		name: 'node',
		metadata: { path: [] },
	};

	return {
		type: 'ArrowFunctionExpression',
		params: [node_id],
		body: {
			type: 'BlockStatement',
			body: ref_attrs.map((attr) => ({
				type: 'ExpressionStatement',
				expression: {
					type: 'CallExpression',
					callee: attr.argument,
					arguments: [clone_identifier(node_id)],
					optional: false,
					metadata: { path: [] },
				},
				metadata: { path: [] },
			})),
			metadata: { path: [] },
		},
		expression: false,
		async: false,
		generator: false,
		metadata: { path: [] },
	};
}

/**
 * @param {any} node
 * @param {any[]} walked_children
 * @param {any[]} raw_children
 * @param {any[]} attributes
 * @returns {{ children: any[]; selfClosing?: boolean } | null}
 */
function rewrite_host_text_or_html_children(node, walked_children, raw_children, attributes) {
	const source_children = raw_children || walked_children;
	const is_composite = is_component_like_element(node);
	const html_children = source_children.filter((child) => child?.type === 'Html');

	if (html_children.length > 0) {
		if (
			is_composite ||
			source_children.length !== 1 ||
			has_dom_content_attribute(attributes, 'innerHTML') ||
			has_dom_content_attribute(attributes, 'textContent')
		) {
			throw create_compile_error(
				html_children[0],
				'`{html ...}` on the Vue target is only supported as the sole child of a host element. Use `innerHTML={...}` as an element attribute when you need the explicit prop form.',
			);
		}

		const walked_html = walked_children[0] || html_children[0];
		attributes.push(
			create_jsx_attribute(
				'innerHTML',
				to_jsx_expression_container(walked_html.expression, html_children[0]),
				html_children[0],
			),
		);

		return { children: [], selfClosing: true };
	}

	if (!is_composite && source_children.length === 1 && source_children[0]?.type === 'Text') {
		return null;
	}

	return null;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_component_like_element(node) {
	const id = node?.id;
	if (!id) return false;
	if (id.type === 'Identifier') return /^[A-Z]/.test(id.name);
	if (id.type === 'MemberExpression') return true;
	return false;
}

/**
 * @param {any[]} attributes
 * @param {string} name
 * @returns {boolean}
 */
function has_dom_content_attribute(attributes, name) {
	return attributes.some(
		(/** @type {any} */ attribute) =>
			attribute &&
			(attribute.type === 'JSXSpreadAttribute' ||
				(attribute.type === 'JSXAttribute' &&
					attribute.name?.type === 'JSXIdentifier' &&
					attribute.name.name === name)),
	);
}

/**
 * @param {string} name
 * @param {any} value
 * @param {any} source_node
 * @returns {any}
 */
function create_jsx_attribute(name, value, source_node) {
	return setLocation(
		/** @type {any} */ ({
			type: 'JSXAttribute',
			name: identifier_to_jsx_name(builders.id(name)),
			value,
			shorthand: false,
			metadata: { path: [] },
		}),
		source_node,
	);
}

/**
 * @param {any} expression
 * @param {any} source_node
 * @returns {any}
 */
function to_jsx_expression_container(expression, source_node = expression) {
	void source_node;
	return {
		type: 'JSXExpressionContainer',
		expression,
		metadata: { path: [] },
	};
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function contains_component_jsx(node) {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'JSXElement') {
		if (is_component_jsx_name(node.openingElement?.name)) {
			return true;
		}

		return node.children.some(contains_component_jsx);
	}

	if (node.type === 'JSXFragment') {
		return node.children.some(contains_component_jsx);
	}

	if (node.type === 'JSXExpressionContainer') {
		return contains_component_jsx(node.expression);
	}

	if (Array.isArray(node)) {
		return node.some(contains_component_jsx);
	}

	return false;
}

/**
 * @param {any} name
 * @returns {boolean}
 */
function is_component_jsx_name(name) {
	if (!name || typeof name !== 'object') {
		return false;
	}

	if (name.type === 'JSXIdentifier') {
		const first = name.name?.[0];
		return first != null && first >= 'A' && first <= 'Z';
	}

	if (name.type === 'JSXMemberExpression') {
		return true;
	}

	return false;
}

/**
 * @param {import('estree').Program} program
 * @param {any} transform_context
 * @returns {void}
 */
function inject_vue_imports(program, transform_context) {
	if (transform_context.needs_define_vapor_component) {
		ensure_named_import(program, 'vue-jsx-vapor', 'defineVaporComponent');
	}

	if (transform_context.needs_suspense) {
		ensure_named_import(program, 'vue', 'Suspense');
	}

	if (transform_context.needs_error_boundary) {
		ensure_named_import(program, '@tsrx/vue/error-boundary', 'TsrxErrorBoundary');
	}
}

/**
 * @param {import('estree').Program} program
 * @param {string} source
 * @param {string} name
 * @returns {void}
 */
function ensure_named_import(program, source, name) {
	for (const statement of program.body) {
		if (statement.type !== 'ImportDeclaration' || statement.source?.value !== source) {
			continue;
		}

		const has_specifier = statement.specifiers.some(
			(/** @type {any} */ specifier) =>
				specifier.type === 'ImportSpecifier' &&
				specifier.imported?.type === 'Identifier' &&
				specifier.imported.name === name,
		);

		if (!has_specifier) {
			statement.specifiers.push(create_import_specifier(name));
		}

		return;
	}

	program.body.unshift(create_import_declaration(source, [create_import_specifier(name)]));
}

/**
 * @param {string} name
 * @returns {any}
 */
function create_import_specifier(name) {
	return {
		type: 'ImportSpecifier',
		imported: builders.id(name),
		local: builders.id(name),
		importKind: 'value',
		metadata: { path: [] },
	};
}

/**
 * @param {string} source
 * @param {any[]} specifiers
 * @returns {any}
 */
function create_import_declaration(source, specifiers) {
	return {
		type: 'ImportDeclaration',
		attributes: [],
		specifiers,
		importKind: 'value',
		source: builders.literal(source),
		metadata: { path: [] },
	};
}
