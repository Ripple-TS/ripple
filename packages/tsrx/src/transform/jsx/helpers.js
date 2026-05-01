/** @import * as AST from 'estree' */
/** @import { Visitors } from 'zimmerframe' */

import tsx from 'esrap/languages/tsx';

/**
 * Zimmerframe provides `path` as the ancestor chain (in original pre-transform
 * types, since visitors run bottom-up). A Tsx node whose parent is a ripple
 * `Element` will render as a JSX child of that element; anywhere else it
 * renders as a standalone expression (e.g. a return value).
 *
 * @param {any[]} path
 * @returns {boolean}
 */
export function in_jsx_child_context(path) {
	const parent = path[path.length - 1];
	return !!parent && parent.type === 'Element';
}

/**
 * Flatten a `<tsx>` / fragment node's children into a single expression. In a
 * JSX-child position, a JSXExpressionContainer `{expr}` is valid and must stay
 * wrapped. In an expression position (e.g. `return ...`), `{expr}` parses as
 * a block/object literal, so unwrap to `expr`.
 *
 * @param {any} node
 * @param {boolean} [in_jsx_child]
 * @returns {any}
 */
export function tsx_node_to_jsx_expression(node, in_jsx_child = false) {
	const children = (node.children || []).filter(
		(/** @type {any} */ child) => child.type !== 'JSXText' || child.value.trim() !== '',
	);

	if (children.length === 1 && children[0].type !== 'JSXText') {
		const only = children[0];
		if (only.type === 'JSXExpressionContainer' && !in_jsx_child) {
			return only.expression;
		}
		return only;
	}

	return /** @type {any} */ ({
		type: 'JSXFragment',
		openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
		closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
		children,
		metadata: { path: [] },
	});
}

/**
 * Default `node.metadata` to `{ path: [] }` if missing, then continue the
 * walk. Use as the `FunctionDeclaration` / `FunctionExpression` /
 * `ArrowFunctionExpression` visitor in a zimmerframe walk so that downstream
 * consumers (e.g. `segments.js` reading `node.value.metadata.is_component`
 * on class methods) don't trip on an undefined metadata object.
 *
 * Ripple's analyze phase does this via `visit_function`; the tsrx-* targets
 * have no analyze phase, so we default metadata during the main walk.
 *
 * @param {any} node
 * @param {{ next: () => any }} ctx
 */
export function ensure_function_metadata(node, { next }) {
	if (!node.metadata) {
		node.metadata = { path: [] };
	}
	return next();
}

/**
 * Wrap esrap's `tsx()` printer with location markers for nodes whose spans
 * (e.g. the leading `new ` of a NewExpression or the angle-bracket delimiters
 * around generic arguments) are otherwise invisible to the source map.
 * Without these markers, Volar mapping collection in `segments.js` throws
 * when looking up the node's start/end positions.
 *
 * Shared across all JSX-producing targets (React, Preact, Solid).
 *
 * @returns {any}
 */
