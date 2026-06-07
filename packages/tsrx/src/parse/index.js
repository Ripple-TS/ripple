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
 * @param {AST.Node | ESTreeJSX.JSXText | null | undefined} node
 * @returns {boolean}
 */
export function isWhitespaceTextNode(node) {
	if (!node) {
		return false;
	}

	if (node.type === 'JSXText') {
		return /^\s*$/.test(node.value);
	}

	return false;
}

/**
 * @type {AcornPlugin}
 */
function elementTemplateClosingTagPlugin(Base) {
	const jsxTagStart = /** @type {any} */ (Base).acornTypeScript?.tokTypes?.jsxTagStart;
	if (!jsxTagStart) return Base;

	/**
	 * @param {any} parser
	 */
	function inElementTemplateBodyDirect(parser) {
		const stack = parser.context;
		const top = stack[stack.length - 1];
		const below = stack[stack.length - 2];
		return top && top.token === '{' && below && below.token === '<tag>...</tag>';
	}

	/**
	 * @param {any} parser
	 */
	function inElementTemplateBodyAnywhere(parser) {
		const stack = parser.context;
		for (let i = 1; i < stack.length; i++) {
			if (
				stack[i] &&
				stack[i].token === '{' &&
				stack[i - 1] &&
				stack[i - 1].token === '<tag>...</tag>'
			) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @param {any} parser
	 */
	function isOpeningTagAfterReturnKeyword(parser) {
		if (parser.input.charCodeAt(parser.start + 1) === 47 /* '/' */) return false;

		let index = parser.start - 1;
		while (index >= 0) {
			const ch = parser.input.charCodeAt(index);
			if (ch === 32 /* ' ' */ || ch === 9 /* '\t' */) {
				index--;
				continue;
			}
			if (ch === 10 /* '\n' */ || ch === 13 /* '\r' */) return false;
			break;
		}

		const end = index + 1;
		const start = end - 'return'.length;
		if (start < 0 || parser.input.slice(start, end) !== 'return') return false;
		const before = start > 0 ? parser.input.charCodeAt(start - 1) : -1;
		return !(
			(before >= 48 /* '0' */ && before <= 57) ||
			(before >= 65 /* 'A' */ && before <= 90) ||
			(before >= 97 /* 'a' */ && before <= 122) ||
			before === 36 /* '$' */ ||
			before === 95 /* '_' */
		);
	}

	return class extends Base {
		/** @param {number} code */
		// @ts-ignore — extending acorn's Parser with internal hooks
		getTokenFromCode(code) {
			if (code === 60 /* '<' */ && !(/** @type {any} */ (this).inType)) {
				const self = /** @type {any} */ (this);
				const nextChar =
					self.pos + 1 < self.input.length ? self.input.charCodeAt(self.pos + 1) : -1;
				if (nextChar === 47 /* '/' */ && inElementTemplateBodyDirect(self)) {
					++self.pos;
					return self.finishToken(jsxTagStart);
				}
			}
			// @ts-ignore — super dispatches to next layer in the plugin chain
			return super.getTokenFromCode(code);
		}

		// @ts-ignore — extending acorn's Parser with internal hooks
		canInsertSemicolon() {
			const self = /** @type {any} */ (this);
			if (
				self.type === jsxTagStart &&
				inElementTemplateBodyAnywhere(self) &&
				!isOpeningTagAfterReturnKeyword(self)
			) {
				return true;
			}
			// @ts-ignore
			return super.canInsertSemicolon();
		}
	};
}

/**
 * Create a parser by composing Acorn with TypeScript/JSX support and optional framework plugins.
 *
 * This is the core factory for building tsrx-based parsers. Framework plugins (like TSRXPlugin)
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
				elementTemplateClosingTagPlugin,
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
		const collect = !!(options?.collect || options?.loose);
		const output_comments = collect ? options?.comments : undefined;

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
				tsrxOptions: {
					filename,
					collect,
					errors: collect ? (options?.errors ?? []) : undefined,
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

	/**
	 * @param {any} node
	 * @returns {node is (ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment) & AST.NodeWithLocation}
	 */
	function isNativeTemplateNode(node) {
		return (
			(node?.type === 'JSXElement' ||
				node?.type === 'JSXFragment' ||
				node?.type === 'JSXStyleElement') &&
			node.metadata?.native_tsrx
		);
	}

	/**
	 * @param {any} node
	 * @returns {node is (ESTreeJSX.JSXElement | AST.JSXStyleElement) & AST.NodeWithLocation}
	 */
	function isNativeTemplateElement(node) {
		return (
			(node?.type === 'JSXElement' || node?.type === 'JSXStyleElement') &&
			node.metadata?.native_tsrx
		);
	}

	/**
	 * @param {any} node
	 * @returns {AST.Node[]}
	 */
	function getTemplateChildren(node) {
		return Array.isArray(node?.children)
			? /** @type {AST.Node[]} */ (/** @type {unknown} */ (node.children))
			: [];
	}

	/**
	 * @param {any} node
	 * @returns {node is (ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment) & AST.NodeWithLocation}
	 */
	function isEmptyTemplateNode(node) {
		return isNativeTemplateNode(node) && getTemplateChildren(node).length === 0;
	}

	/**
	 * @param {any} node
	 * @returns {any}
	 */
	function getNodeMetadata(node) {
		const target = /** @type {AST.Node} */ (/** @type {unknown} */ (node));
		target.metadata ??= { path: [] };
		return target.metadata;
	}

	/**
	 * @param {any} node
	 * @param {AST.CommentWithLocation} comment
	 */
	function pushInnerComment(node, comment) {
		const target = /** @type {any} */ (node);
		(target.innerComments ||= []).push(comment);
	}

	/**
	 * @param {any} node
	 * @returns {boolean}
	 */
	function hasInnerComments(node) {
		return !!(/** @type {any} */ (node).innerComments?.length);
	}

	/**
	 * @param {ESTreeJSX.JSXElement | AST.JSXStyleElement} node
	 * @returns {string | null}
	 */
	function getJSXElementName(node) {
		const name = node.openingElement?.name;
		if (!name) return null;
		if (name.type === 'JSXIdentifier') return name.name;
		if (name.type === 'JSXNamespacedName') return `${name.namespace.name}:${name.name.name}`;
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

					/** @returns {boolean} */
					function isCommentInsideAttributeExpression() {
						for (let i = path.length - 1; i >= 0; i--) {
							const ancestor = path[i];
							if (
								ancestor &&
								(ancestor.type === 'JSXAttribute' || ancestor.type === 'JSXExpressionContainer')
							) {
								return true;
							}
						}
						return false;
					}

					/**
					 * @param {AST.CommentWithLocation} comment
					 * @returns {boolean}
					 */
					function isCommentInsideUnvisitedAttribute(comment) {
						for (let i = path.length - 1; i >= 0; i--) {
							const ancestor = path[i];
							// we would definitely reach the attribute first before getting to the element
							if (ancestor.type === 'JSXAttribute') {
								return false;
							}
							if (isNativeTemplateElement(ancestor)) {
								for (const attr of ancestor.openingElement.attributes) {
									if (
										attr.start !== undefined &&
										attr.end !== undefined &&
										comment.start >= attr.start &&
										comment.end <= attr.end
									) {
										return true;
									}
								}
							}
						}
						return false;
					}

					/**
					 * @param {AST.CommentWithLocation} comment
					 * @returns {((ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment) & AST.NodeWithLocation) | null}
					 */
					function getEmptyElementInnerCommentTarget(comment) {
						const element = path.findLast((ancestor) => isNativeTemplateNode(ancestor));
						const openingEnd =
							element?.type === 'JSXFragment'
								? element.openingFragment?.end
								: element?.openingElement?.end;
						if (
							!element ||
							!isEmptyTemplateNode(element) ||
							openingEnd === undefined ||
							!(comment.start >= openingEnd && comment.end <= element.end)
						) {
							return null;
						}

						return element;
					}

					// Skip CSS nodes entirely - they use CSS-local positions (relative to
					// the <style> tag content) which would incorrectly match against
					// absolute source positions of JS/HTML comments. Also consume any
					// CSS comments (which have absolute positions) that fall within the
					// parent <style> element's content range so they don't leak to
					// subsequent JS nodes.
					if (node.type === 'StyleSheet') {
						const styleElement =
							/** @type {(ESTreeJSX.JSXElement & AST.NodeWithLocation) | undefined} */ (
								path.findLast(
									(ancestor) =>
										isNativeTemplateElement(ancestor) && getJSXElementName(ancestor) === 'style',
								)
							);
						if (styleElement) {
							const cssStart = styleElement.openingElement?.end ?? styleElement.start;
							const cssEnd = styleElement.closingElement?.start ?? styleElement.end;
							while (comments[0] && comments[0].start >= cssStart && comments[0].end <= cssEnd) {
								comments.shift();
							}
						}
						return;
					}

					if (metadata && metadata.commentContainerId !== undefined) {
						// For empty template elements, keep comments as `innerComments`.
						// The Prettier plugin uses `innerComments` to preserve them and
						// to avoid collapsing the element into self-closing syntax.
						const isEmptyElement = isEmptyTemplateNode(node);
						if (!isEmptyElement) {
							while (
								comments[0] &&
								comments[0].context &&
								comments[0].context.containerId === metadata.commentContainerId &&
								comments[0].context.beforeMeaningfulChild
							) {
								// Check that the comment is actually in this element's own content
								// area, not positionally inside a child element. This handles the
								// case where jsx_parseOpeningElementAt() triggers jsx_readToken()
								// before the child element is pushed to the parser's #path, causing
								// comments inside the child to get the parent's containerId.
								const commentStart = comments[0].start;
								const isInsideChildElement = getTemplateChildren(node).some(
									(child) =>
										child &&
										child.start !== undefined &&
										child.end !== undefined &&
										commentStart >= child.start &&
										commentStart < child.end,
								);
								if (isInsideChildElement) break;

								const elementComment = /** @type {AST.CommentWithLocation} */ (comments.shift());

								(metadata.elementLeadingComments ||= []).push(elementComment);
							}
						}
					}

					while (
						comments[0] &&
						comments[0].start < /** @type {AST.NodeWithLocation} */ (node).start
					) {
						// Skip comments that are inside an attribute of an ancestor JSX element.
						// Since zimmerframe visits children before attributes, we need to leave
						// these comments for when the attribute nodes are visited.
						if (
							isCommentInsideUnvisitedAttribute(
								/** @type {AST.CommentWithLocation} */ (comments[0]),
							)
						) {
							break;
						}

						const maybeInner = getEmptyElementInnerCommentTarget(
							/** @type {AST.CommentWithLocation} */ (comments[0]),
						);
						if (maybeInner) {
							pushInnerComment(
								maybeInner,
								/** @type {AST.CommentWithLocation} */ (comments.shift()),
							);
							continue;
						}

						const comment = /** @type {AST.CommentWithLocation} */ (comments.shift());

						// Skip leading comments for BlockStatement that is a function body
						// These comments should be dangling on the function instead
						if (node.type === 'BlockStatement') {
							const parent = path.at(-1);
							if (
								parent &&
								(parent.type === 'FunctionDeclaration' ||
									parent.type === 'FunctionExpression' ||
									parent.type === 'ArrowFunctionExpression') &&
								parent.body === node
							) {
								// This is a function body - don't attach comment, let it be handled by function
								(parent.comments ||= []).push(comment);
								continue;
							}
						}

						if (isCommentInsideAttributeExpression()) {
							(node.leadingComments ||= []).push(comment);
							continue;
						}

						const ancestorElements = path
							.filter((ancestor) => isNativeTemplateNode(ancestor) && ancestor.loc)
							.map((ancestor) => /** @type {AST.NodeWithLocation} */ (ancestor))
							.sort((a, b) => a.loc.start.line - b.loc.start.line);

						const targetAncestor = ancestorElements.find(
							(ancestor) => comment.loc.start.line < ancestor.loc.start.line,
						);

						if (targetAncestor) {
							const targetMetadata = getNodeMetadata(targetAncestor);
							(targetMetadata.elementLeadingComments ||= []).push(comment);
							continue;
						}

						(node.leadingComments ||= []).push(comment);
					}

					next();

					if (comments[0]) {
						if (node.type === 'Program' && node.body.length === 0) {
							// Collect all comments in an empty program (file with only comments)
							while (comments.length) {
								const comment = /** @type {AST.CommentWithLocation} */ (comments.shift());
								(node.innerComments ||= []).push(comment);
							}
							if (node.innerComments && node.innerComments.length > 0) {
								return;
							}
						}
						if (node.type === 'BlockStatement' && node.body.length === 0) {
							// Collect all comments that fall within this empty block
							while (
								comments[0] &&
								comments[0].start < /** @type {AST.NodeWithLocation} */ (node).end &&
								comments[0].end < /** @type {AST.NodeWithLocation} */ (node).end
							) {
								const comment = /** @type {AST.CommentWithLocation} */ (comments.shift());
								(node.innerComments ||= []).push(comment);
							}
							if (node.innerComments && node.innerComments.length > 0) {
								return;
							}
						}
						// Handle JSXEmptyExpression - these represent {/* comment */} in JSX
						if (node.type === 'JSXEmptyExpression') {
							// Collect all comments that fall within this JSXEmptyExpression
							while (
								comments[0] &&
								comments[0].start >= /** @type {AST.NodeWithLocation} */ (node).start &&
								comments[0].end <= /** @type {AST.NodeWithLocation} */ (node).end
							) {
								const comment = /** @type {AST.CommentWithLocation} */ (comments.shift());
								(node.innerComments ||= []).push(comment);
							}
							if (node.innerComments && node.innerComments.length > 0) {
								return;
							}
						}
						// Handle empty template nodes the same way as empty BlockStatements
						if (isEmptyTemplateNode(node)) {
							// Collect all comments that fall within this empty element
							while (
								comments[0] &&
								comments[0].start < /** @type {AST.NodeWithLocation} */ (node).end &&
								comments[0].end < /** @type {AST.NodeWithLocation} */ (node).end
							) {
								const comment = /** @type {AST.CommentWithLocation} */ (comments.shift());
								pushInnerComment(node, comment);
							}
							if (hasInnerComments(node)) {
								return;
							}
						}

						// Trailing comments after the last statement/render inside a `@{ … }`
						// code block (before its `}`) have no following node to attach to and
						// would otherwise be claimed by the enclosing element's closing tag.
						// Claim them here as the block's inner comments.
						if (node.type === 'JSXCodeBlock') {
							while (
								comments[0] &&
								comments[0].start >= /** @type {AST.NodeWithLocation} */ (node).start &&
								comments[0].start < /** @type {AST.NodeWithLocation} */ (node).end
							) {
								pushInnerComment(node, /** @type {AST.CommentWithLocation} */ (comments.shift()));
							}
							if (comments.length === 0) {
								return;
							}
						}

						const parent = /** @type {AST.Node & AST.NodeWithLocation} */ (path.at(-1));

						if (parent === undefined || node.end !== parent.end) {
							const slice = source.slice(node.end, comments[0].start);

							// Check if this node is the last item in an array-like structure
							let is_last_in_array = false;
							/** @type {(AST.Node | null)[] | null} */
							let node_array = null;
							let isParam = false;
							let isArgument = false;
							let isSwitchCaseSibling = false;

							if (parent) {
								if (
									parent.type === 'BlockStatement' ||
									parent.type === 'Program' ||
									parent.type === 'ClassBody'
								) {
									node_array = parent.body;
								} else if (parent.type === 'SwitchStatement') {
									node_array = parent.cases;
									isSwitchCaseSibling = true;
								} else if (parent.type === 'SwitchCase') {
									node_array = parent.consequent;
								} else if (parent.type === 'ArrayExpression') {
									node_array = parent.elements;
								} else if (parent.type === 'ObjectExpression') {
									node_array = parent.properties;
								} else if (parent.type === 'ObjectPattern') {
									node_array = parent.properties;
								} else if (parent.type === 'TSTypeLiteral') {
									node_array = parent.members;
								} else if (
									parent.type === 'FunctionDeclaration' ||
									parent.type === 'FunctionExpression' ||
									parent.type === 'ArrowFunctionExpression'
								) {
									node_array = parent.params;
									isParam = true;
								} else if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
									node_array = parent.arguments;
									isArgument = true;
								}
							}

							if (node_array && Array.isArray(node_array)) {
								is_last_in_array = node_array.indexOf(node) === node_array.length - 1;
							}

							const trailingCommentBoundary =
								parent &&
								parent.type === 'ObjectPattern' &&
								parent.typeAnnotation &&
								parent.typeAnnotation.start !== undefined
									? parent.typeAnnotation.start
									: parent?.end;

							if (is_last_in_array) {
								if (isParam || isArgument) {
									while (comments.length) {
										const potentialComment = comments[0];
										if (
											trailingCommentBoundary !== undefined &&
											potentialComment.start >= trailingCommentBoundary
										) {
											break;
										}

										const maybeInner = getEmptyElementInnerCommentTarget(potentialComment);
										if (maybeInner) {
											pushInnerComment(
												maybeInner,
												/** @type {AST.CommentWithLocation} */ (comments.shift()),
											);
											continue;
										}

										const nextChar = getNextNonWhitespaceCharacter(source, potentialComment.end);
										if (nextChar === ')') {
											(node.trailingComments ||= []).push(
												/** @type {AST.CommentWithLocation} */ (comments.shift()),
											);
											continue;
										}

										break;
									}
								} else {
									// Special case: There can be multiple trailing comments after the last node in a block,
									// and they can be separated by newlines
									while (comments.length) {
										const comment = comments[0];
										if (
											trailingCommentBoundary !== undefined &&
											comment.start >= trailingCommentBoundary
										) {
											break;
										}

										const maybeInner = getEmptyElementInnerCommentTarget(comment);
										if (maybeInner) {
											pushInnerComment(
												maybeInner,
												/** @type {AST.CommentWithLocation} */ (comments.shift()),
											);
											continue;
										}

										(node.trailingComments ||= []).push(comment);
										comments.shift();
									}
								}
							} else if (/** @type {AST.NodeWithLocation} */ (node).end <= comments[0].start) {
								const maybeInner = getEmptyElementInnerCommentTarget(
									/** @type {AST.CommentWithLocation} */ (comments[0]),
								);
								if (maybeInner) {
									pushInnerComment(
										maybeInner,
										/** @type {AST.CommentWithLocation} */ (comments.shift()),
									);
									return;
								}

								const onlySimpleWhitespace = /^[,) \t]*$/.test(slice);
								const onlyWhitespace = /^\s*$/.test(slice);
								const hasBlankLine = /\n\s*\n/.test(slice);
								const nodeEndLine = node.loc?.end?.line ?? null;
								const commentStartLine = comments[0].loc?.start?.line ?? null;
								const isImmediateNextLine =
									nodeEndLine !== null &&
									commentStartLine !== null &&
									commentStartLine === nodeEndLine + 1;

								if (isSwitchCaseSibling && !is_last_in_array) {
									if (
										nodeEndLine !== null &&
										commentStartLine !== null &&
										nodeEndLine === commentStartLine
									) {
										node.trailingComments = [
											/** @type {AST.CommentWithLocation} */ (comments.shift()),
										];
									}
									return;
								}

								if (
									onlySimpleWhitespace ||
									(onlyWhitespace && !hasBlankLine && isImmediateNextLine)
								) {
									// Check if this is a block comment that's inline with the next statement
									// e.g., /** @type {SomeType} */ (a) = 5;
									// These should be leading comments, not trailing
									if (comments[0].type === 'Block' && !is_last_in_array && node_array) {
										const currentIndex = node_array.indexOf(node);
										const nextSibling = node_array[currentIndex + 1];

										if (nextSibling && nextSibling.loc) {
											const commentEndLine = comments[0].loc?.end?.line;
											const nextSiblingStartLine = nextSibling.loc?.start?.line;

											// If comment ends on same line as next sibling starts, it's inline with next
											if (commentEndLine === nextSiblingStartLine) {
												// Leave it for next sibling's leading comments
												return;
											}
										}
									}

									// For function parameters, only attach as trailing comment if it's on the same line
									// Comments on next line after comma should be leading comments of next parameter
									if (isParam) {
										// Check if comment is on same line as the node
										const nodeEndLine = source.slice(0, node.end).split('\n').length;
										const commentStartLine = source.slice(0, comments[0].start).split('\n').length;
										if (nodeEndLine === commentStartLine) {
											node.trailingComments = [
												/** @type {AST.CommentWithLocation} */ (comments.shift()),
											];
										}
										// Otherwise leave it for next parameter's leading comments
									} else {
										// Line comments on the next line should be leading comments
										// for the next statement, not trailing comments for this one.
										// Only attach as trailing if:
										// 1. It's on the same line as this node, OR
										// 2. This is the last item in the array (no next sibling to attach to)
										const commentOnSameLine =
											nodeEndLine !== null &&
											commentStartLine !== null &&
											nodeEndLine === commentStartLine;

										if (commentOnSameLine || is_last_in_array) {
											node.trailingComments = [
												/** @type {AST.CommentWithLocation} */ (comments.shift()),
											];
										}
										// Otherwise leave it for next sibling's leading comments
									}
								} else if (hasBlankLine && onlyWhitespace && node_array) {
									// When there's a blank line between node and comment(s),
									// check if there's also a blank line after the comment(s) before the next node
									// If so, attach comments as trailing to preserve the grouping
									// Only do this for statement-level contexts (BlockStatement, Program),
									// not for JSX element children or other contexts
									const isStatementContext =
										parent.type === 'BlockStatement' || parent.type === 'Program';

									if (!isStatementContext) {
										return;
									}

									const currentIndex = node_array.indexOf(node);
									const nextSibling = node_array[currentIndex + 1];

									if (nextSibling && nextSibling.loc) {
										// Find where the comment block ends
										let lastCommentIndex = 0;
										let lastCommentEnd = comments[0].end;

										// Collect consecutive comments (without blank lines between them)
										while (comments[lastCommentIndex + 1]) {
											const currentComment = comments[lastCommentIndex];
											const nextComment = comments[lastCommentIndex + 1];
											const sliceBetween = source.slice(currentComment.end, nextComment.start);

											// If there's a blank line, stop
											if (/\n\s*\n/.test(sliceBetween)) {
												break;
											}

											lastCommentIndex++;
											lastCommentEnd = nextComment.end;
										}

										// Check if there's a blank line after the last comment and before next sibling
										const sliceAfterComments = source.slice(lastCommentEnd, nextSibling.start);
										const hasBlankLineAfter = /\n\s*\n/.test(sliceAfterComments);

										if (hasBlankLineAfter) {
											// Don't attach comments as trailing if they are inside the next template node.
											const nextIsElement = isNativeTemplateNode(nextSibling);
											const commentsInsideElement =
												nextIsElement &&
												nextSibling.loc &&
												comments.some((c) => {
													if (!c.loc) return false;
													// Check if comment is on a line between the JSX element's start and end lines
													return (
														c.loc.start.line >= nextSibling.loc.start.line &&
														c.loc.end.line <= nextSibling.loc.end.line
													);
												});

											if (!commentsInsideElement) {
												// Attach all the comments as trailing
												for (let i = 0; i <= lastCommentIndex; i++) {
													(node.trailingComments ||= []).push(
														/** @type {AST.CommentWithLocation} */ (comments.shift()),
													);
												}
											}
										}
									}
								}
							}
						}
					}
				},
			});
		},
	};
}

// Re-export acorn utilities that plugins may need
export { acorn, tsPlugin };
