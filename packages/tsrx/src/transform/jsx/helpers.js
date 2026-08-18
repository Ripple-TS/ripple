/** @import * as AST from 'estree' */
/** @import * as ESRap from 'esrap' */

import tsx from 'esrap/languages/tsx';
import {
	should_preserve_comment,
	should_preserve_jsx_tooling_comment,
	is_file_level_pragma,
	format_comment,
} from '../../comment-utils.js';
import { has_location } from '../../utils/ast.js';
import { with_deferred_imports } from '../imports.js';

/**
 * Zimmerframe provides `path` as the ancestor chain. A native template node in
 * the children list of any JSX element/fragment renders as a JSX child;
 * anywhere else it renders as a standalone expression (e.g. a return value).
 * The parent may be a parsed native template node or a synthetic fragment the
 * transform built around render children — either way a bare expression in a
 * child slot would print as JSX text.
 *
 * @param {AST.Node[]} path
 * @returns {boolean}
 */
export function in_jsx_child_context(path) {
	const parent = path[path.length - 1];
	return !!parent && (parent.type === 'JSXElement' || parent.type === 'JSXFragment');
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function is_empty_jsx_fragment(node) {
	return (
		node?.type === 'JSXFragment' &&
		!(node.children || []).some(
			(child) => child && (child.type !== 'JSXText' || child.value.trim() !== ''),
		)
	);
}

/**
 * Match Ripple's transform path metadata shape: every node seen by the walker
 * carries its current ancestor path for downstream CSS pruning and mapping
 * helpers.
 *
 * @param {AST.Node} node
 * @param {AST.Node[]} path
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
 * @returns {ESRap.Visitors<AST.Node>}
 */
/**
 * @param {boolean} [boundary_tokens] Enable esrap's `boundaryTokens` anchors
 * (structural tokens carry one-character source locations). typeOnly/volar
 * prints opt in — their maps are consumed positionally by the language
 * tooling and never shipped; build prints stay sparse.
 * @param {AST.CommentWithLocation[]} [comments] Source comments. In type-only
 * output, file-wide pragmas lead the program while documentation and scoped
 * annotations stay with their declarations, members, or statements. A sparse
 * print with explicitly supplied comments retains its existing leading-pragma
 * behavior. Ordinary build callers supply no comments.
 */
export function tsx_with_ts_locations(boundary_tokens = false, comments = undefined) {
	const base = with_deferred_imports(tsx({ boundaryTokens: boundary_tokens }));
	const { _: base_visitor, ...base_visitors } = base;
	const preserve_comments = comments !== undefined;
	const preserve_owner_comments = boundary_tokens && preserve_comments;
	/** @type {Set<string> | null} */
	const emitted_comments = preserve_comments ? new Set() : null;

	/**
	 * @param {AST.CommentWithLocation} comment
	 * @param {ESRap.Context} context
	 */
	const write_preserved_comment = (comment, context) => {
		if (
			!emitted_comments ||
			!(preserve_owner_comments
				? should_preserve_jsx_tooling_comment(comment)
				: should_preserve_comment(comment))
		) {
			return;
		}
		const key = `${comment.start}:${comment.end}:${comment.type}:${comment.value}`;
		if (emitted_comments.has(key)) return;
		emitted_comments.add(key);
		if (comment.loc) context.location(comment.loc.start.line, comment.loc.start.column);
		context.write(format_comment(comment));
		if (comment.loc) context.location(comment.loc.end.line, comment.loc.end.column);
		context.newline();
	};

	/**
	 * @param {AST.Node} node
	 * @param {ESRap.Context} context
	 */
	const write_leading_comments = (node, context) => {
		if (!node.leadingComments || !is_comment_owner(node)) return;
		for (const comment of node.leadingComments) {
			if (has_location(comment)) write_preserved_comment(comment, context);
		}
	};

	const leading_preserved = (/** @type {AST.Program} */ program) => {
		if (!preserve_comments || !comments?.length) return [];
		// Injected statements (dynamic-import/try-import prepends) carry no
		// loc; anchor "leading" on the first statement that maps to source,
		// else every preserved comment in the file would hoist to the top.
		const first = program.body.find((node) => node.loc);
		return comments.filter(
			(comment) =>
				(preserve_owner_comments
					? is_file_level_pragma(comment)
					: should_preserve_comment(comment)) &&
				(first?.loc == null ||
					(comment.loc &&
						(comment.loc.end.line < first.loc.start.line ||
							(comment.loc.end.line === first.loc.start.line &&
								comment.loc.end.column <= first.loc.start.column)))),
		);
	};

	/** @type {ESRap.Visitors<AST.Node>} */
	const wrappers = {
		Program: (node, context) => {
			for (const comment of leading_preserved(node)) {
				write_preserved_comment(comment, context);
			}
			/** @type {NonNullable<typeof base.Program>} */ (base.Program)(node, context);
		},
		ArrayPattern: (node, context) => {
			/** @type {NonNullable<typeof base.ArrayPattern>} */ (base.ArrayPattern)(node, context);
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
				/** @type {NonNullable<typeof base.Property>} */ (base.Property)(node, context);
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

		// TSRX text may contain a literal `<` — one that cannot start a tag
		// (`<span><3</span>`) or a raw-text `<script>` body — but the printed TSX
		// is re-parsed by a JSX toolchain (esbuild, Babel, SWC), and JSX forbids
		// a bare `<` in text. Emit it as `&lt;`, which those parsers decode back
		// to the same string.
		JSXText: (node, context) => {
			context.write(node.value.replace(/</g, '&lt;'), node);
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
			// `declare global` is represented as a TSModuleDeclaration whose id is
			// `global`; adding `module` changes it into an unrelated named module.
			// Ambient `declare module '…' { … }` must still keep its `declare` —
			// the typeOnly/volar output is real TS and `module '…' { … }` alone is
			// a syntax error (TS1035).
			if (node.declare) context.write('declare ');
			if (node.kind === 'global') {
				context.visit(node.id);
				context.visit(node.body);
				return;
			}
			context.write(node.kind);
			context.write(' ');
			context.visit(node.id);
			context.visit(node.body);
		},
		_(node, context, visit) {
			if (preserve_owner_comments) write_leading_comments(node, context);
			const visit_with_locations = () => {
				if (
					!node.loc ||
					(!LOCATION_WRAPPED_NODE_TYPES.has(node.type) &&
						!(boundary_tokens && TOOLING_LOCATION_WRAPPED_NODE_TYPES.has(node.type)))
				) {
					visit(node);
					return;
				}
				context.location(node.loc.start.line, node.loc.start.column);
				visit(node);
				context.location(node.loc.end.line, node.loc.end.column);
			};
			if (base_visitor) {
				base_visitor(node, context, visit_with_locations);
			} else {
				visit_with_locations();
			}
		},
	};

	return { ...base_visitors, ...wrappers };
}

/**
 * A newline is safe before a statement/declaration or a member, but not before
 * an arbitrary expression: `return /** @type {number} *\/ 1` must not become a
 * bare return, and `throw` forbids a line terminator before its argument.
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_comment_owner(node) {
	return (
		node.type.endsWith('Declaration') ||
		node.type.endsWith('Statement') ||
		COMMENT_OWNER_NODE_TYPES.has(node.type)
	);
}

const COMMENT_OWNER_NODE_TYPES = new Set([
	'VariableDeclarator',
	'Property',
	'PropertyDefinition',
	'AccessorProperty',
	'MethodDefinition',
	'TSAbstractPropertyDefinition',
	'TSAbstractAccessorProperty',
	'TSAbstractMethodDefinition',
	'TSPropertySignature',
	'TSMethodSignature',
	'TSIndexSignature',
	'TSEnumMember',
	'TSExportAssignment',
]);

const TOOLING_LOCATION_WRAPPED_NODE_TYPES = new Set([
	'ExportNamedDeclaration',
	'ExportDefaultDeclaration',
	'ExportAllDeclaration',
	'TSPropertySignature',
]);

// Be careful when adding visitors that are already defined in `wrappers`.
// JSXOpeningElement is intentionally in both places: its custom printer still
// needs a location marker around the whole node.
const LOCATION_WRAPPED_NODE_TYPES = new Set([
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
]);

/**
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.JSXIfExpression | (AST.IfStatement & { statementType: 'IfStatement' })}
 */
export function is_template_if_node(node) {
	return (
		node?.type === 'JSXIfExpression' ||
		(node?.type === 'IfStatement' && node?.statementType === 'IfStatement')
	);
}

/**
 * A `@for … of …` directive, in either the expression or the retyped statement
 * form. `JSXForExpression` also covers `@for … in …` and plain `@for (;;)`, so
 * both arms must check `statementType` — callers read for-of-only fields such
 * as `await` off the result.
 *
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.JSXForOfExpression | (AST.ForOfStatement & { statementType: 'ForOfStatement' })}
 */
export function is_template_for_of_node(node) {
	return (
		(node?.type === 'JSXForExpression' || node?.type === 'ForOfStatement') &&
		node.statementType === 'ForOfStatement'
	);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.JSXSwitchExpression | (AST.SwitchStatement & { statementType: 'SwitchStatement' })}
 */
export function is_template_switch_node(node) {
	return (
		node?.type === 'JSXSwitchExpression' ||
		(node?.type === 'SwitchStatement' && node?.statementType === 'SwitchStatement')
	);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {node is AST.JSXTryExpression | (AST.TryStatement & { statementType: 'TryStatement' })}
 */
export function is_template_try_node(node) {
	return (
		node?.type === 'JSXTryExpression' ||
		(node?.type === 'TryStatement' && node?.statementType === 'TryStatement')
	);
}