export function tsx_with_ts_locations() {
	const base = /** @type {any} */ (tsx());

	/**
	 * @param {any} node
	 * @param {any} context
	 * @param {any} visitor
	 */
	const wrap_with_locations = (node, context, visitor) => {
		if (!node.loc) {
			visitor(node, context);
			return;
		}
		context.location(node.loc.start.line, node.loc.start.column);
		visitor(node, context);
		context.location(node.loc.end.line, node.loc.end.column);
	};

	/** @type {Record<string, (node: any, context: any) => void>} */
	const wrappers = {
		ArrayPattern: (node, context) => {
			base.ArrayPattern(node, context);
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
		},
		Identifier: (node, context) => {
			context.write(node.name, node);
			if (node.optional) {
				context.write('?');
			}
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
		},
		TSNamedTupleMember: (node, context) => {
			context.visit(node.label);
			if (node.optional) {
				context.write('?');
			}
			context.write(': ');
			context.visit(node.elementType);
		},
		// esrap's Property printer for method shorthand (`{ foo<T>() {} }`)
		// does not visit `value.typeParameters`, so the `<T>` is dropped from
		// the output and segments.js can't resolve the TSTypeParameterDeclaration's
		// source position. Override only the actual method-shorthand branch —
		// `{ foo: function() {} }` (`node.method === false`) and getters/setters
		// must fall through to base.Property to preserve their printed form.
		Property: (node, context) => {
			if (!node.method || node.value.type !== 'FunctionExpression') {
				base.Property(node, context);
				return;
			}
			const value = node.value;
			if (value.async) context.write('async ');
			if (value.generator) context.write('*');
			if (node.computed) context.write('[');
			context.visit(node.key);
			if (node.computed) context.write(']');
			if (value.typeParameters) {
				context.visit(value.typeParameters);
			}
			context.write('(');
			for (let i = 0; i < value.params.length; i++) {
				if (i > 0) context.write(', ');
				context.visit(value.params[i]);
			}
			context.write(')');
			if (value.returnType) context.visit(value.returnType);
			context.write(' ');
			context.visit(value.body);
		},
		// esrap's ArrowFunctionExpression printer ignores `typeParameters` and
		// `returnType`, so an annotated arrow like `(): Record<...> => ...`
		// prints as `() => ...` and segments.js can't resolve the return-type
		// nodes' positions in the generated output.
		ArrowFunctionExpression: (node, context) => {
			if (node.async) context.write('async ');
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
			context.write('(');
			for (let i = 0; i < node.params.length; i++) {
				if (i > 0) context.write(', ');
				context.visit(node.params[i]);
			}
			context.write(')');
			if (node.returnType) {
				context.visit(node.returnType);
			}
			context.write(' => ');
			const body = node.body;
			const wrap_body =
				body.type === 'ObjectExpression' ||
				(body.type === 'AssignmentExpression' && body.left.type === 'ObjectPattern') ||
				(body.type === 'LogicalExpression' && body.left.type === 'ObjectExpression') ||
				(body.type === 'ConditionalExpression' && body.test.type === 'ObjectExpression');
			if (wrap_body) {
				context.write('(');
				context.visit(body);
				context.write(')');
			} else {
				context.visit(body);
			}
		},

		// esrap's JSXOpeningElement printer doesn't emit `typeArguments`, so generic
		// component tags like `<RenderProp<User>>` lose the `<User>` in the output.
		JSXOpeningElement: (node, context) => {
			context.write('<');
			context.visit(node.name);
			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}
			for (const attribute of node.attributes) {
				context.write(' ');
				context.visit(attribute);
			}
			if (node.selfClosing) {
				context.write(' /');
			}
			context.write('>');
		},
	};

	// Be careful when duplicating visitors that are already defined
	// above in the `wrappers`
	// if there is already a visitor but you still need a mapping
	// on the whole node, only then duplicate it here
	// e.g. JSXOpeningElement is such a case
	for (const type of [
		// JS nodes whose esrap printer emits no location marker, causing
		// segments.js get_mapping_from_node() to throw when it asks for the
		// generated position of the node's start (or end).
		'IfStatement',
		'NewExpression',
		'MemberExpression',
		'ObjectExpression',
		'ReturnStatement',
		'ForStatement',
		'ForInStatement',
		'ForOfStatement',
		'TemplateLiteral',
		'AwaitExpression',
		'SwitchStatement',
		'TaggedTemplateExpression',
		// JSX wrapper nodes: esrap writes `<`, `>`, `</`, `{`, `}` without
		// locations, so the opening/closing element's and expression
		// container's start and end don't resolve.
		'JSXOpeningElement',
		'JSXClosingElement',
		'JSXExpressionContainer',
		// TS wrapper nodes with the same issue.
		'TSTypeParameterInstantiation',
		'TSTypeParameterDeclaration',
		'TSTypeParameter',
	]) {
		const visitor = wrappers[type];

		wrappers[type] = (node, context) => wrap_with_locations(node, context, visitor ?? base[type]);
	}

	return { ...base, ...wrappers };
}
