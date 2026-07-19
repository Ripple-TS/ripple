/** @import * as AST from 'estree' */
/** @import { Visitors } from 'zimmerframe' */

import tsx from 'esrap/languages/tsx';
import { should_preserve_comment, format_comment } from '../../comment-utils.js';

/**
 * Zimmerframe provides `path` as the ancestor chain. A native template node in
 * the children list of any JSX element/fragment renders as a JSX child;
 * anywhere else it renders as a standalone expression (e.g. a return value).
 * The parent may be a parsed native template node or a synthetic fragment the
 * transform built around render children — either way a bare expression in a
 * child slot would print as JSX text.
 *
 * @param {any[]} path
 * @returns {boolean}
 */
export function in_jsx_child_context(path) {
	const parent = path[path.length - 1];
	return !!parent && (parent.type === 'JSXElement' || parent.type === 'JSXFragment');
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_empty_jsx_fragment(node) {
	return (
		node?.type === 'JSXFragment' &&
		!(node.children || []).some(
			(/** @type {any} */ child) =>
				child && (child.type !== 'JSXText' || child.value.trim() !== ''),
		)
	);
}

/**
 * Match Ripple's transform path metadata shape: every node seen by the walker
 * carries its current ancestor path for downstream CSS pruning and mapping
 * helpers.
 *
 * @param {any} node
 * @param {any[]} path
 * @returns {void}
 */
export function set_node_path_metadata(node, path) {
	if (!node.metadata) {
		node.metadata = { path: [...path] };
	} else {
		node.metadata.path = [...path];
	}
}

/**
 * Wrap esrap's `tsx()` printer with location markers for the remaining nodes
 * whose spans are invisible to the source map (e.g. `class`, template-literal
 * backticks, JSX angle brackets, generic-argument delimiters). Without these
 * markers, Volar mapping collection in `segments.js` throws when looking up
 * the node's start/end positions. esrap ≥2.3.0 (keyword writes +
 * `boundaryTokens`) covers most starts, but not statement ends — see the
 * list below for what each entry still compensates.
 *
 * Shared across all JSX-producing targets (React, Preact, Solid).
 *
 * @returns {any}
 */
/**
 * @param {boolean} [boundary_tokens] Enable esrap's `boundaryTokens` anchors
 * (structural tokens carry one-character source locations). typeOnly/volar
 * prints opt in — their maps are consumed positionally by the language
 * tooling and never shipped; build prints stay sparse.
 * @param {AST.CommentWithLocation[]} [comments] Source comments; the ones
 * `should_preserve_comment` classifies as semantic-to-TS (`@ts-nocheck`,
 * `@jsxImportSource`, triple-slash references, …) and that LEAD the program
 * are re-emitted at the top of the printed output. The generated TSX is real
 * TS input — dropping a leading pragma changes how the whole file checks.
 */
export function tsx_with_ts_locations(boundary_tokens = false, comments = undefined) {
	const base = /** @type {any} */ (tsx({ boundaryTokens: boundary_tokens }));

	const leading_preserved = (/** @type {any} */ program) => {
		if (!comments?.length) return [];
		// Injected statements (dynamic-import/try-import prepends) carry no
		// loc; anchor "leading" on the first statement that maps to source,
		// else every preserved comment in the file would hoist to the top.
		const first = program.body?.find((/** @type {any} */ node) => node.loc);
		return comments.filter(
			(/** @type {any} */ comment) =>
				should_preserve_comment(comment) &&
				(first?.loc == null ||
					(comment.loc &&
						(comment.loc.end.line < first.loc.start.line ||
							(comment.loc.end.line === first.loc.start.line &&
								comment.loc.end.column <= first.loc.start.column)))),
		);
	};

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
		Program: (node, context) => {
			for (const comment of leading_preserved(node)) {
				if (comment.loc) context.location(comment.loc.start.line, comment.loc.start.column);
				context.write(format_comment(comment));
				if (comment.loc) context.location(comment.loc.end.line, comment.loc.end.column);
				context.newline();
			}
			base.Program(node, context);
		},
		ArrayPattern: (node, context) => {
			base.ArrayPattern(node, context);
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
		// esrap's TSExpressionWithTypeArguments printer only emits `expression`,
		// dropping interface heritage arguments such as the `<T>` in
		// `interface Foo<T> extends Bar<T> {}`. Besides changing the declaration's
		// semantics, that leaves segments.js unable to map the omitted node.
		TSExpressionWithTypeArguments: (node, context) => {
			context.visit(node.expression);
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
		},
		TSModuleDeclaration: (node, context) => {
			// Ambient `declare module '…' { … }` must keep its `declare` — the
			// typeOnly/volar output is real TS and `module '…' { … }` alone is a
			// syntax error (TS1035). Non-ambient `module name { }` blocks have no
			// `declare` and print unchanged.
			if (node.declare) context.write('declare ');
			context.write(node.metadata?.module_keyword ?? 'module');
			context.write(' ');
			context.visit(node.id);
			context.visit(node.body);
		},
	};

	// Be careful when duplicating visitors that are already defined
	// above in the `wrappers`
	// if there is already a visitor but you still need a mapping
	// on the whole node, only then duplicate it here
	// e.g. JSXOpeningElement is such a case
	for (const type of [
		// JS nodes with boundary positions esrap still cannot map. Keyword
		// writes (if/new/return/for/switch/await) and `boundaryTokens`
		// anchors (brackets, braces, parens, computed/call closers) cover
		// many STARTS, but statement ENDS land on unanchored characters
		// (`;`, a block's `}`), `class` is not a keyword-write, template
		// literals' backticks carry no location, and an arrow's span can
		// start at a bare `(` — so these node-level markers remain the
		// source of both boundaries until esrap can anchor them.
		'ClassDeclaration',
		'ClassExpression',
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
		'ArrowFunctionExpression',
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

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_template_if_node(node) {
	return (
		node?.type === 'JSXIfExpression' ||
		(node?.type === 'IfStatement' && node?.statementType === 'IfStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_template_for_of_node(node) {
	return (
		node?.type === 'JSXForExpression' ||
		(node?.type === 'ForOfStatement' && node?.statementType === 'ForOfStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_template_switch_node(node) {
	return (
		node?.type === 'JSXSwitchExpression' ||
		(node?.type === 'SwitchStatement' && node?.statementType === 'SwitchStatement')
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function is_template_try_node(node) {
	return (
		node?.type === 'JSXTryExpression' ||
		(node?.type === 'TryStatement' && node?.statementType === 'TryStatement')
	);
}
