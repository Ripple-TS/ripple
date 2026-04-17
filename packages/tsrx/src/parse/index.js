/**
@import * as AST from 'estree'
@import * as ESTreeJSX from 'estree-jsx'
@import { Parse } from '../../types/parse'
 */

import * as acorn from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';
import { walk } from 'zimmerframe';

/**
 * @typedef {(BaseParser: typeof acorn.Parser) => typeof acorn.Parser} AcornPlugin
 */

/** @type {Parse.BindingType} */
export const BINDING_TYPES = {
	BIND_NONE: 0, // Not a binding
	BIND_VAR: 1, // Var-style binding
	BIND_LEXICAL: 2, // Let- or const-style binding
	BIND_FUNCTION: 3, // Function declaration
	BIND_SIMPLE_CATCH: 4, // Simple (identifier pattern) catch binding
	BIND_OUTSIDE: 5, // Special case for function names as bound inside the function
};

/**
 * @this {Parse.DestructuringErrors}
 * @returns {Parse.DestructuringErrors}
 */
export function DestructuringErrors() {
	if (!(this instanceof DestructuringErrors)) {
		throw new TypeError("'DestructuringErrors' must be invoked with 'new'");
	}
	this.shorthandAssign = -1;
	this.trailingComma = -1;
	this.parenthesizedAssign = -1;
	this.parenthesizedBind = -1;
	this.doubleProto = -1;
	return this;
}

/**
 * Convert JSX node types to regular JavaScript node types
 * @param {ESTreeJSX.JSXIdentifier | ESTreeJSX.JSXMemberExpression | AST.Node} node - The JSX node to convert
 * @returns {AST.Identifier | AST.MemberExpression | AST.Node} The converted node
 */
export function convert_from_jsx(node) {
	/** @type {AST.Identifier | AST.MemberExpression | AST.Node} */
	let converted_node;
	if (node.type === 'JSXIdentifier') {
		converted_node = /** @type {AST.Identifier} */ (/** @type {unknown} */ (node));
		converted_node.type = 'Identifier';
	} else if (node.type === 'JSXMemberExpression') {
		converted_node = /** @type {AST.MemberExpression} */ (/** @type {unknown} */ (node));
		converted_node.type = 'MemberExpression';
		converted_node.object = /** @type {AST.Identifier | AST.MemberExpression} */ (
			convert_from_jsx(converted_node.object)
		);
		converted_node.property = /** @type {AST.Identifier} */ (
			convert_from_jsx(converted_node.property)
		);
	} else {
		converted_node = node;
	}
	return converted_node;
}

const regex_whitespace_only = /\s/;

/**
 * Skip whitespace characters without skipping comments.
 * This is needed because Acorn's skipSpace() also skips comments, which breaks
 * parsing in certain contexts. Updates parser position and line tracking.
 * @param {Parse.Parser} parser
 */
export function skipWhitespace(parser) {
	const originalStart = parser.start;
	/** @type {acorn.Position | undefined} */
	let lineInfo;
	while (
		parser.start < parser.input.length &&
		regex_whitespace_only.test(parser.input[parser.start])
	) {
		parser.start++;
	}
	// Update line tracking if whitespace was skipped
	if (parser.start !== originalStart) {
		lineInfo = acorn.getLineInfo(parser.input, parser.start);
		if (parser.pos <= parser.start) {
			parser.curLine = lineInfo.line;
			parser.lineStart = parser.start - lineInfo.column;
		}
	}

	parser.startLoc = lineInfo || acorn.getLineInfo(parser.input, parser.start);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
export function isWhitespaceTextNode(node) {
	if (!node || node.type !== 'Text') {
		return false;
	}

	const expr = node.expression;
	if (expr && expr.type === 'Literal' && typeof expr.value === 'string') {
		return /^\s*$/.test(expr.value);
	}
	return false;
}

/**
 * Create a parser by composing Acorn with TypeScript/JSX support and optional framework plugins.
 *
 * This is the core factory for building tsrx-based parsers. Framework plugins (like RipplePlugin)
 * extend the base parser with framework-specific syntax.
 *
 * @param {...(AcornPlugin | Function)} plugins - Framework parser plugins to compose
 * @returns {(source: string, filename?: string, options?: any) => AST.Program} A parse function
 */
export function createParser(...plugins) {
	const parser = /** @type {Parse.ParserConstructor} */ (
		/** @type {unknown} */ (
			acorn.Parser.extend(
				tsPlugin({ jsx: true }),
				...plugins.map((p) => /** @type {AcornPlugin} */ (/** @type {unknown} */ (p))),
			)
		)
	);

	/**
	 * @param {string} source
	 * @param {string} [filename]
	 * @param {any} [options]
	 * @returns {AST.Program}
	 */
	return function parse(source, filename, options) {
		/** @type {AST.CommentWithLocation[]} */
		const comments = [];
		const output_comments = options?.comments;

		const { onComment, add_comments } = get_comment_handlers(source, comments);
		/** @type {AST.Program} */
		let ast;

		try {
			ast = parser.parse(source, {
				sourceType: 'module',
				ecmaVersion: 13,
				allowReturnOutsideFunction: true,
				locations: true,
				onComment,
				rippleOptions: {
					filename,
					errors: options?.errors ?? [],
					loose: options?.loose || false,
				},
			});
		} catch (e) {
			throw e;
		}

		if (output_comments) {
			for (let i = 0; i < comments.length; i++) {
				output_comments.push(comments[i]);
			}
		}

		add_comments(ast);

		return ast;
	};
}

/**
 * Create comment handlers for tracking and attaching comments to AST nodes.
 * Used by parse functions to collect and attach comments during parsing.
 * @param {string} source - The source code being parsed
 * @param {AST.CommentWithLocation[]} comments - Array to collect comments into
 * @param {number} [index=0] - Starting index for comment filtering
 * @returns {{ onComment: Parse.Options['onComment'], add_comments: (ast: AST.Node | AST.CSS.StyleSheet) => void }}
 */
export function get_comment_handlers(source, comments, index = 0) {
	/**
	 * @param {string} text
	 * @param {number} startIndex
	 * @returns {string | null}
	 */
	function getNextNonWhitespaceCharacter(text, startIndex) {
		for (let i = startIndex; i < text.length; i++) {
			const char = text[i];
			if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
				return char;
			}
		}
		return null;
	}

	return {
		/**
		 * @type {Parse.Options['onComment']}
		 */
		onComment: (block, value, start, end, start_loc, end_loc, metadata) => {
			if (block && /\n/.test(value)) {
				let a = start;
				while (a > 0 && source[a - 1] !== '\n') a -= 1;

				let b = a;
				while (/[ \t]/.test(source[b])) b += 1;

				const indentation = source.slice(a, b);
				value = value.replace(new RegExp(`^${indentation}`, 'gm'), '');
			}

			comments.push({
				type: block ? 'Block' : 'Line',
				value,
				start,
				end,
				loc: {
					start: start_loc,
					end: end_loc,
				},
				context: metadata ?? null,
			});
		},

		/**
		 * @param {AST.Node | AST.CSS.StyleSheet} ast
		 */
		add_comments: (ast) => {
			if (comments.length === 0) return;

			comments = comments
				.filter((comment) => comment.start >= index)
				.map(({ type, value, start, end, loc, context }) => ({
					type,
					value,
					start,
					end,
					loc,
					context,
				}));

			walk(ast, null, {
				_(node, { next, path }) {
					const metadata = /** @type {AST.Node} */ (node)?.metadata;

					/**
					 * Check if a comment is inside an attribute expression
					 * of any ancestor Elements.
					 * @returns {boolean}
					 */
					function isCommentInsideAttributeExpression() {
						for (let i = path.length - 1; i >= 0; i--) {
							const ancestor = path[i];
							if (
								ancestor &&
								(ancestor.type === 'JSXAttribute' ||
									ancestor.type === 'Attribute' ||
									ancestor.type === 'JSXExpressionContainer')
							) {
								return true;
							}
						}
						return false;
					}

					/**
					 * Check if a comment is inside any attribute of ancestor Elements,
					 * but NOT if we're currently traversing inside that attribute.
					 * @param {AST.CommentWithLocation} comment
					 * @returns {boolean}
					 */
					function isCommentInsideUnvisitedAttribute(comment) {
						for (let i = path.length - 1; i >= 0; i--) {
							const ancestor = path[i];
							if (ancestor.type === 'JSXAttribute' || ancestor.type === 'Attribute') {
								return false;
							}
							if (ancestor && ancestor.type === 'Element') {
								for (const attr of /** @type {(AST.Attribute & AST.NodeWithLocation)[]} */ (
									ancestor.attributes
								)) {
									if (comment.start >= attr.start && comment.end <= attr.end) {
										return true;
									}
								}
							}
						}
						return false;
					}

					/**
					 * If a comment is located between an empty Element's opening and closing tags,
					 * attach it to the Element as `innerComments`.
					 * @param {AST.CommentWithLocation} comment
					 * @returns {AST.Element | null}
					 */
					function getEmptyElementInnerCommentTarget(comment) {
						const element = /** @type {AST.Element | undefined} */ (
							path.findLast((ancestor) => ancestor && ancestor.type === 'Element')
						);
						if (
							!element ||
							element.children.length > 0 ||
							!element.openingElement?.end ||
							!element.closingElement?.start ||
							comment.start < element.openingElement.end ||
							comment.end > element.closingElement.start
						) {
							return null;
						}
						return element;
					}

					if (node.start === undefined || node.end === undefined) {
						next();
						return;
					}

					while (comments.length > 0) {
						const comment = comments[0];

						if (comment.end <= node.start) {
							// Comment is before this node
							if (isCommentInsideUnvisitedAttribute(comment)) {
								comments.shift();
								continue;
							}

							const emptyElementTarget = getEmptyElementInnerCommentTarget(comment);
							if (emptyElementTarget) {
								if (!emptyElementTarget.innerComments) {
									emptyElementTarget.innerComments = [];
								}
								emptyElementTarget.innerComments.push(comment);
								comments.shift();
								continue;
							}

							if (metadata && !isCommentInsideAttributeExpression()) {
								const isElementChild = path.some(
									(p) => p.type === 'Element' || p.type === 'Tsx' || p.type === 'TsxCompat',
								);
								if (isElementChild) {
									if (!metadata.elementLeadingComments) {
										metadata.elementLeadingComments = [];
									}
									metadata.elementLeadingComments.push(comment);
								} else {
									if (!node.leadingComments) {
										node.leadingComments = [];
									}
									/** @type {AST.Comment[]} */ (node.leadingComments).push(comment);
								}
							} else {
								if (!node.leadingComments) {
									node.leadingComments = [];
								}
								/** @type {AST.Comment[]} */ (node.leadingComments).push(comment);
							}
							comments.shift();
						} else if (comment.start >= node.end) {
							// Comment is after this node - stop
							break;
						} else {
							// Comment is inside this node
							break;
						}
					}

					next();

					// After visiting children, check for trailing comments
					while (comments.length > 0) {
						const comment = comments[0];

						if (comment.start >= node.start && comment.end <= node.end) {
							// Comment is inside this node but after all children
							const emptyElementTarget = getEmptyElementInnerCommentTarget(comment);
							if (emptyElementTarget) {
								if (!emptyElementTarget.innerComments) {
									emptyElementTarget.innerComments = [];
								}
								emptyElementTarget.innerComments.push(comment);
								comments.shift();
								continue;
							}

							if (!node.trailingComments) {
								node.trailingComments = [];
							}
							/** @type {AST.Comment[]} */ (node.trailingComments).push(comment);
							comments.shift();
						} else {
							break;
						}
					}
				},
			});

			// Any remaining comments go on the root node
			if (comments.length > 0) {
				if (!ast.trailingComments) {
					ast.trailingComments = [];
				}
				for (const comment of comments) {
					/** @type {AST.Comment[]} */ (ast.trailingComments).push(comment);
				}
			}
		},
	};
}

// Re-export acorn utilities that plugins may need
export { acorn, tsPlugin };
