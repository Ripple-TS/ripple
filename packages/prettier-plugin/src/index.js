/**
 * @import * as acorn from '@tsrx/core/types/acorn';
 * @import * as AST from '@tsrx/core/types/estree';
 * @import * as ESTreeJSX from '@tsrx/core/types/estree-jsx';
 * @import { Doc, AstPath, ParserOptions } from 'prettier';
 */

/**
 * Print function callback type.
 * Uses an intersection of two signatures:
 * 1. (path) => Doc — compatible with CallCallback/MapCallback for path.call/path.map
 * 2. (path, args) => Doc — used when passing context args via lambdas
 *
 * @typedef {((path: AstPath) => Doc) & ((path: AstPath, args: PrintArgs) => Doc)} PrintFn
 */

/** @typedef {Partial<Pick<ParserOptions, 'singleQuote' | 'jsxSingleQuote' | 'semi' | 'trailingComma' | 'useTabs' | 'tabWidth' | 'singleAttributePerLine' | 'bracketSameLine' | 'bracketSpacing' | 'arrowParens' | 'originalText' | 'printWidth'>> & { locStart: (node: AST.NodeWithLocation) => number, locEnd: (node: AST.NodeWithLocation) => number }} RippleFormatOptions */

/** @typedef {{ isInAttribute?: boolean, isInArray?: boolean, allowInlineObject?: boolean, isConditionalTest?: boolean, isNestedConditional?: boolean, suppressLeadingComments?: boolean, suppressExpressionLeadingComments?: boolean, isInlineContext?: boolean, isStatement?: boolean, isLogicalAndOr?: boolean, allowShorthandProperty?: boolean, isFirstChild?: boolean, noBreakInside?: boolean, expandLastArg?: boolean, preferInlineSimpleUnionType?: boolean }} PrintArgs */

import { parseModule } from '@tsrx/core';
import { doc } from 'prettier';

const { builders, utils } = doc;
const {
	join,
	line,
	softline,
	hardline,
	group,
	indent,
	ifBreak,
	fill,
	conditionalGroup,
	breakParent,
	indentIfBreak,
	lineSuffix,
	align,
} = builders;
const { replaceEndOfLine, willBreak } = utils;

/** @type {import('prettier').Plugin['languages']} */
export const languages = [
	{
		name: 'tsrx',
		parsers: ['tsrx'],
		extensions: ['.tsrx'],
		vscodeLanguageIds: ['tsrx', 'ripple'],
	},
];

/** @type {import('prettier').Plugin['parsers']} */
export const parsers = {
	tsrx: {
		astFormat: 'ripple-ast',
		/**
		 * @param {string} text
		 * @param {ParserOptions<AST.Node | AST.CSS.StyleSheet>} options
		 * @returns {AST.Program}
		 */
		parse(text, options) {
			return parseModule(text, options.filepath || 'PrettierPlugin.tsrx');
		},

		/**
		 * @param {AST.NodeWithLocation} node
		 * @returns {number}
		 */
		locStart(node) {
			return node.start;
		},

		/**
		 * @param {AST.NodeWithLocation} node
		 * @returns {number}
		 */
		locEnd(node) {
			return node.end;
		},
	},
};

/** @type {import('prettier').Plugin['printers']} */
export const printers = {
	'ripple-ast': {
		/**
		 * @param {AstPath<AST.Node | AST.CSS.StyleSheet>} path
		 * @param {RippleFormatOptions} options
		 * @param {PrintFn} print
		 * @param {PrintArgs} [args]
		 * @returns {Doc}
		 */
		print(path, options, print, args) {
			const node = path.node;
			const parts = printRippleNode(node, path, options, print, args);
			// If printRippleNode returns doc parts, return them directly
			// If it returns a string, wrap it for consistency
			// If it returns an array, concatenate it
			if (Array.isArray(parts)) {
				return parts;
			}
			return typeof parts === 'string' ? parts : parts;
		},
		/**
		 * @param {AstPath<AST.Node | AST.CSS.StyleSheet>} path
		 * @returns {((textToDoc: (text: string, options: object) => Promise<Doc>) => Promise<Doc>) | null}
		 */
		embed(path) {
			const node = path.node;

			// Handle StyleSheet nodes inside style tags
			if (node.type === 'StyleSheet' && node.source) {
				// Return async function that will be called by Prettier
				return async (textToDoc) => {
					try {
						// Format CSS using Prettier's textToDoc
						const body = await textToDoc(node.source, {
							parser: 'css',
						});

						// Return the formatted CSS
						// Note: printElement will wrap this in indent(), so we don't add indent here
						return body;
					} catch (error) {
						// If CSS has syntax errors, return original unformatted content
						console.error('Error formatting CSS:', error);
						return node.source;
					}
				};
			}

			return null;
		},
		/**
		 * @param {AST.Node & Record<string, unknown>} node
		 * @returns {string[]}
		 */
		getVisitorKeys(node) {
			// Exclude metadata and raw text properties that shouldn't be traversed
			// The css property is specifically excluded so embed() can handle it
			const excludedKeys = new Set([
				'start',
				'end',
				'loc',
				'metadata',
				'css', // Handled by embed()
				'raw',
				'regex',
				'content', // Handled by embed() for <script> tags
			]);

			const keys = Object.keys(node).filter((key) => {
				if (excludedKeys.has(key)) {
					return false;
				}
				return typeof node[key] === 'object' && node[key] !== null;
			});

			return keys;
		},
	},
};

/**
 * Format a string literal according to Prettier options
 * @param {string | number | bigint | boolean | RegExp | null | undefined} value - value to format
 * @param {RippleFormatOptions} options - Prettier options
 * @returns {string} - The formatted string literal with quotes
 */
function formatStringLiteral(value, options) {
	if (typeof value !== 'string') {
		return JSON.stringify(value);
	}

	const quote = options.singleQuote ? "'" : '"';
	const escapedValue = value
		.replace(/\\/g, '\\\\')
		.replace(new RegExp(quote, 'g'), '\\' + quote)
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');

	return quote + escapedValue + quote;
}

/**
 * Add semicolon based on options.semi setting
 * @param {RippleFormatOptions} options - Prettier options
 * @returns {string} - Semicolon or empty string
 */
function semi(options) {
	return options.semi !== false ? ';' : '';
}

/**
 * Check if a node was originally on a single line in source
 * @param {AST.Node} node - The AST node to check
 * @returns {boolean} - True if the node was on a single line
 */
function wasOriginallySingleLine(node) {
	if (!node || !node.loc || !node.loc.start || !node.loc.end) {
		return false;
	}

	return node.loc.start.line === node.loc.end.line;
}

/**
 * Check if an object expression was originally single line
 * @param {AST.ObjectExpression} node - The object expression node
 * @returns {boolean} - True if single line
 */
function isSingleLineObjectExpression(node) {
	return wasOriginallySingleLine(node);
}

/**
 * Check if a node has any comments (leading, trailing, or inner)
 * @param {AST.Node & AST.NodeWithMaybeComments} node - The AST node to check
 * @returns {boolean} - True if the node has comments
 */
function hasComment(node) {
	return !!(node.leadingComments || node.trailingComments || node.innerComments);
}

/**
 * Check whether a comment is a `prettier-ignore` directive.
 * @param {AST.Comment | undefined} comment - The comment to check
 * @returns {boolean} - True if the comment reads exactly `prettier-ignore`
 */
function isPrettierIgnoreComment(comment) {
	if (!comment || (comment.type !== 'Line' && comment.type !== 'Block')) {
		return false;
	}
	return comment.value.trim() === 'prettier-ignore';
}

/**
 * Check whether a node is immediately preceded by a `prettier-ignore` directive.
 * Only the last leading comment counts, matching Prettier core.
 * @param {AST.Node & AST.NodeWithMaybeComments} node - The AST node to check
 * @returns {boolean} - True if the node should be printed verbatim
 */
function hasPrettierIgnore(node) {
	const comments = node.leadingComments;
	if (!comments || comments.length === 0) {
		return false;
	}
	return isPrettierIgnoreComment(comments[comments.length - 1]);
}

/**
 * @param {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction} node - The function node
 * @returns {Array<AST.Pattern | AST.Parameter>} - Array of parameter patterns
 */
function getFunctionParameters(node) {
	/** @type {(AST.Pattern | AST.Parameter)[]} */
	const parameters = [];

	if (node.params) {
		parameters.push(...node.params);
	}

	return parameters;
}

/**
 * Iterate over function parameters with path callbacks.
 * TypeScript/Ripple functions can have additional `this` and `rest` parameters.
 * @param {AstPath<AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction | AST.FunctionDeclaration>} path - The function path
 * @param {(paramPath: AstPath<AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction | AST.FunctionDeclaration>, index: number) => void} iteratee - Callback for each parameter
 * @returns {void}
 */
function iterateFunctionParametersPath(path, iteratee) {
	/** @type {AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction | AST.FunctionDeclaration} */
	const node = path.node;
	let index = 0;
	/** @type {(paramPath: AstPath) => void} */
	const callback = (paramPath) => iteratee(paramPath, index++);

	if (node.params) {
		path.each(callback, 'params');
	}
}

// Operator precedence (higher number = higher precedence)
/** @type {Record<string, number>} */
const PRECEDENCE = {
	'||': 1,
	'&&': 2,
	'|': 3,
	'^': 4,
	'&': 5,
	'==': 6,
	'!=': 6,
	'===': 6,
	'!==': 6,
	'<': 7,
	'<=': 7,
	'>': 7,
	'>=': 7,
	in: 7,
	instanceof: 7,
	'<<': 8,
	'>>': 8,
	'>>>': 8,
	'+': 9,
	'-': 9,
	'*': 10,
	'/': 10,
	'%': 10,
	'**': 11,
};

/**
 * Get operator precedence for binary/logical expressions
 * @param {string} operator - The operator string
 * @returns {number} - Precedence level (higher = binds tighter)
 */
function getPrecedence(operator) {
	return PRECEDENCE[operator] || 0;
}

/**
 * Check if a BinaryExpression needs parentheses
 * @param {AST.BinaryExpression | AST.LogicalExpression} node - The expression node
 * @param {AST.Node} parent - The parent node
 * @returns {boolean} - True if parentheses are needed
 */
function binaryExpressionNeedsParens(node, parent) {
	if (!node.metadata?.parenthesized) {
		return false;
	}

	// If parent is not an operator context, don't preserve parens
	if (
		!parent ||
		(parent.type !== 'BinaryExpression' &&
			parent.type !== 'LogicalExpression' &&
			parent.type !== 'UnaryExpression')
	) {
		return false;
	}

	// If parent is UnaryExpression, it already handles the parentheses
	if (parent.type === 'UnaryExpression') {
		return false;
	}

	// For BinaryExpression/LogicalExpression parents, check precedence
	if (parent.type === 'BinaryExpression' || parent.type === 'LogicalExpression') {
		const nodePrecedence = getPrecedence(node.operator);
		const parentPrecedence = getPrecedence(parent.operator);

		// Need parens if:
		// 1. Child has lower precedence than parent
		// 2. Same precedence but different operators (for clarity)
		// 3. Child is on the right side and precedence is equal (for left-associative operators)
		if (nodePrecedence < parentPrecedence) {
			return true;
		}
		if (nodePrecedence === parentPrecedence && node.operator !== parent.operator) {
			return true;
		}
	}

	return false;
}

/**
 * Check if a parenthesized AssignmentExpression needs its parentheses preserved.
 * @param {AST.AssignmentExpression} node - The expression node
 * @param {AST.Node | null} parent - The parent node
 * @returns {boolean} - True if parentheses are needed
 */
function assignmentExpressionNeedsParens(node, parent) {
	if (!node.metadata?.parenthesized || !parent) {
		return false;
	}

	if (parent.type === 'BinaryExpression' || parent.type === 'LogicalExpression') {
		return true;
	}

	if (parent.type === 'ConditionalExpression') {
		return parent.test === node;
	}

	if (parent.type === 'AwaitExpression' || parent.type === 'YieldExpression') {
		return parent.argument === node;
	}

	if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
		return parent.callee === node;
	}

	if (parent.type === 'TaggedTemplateExpression') {
		return parent.tag === node;
	}

	if (
		parent.type === 'TSAsExpression' ||
		parent.type === 'TSSatisfiesExpression' ||
		parent.type === 'TSNonNullExpression' ||
		parent.type === 'TSInstantiationExpression'
	) {
		return parent.expression === node;
	}

	return false;
}

/**
 * Create a function that skips specified characters in text
 * @param {string | RegExp} characters - Characters to skip
 * @returns {(text: string, startIndex: number | false, options?: { backwards?: boolean }) => number | false}
 */
function createSkip(characters) {
	return (text, startIndex, options) => {
		const backwards = Boolean(options && options.backwards);

		if (startIndex === false) {
			return false;
		}

		const length = text.length;
		let cursor = startIndex;
		while (cursor >= 0 && cursor < length) {
			const character = text.charAt(cursor);
			if (characters instanceof RegExp) {
				if (!characters.test(character)) {
					return cursor;
				}
			} else if (!characters.includes(character)) {
				return cursor;
			}
			cursor = backwards ? cursor - 1 : cursor + 1;
		}

		if (cursor === -1 || cursor === length) {
			return cursor;
		}

		return false;
	};
}

const skipSpaces = createSkip(' \t');
const skipToLineEnd = createSkip(',; \t');
const skipEverythingButNewLine = createSkip(/[^\n\r\u2028\u2029]/u);

/**
 * Check if a character is a newline
 * @param {string} character - Single character to check
 * @returns {boolean}
 */
function isCharNewLine(character) {
	return (
		character === '\n' || character === '\r' || character === '\u2028' || character === '\u2029'
	);
}

/**
 * Check if a character is whitespace (space or tab)
 * @param {string} character - Single character to check
 * @returns {boolean}
 */
function isCharSpace(character) {
	return character === ' ' || character === '\t';
}

/**
 * Skip over an inline comment (/* ... * /)
 * @param {string} text - Source text
 * @param {number | false} startIndex - Starting position
 * @returns {number | false} - Position after comment or original position
 */
function skipInlineComment(text, startIndex) {
	if (startIndex === false) {
		return false;
	}

	if (text.charAt(startIndex) === '/' && text.charAt(startIndex + 1) === '*') {
		for (let i = startIndex + 2; i < text.length; i++) {
			if (text.charAt(i) === '*' && text.charAt(i + 1) === '/') {
				return i + 2;
			}
		}
	}

	return startIndex;
}

/**
 * Skip over a newline character
 * @param {string} text - Source text
 * @param {number | false} startIndex - Starting position
 * @param {{ backwards?: boolean }} [options] - Direction options
 * @returns {number | false} - Position after newline or original position
 */
function skipNewline(text, startIndex, options) {
	const backwards = Boolean(options && options.backwards);
	if (startIndex === false) {
		return false;
	}

	const character = text.charAt(startIndex);
	if (backwards) {
		if (text.charAt(startIndex - 1) === '\r' && character === '\n') {
			return startIndex - 2;
		}
		if (isCharNewLine(character)) {
			return startIndex - 1;
		}
	} else {
		if (character === '\r' && text.charAt(startIndex + 1) === '\n') {
			return startIndex + 2;
		}
		if (isCharNewLine(character)) {
			return startIndex + 1;
		}
	}

	return startIndex;
}

/**
 * Skip over a trailing comment (// ...)
 * @param {string} text - Source text
 * @param {number | false} startIndex - Starting position
 * @returns {number | false} - Position after comment or original position
 */
function skipTrailingComment(text, startIndex) {
	if (startIndex === false) {
		return false;
	}

	if (text.charAt(startIndex) === '/' && text.charAt(startIndex + 1) === '/') {
		return skipEverythingButNewLine(text, startIndex);
	}

	return startIndex;
}

/**
 * Check if a node is a RegExp literal
 * @param {AST.Expression | AST.SpreadElement} node - The AST node
 * @returns {boolean}
 */
function isRegExpLiteral(node) {
	return node && node.type === 'Literal' && !!(/** @type {AST.RegExpLiteral} */ (node).regex);
}

/**
 * Check if a comment is followed by a paren on the same line
 * @param {AST.Comment} comment - The comment node
 * @param {RippleFormatOptions} options - Prettier options
 * @returns {boolean}
 */
function isCommentFollowedBySameLineParen(comment, options) {
	if (!comment || !options || typeof options.originalText !== 'string') {
		return false;
	}

	const text = options.originalText;
	let cursor = /** @type {AST.NodeWithLocation} */ (comment).end;
	while (cursor < text.length) {
		const character = text.charAt(cursor);
		if (character === '(') {
			return true;
		}
		if (isCharNewLine(character) || !isCharSpace(character)) {
			return false;
		}
		cursor++;
	}

	return false;
}

/**
 * Check if there is a newline at the given position
 * @param {string} text - Source text
 * @param {number} startIndex - Starting position
 * @param {{ backwards?: boolean }} [options] - Direction options
 * @returns {boolean}
 */
function hasNewline(text, startIndex, options) {
	const idx = skipSpaces(text, options && options.backwards ? startIndex - 1 : startIndex, options);
	const idx2 = skipNewline(text, idx, options);
	return idx !== idx2;
}

/**
 * Check if the next line after a node is empty
 * @param {AST.Node | AST.Comment} node - The AST node
 * @param {RippleFormatOptions} options - Prettier options
 * @returns {boolean}
 */
function isNextLineEmpty(node, options) {
	if (!node || !options || !options.originalText) {
		return false;
	}

	const text = options.originalText;
	/** @type {number | false} */
	let index = options.locEnd(/** @type {AST.NodeWithLocation} */ (node));

	let previousIndex = null;
	while (index !== previousIndex) {
		previousIndex = index;
		index = skipToLineEnd(text, index);
		index = skipInlineComment(text, index);
		index = skipSpaces(text, index);
	}

	index = skipTrailingComment(text, index);
	index = skipNewline(text, index);
	return index !== false && hasNewline(text, index);
}

/**
 * Check if a function has a rest parameter
 * @param {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction} node - The function node
 * @returns {boolean}
 */
function hasRestParameter(node) {
	return (
		!!node.params &&
		node.params.length > 0 &&
		node.params[node.params.length - 1].type === 'RestElement'
	);
}

/**
 * Determine if a trailing comma should be printed based on options
 * @param {RippleFormatOptions} options - Prettier options
 * @param {'es5' | 'all'} [level='all'] - Comma level to check
 * @returns {boolean}
 */
function shouldPrintComma(options, level = 'all') {
	switch (options.trailingComma) {
		case 'none':
			return false;
		case 'es5':
			return level === 'es5' || level === 'all';
		case 'all':
			return level === 'all';
		default:
			return false;
	}
}

/**
 * Check if a leading comment can be attached to the previous element
 * @param {AST.Comment} comment - The comment node
 * @param {AST.Node} previousNode - Previous node
 * @param {AST.Node} nextNode - Next node
 * @returns {boolean}
 */
function canAttachLeadingCommentToPreviousElement(comment, previousNode, nextNode) {
	if (!comment || !previousNode || !nextNode) {
		return false;
	}

	const isBlockComment = comment.type === 'Block';
	if (!isBlockComment) {
		return false;
	}

	if (!comment.loc || !previousNode.loc || !nextNode.loc) {
		return false;
	}

	if (getBlankLinesBetweenNodes(previousNode, comment) > 0) {
		return false;
	}

	if (getBlankLinesBetweenNodes(comment, nextNode) > 0) {
		return false;
	}

	return true;
}

/**
 * Build doc for inline array comments
 * @param {AST.Comment[]} comments - Array of comment nodes
 * @returns {Doc | null}
 */
function buildInlineArrayCommentDoc(comments) {
	if (!Array.isArray(comments) || comments.length === 0) {
		return null;
	}

	const docs = [];
	for (let index = 0; index < comments.length; index++) {
		const comment = comments[index];
		if (!comment) {
			continue;
		}

		// Ensure spacing before the first comment and between subsequent ones.
		docs.push(' ');
		if (comment.type === 'Block') {
			docs.push('/*' + comment.value + '*/');
		} else if (comment.type === 'Line') {
			docs.push('//' + comment.value);
		}
	}

	return docs.length > 0 ? docs : null;
}

/**
 * Print an object or method key
 * @param {AST.Property | AST.MethodDefinition} node - The property or method node
 * @param {AstPath<AST.Property | AST.MethodDefinition>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printKey(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	if (node.computed) {
		// computed are never converted to identifiers
		parts.push('[', path.call(print, 'key'), ']');
		return parts;
	}

	if (node.key.type === 'Literal' && typeof node.key.value === 'string') {
		// Check if the key is a valid identifier that doesn't need quotes
		const key = node.key.value;
		const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);

		if (isValidIdentifier) {
			// Don't quote valid identifiers
			parts.push(key);
		} else {
			// Quote keys that need it (e.g., contain special characters)
			parts.push(formatStringLiteral(key, options));
		}
	} else {
		parts.push(path.call(print, 'key'));
	}

	return parts;
}

/**
 * Combine already-printed leading comment parts, a node's printed body, and its
 * trailing comments into the final Doc returned by {@link printRippleNode}.
 * @param {AST.Node} node - The AST node
 * @param {Doc[]} parts - Leading-comment parts already collected for the node
 * @param {Doc[] | Doc} nodeContent - The printed body of the node
 * @returns {Doc[] | Doc}
 */
function finishRippleNode(node, parts, nodeContent) {
	// Handle trailing comments
	if (node.trailingComments) {
		const trailingParts = [];
		let previousComment = null;

		for (let i = 0; i < node.trailingComments.length; i++) {
			const comment = node.trailingComments[i];
			const isInlineComment = Boolean(
				node.loc && comment.loc && node.loc.end.line === comment.loc.start.line,
			);

			const commentDoc =
				comment.type === 'Line' ? '//' + comment.value : '/*' + comment.value + '*/';

			if (isInlineComment) {
				if (comment.type === 'Line') {
					trailingParts.push(lineSuffix([' ', commentDoc]));
					trailingParts.push(breakParent);
				} else {
					trailingParts.push(' ' + commentDoc);
				}
			} else {
				const refs = [];
				refs.push(hardline);

				const blankLinesBetween = previousComment
					? getBlankLinesBetweenNodes(previousComment, comment)
					: getBlankLinesBetweenNodes(node, comment);
				if (blankLinesBetween > 0) {
					refs.push(hardline);
				}

				refs.push(commentDoc);
				trailingParts.push(lineSuffix(refs));
			}

			previousComment = comment;
		}

		if (trailingParts.length > 0) {
			parts.push(nodeContent);
			parts.push(...trailingParts);
			return parts;
		}
	} // Return with or without leading comments
	if (parts.length > 0) {
		// Don't add blank line between leading comments and node
		// because they're meant to be attached together
		parts.push(nodeContent);
		return parts;
	}

	return nodeContent;
}

/**
 * Main print function for Ripple AST nodes
 * @param {AST.Node | AST.CSS.StyleSheet} node - The AST node to print
 * @param {AstPath} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @param {PrintArgs} [args] - Additional context arguments
 * @returns {Doc[] | Doc}
 */
function printRippleNode(node, path, options, print, args) {
	if (!node || typeof node !== 'object') {
		return String(node || '');
	}

	/** @type {Doc[]} */
	const parts = [];

	const isInlineContext = args && args.isInlineContext;
	const suppressLeadingComments = args && args.suppressLeadingComments;

	// Handle leading comments
	if (node.leadingComments && !suppressLeadingComments) {
		for (let i = 0; i < node.leadingComments.length; i++) {
			const comment = node.leadingComments[i];
			const nextComment = node.leadingComments[i + 1];
			const isLastComment = i === node.leadingComments.length - 1;

			if (comment.type === 'Line') {
				parts.push('//' + comment.value);
				parts.push(hardline);

				// Check if there should be blank lines between this comment and the next
				if (nextComment) {
					const blankLinesBetween = getBlankLinesBetweenNodes(comment, nextComment);
					if (blankLinesBetween > 0) {
						parts.push(hardline);
					}
				} else if (isLastComment && node.type !== 'JSXText') {
					// Preserve a blank line between the last comment and the node if it existed
					const blankLinesBetween = getBlankLinesBetweenNodes(comment, node);
					if (blankLinesBetween > 0) {
						parts.push(hardline);
					}
				}
			} else if (comment.type === 'Block') {
				parts.push('/*' + comment.value + '*/');

				// Check if comment and node are on the same line (for inline JSDoc comments)
				const isCommentInlineWithParen =
					isLastComment && isCommentFollowedBySameLineParen(comment, options);
				const isCommentOnSameLine =
					isLastComment && comment.loc && node.loc && comment.loc.end.line === node.loc.start.line;
				const shouldKeepOnSameLine = isCommentOnSameLine || isCommentInlineWithParen;

				if (!isInlineContext && !shouldKeepOnSameLine) {
					parts.push(hardline);

					// Check if there should be blank lines between this comment and the next
					if (nextComment) {
						const blankLinesBetween = getBlankLinesBetweenNodes(comment, nextComment);
						if (blankLinesBetween > 0) {
							parts.push(hardline);
						}
					} else if (isLastComment) {
						// Preserve a blank line between the last comment and the node if it existed
						const blankLinesBetween = getBlankLinesBetweenNodes(comment, node);
						if (blankLinesBetween > 0) {
							parts.push(hardline);
						}
					}
				} else {
					parts.push(' ');
				}
			}
		}
	}

	// Handle inner comments (for nodes with no children to attach to)
	const innerCommentParts = [];
	const innerComments = /** @type {AST.NodeWithMaybeComments} */ (node).innerComments;
	if (innerComments) {
		for (const comment of innerComments) {
			if (comment.type === 'Line') {
				innerCommentParts.push('//' + comment.value);
			} else if (comment.type === 'Block') {
				innerCommentParts.push('/*' + comment.value + '*/');
			}
		}
	}

	// A `prettier-ignore` directive keeps the node's original source verbatim.
	const commentNode = /** @type {AST.Node & AST.NodeWithMaybeComments} */ (node);
	const ignoreStart = /** @type {AST.NodeWithLocation} */ (node).start;
	const ignoreEnd = /** @type {AST.NodeWithLocation} */ (node).end;
	if (
		hasPrettierIgnore(commentNode) &&
		typeof options.originalText === 'string' &&
		typeof ignoreStart === 'number' &&
		typeof ignoreEnd === 'number'
	) {
		return finishRippleNode(
			commentNode,
			parts,
			replaceEndOfLine(options.originalText.slice(ignoreStart, ignoreEnd)),
		);
	}

	/** @type {Doc[] | Doc} */
	let nodeContent;

	switch (node.type) {
		case 'Program': {
			// Handle the body statements properly with whitespace preservation
			const statements = [];
			for (let i = 0; i < node.body.length; i++) {
				const statement = path.call(print, 'body', i);
				// If statement is an array, flatten it
				if (Array.isArray(statement)) {
					statements.push(statement);
				} else {
					statements.push(statement);
				}

				// Add spacing between top-level statements based on original formatting
				if (i < node.body.length - 1) {
					const currentStmt = node.body[i];
					const nextStmt = node.body[i + 1];

					// Only add spacing when explicitly needed
					if (shouldAddBlankLine(currentStmt, nextStmt)) {
						statements.push([line, line]); // blank line
					} else {
						statements.push(line); // single line break
					}
				}
			}

			// Prettier always adds a trailing newline to files
			// Add it unless the code is completely empty
			if (statements.length > 0) {
				nodeContent = [...statements, hardline];
			} else {
				nodeContent = statements;
			}
			break;
		}

		case 'ImportDeclaration':
			nodeContent = printImportDeclaration(node, path, options, print);
			break;

		case 'ExportNamedDeclaration':
			nodeContent = printExportNamedDeclaration(node, path, options, print);
			break;

		case 'ExportDefaultDeclaration':
			nodeContent = printExportDefaultDeclaration(node, path, options, print);
			break;

		case 'FunctionDeclaration':
			nodeContent = printFunctionDeclaration(node, path, options, print);
			break;

		case 'TSDeclareFunction':
			nodeContent = printTSDeclareFunction(node, path, options, print);
			break;

		case 'IfStatement':
			nodeContent = printIfStatement(node, path, options, print);
			break;
		case 'JSXIfExpression':
			nodeContent = [
				'@',
				printIfStatement(
					/** @type {AST.IfStatement} */ (/** @type {unknown} */ (node)),
					path,
					options,
					print,
					true,
				),
			];
			break;

		case 'ForOfStatement':
			nodeContent = printForOfStatement(node, path, options, print);
			break;
		case 'JSXForExpression':
			if (node.statementType === 'ForInStatement') {
				nodeContent = [
					'@',
					printForInStatement(
						/** @type {AST.ForInStatement} */ (/** @type {unknown} */ (node)),
						path,
						options,
						print,
					),
				];
			} else if (node.statementType === 'ForStatement') {
				nodeContent = [
					'@',
					printForStatement(
						/** @type {AST.ForStatement} */ (/** @type {unknown} */ (node)),
						path,
						options,
						print,
					),
				];
			} else {
				nodeContent = [
					'@',
					printForOfStatement(
						/** @type {AST.ForOfStatement} */ (/** @type {unknown} */ (node)),
						path,
						options,
						print,
						true,
					),
				];
			}
			break;

		case 'ForStatement':
			nodeContent = printForStatement(node, path, options, print);
			break;

		case 'ForInStatement':
			nodeContent = printForInStatement(node, path, options, print);
			break;

		case 'WhileStatement':
			nodeContent = printWhileStatement(node, path, options, print);
			break;

		case 'DoWhileStatement':
			nodeContent = printDoWhileStatement(node, path, options, print);
			break;

		case 'ClassDeclaration':
		case 'ClassExpression':
			nodeContent = printClassDeclaration(node, path, options, print);
			break;

		case 'TryStatement':
			nodeContent = printTryStatement(node, path, options, print);
			break;
		case 'JSXTryExpression':
			nodeContent = [
				'@',
				printTryStatement(
					/** @type {AST.TryStatement} */ (/** @type {unknown} */ (node)),
					path,
					options,
					print,
					true,
				),
			];
			break;

		case 'ArrayExpression': {
			if (!node.elements || node.elements.length === 0) {
				nodeContent = '[]';
				break;
			}

			// Check if any element is an object expression
			let hasObjectElements = false;
			for (let i = 0; i < node.elements.length; i++) {
				const element = node.elements[i];
				if (element && element.type === 'ObjectExpression') {
					hasObjectElements = true;
					break;
				}
			}
			let shouldInlineObjects = false;

			// Check if this array is inside an attribute
			const isInAttribute = args && args.isInAttribute;
			const suppressLeadingCommentIndices = new Set();
			const inlineCommentsBetween = new Array(Math.max(node.elements.length - 1, 0)).fill(null);

			for (let index = 0; index < node.elements.length - 1; index++) {
				const currentElement = /** @type {AST.Expression | AST.SpreadElement} */ (
					node.elements[index]
				);
				const nextElement = node.elements[index + 1];
				if (
					!nextElement ||
					!nextElement.leadingComments ||
					nextElement.leadingComments.length === 0
				) {
					continue;
				}

				const canTransferAllLeadingComments = nextElement.leadingComments.every(
					(/** @type {AST.Comment} */ comment) =>
						canAttachLeadingCommentToPreviousElement(comment, currentElement, nextElement),
				);

				if (!canTransferAllLeadingComments) {
					continue;
				}

				const inlineCommentDoc = buildInlineArrayCommentDoc(nextElement.leadingComments);
				if (inlineCommentDoc) {
					inlineCommentsBetween[index] = inlineCommentDoc;
					suppressLeadingCommentIndices.add(index + 1);
				}
			}

			// Check if all elements are objects with multiple properties
			// In that case, each object should be on its own line
			const objectElements = node.elements.filter((el) => el && el.type === 'ObjectExpression');
			const allElementsAreObjects =
				node.elements.length > 0 &&
				node.elements.every((el) => el && el.type === 'ObjectExpression');
			const allObjectsHaveMultipleProperties =
				allElementsAreObjects &&
				objectElements.length > 0 &&
				objectElements.every(
					(obj) =>
						/** @type {AST.ObjectExpression} */ (obj).properties &&
						/** @type {AST.ObjectExpression} */ (obj).properties.length > 1,
				);

			// For arrays of simple objects with only a few properties, try to keep compact
			// But NOT if all objects have multiple properties
			if (hasObjectElements && !allObjectsHaveMultipleProperties) {
				shouldInlineObjects = true;
				for (let i = 0; i < node.elements.length; i++) {
					const element = node.elements[i];
					if (element && element.type === 'ObjectExpression') {
						if (!isSingleLineObjectExpression(element)) {
							shouldInlineObjects = false;
							break;
						}
					}
				}
			}

			// Default printing - pass isInArray or isInAttribute context
			const arrayWasSingleLine = wasOriginallySingleLine(node);
			const shouldUseTrailingComma = options.trailingComma !== 'none';
			const elements = path.map(
				/**
				 * @param {AstPath} elPath
				 * @param {number} index
				 */
				(elPath, index) => {
					const childNode = node.elements[index];
					/** @type {PrintArgs} */
					const childArgs = {};

					if (suppressLeadingCommentIndices.has(index)) {
						childArgs.suppressLeadingComments = true;
					}

					if (isInAttribute) {
						childArgs.isInAttribute = true;
						return print(elPath, childArgs);
					}

					if (
						hasObjectElements &&
						childNode &&
						childNode.type === 'ObjectExpression' &&
						shouldInlineObjects
					) {
						childArgs.isInArray = true;
						childArgs.allowInlineObject = true;
						return print(elPath, childArgs);
					}

					if (hasObjectElements) {
						childArgs.isInArray = true;
					}

					return Object.keys(childArgs).length > 0 ? print(elPath, childArgs) : print(elPath);
				},
				'elements',
			);

			if (hasObjectElements && shouldInlineObjects && arrayWasSingleLine) {
				const separator = [',', line];
				const trailing = shouldUseTrailingComma ? ifBreak(',', '') : '';
				nodeContent = group([
					'[',
					indent([softline, join(separator, elements), trailing]),
					softline,
					']',
				]);
				break;
			}

			// Arrays should inline all elements unless:
			// 1. An element (not first) has blank line above it - then that element on new line with blank
			// 2. Elements don't fit within printWidth
			// 3. Array contains objects and every object has more than 1 property - each object on own line

			// Check which elements have blank lines above them
			const elementsWithBlankLineAbove = [];

			// Check for blank line after opening bracket (before first element)
			// This indicates the array should be collapsed, not preserved as multiline
			let hasBlankLineAfterOpening = false;
			if (node.elements.length > 0 && node.elements[0]) {
				const firstElement = node.elements[0];
				// Check if first element starts on a different line than the opening bracket
				// and there's a blank line between them
				if (firstElement.loc && node.loc) {
					const bracketLine = node.loc.start.line;
					const firstElementLine = firstElement.loc.start.line;
					// If there's more than one line between bracket and first element, there's a blank line
					if (firstElementLine - bracketLine > 1) {
						hasBlankLineAfterOpening = true;
					}
				}
			}

			// Check for blank line before closing bracket (after last element)
			let hasBlankLineBeforeClosing = false;
			if (node.elements.length > 0 && node.elements[node.elements.length - 1]) {
				const lastElement = node.elements[node.elements.length - 1];
				if (lastElement?.loc && node.loc) {
					const lastElementLine = lastElement.loc.end.line;
					const closingBracketLine = node.loc.end.line;
					// If there's more than one line between last element and closing bracket, there's a blank line
					if (closingBracketLine - lastElementLine > 1) {
						hasBlankLineBeforeClosing = true;
					}
				}
			}

			for (let i = 1; i < node.elements.length; i++) {
				const prevElement = node.elements[i - 1];
				const currentElement = node.elements[i];
				if (!prevElement || !currentElement) {
					continue;
				}

				const leadingComments = currentElement.leadingComments || [];
				if (leadingComments.length > 0) {
					const firstComment = leadingComments[0];
					const lastComment = leadingComments[leadingComments.length - 1];

					const linesBeforeComment = getBlankLinesBetweenNodes(prevElement, firstComment);
					const linesAfterComment = getBlankLinesBetweenNodes(lastComment, currentElement);

					if (linesBeforeComment > 0 || linesAfterComment > 0) {
						elementsWithBlankLineAbove.push(i);
					}
					continue;
				}

				if (getBlankLinesBetweenNodes(prevElement, currentElement) > 0) {
					elementsWithBlankLineAbove.push(i);
				}
			}

			const hasAnyBlankLines = elementsWithBlankLineAbove.length > 0;

			// Check if any elements contain hard breaks (like multiline ternaries)
			// Don't check willBreak() as that includes soft breaks from groups
			// Only check for actual multiline content that forces breaking
			const hasHardBreakingElements = node.elements.some((el) => {
				if (!el) return false;
				// Multiline ternaries are the main case that should force all elements on separate lines
				return el.type === 'ConditionalExpression';
			});

			if (!hasAnyBlankLines && !allObjectsHaveMultipleProperties && !hasHardBreakingElements) {
				// Check if array has inline comments between elements
				const hasInlineComments = inlineCommentsBetween.some((comment) => comment !== null);

				// For arrays originally formatted with one element per line (no blank lines between),
				// preserve that formatting using join() with hardline - BUT only if no inline comments
				// and no blank lines at boundaries
				if (
					!arrayWasSingleLine &&
					!hasBlankLineAfterOpening &&
					!hasBlankLineBeforeClosing &&
					!hasInlineComments
				) {
					const separator = [',', hardline];
					const trailingDoc = shouldUseTrailingComma ? ',' : '';
					nodeContent = group([
						'[',
						indent([hardline, join(separator, elements), trailingDoc]),
						hardline,
						']',
					]);
					break;
				}

				// For arrays that should collapse (single-line or blank after opening) or have comments,
				// use fill() to pack elements
				const fillParts = [];
				let skipNextSeparator = false;
				for (let index = 0; index < elements.length; index++) {
					if (index > 0) {
						if (skipNextSeparator) {
							skipNextSeparator = false;
						} else {
							fillParts.push(line);
						}
					}

					if (index < elements.length - 1) {
						const inlineCommentDoc = inlineCommentsBetween[index];

						if (inlineCommentDoc) {
							// Build comment without leading space for separate-line version
							const nextElement = node.elements[index + 1];
							const commentParts = [];
							if (nextElement && nextElement.leadingComments) {
								for (const comment of nextElement.leadingComments) {
									if (comment.type === 'Block') {
										commentParts.push('/*' + comment.value + '*/');
									} else if (comment.type === 'Line') {
										commentParts.push('//' + comment.value);
									}
								}
							}
							const commentDocNoSpace = commentParts.length > 0 ? commentParts : '';

							// Provide conditional rendering: inline if it fits, otherwise on separate line
							fillParts.push(
								conditionalGroup([
									// Try inline first (with space before comment)
									[elements[index], ',', inlineCommentDoc, hardline],
									// If doesn't fit, put comment on next line (without leading space)
									[elements[index], ',', hardline, commentDocNoSpace, hardline],
								]),
							);
							skipNextSeparator = true;
						} else {
							fillParts.push(group([elements[index], ',']));
							skipNextSeparator = false;
						}
					} else {
						fillParts.push(elements[index]);
						skipNextSeparator = false;
					}
				}

				const trailingDoc = shouldUseTrailingComma ? ifBreak(',', '') : '';
				nodeContent = group(['[', indent([softline, fill(fillParts), trailingDoc]), softline, ']']);
				break;
			}

			// If array has breaking elements (multiline ternaries, functions, etc.)
			// use join() to put each element on its own line, per Prettier spec
			if (hasHardBreakingElements) {
				const separator = [',', line];
				/** @type {Doc[]} */
				const parts = [];
				for (let index = 0; index < elements.length; index++) {
					parts.push(elements[index]);
				}
				const trailingDoc = shouldUseTrailingComma ? ifBreak(',', '') : '';
				nodeContent = group([
					'[',
					indent([softline, join(separator, parts), trailingDoc]),
					softline,
					']',
				]);
				break;
			}

			// If array has multi-property objects, force each object on its own line
			// Objects that were originally inline can stay inline if they fit printWidth
			// Objects that were originally multi-line should stay multi-line
			if (allObjectsHaveMultipleProperties) {
				const inlineElements = path.map((elPath, index) => {
					const obj = node.elements[index];
					const wasObjSingleLine =
						obj && obj.type === 'ObjectExpression' && wasOriginallySingleLine(obj);
					return print(elPath, {
						isInArray: true,
						allowInlineObject: wasObjSingleLine || undefined,
					});
				}, 'elements');
				const separator = [',', hardline];
				const trailingDoc = shouldUseTrailingComma ? ifBreak(',', '') : '';
				nodeContent = group([
					'[',
					indent([hardline, join(separator, inlineElements), trailingDoc]),
					hardline,
					']',
				]);
				break;
			}

			// Has blank lines - format with blank lines preserved
			// Group elements between blank lines together so they can inline
			const contentParts = [];

			// Split elements into groups separated by blank lines
			/** @type {number[][]} */
			const groups = [];
			/** @type {number[]} */
			let currentGroup = [];

			for (let i = 0; i < elements.length; i++) {
				const hasBlankLineAbove = elementsWithBlankLineAbove.includes(i);

				if (hasBlankLineAbove && currentGroup.length > 0) {
					// Save current group and start new one
					groups.push(currentGroup);
					currentGroup = [i];
				} else {
					currentGroup.push(i);
				}
			}

			// Don't forget the last group
			if (currentGroup.length > 0) {
				groups.push(currentGroup);
			}

			// Now output each group
			for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
				const group_indices = groups[groupIdx];

				// Add blank line before this group (except first group)
				if (groupIdx > 0) {
					contentParts.push(hardline);
					contentParts.push(hardline);
				}

				// Build the group elements
				// Use fill() to automatically pack as many elements as fit per line
				// IMPORTANT: Each element+comma needs to be grouped for proper width calculation
				const fillParts = [];
				for (let i = 0; i < group_indices.length; i++) {
					const elemIdx = group_indices[i];
					const isLastInArray = elemIdx === elements.length - 1;

					if (i > 0) {
						fillParts.push(line);
					}
					// Wrap element+comma in group so fill() measures them together including breaks
					// But don't add comma to the very last element (it gets trailing comma separately)
					if (isLastInArray && shouldUseTrailingComma) {
						fillParts.push(group(elements[elemIdx]));
					} else {
						fillParts.push(group([elements[elemIdx], ',']));
					}
				}

				contentParts.push(fill(fillParts));
			}

			// Add trailing comma only if the last element didn't already have one
			if (shouldUseTrailingComma) {
				contentParts.push(',');
			}

			// Array with blank lines - format as multi-line
			// Use simple group that will break to fit within printWidth
			nodeContent = group(['[', indent([line, contentParts]), line, ']']);
			break;
		}

		case 'ObjectExpression':
			nodeContent = printObjectExpression(node, path, options, print, args);
			break;

		case 'ClassBody':
			nodeContent = printClassBody(node, path, options, print);
			break;

		case 'PropertyDefinition':
			nodeContent = printPropertyDefinition(node, path, options, print);
			break;

		case 'MethodDefinition':
			nodeContent = printMethodDefinition(node, path, options, print);
			break;

		case 'PrivateIdentifier':
			nodeContent = '#' + node.name;
			break;

		case 'AssignmentExpression': {
			// Print left side with noBreakInside context to keep calls compact
			let leftPart = path.call((p) => print(p, { noBreakInside: true }), 'left');
			// Preserve parentheses around the left side when present
			if (node.left.metadata?.parenthesized) {
				leftPart = ['(', leftPart, ')'];
			}
			// For CallExpression on the right with JSDoc comments, use fluid layout strategy
			const rightSide = path.call(print, 'right');

			// Use fluid layout for assignments: allows breaking after operator first
			const groupId = Symbol('assignment');
			nodeContent = group([
				group(leftPart),
				' ',
				node.operator,
				group(indent(line), { id: groupId }),
				indentIfBreak(rightSide, { groupId }),
			]);
			const parent = path.getParentNode();
			if (assignmentExpressionNeedsParens(node, parent)) {
				nodeContent = ['(', nodeContent, ')'];
			}
			break;
		}

		case 'MemberExpression':
			nodeContent = printMemberExpression(node, path, options, print);
			break;

		case 'MetaProperty':
			// Prints import.meta, new.target, etc.
			nodeContent = [path.call(print, 'meta'), '.', path.call(print, 'property')];
			break;

		case 'Super':
			nodeContent = 'super';
			break;

		case 'ThisExpression':
			nodeContent = 'this';
			break;

		case 'ChainExpression':
			nodeContent = path.call(print, 'expression');
			break;

		case 'ImportExpression': {
			/** @type {Doc[]} */
			const parts = ['import(', path.call(print, 'source')];
			if (node.options) {
				parts.push(', ', path.call(print, 'options'));
			}
			parts.push(')');
			nodeContent = parts;
			break;
		}

		case 'CallExpression': {
			/** @type {Doc[]} */
			const parts = [];
			let calleePart = path.call(print, 'callee');
			const calleeNeedsParens =
				node.callee.metadata?.parenthesized &&
				(node.callee.type === 'ArrowFunctionExpression' ||
					node.callee.type === 'FunctionExpression' ||
					node.callee.type === 'TSAsExpression' ||
					node.callee.type === 'TSSatisfiesExpression');
			if (calleeNeedsParens) {
				calleePart = ['(', calleePart, ')'];
			}
			parts.push(calleePart);

			if (node.optional) {
				parts.push('?.');
			}

			// Add TypeScript generics if present
			if (node.typeArguments) {
				parts.push(path.call(print, 'typeArguments'));
			}

			const argsDoc = printCallArguments(path, options, print);
			parts.push(argsDoc);

			let callContent = parts;

			// Preserve parentheses for type-annotated call expressions
			// When parenthesized with leading comments, use grouping to allow breaking
			if (node.metadata?.parenthesized) {
				const hasLeadingComments = node.leadingComments && node.leadingComments.length > 0;
				if (hasLeadingComments) {
					// Group with softline to allow breaking after opening paren
					callContent = /** @type {Doc[]} */ ([
						group(['(', indent([softline, callContent]), softline, ')']),
					]);
				} else {
					callContent = ['(', callContent, ')'];
				}
			}
			nodeContent = callContent;
			break;
		}

		case 'AwaitExpression': {
			/** @type {Doc[]} */
			const parts = ['await ', path.call(print, 'argument')];
			nodeContent = parts;
			break;
		}

		case 'StyleSheet': {
			// StyleSheet nodes inside <style> elements. When CSS is empty/whitespace-only,
			// return empty string so the element collapses to <style></style>.
			// Non-empty stylesheets are normally handled by embed() using textToDoc with the CSS parser.
			if (!node.source || !node.source.trim()) {
				nodeContent = '';
			} else {
				nodeContent = node.source.trim();
			}
			break;
		}

		case 'UnaryExpression':
			nodeContent = printUnaryExpression(node, path, options, print);
			break;

		case 'YieldExpression':
			nodeContent = printYieldExpression(node, path, options, print);
			break;

		case 'TSAsExpression': {
			const typeAnnotation = path.call(
				(typePath) => print(typePath, { preferInlineSimpleUnionType: true }),
				'typeAnnotation',
			);
			nodeContent =
				node.typeAnnotation.type !== 'TSTypeLiteral' && willBreak(typeAnnotation)
					? [path.call(print, 'expression'), ' as', indent([line, typeAnnotation])]
					: [path.call(print, 'expression'), ' as ', typeAnnotation];
			break;
		}

		case 'TSSatisfiesExpression': {
			const typeAnnotation = path.call(
				(typePath) => print(typePath, { preferInlineSimpleUnionType: true }),
				'typeAnnotation',
			);
			nodeContent =
				node.typeAnnotation.type !== 'TSTypeLiteral' && willBreak(typeAnnotation)
					? [path.call(print, 'expression'), ' satisfies', indent([line, typeAnnotation])]
					: [path.call(print, 'expression'), ' satisfies ', typeAnnotation];
			break;
		}

		case 'TSNonNullExpression': {
			const expression = path.call(print, 'expression');
			const needsParens =
				node.expression.type === 'TSAsExpression' ||
				node.expression.type === 'TSSatisfiesExpression';
			nodeContent = needsParens ? ['(', expression, ')!'] : [expression, '!'];
			break;
		}

		case 'TSInstantiationExpression': {
			// Explicit type instantiation: foo<Type>, identity<string>
			nodeContent = [path.call(print, 'expression'), path.call(print, 'typeArguments')];
			break;
		}

		case 'JSXExpressionContainer': {
			nodeContent = ['{', path.call(print, 'expression'), '}'];
			break;
		}

		case 'NewExpression':
			nodeContent = printNewExpression(node, path, options, print);
			break;
		case 'TemplateLiteral':
			nodeContent = printTemplateLiteral(node, path, options, print);
			break;

		case 'TaggedTemplateExpression':
			nodeContent = printTaggedTemplateExpression(node, path, options, print);
			break;

		case 'ThrowStatement':
			nodeContent = printThrowStatement(node, path, options, print);
			break;

		case 'TSInterfaceDeclaration':
			nodeContent = printTSInterfaceDeclaration(node, path, options, print);
			break;

		case 'TSTypeAliasDeclaration':
			nodeContent = printTSTypeAliasDeclaration(node, path, options, print);
			break;

		case 'TSEnumDeclaration':
			nodeContent = printTSEnumDeclaration(node, path, options, print);
			break;

		case 'TSTypeParameterDeclaration':
			nodeContent = printTSTypeParameterDeclaration(node, path, options, print);
			break;

		case 'TSTypeParameter':
			nodeContent = printTSTypeParameter(node, path, options, print);
			break;

		case 'TSTypeParameterInstantiation':
			nodeContent = printTSTypeParameterInstantiation(node, path, options, print);
			break;

		case 'TSSymbolKeyword':
			nodeContent = 'symbol';
			break;

		case 'TSAnyKeyword':
			nodeContent = 'any';
			break;

		case 'TSUnknownKeyword':
			nodeContent = 'unknown';
			break;

		case 'TSNeverKeyword':
			nodeContent = 'never';
			break;

		case 'TSVoidKeyword':
			nodeContent = 'void';
			break;

		case 'TSUndefinedKeyword':
			nodeContent = 'undefined';
			break;

		case 'TSNullKeyword':
			nodeContent = 'null';
			break;

		case 'TSNumberKeyword':
			nodeContent = 'number';
			break;

		case 'TSBigIntKeyword':
			nodeContent = 'bigint';
			break;

		case 'TSObjectKeyword':
			nodeContent = 'object';
			break;

		case 'TSBooleanKeyword':
			nodeContent = 'boolean';
			break;

		case 'TSStringKeyword':
			nodeContent = 'string';
			break;

		case 'EmptyStatement':
			nodeContent = '';
			break;

		case 'TSInterfaceBody':
			nodeContent = printTSInterfaceBody(node, path, options, print);
			break;

		case 'SwitchStatement':
			nodeContent = printSwitchStatement(node, path, options, print);
			break;
		case 'JSXSwitchExpression':
			nodeContent = printJSXSwitchExpression(
				/** @type {AST.SwitchStatement} */ (/** @type {unknown} */ (node)),
				path,
				options,
				print,
			);
			break;

		case 'SwitchCase':
			nodeContent = printSwitchCase(node, path, options, print);
			break;

		case 'BreakStatement':
			nodeContent = printBreakStatement(node, path, options, print);
			break;

		case 'ContinueStatement':
			nodeContent = printContinueStatement(node, path, options, print);
			break;

		case 'DebuggerStatement':
			nodeContent = printDebuggerStatement(node, path, options);
			break;

		case 'SequenceExpression':
			nodeContent = printSequenceExpression(node, path, options, print);
			break;

		case 'SpreadElement': {
			const argumentDoc = path.call(print, 'argument');
			// Wrap argument in parens if it's a low-precedence logical expression (e.g., nullish coalescing)
			// that needs them for correct parsing
			const needsParens =
				node.argument.type === 'LogicalExpression' && node.argument.operator === '??';
			if (needsParens) {
				nodeContent = ['...(', argumentDoc, ')'];
			} else {
				nodeContent = ['...', argumentDoc];
			}
			break;
		}
		case 'RestElement': {
			/** @type {Doc[]} */
			const parts = ['...', path.call(print, 'argument')];
			if (node.typeAnnotation) {
				parts.push(': ', path.call(print, 'typeAnnotation'));
			}
			nodeContent = parts;
			break;
		}
		case 'VariableDeclaration':
			nodeContent = printVariableDeclaration(node, path, options, print);
			break;

		case 'ExpressionStatement': {
			// Object literals at statement position need parentheses to avoid ambiguity with blocks
			const needsParens = node.expression.type === 'ObjectExpression';
			if (needsParens) {
				nodeContent = ['(', path.call(print, 'expression'), ')', semi(options)];
			} else {
				nodeContent = [path.call(print, 'expression'), semi(options)];
			}
			break;
		}
		case 'Identifier': {
			// Simple case - just return the name directly like Prettier core
			let identifierContent;
			if (node.typeAnnotation) {
				const optionalMarker = node.optional ? '?' : '';
				identifierContent = [node.name, optionalMarker, ': ', path.call(print, 'typeAnnotation')];
			} else {
				identifierContent = node.name;
			}
			// Preserve parentheses for type-cast identifiers, but only if:
			// 1. The identifier itself is marked as parenthesized
			// 2. The parent is NOT handling parentheses itself (MemberExpression, AssignmentExpression, etc.)
			const parent = path.getParentNode();
			const parentHandlesParens =
				parent &&
				(parent.type === 'MemberExpression' ||
					(parent.type === 'AssignmentExpression' && parent.left === node));
			const shouldAddParens = node.metadata?.parenthesized && !parentHandlesParens;
			if (shouldAddParens) {
				nodeContent = ['(', identifierContent, ')'];
			} else {
				nodeContent = identifierContent;
			}
			break;
		}
		case 'Literal':
			// Handle regex literals specially
			const node_typed = /** @type {AST.RegExpLiteral} */ (node);
			if (node_typed.regex) {
				// Regex literal: use the raw representation
				nodeContent = node_typed.raw || `/${node_typed.regex.pattern}/${node_typed.regex.flags}`;
			} else {
				// String, number, boolean, or null literal
				nodeContent = formatStringLiteral(node.value, options);
			}
			break;

		case 'ArrowFunctionExpression':
			nodeContent = printArrowFunction(node, path, options, print, args);
			break;

		case 'FunctionExpression':
			nodeContent = printFunctionExpression(node, path, options, print);
			break;

		case 'TSModuleBlock':
		case 'BlockStatement': {
			// Apply the same block formatting pattern throughout TSRX.
			if (!node.body || node.body.length === 0) {
				// Handle innerComments for empty blocks
				if (innerCommentParts.length > 0) {
					const blockNode = /** @type {AST.BlockStatement} */ (node);
					// Check if we need to preserve blank lines between comments
					if (blockNode.innerComments && blockNode.innerComments.length > 0) {
						const commentDocs = [];
						const comments = blockNode.innerComments;

						for (let i = 0; i < comments.length; i++) {
							const comment = comments[i];
							const prevComment = i > 0 ? comments[i - 1] : null;

							// Check if there's a blank line before this comment
							const hasBlankLineBefore =
								prevComment && getBlankLinesBetweenNodes(prevComment, comment) > 0;

							/** @type {Doc | undefined} */
							let commentDoc;
							if (comment.type === 'Line') {
								commentDoc = '//' + comment.value;
							} else if (comment.type === 'Block') {
								commentDoc = '/*' + comment.value + '*/';
							}

							if (commentDoc !== undefined) {
								commentDocs.push({ doc: commentDoc, hasBlankLineBefore });
							}
						}

						// Build the content with proper spacing
						const contentParts = [];
						for (let i = 0; i < commentDocs.length; i++) {
							const { doc, hasBlankLineBefore } = commentDocs[i];

							if (i > 0) {
								// Add blank line if needed (two hardlines = one blank line)
								if (hasBlankLineBefore) {
									contentParts.push(hardline);
									contentParts.push(hardline);
								} else {
									contentParts.push(hardline);
								}
							}

							contentParts.push(doc);
						}

						nodeContent = group(['{', indent([hardline, contentParts]), hardline, '}']);
						break;
					} else {
						// Fallback to simple join
						nodeContent = group([
							'{',
							indent([hardline, join(hardline, innerCommentParts)]),
							hardline,
							'}',
						]);
						break;
					}
				}

				// Control flow statements (if, for, while, etc.) get expanded empty blocks
				// to match standard Prettier behavior. Functions/methods keep `{}`.
				const blockParent = path.getParentNode();
				const isControlFlow =
					blockParent &&
					(blockParent.type === 'IfStatement' ||
						blockParent.type === 'ForStatement' ||
						blockParent.type === 'ForInStatement' ||
						blockParent.type === 'ForOfStatement' ||
						blockParent.type === 'WhileStatement' ||
						blockParent.type === 'DoWhileStatement' ||
						blockParent.type === 'TryStatement' ||
						blockParent.type === 'CatchClause' ||
						blockParent.type === 'SwitchCase' ||
						blockParent.type === 'JSXIfExpression' ||
						blockParent.type === 'JSXForExpression' ||
						blockParent.type === 'JSXTryExpression' ||
						blockParent.type === 'JSXSwitchExpression');

				if (isControlFlow) {
					nodeContent = ['{', hardline, '}'];
				} else {
					nodeContent = '{}';
				}
				break;
			}

			// Process statements and handle spacing using shouldAddBlankLine
			/** @type {Doc[]} */
			const statements = [];
			for (let i = 0; i < node.body.length; i++) {
				const statement = path.call(print, 'body', i);
				statements.push(statement);

				// Handle blank lines between statements
				if (i < node.body.length - 1) {
					const currentStmt = node.body[i];
					const nextStmt = node.body[i + 1];

					if (shouldAddBlankLine(currentStmt, nextStmt)) {
						statements.push(hardline, hardline); // Blank line = two hardlines
					} else {
						statements.push(hardline); // Normal line break
					}
				}
			}

			// Use proper block statement pattern
			nodeContent = group(['{', indent([hardline, statements]), hardline, '}']);
			break;
		}

		case 'TSModuleDeclaration': {
			nodeContent = [
				node.metadata?.module_keyword ?? 'module',
				' ',
				path.call(print, 'id'),
				' ',
				path.call(print, 'body'),
			];
			break;
		}

		case 'ReturnStatement': {
			/** @type {Doc[]} */
			const parts = ['return'];
			if (node.argument) {
				parts.push(' ');
				parts.push(path.call(print, 'argument'));
			}
			parts.push(semi(options));
			nodeContent = parts;
			break;
		}

		case 'BinaryExpression': {
			// Check if we're in an assignment/declaration context where parent handles indentation
			const parent = path.getParentNode();
			const shouldNotIndent =
				parent &&
				(parent.type === 'VariableDeclarator' ||
					parent.type === 'AssignmentExpression' ||
					parent.type === 'AssignmentPattern');

			let result;
			// Don't add indent if we're in a conditional test context
			if (args?.isConditionalTest) {
				result = group([
					path.call((childPath) => print(childPath, { isConditionalTest: true }), 'left'),
					' ',
					node.operator,
					[line, path.call((childPath) => print(childPath, { isConditionalTest: true }), 'right')],
				]);
			} else if (shouldNotIndent) {
				// In assignment context, don't add indent - parent will handle it
				result = group([
					path.call(print, 'left'),
					' ',
					node.operator,
					[line, path.call(print, 'right')],
				]);
			} else {
				result = group([
					path.call(print, 'left'),
					' ',
					node.operator,
					indent([line, path.call(print, 'right')]),
				]);
			}

			// Wrap in parentheses only if semantically necessary
			if (binaryExpressionNeedsParens(node, parent)) {
				result = ['(', result, ')'];
			}

			nodeContent = result;
			break;
		}
		case 'LogicalExpression': {
			const logicalParent = path.getParentNode();
			let logicalResult;
			const rightIsNullLiteral = node.right.type === 'Literal' && node.right.value === null;
			const shouldKeepNullishFallbackInline =
				node.operator === '??' &&
				rightIsNullLiteral &&
				(node.left.type === 'CallExpression' ||
					node.left.type === 'ChainExpression' ||
					node.left.type === 'NewExpression');
			if (shouldKeepNullishFallbackInline) {
				logicalResult = group([
					path.call(print, 'left'),
					' ',
					node.operator,
					' ',
					path.call(print, 'right'),
				]);
			} else if (args?.isConditionalTest) {
				// Don't add indent if we're in a conditional test context
				logicalResult = group([
					path.call((childPath) => print(childPath, { isConditionalTest: true }), 'left'),
					' ',
					node.operator,
					[line, path.call((childPath) => print(childPath, { isConditionalTest: true }), 'right')],
				]);
			} else {
				logicalResult = group([
					path.call(print, 'left'),
					' ',
					node.operator,
					indent([line, path.call(print, 'right')]),
				]);
			}

			// Wrap in parentheses only if semantically necessary
			if (binaryExpressionNeedsParens(node, logicalParent)) {
				logicalResult = ['(', logicalResult, ')'];
			}

			nodeContent = logicalResult;
			break;
		}

		case 'ConditionalExpression': {
			// Use Prettier's grouping to handle line breaking when exceeding printWidth
			// For the test expression, if it's a LogicalExpression or BinaryExpression,
			// tell it not to add its own indentation since we're in a conditional context
			const testNeedsContext =
				node.test.type === 'LogicalExpression' || node.test.type === 'BinaryExpression';
			const testDoc = testNeedsContext
				? path.call((childPath) => print(childPath, { isConditionalTest: true }), 'test')
				: path.call(print, 'test');

			// Check if we have nested ternaries (but not if they're parenthesized, which keeps them inline)
			const hasUnparenthesizedNestedConditional =
				(node.consequent.type === 'ConditionalExpression' &&
					!node.consequent.metadata?.parenthesized) ||
				(node.alternate.type === 'ConditionalExpression' &&
					!node.alternate.metadata?.parenthesized);

			// If we have unparenthesized nested ternaries, tell the children they're nested
			const consequentDoc =
				hasUnparenthesizedNestedConditional &&
				node.consequent.type === 'ConditionalExpression' &&
				!node.consequent.metadata?.parenthesized
					? path.call((childPath) => print(childPath, { isNestedConditional: true }), 'consequent')
					: path.call(print, 'consequent');
			const alternateDoc =
				hasUnparenthesizedNestedConditional &&
				node.alternate.type === 'ConditionalExpression' &&
				!node.alternate.metadata?.parenthesized
					? path.call((childPath) => print(childPath, { isNestedConditional: true }), 'alternate')
					: path.call(print, 'alternate');

			// Check if the consequent or alternate will break
			const consequentBreaks = willBreak(consequentDoc);
			const alternateBreaks = willBreak(alternateDoc);

			// Helper to determine if a node type already handles its own indentation
			const hasOwnIndentation = (/** @type {string} */ nodeType) => {
				return nodeType === 'BinaryExpression' || nodeType === 'LogicalExpression';
			};

			let result;
			// If either branch breaks OR we have unparenthesized nested ternaries OR we're already nested, use multiline format
			if (
				consequentBreaks ||
				alternateBreaks ||
				hasUnparenthesizedNestedConditional ||
				args?.isNestedConditional
			) {
				// Only add extra indent if the expression doesn't handle its own indentation
				// AND it's not a nested conditional (which already gets indented by its parent)
				const shouldIndentConsequent =
					!hasOwnIndentation(node.consequent.type) &&
					node.consequent.type !== 'ConditionalExpression';
				const shouldIndentAlternate =
					!hasOwnIndentation(node.alternate.type) &&
					node.alternate.type !== 'ConditionalExpression';

				result = [
					testDoc,
					indent([line, '? ', shouldIndentConsequent ? indent(consequentDoc) : consequentDoc]),
					indent([line, ': ', shouldIndentAlternate ? indent(alternateDoc) : alternateDoc]),
				];
			} else {
				// Otherwise try inline first, then multiline if it doesn't fit
				const shouldIndentConsequent =
					!hasOwnIndentation(node.consequent.type) &&
					node.consequent.type !== 'ConditionalExpression';
				const shouldIndentAlternate =
					!hasOwnIndentation(node.alternate.type) &&
					node.alternate.type !== 'ConditionalExpression';

				result = conditionalGroup([
					// Try inline first
					[testDoc, ' ? ', consequentDoc, ' : ', alternateDoc],
					// If inline doesn't fit, use multiline
					[
						testDoc,
						indent([line, '? ', shouldIndentConsequent ? indent(consequentDoc) : consequentDoc]),
						indent([line, ': ', shouldIndentAlternate ? indent(alternateDoc) : alternateDoc]),
					],
				]);
			}

			// Wrap in parentheses if metadata indicates they were present
			if (node.metadata?.parenthesized) {
				result = ['(', result, ')'];
			}

			nodeContent = result;
			break;
		}

		case 'UpdateExpression':
			if (node.prefix) {
				nodeContent = [node.operator, path.call(print, 'argument')];
			} else {
				nodeContent = [path.call(print, 'argument'), node.operator];
			}
			break;

		case 'TSArrayType': {
			/** @type {Doc[]} */
			const parts = [path.call(print, 'elementType'), '[]'];
			nodeContent = parts;
			break;
		}

		case 'MemberExpression':
			nodeContent = printMemberExpression(node, path, options, print);
			break;

		case 'ObjectPattern':
			nodeContent = node.lazy
				? ['&', printObjectPattern(node, path, options, print)]
				: printObjectPattern(node, path, options, print);
			break;

		case 'ArrayPattern':
			nodeContent = node.lazy
				? ['&', printArrayPattern(node, path, options, print)]
				: printArrayPattern(node, path, options, print);
			break;

		case 'Property':
			nodeContent = printProperty(node, path, options, print);
			break;

		case 'VariableDeclarator':
			nodeContent = printVariableDeclarator(node, path, options, print);
			break;

		case 'AssignmentPattern':
			nodeContent = printAssignmentPattern(node, path, options, print);
			break;

		case 'TSTypeAnnotation': {
			nodeContent = path.call(print, 'typeAnnotation');
			break;
		}

		case 'TSTypeLiteral':
			nodeContent = printTSTypeLiteral(node, path, options, print);
			break;

		case 'TSPropertySignature':
			nodeContent = printTSPropertySignature(node, path, options, print);
			break;

		case 'TSMethodSignature':
			nodeContent = printTSMethodSignature(node, path, options, print);
			break;

		case 'TSCallSignatureDeclaration':
			nodeContent = printTSCallSignatureDeclaration(node, path, options, print);
			break;

		case 'TSConstructSignatureDeclaration':
			nodeContent = printTSConstructSignatureDeclaration(node, path, options, print);
			break;

		case 'TSEnumMember':
			nodeContent = printTSEnumMember(node, path, options, print);
			break;
		case 'TSLiteralType':
			nodeContent = path.call(print, 'literal');
			break;

		case 'TSUnionType': {
			nodeContent = printTSUnionType(node, path, print, args);
			break;
		}

		case 'TSIntersectionType': {
			const types = path.map(print, 'types');
			nodeContent = join(' & ', types);
			break;
		}

		case 'TSTypeReference':
			nodeContent = printTSTypeReference(node, path, options, print);
			break;

		case 'TSTypeOperator': {
			const operator = node.operator;
			const type = path.call(print, 'typeAnnotation');
			nodeContent = [operator, ' ', type];
			break;
		}

		case 'TSTypeQuery': {
			const expr = path.call(print, 'exprName');
			nodeContent = ['typeof ', expr];
			break;
		}

		case 'TSFunctionType': {
			/** @type {Doc[]} */
			const parts = [];

			// Handle parameters
			parts.push('(');
			if (node.parameters && node.parameters.length > 0) {
				const params = path.map(print, 'parameters');
				for (let i = 0; i < params.length; i++) {
					if (i > 0) parts.push(', ');
					parts.push(params[i]);
				}
			}
			parts.push(')');

			// Handle return type
			parts.push(' => ');
			if (node.typeAnnotation) {
				parts.push(path.call(print, 'typeAnnotation'));
			}

			nodeContent = parts;
			break;
		}

		case 'TSTupleType':
			nodeContent = printTSTupleType(node, path, options, print);
			break;

		case 'TSNamedTupleMember':
			nodeContent = printTSNamedTupleMember(node, path, options, print);
			break;

		case 'TSRestType':
			nodeContent = ['...', path.call(print, 'typeAnnotation')];
			break;

		case 'TSOptionalType':
			nodeContent = [path.call(print, 'typeAnnotation'), '?'];
			break;

		case 'TSIndexSignature':
			nodeContent = printTSIndexSignature(node, path, options, print);
			break;

		case 'TSConstructorType':
			nodeContent = printTSConstructorType(node, path, options, print);
			break;

		case 'TSConditionalType':
			nodeContent = printTSConditionalType(node, path, options, print);
			break;
		case 'TSInferType':
			nodeContent = ['infer ', path.call(print, 'typeParameter')];
			break;

		case 'TSMappedType':
			nodeContent = printTSMappedType(node, path, options, print);
			break;

		case 'TSQualifiedName':
			nodeContent = printTSQualifiedName(node, path, options, print);
			break;

		case 'TSImportType':
			nodeContent = printTSImportType(node, path, options, print);
			break;

		case 'TSIndexedAccessType':
			nodeContent = printTSIndexedAccessType(node, path, options, print);
			break;

		case 'TSParenthesizedType': {
			nodeContent = ['(', path.call(print, 'typeAnnotation'), ')'];
			break;
		}

		case 'TSExpressionWithTypeArguments': {
			/** @type {Doc[]} */
			const parts = [];
			parts.push(path.call(print, 'expression'));

			if (node.typeParameters) {
				parts.push(path.call(print, 'typeParameters'));
			}

			nodeContent = parts;
			break;
		}

		case 'JSXCodeBlock':
			nodeContent = printJSXCodeBlock(node, path, options, print);
			break;

		case 'JSXStyleElement':
			nodeContent = printJSXElement(node, path, options, print);
			break;

		case 'JSXElement':
			nodeContent = printJSXElement(/** @type {AST.TSRXJSXElement} */ (node), path, options, print);
			break;

		case 'JSXFragment':
			nodeContent = printJSXFragment(
				/** @type {AST.TSRXJSXFragment} */ (node),
				path,
				options,
				print,
			);
			break;

		case 'JSXText':
			nodeContent = printRawText(node.value);
			break;

		case 'JSXEmptyExpression':
			// JSXEmptyExpression represents the empty expression in {/* comment */}
			// The comments are attached as innerComments by the parser
			if (innerCommentParts.length > 0) {
				nodeContent = innerCommentParts;
			} else {
				nodeContent = '';
			}
			break;

		case 'JSXAttribute':
			nodeContent = printJSXAttribute(node, path, options, print);
			break;

		case 'JSXSpreadAttribute': {
			nodeContent = ['{...', path.call(print, 'argument'), '}'];
			break;
		}

		default:
			// Fallback for unknown node types
			console.warn('Unknown node type:', node.type);
			nodeContent = '/* Unknown: ' + node.type + ' */';
			break;
	}

	return finishRippleNode(/** @type {AST.Node} */ (node), parts, nodeContent);
}

/**
 * Print an import declaration
 * @param {AST.ImportDeclaration} node - The import declaration node
 * @param {AstPath<AST.ImportDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} _print - Print callback (unused)
 * @returns {Doc[]}
 */
function printImportDeclaration(node, path, options, _print) {
	/** @type {Doc[]} */
	const parts = ['import'];

	// Handle type imports
	if (node.importKind === 'type') {
		parts.push(' type');
	}

	if (node.specifiers && node.specifiers.length > 0) {
		/** @type {string[]} */
		const defaultImports = [];
		/** @type {string[]} */
		const namedImports = [];
		/** @type {string[]} */
		const namespaceImports = [];

		node.specifiers.forEach((/** @type {AST.Node} */ spec) => {
			if (spec.type === 'ImportDefaultSpecifier') {
				defaultImports.push(/** @type {string} */ (spec.local.name));
			} else if (spec.type === 'ImportSpecifier') {
				// Handle inline type imports: import { type Component } from 'ripple'
				const typePrefix = spec.importKind === 'type' ? 'type ' : '';
				const importedName = /** @type {AST.Identifier} */ (spec.imported).name;
				const localName = spec.local.name;
				const importName =
					importedName === localName
						? typePrefix + localName
						: typePrefix + importedName + ' as ' + localName;
				namedImports.push(importName);
			} else if (spec.type === 'ImportNamespaceSpecifier') {
				namespaceImports.push('* as ' + /** @type {string} */ (spec.local.name));
			}
		});

		// Build import clause with proper grouping and line breaking
		/** @type {Doc[]} */
		const importClauseParts = [];

		if (defaultImports.length > 0) {
			importClauseParts.push(defaultImports.join(', '));
		}
		if (namespaceImports.length > 0) {
			importClauseParts.push(namespaceImports.join(', '));
		}
		if (namedImports.length > 0) {
			// Use Prettier's group and conditionalGroup for named imports to handle line breaking
			const namedImportsDocs = namedImports.map((name) => name);
			const namedImportsGroup = group([
				'{',
				indent([options.bracketSpacing ? line : softline, join([',', line], namedImportsDocs)]),
				ifBreak(shouldPrintComma(options) ? ',' : ''),
				options.bracketSpacing ? line : softline,
				'}',
			]);
			importClauseParts.push(namedImportsGroup);
		}

		parts.push(' ');
		if (importClauseParts.length === 1 && typeof importClauseParts[0] === 'object') {
			parts.push(importClauseParts[0]);
		} else {
			parts.push(/** @type {Doc} */ (join(', ', /** @type {string[]} */ (importClauseParts))));
		}
		parts.push(' from');
	}

	const source = /** @type {AST.Literal | AST.Identifier} */ (/** @type {unknown} */ (node.source));
	const sourceDoc =
		source.type === 'Identifier'
			? source.name
			: formatStringLiteral(/** @type {string} */ (source.value), options);

	parts.push(' ', sourceDoc, semi(options));

	return parts;
}

/**
 * Print an export named declaration
 * @param {AST.ExportNamedDeclaration} node - The export declaration node
 * @param {AstPath<AST.ExportNamedDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[] | Doc}
 */
function printExportNamedDeclaration(node, path, options, print) {
	if (node.declaration) {
		/** @type {Doc[]} */
		const parts = [];
		parts.push('export ');
		parts.push(path.call(print, 'declaration'));
		return parts;
	} else if (node.specifiers && node.specifiers.length > 0) {
		const specifiers = node.specifiers.map((spec) => {
			const exportedName = /** @type {AST.Identifier} */ (spec.exported).name;
			const localName = /** @type {AST.Identifier} */ (spec.local).name;
			if (exportedName === localName) {
				return localName;
			} else {
				return localName + ' as ' + exportedName;
			}
		});

		const parts = ['export { '];
		for (let i = 0; i < specifiers.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(specifiers[i]);
		}
		parts.push(' }');

		if (node.source) {
			const source = /** @type {AST.Literal | AST.Identifier} */ (
				/** @type {unknown} */ (node.source)
			);
			parts.push(' from ');
			parts.push(
				source.type === 'Identifier'
					? source.name
					: formatStringLiteral(/** @type {string} */ (source.value), options),
			);
		}
		parts.push(semi(options));

		return parts;
	}

	return 'export';
}

/**
 * Print a variable declaration
 * @param {AST.VariableDeclaration} node - The variable declaration node
 * @param {AstPath<AST.VariableDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printVariableDeclaration(node, path, options, print) {
	const kind = node.kind || 'let';

	// Don't add semicolon ONLY if this is part of a for loop header
	// - ForStatement: the init part
	// - ForOfStatement: the left part
	const parentNode = /** @type {AST.Node | null} */ (path.getParentNode());
	const isForLoopInit =
		(parentNode && parentNode.type === 'ForStatement' && parentNode.init === node) ||
		(parentNode && parentNode.type === 'ForOfStatement' && parentNode.left === node) ||
		(parentNode && parentNode.type === 'ForInStatement' && parentNode.left === node) ||
		(parentNode &&
			parentNode.type === 'JSXForExpression' &&
			(parentNode.statementType === 'ForStatement'
				? parentNode.init === node
				: parentNode.left === node));

	const declarations = path.map(print, 'declarations');
	const declarationParts = join(', ', declarations);

	if (!isForLoopInit) {
		return [kind, ' ', declarationParts, semi(options)];
	}

	return [kind, ' ', declarationParts];
}

/**
 * Print a function expression
 * @param {AST.FunctionExpression} node - The function expression node
 * @param {AstPath<AST.FunctionExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printFunctionExpression(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Handle async functions
	if (node.async) {
		parts.push('async ');
	}

	parts.push('function');

	// Handle generator functions
	if (node.generator) {
		parts.push('*');
	}

	// Function name (if any)
	if (node.id) {
		parts.push(' ');
		parts.push(node.id.name);
	}

	// Add TypeScript generics if present
	if (node.typeParameters) {
		// Only add space if there's no function name
		if (!node.id) {
			parts.push(' ');
		}
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	} else if (!node.id) {
		// If no name and no type parameters, add space before params
		parts.push(' ');
	}

	// Print parameters using shared function
	const paramsPart = printFunctionParameters(path, options, print);
	parts.push(group(paramsPart)); // Handle return type annotation
	if (node.returnType) {
		parts.push(': ', path.call(print, 'returnType'));
	}

	parts.push(' ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Print an arrow function expression
 * @param {AST.ArrowFunctionExpression} node - The arrow function node
 * @param {AstPath<AST.ArrowFunctionExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @param {PrintArgs} [args] - Additional context arguments
 * @returns {Doc}
 */
function printArrowFunction(node, path, options, print, args) {
	/** @type {Doc[]} */
	const parts = [];

	if (node.async) {
		parts.push('async ');
	}

	// Add TypeScript generics if present
	if (node.typeParameters) {
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	}

	// Handle single param without parens (when arrowParens !== 'always')
	// Note: can't use single param syntax if there are type parameters or return type
	if (
		options.arrowParens !== 'always' &&
		node.params &&
		node.params.length === 1 &&
		node.params[0].type === 'Identifier' &&
		!node.params[0].typeAnnotation &&
		!node.returnType &&
		!node.typeParameters
	) {
		parts.push(path.call(print, 'params', 0));
	} else {
		// Print parameters using shared function
		const paramsPart = printFunctionParameters(path, options, print);
		parts.push(group(paramsPart));
	} // Handle return type annotation
	if (node.returnType) {
		parts.push(': ', path.call(print, 'returnType'));
	}

	// For block statements, print the body directly to get proper formatting
	if (node.body.type === 'BlockStatement') {
		parts.push(' => ');
		parts.push(path.call(print, 'body'));
	} else {
		// For expression bodies, check if we need to wrap in parens
		// Wrap ObjectExpression, AssignmentExpression, and SequenceExpression in parens
		// to avoid ambiguity with block statements or to clarify intent
		const bodyDoc = path.call(print, 'body');
		const groupId = Symbol('arrow');
		const shouldBreakBody = shouldBreakArrowExpressionBody(node.body, options, args);
		/** @type {Doc | Doc[]} */
		let bodyContent;
		if (
			node.body.type === 'ObjectExpression' ||
			node.body.type === 'AssignmentExpression' ||
			node.body.type === 'SequenceExpression'
		) {
			bodyContent = ['(', bodyDoc, ')'];
		} else {
			bodyContent = bodyDoc;
		}
		if (shouldBreakBody) {
			parts.push(' =>', indent([hardline, bodyContent]));
		} else {
			if (isTemplateExpression(node.body)) {
				return conditionalGroup([
					group([...parts, ' => ', bodyContent]),
					group([...parts, ' =>', indent([hardline, bodyContent])]),
				]);
			}
			parts.push(
				' =>',
				group(indent(line), { id: groupId }),
				indentIfBreak(bodyContent, { groupId }),
			);
		}
	}

	return group(parts);
}

/**
 * Check whether an expression is one of TSRX's template expression wrappers.
 * @param {AST.Node} node - The node to check
 * @returns {boolean}
 */
function isTemplateExpression(node) {
	return node.type === 'JSXElement' || node.type === 'JSXFragment';
}

/**
 * Check whether a braced attribute expression should close on its own line.
 * @param {AST.Node} node - The expression inside the attribute braces
 * @param {RippleFormatOptions} options
 * @param {AST.Node} [attributeNode]
 * @returns {boolean}
 */
function shouldBreakAttributeExpressionClosingBrace(node, options, attributeNode = node) {
	return (
		node.type === 'ArrowFunctionExpression' &&
		node.body &&
		isTemplateExpression(node.body) &&
		sourceSpanExceedsPrintWidth(
			/** @type {AST.NodeWithLocation} */ (/** @type {unknown} */ (attributeNode ?? node)),
			options,
		)
	);
}

/**
 * Print an export default declaration
 * @param {AST.ExportDefaultDeclaration} node - The export default node
 * @param {AstPath<AST.ExportDefaultDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printExportDefaultDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('export default ');
	parts.push(path.call(print, 'declaration'));
	return parts;
}

/**
 * Check if the only function parameter should be hugged (no extra parens)
 * @param {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction} node - The function node
 * @returns {boolean}
 */
function shouldHugTheOnlyFunctionParameter(node) {
	if (!node) {
		return false;
	}
	const parameters = getFunctionParameters(node);
	if (parameters.length !== 1) {
		return false;
	}
	const [parameter] = parameters;
	return (
		!hasComment(parameter) &&
		(parameter.type === 'ObjectPattern' ||
			parameter.type === 'ArrayPattern' ||
			(parameter.type === 'Identifier' &&
				!!parameter.typeAnnotation &&
				parameter.typeAnnotation.type === 'TSTypeAnnotation'))
	);
}

/**
 * Print function parameters with proper formatting
 * @param {AstPath<AST.FunctionExpression | AST.ArrowFunctionExpression | AST.TSDeclareFunction | AST.FunctionDeclaration>} path - The function path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printFunctionParameters(path, options, print) {
	const functionNode = path.node;
	const parameters = getFunctionParameters(functionNode);

	if (parameters.length === 0) {
		return ['(', ')'];
	}

	const shouldHugParameters = shouldHugTheOnlyFunctionParameter(functionNode);
	/** @type {Doc[]} */
	const printed = [];

	iterateFunctionParametersPath(path, (parameterPath, index) => {
		const isLastParameter = index === parameters.length - 1;

		printed.push(print(parameterPath));

		if (!isLastParameter) {
			printed.push(',');
			if (shouldHugParameters) {
				printed.push(' ');
			} else if (isNextLineEmpty(parameters[index], options)) {
				printed.push(hardline, hardline);
			} else {
				printed.push(line);
			}
		}
	});

	const hasNotParameterDecorator = parameters.every(
		(node) =>
			!(/** @type {AST.Identifier} */ (node).decorators) ||
			/** @type {AST.Identifier} */ (node).decorators.length === 0,
	);

	if (shouldHugParameters && hasNotParameterDecorator) {
		return ['(', ...printed, ')'];
	}

	return [
		'(',
		indent([softline, ...printed]),
		ifBreak(shouldPrintComma(options, 'all') && !hasRestParameter(functionNode) ? ',' : ''),
		softline,
		')',
	];
}

/**
 * Check if a node is spread-like (SpreadElement or RestElement)
 * @param {AST.Node} node - The AST node
 * @returns {boolean}
 */
function isSpreadLike(node) {
	return node && (node.type === 'SpreadElement' || node.type === 'RestElement');
}

/**
 * Check if a node is a block-like function (function expression or arrow with block body)
 * @param {AST.Node} node - The AST node
 * @returns {boolean}
 */
function isBlockLikeFunction(node) {
	if (!node) {
		return false;
	}
	if (node.type === 'FunctionExpression') {
		return true;
	}
	if (node.type === 'ArrowFunctionExpression') {
		return node.body && node.body.type === 'BlockStatement';
	}
	return false;
}

/**
 * Determine if the last argument should be hugged (no line break before it)
 * @param {AST.CallExpression['arguments']} args - Array of arguments
 * @param {boolean[]} argumentBreakFlags - Flags indicating which args break
 * @returns {boolean}
 */
function shouldHugLastArgument(args, argumentBreakFlags) {
	if (!args || args.length === 0) {
		return false;
	}

	const lastIndex = args.length - 1;
	const lastArg = args[lastIndex];

	if (isSpreadLike(lastArg)) {
		return false;
	}

	if (!isBlockLikeFunction(lastArg)) {
		return false;
	}

	if (hasComment(lastArg)) {
		return false;
	}

	for (let index = 0; index < lastIndex; index++) {
		const argument = args[index];
		if (
			isSpreadLike(argument) ||
			hasComment(argument) ||
			isBlockLikeFunction(argument) ||
			isRegExpLiteral(argument) ||
			argumentBreakFlags[index]
		) {
			return false;
		}
	}

	return true;
}

/**
 * Check if arguments contain arrow functions with block bodies that should be hugged
 * @param {AST.CallExpression['arguments']} args - Array of arguments
 * @returns {boolean}
 */
function shouldHugArrowFunctions(args) {
	if (!args || args.length === 0) {
		return false;
	}

	// Only hug when the first argument is the block-like callback and there
	// are no other block-like callbacks later in the list. This mirrors how
	// Prettier keeps patterns like useEffect(() => {}, deps) inline while
	// allowing suffix callbacks (e.g. foo(regex, () => {})) to expand.
	const firstBlockIndex = args.findIndex((arg) => isBlockLikeFunction(arg));
	if (firstBlockIndex !== 0) {
		return false;
	}

	for (let index = 1; index < args.length; index++) {
		if (isBlockLikeFunction(args[index])) {
			return false;
		}
	}

	return firstBlockIndex === 0;
}

/**
 * Check whether a node's original source span exceeds the configured print width.
 * @param {AST.NodeWithLocation} node - The node to check
 * @param {RippleFormatOptions} options - Prettier options
 * @returns {boolean}
 */
function sourceSpanExceedsPrintWidth(node, options) {
	const printWidth = options.printWidth ?? 80;
	if (!options.originalText || node.start === undefined || node.end === undefined) {
		return false;
	}
	return options.originalText.slice(node.start, node.end).length > printWidth;
}

/**
 * Check if an arrow expression body should break immediately after `=>`.
 * @param {AST.Expression} node - The arrow body expression
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintArgs} [args] - Additional context arguments
 * @returns {boolean}
 */
function shouldBreakArrowExpressionBody(node, options, args) {
	return (
		(node.type === 'BinaryExpression' || node.type === 'LogicalExpression') &&
		sourceSpanExceedsPrintWidth(/** @type {AST.NodeWithLocation} */ (node), options)
	);
}

/**
 * Print call expression arguments
 * @param {AstPath<AST.CallExpression>} path - The call path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printCallArguments(path, options, print) {
	const { node } = path;
	const args = node.arguments || [];

	if (args.length === 0) {
		return '()';
	}

	// Check if last argument can be expanded (object or array)
	const finalArg = args[args.length - 1];
	const couldExpandLastArg =
		finalArg &&
		(finalArg.type === 'ObjectExpression' || finalArg.type === 'ArrayExpression') &&
		!hasComment(finalArg);

	/** @type {Doc[]} */
	const printedArguments = [];
	/** @type {Doc[]} */
	const argumentDocs = [];
	/** @type {boolean[]} */
	const argumentBreakFlags = [];
	let anyArgumentHasEmptyLine = false;

	path.each((argumentPath, index) => {
		const isLast = index === args.length - 1;
		const argumentNode = args[index];
		const printOptions = isBlockLikeFunction(argumentNode) ? undefined : { isInlineContext: true };

		// Print normally (not with expandLastArg yet - we'll do that later if needed)
		const argumentDoc = printOptions ? print(argumentPath, printOptions) : print(argumentPath);

		argumentDocs.push(argumentDoc);
		// Arrow functions with block bodies have internal breaks but shouldn't
		// cause the call arguments to break - they stay inline with the call
		const shouldTreatAsBreaking = willBreak(argumentDoc) && !isBlockLikeFunction(argumentNode);
		argumentBreakFlags.push(shouldTreatAsBreaking);

		if (!isLast) {
			if (isNextLineEmpty(argumentNode, options)) {
				anyArgumentHasEmptyLine = true;
				printedArguments.push([argumentDoc, ',', hardline, hardline]);
			} else {
				printedArguments.push([argumentDoc, ',', line]);
			}
		} else {
			printedArguments.push(argumentDoc);
		}
	}, 'arguments');
	const trailingComma = shouldPrintComma(options, 'all') ? ',' : '';

	// Special case: single array/object argument should keep opening delimiter inline
	const isSingleArrayArgument = args.length === 1 && args[0] && args[0].type === 'ArrayExpression';
	const isSingleObjectArgument =
		args.length === 1 && args[0] && args[0].type === 'ObjectExpression';

	if (isSingleArrayArgument || isSingleObjectArgument) {
		// Don't use group() - just concat to allow the argument to control its own breaking
		// For single argument, no trailing comma needed
		return ['(', argumentDocs[0], ')'];
	} // Check if we should hug arrow functions (keep params inline even when body breaks)
	const shouldHugArrows = shouldHugArrowFunctions(args);
	let huggedArrowDoc = null;

	// For arrow functions, we want to keep params on same line as opening paren
	// but allow the block body to break naturally
	if (shouldHugArrows && !anyArgumentHasEmptyLine) {
		// Build a version that keeps arguments inline with opening paren
		/** @type {Doc[]} */
		const huggedParts = ['('];

		for (let index = 0; index < args.length; index++) {
			if (index > 0) {
				huggedParts.push(', ');
			}
			huggedParts.push(argumentDocs[index]);
		}

		huggedParts.push(')');
		huggedArrowDoc = huggedParts;
	}

	// Build standard breaking version with indentation
	const contents = [
		'(',
		indent([softline, ...printedArguments]),
		ifBreak(trailingComma),
		softline,
		')',
	];

	const shouldForceBreak = anyArgumentHasEmptyLine;
	const shouldBreakForContent = argumentDocs.some((docPart) => docPart && willBreak(docPart));

	const groupedContents = group(contents, {
		shouldBreak: shouldForceBreak || shouldBreakForContent,
	});

	if (huggedArrowDoc) {
		return conditionalGroup([huggedArrowDoc, groupedContents]);
	}

	const lastIndex = args.length - 1;
	const lastArg = args[lastIndex];
	const lastArgDoc = argumentDocs[lastIndex];
	const lastArgBreaks = lastArgDoc ? willBreak(lastArgDoc) : false;
	const previousArgsBreak =
		lastIndex > 0 ? argumentBreakFlags.slice(0, lastIndex).some(Boolean) : false;
	const isExpandableLastArgType =
		lastArg && (lastArg.type === 'ObjectExpression' || lastArg.type === 'ArrayExpression');

	// Check if we should expand the last argument (like Prettier's shouldExpandLastArg)
	const shouldExpandLast =
		args.length > 1 && couldExpandLastArg && !previousArgsBreak && !anyArgumentHasEmptyLine;

	if (shouldExpandLast) {
		const headArgs = argumentDocs.slice(0, -1);

		// Re-print the last arg with expandLastArg: true
		const expandedLastArg = path.call(
			(argPath) => print(argPath, { isInlineContext: true, expandLastArg: true }),
			'arguments',
			lastIndex,
		);

		// Build the inline version: head args inline + expanded last arg
		/** @type {Doc[]} */
		const inlinePartsWithExpanded = ['('];
		for (let index = 0; index < headArgs.length; index++) {
			if (index > 0) {
				inlinePartsWithExpanded.push(', ');
			}
			inlinePartsWithExpanded.push(headArgs[index]);
		}
		if (headArgs.length > 0) {
			inlinePartsWithExpanded.push(', ');
		}
		inlinePartsWithExpanded.push(group(expandedLastArg, { shouldBreak: true }));
		inlinePartsWithExpanded.push(')');

		return conditionalGroup([
			// Try with normal formatting first
			['(', ...argumentDocs.flatMap((doc, i) => (i > 0 ? [', ', doc] : [doc])), ')'],
			// Then try with expanded last arg
			inlinePartsWithExpanded,
			// Finally fall back to all args broken out
			groupedContents,
		]);
	}

	const canInlineLastArg =
		args.length > 1 &&
		isExpandableLastArgType &&
		lastArgBreaks &&
		!previousArgsBreak &&
		!anyArgumentHasEmptyLine &&
		!hasComment(lastArg);

	if (canInlineLastArg) {
		/** @type {Doc[]} */
		const inlineParts = ['('];
		for (let index = 0; index < argumentDocs.length; index++) {
			if (index > 0) {
				inlineParts.push(', ');
			}
			inlineParts.push(argumentDocs[index]);
		}
		inlineParts.push(')');

		return conditionalGroup([inlineParts, groupedContents]);
	}

	if (!anyArgumentHasEmptyLine && shouldHugLastArgument(args, argumentBreakFlags)) {
		const lastIndex = args.length - 1;
		/** @type {Doc[]} */
		const inlineParts = ['('];

		for (let index = 0; index < lastIndex; index++) {
			if (index > 0) {
				inlineParts.push(', ');
			}
			inlineParts.push(argumentDocs[index]);
		}

		if (lastIndex > 0) {
			inlineParts.push(', ');
		}

		inlineParts.push(argumentDocs[lastIndex]);
		inlineParts.push(')');

		return conditionalGroup([group(inlineParts), groupedContents]);
	}

	return groupedContents;
}

/**
 * Print TSDeclareFunction (TypeScript function overload declaration)
 * These are function signatures without bodies, ending with semicolon
 * @param {AST.TSDeclareFunction} node - The TS function declaration node
 * @param {AstPath<AST.TSDeclareFunction>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSDeclareFunction(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Handle declare modifier for ambient declarations
	if (node.declare) {
		parts.push('declare ');
	}

	// Handle async functions
	if (node.async) {
		parts.push('async ');
	}

	parts.push('function');

	// Handle generator functions
	if (node.generator) {
		parts.push('*');
	}

	// Handle function name (may be null for anonymous default exports)
	if (node.id) {
		parts.push(' ');
		parts.push(node.id.name);
	}

	// Add TypeScript generics if present
	if (node.typeParameters) {
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	}

	// Print parameters using shared function
	const paramsPart = printFunctionParameters(path, options, print);
	parts.push(group(paramsPart));

	// Handle return type annotation
	if (node.returnType) {
		parts.push(': ', path.call(print, 'returnType'));
	}

	// TSDeclareFunction ends with semicolon, no body
	parts.push(';');

	return parts;
}

/**
 * Print a function declaration
 * @param {AST.FunctionDeclaration} node - The function declaration node
 * @param {AstPath<AST.FunctionDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printFunctionDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Handle async functions
	if (node.async) {
		parts.push('async ');
	}

	parts.push('function');

	// Handle generator functions
	if (node.generator) {
		parts.push('*');
	}

	parts.push(' ');
	parts.push(node.id.name);

	// Add TypeScript generics if present
	if (node.typeParameters) {
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	}

	// Print parameters using shared function
	const paramsPart = printFunctionParameters(path, options, print);
	parts.push(group(paramsPart));

	// Handle return type annotation
	if (node.returnType) {
		parts.push(': ', path.call(print, 'returnType'));
	}

	parts.push(' ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Extract and print leading comments from a node before a control flow statement keyword
 * @param {AST.Node} node - The node that may have leading comments
 * @returns {Doc[]} - Array of doc parts for the comments
 */
function extractAndPrintLeadingComments(node) {
	const leadingComments = node && node.leadingComments;
	/** @type {Doc[]} */
	const parts = [];

	if (leadingComments && leadingComments.length > 0) {
		for (let i = 0; i < leadingComments.length; i++) {
			const comment = leadingComments[i];
			const nextComment = leadingComments[i + 1];

			if (comment.type === 'Line') {
				parts.push('//' + comment.value);
				parts.push(hardline);

				// Check if there should be blank lines between comments
				if (nextComment) {
					const blankLinesBetween = getBlankLinesBetweenNodes(comment, nextComment);
					if (blankLinesBetween > 0) {
						parts.push(hardline);
					}
				}
			} else if (comment.type === 'Block') {
				parts.push('/*' + comment.value + '*/');
				parts.push(hardline);

				// Check if there should be blank lines between comments
				if (nextComment) {
					const blankLinesBetween = getBlankLinesBetweenNodes(comment, nextComment);
					if (blankLinesBetween > 0) {
						parts.push(hardline);
					}
				}
			}
		}
	}

	return parts;
}

/**
 * Print an if statement
 * @param {AST.IfStatement} node - The if statement node
 * @param {AstPath<AST.IfStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @param {boolean} [directive]
 * @returns {Doc[]}
 */
function printIfStatement(node, path, options, print, directive = false) {
	// Extract leading comments from test node to print them before 'if' keyword
	const testNode = node.test;

	// Print test without its leading comments (they'll be printed before 'if')
	const test = path.call((testPath) => print(testPath, { suppressLeadingComments: true }), 'test');
	const consequent = path.call(print, 'consequent');

	// Use group to allow breaking the test when it doesn't fit
	const testDoc = group(['if (', indent([softline, test]), softline, ')']);

	// Check if consequent is a block statement or another if statement
	const consequentIsBlock = node.consequent.type === 'BlockStatement';
	const consequentIsIf = node.consequent.type === 'IfStatement';

	/** @type {Doc[]} */
	const parts = [];

	// Print leading comments from test node before 'if' keyword
	parts.push(...extractAndPrintLeadingComments(testNode));

	parts.push(testDoc);

	// Handle the consequent
	if (consequentIsBlock) {
		// For block statements, add a space before the block
		parts.push(' ', consequent);
	} else if (consequentIsIf) {
		// For nested if statements, add a line break and indent
		parts.push(indent([hardline, consequent]));
	} else {
		// For other non-block statements, add a space
		parts.push(' ', consequent);
	}

	// Handle the alternate
	if (node.alternate) {
		// If consequent is not a block, add a hardline before else
		if (!consequentIsBlock) {
			parts.push(hardline);
		} else {
			parts.push(' ');
		}

		parts.push(directive ? '@else ' : 'else ');
		if (directive && node.alternate.type === 'IfStatement') {
			parts.push(
				path.call(
					(alternatePath) =>
						printIfStatement(
							/** @type {AST.IfStatement} */ (alternatePath.node),
							/** @type {AstPath<AST.IfStatement>} */ (alternatePath),
							options,
							print,
							true,
						),
					'alternate',
				),
			);
		} else {
			parts.push(path.call(print, 'alternate'));
		}
	}

	return parts;
}

/**
 * Print a for-in statement
 * @param {AST.ForInStatement} node - The for-in statement node
 * @param {AstPath<AST.ForInStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printForInStatement(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('for (');
	parts.push(path.call(print, 'left'));
	parts.push(' in ');
	parts.push(path.call(print, 'right'));

	parts.push(') ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Print a for-of statement (with Ripple index/key extensions)
 * @param {AST.ForOfStatement} node - The for-of statement node
 * @param {AstPath<AST.ForOfStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @param {boolean} [directive]
 * @returns {Doc[]}
 */
function printForOfStatement(node, path, options, print, directive = false) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('for (');
	parts.push(path.call(print, 'left'));
	parts.push(' of ');
	parts.push(path.call(print, 'right'));

	// Handle Ripple-specific index syntax
	if (node.index) {
		parts.push('; index ');
		parts.push(path.call(print, 'index'));
	}

	if (node.key) {
		parts.push('; key ');
		parts.push(path.call(print, 'key'));
	}

	parts.push(') ');
	parts.push(path.call(print, 'body'));
	if (node.empty) {
		parts.push(directive ? ' @empty ' : ' empty ');
		parts.push(path.call(print, 'empty'));
	}

	return parts;
}

/**
 * Print a for statement
 * @param {AST.ForStatement} node - The for statement node
 * @param {AstPath<AST.ForStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printForStatement(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('for (');

	// Handle init part
	if (node.init) {
		parts.push(path.call(print, 'init'));
	}
	parts.push(';');

	// Handle test part
	if (node.test) {
		parts.push(' ');
		parts.push(path.call(print, 'test'));
	}
	parts.push(';');

	// Handle update part
	if (node.update) {
		parts.push(' ');
		parts.push(path.call(print, 'update'));
	}

	parts.push(') ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Print a while statement
 * @param {AST.WhileStatement} node - The while statement node
 * @param {AstPath<AST.WhileStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printWhileStatement(node, path, options, print) {
	// Extract leading comments from test node to print them before 'while' keyword
	const testNode = node.test;

	// Print test without its leading comments (they'll be printed before 'while')
	const test = path.call((testPath) => print(testPath, { suppressLeadingComments: true }), 'test');

	/** @type {Doc[]} */
	const parts = [];

	// Print leading comments from test node before 'while' keyword
	parts.push(...extractAndPrintLeadingComments(testNode));

	parts.push('while (');
	parts.push(test);
	parts.push(') ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Print a do-while statement
 * @param {AST.DoWhileStatement} node - The do-while statement node
 * @param {AstPath<AST.DoWhileStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printDoWhileStatement(node, path, options, print) {
	// Extract leading comments from test node to print them before 'while' keyword
	const testNode = node.test;

	// Print test without its leading comments (they'll be printed before 'while')
	const test = path.call((testPath) => print(testPath, { suppressLeadingComments: true }), 'test');

	/** @type {Doc[]} */
	const parts = [];
	parts.push('do ');
	parts.push(path.call(print, 'body'));

	// Print leading comments from test node before 'while' keyword
	const commentParts = extractAndPrintLeadingComments(testNode);
	if (commentParts.length > 0) {
		parts.push(' ');
		parts.push(...commentParts);
	} else {
		parts.push(' ');
	}

	parts.push('while (');
	parts.push(test);
	parts.push(')');
	parts.push(semi(options));

	return parts;
}

/**
 * Print an object expression
 * @param {AST.ObjectExpression} node - The object expression node
 * @param {AstPath<AST.ObjectExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @param {PrintArgs} [args] - Additional context arguments
 * @returns {Doc}
 */
function printObjectExpression(node, path, options, print, args) {
	const open_brace = '{';
	const close_brace = '}';
	const skip_offset = 1;
	const closing_offset = 1;

	if (!node.properties || node.properties.length === 0) {
		return open_brace + close_brace;
	}

	// Check if there are blank lines between any properties
	let hasBlankLinesBetweenProperties = false;
	for (let i = 0; i < node.properties.length - 1; i++) {
		const current = node.properties[i];
		const next = node.properties[i + 1];
		if (current && next && getBlankLinesBetweenNodes(current, next) > 0) {
			hasBlankLinesBetweenProperties = true;
			break;
		}
	}

	// Check if object was originally multi-line
	let isOriginallyMultiLine = false;
	if (node.loc && node.loc.start && node.loc.end) {
		isOriginallyMultiLine = node.loc.start.line !== node.loc.end.line;
	}

	// Also check for blank lines at edges (after { or before })
	// If the original code has blank lines anywhere in the object, format multi-line
	let hasAnyBlankLines = hasBlankLinesBetweenProperties;
	if (!hasAnyBlankLines && node.properties.length > 0 && options.originalText) {
		const firstProp = node.properties[0];
		const lastProp = node.properties[node.properties.length - 1];

		// Check for blank line after opening brace (before first property)
		if (firstProp && firstProp.loc && node.loc && node.loc.start) {
			hasAnyBlankLines =
				getBlankLinesBetweenPositions(
					/** @type {acorn.Position} */ (node.loc.start).offset(skip_offset),
					firstProp.loc.start,
				) > 0;
		}

		// Check for blank line before closing brace (after last property)
		if (!hasAnyBlankLines && lastProp && lastProp.loc && node.loc && node.loc.end) {
			hasAnyBlankLines =
				getBlankLinesBetweenPositions(
					lastProp.loc.end,
					/** @type {acorn.Position} */ (node.loc.end).offset(-closing_offset),
				) > 0; // Skip closing delimiter(s): either '}' or '})'.
		}
	}

	// Check if we should try to format inline
	const isInArray = args && args.isInArray;
	const isInAttribute = args && args.isInAttribute;
	const isSimple = node.properties.length <= 2;
	// Only 1-property objects are considered very simple for compact formatting
	const isVerySimple = node.properties.length === 1;

	// Use AST builders and respect trailing commas
	const properties = path.map(print, 'properties');
	const shouldUseTrailingComma = options.trailingComma !== 'none' && properties.length > 0;

	// For arrays: very simple (1-prop) objects can be inline, 2-prop objects always multiline
	// For attributes: force inline for simple objects
	// BUT: if there are ANY blank lines in the object (between props or at edges), always use multi-line
	if (isSimple && (isInArray || isInAttribute) && !hasAnyBlankLines) {
		if (isInArray) {
			if (isVerySimple) {
				// 1-property objects: force inline with spaces
				return [open_brace, ' ', properties[0], ' ', close_brace];
			}
		}
	}

	if (args && args.allowInlineObject) {
		const separator = [',', line];
		const propertyDoc = join(separator, properties);
		const spacing = options.bracketSpacing === false ? softline : line;
		const trailingDoc = shouldUseTrailingComma ? ifBreak(',', '') : '';

		return group([open_brace, indent([spacing, propertyDoc, trailingDoc]), spacing, close_brace]);
	}

	// For objects that were originally inline (single-line) and don't have blank lines,
	// and aren't in arrays, allow inline formatting if it fits printWidth
	// This handles cases like `const T0: t17 = { x: 1 };` staying inline when it fits
	// The group() will automatically break to multi-line if it doesn't fit
	if (!hasAnyBlankLines && !isOriginallyMultiLine && !isInArray) {
		const separator = [',', line];
		const propertyDoc = join(separator, properties);
		const spacing = options.bracketSpacing === false ? softline : line;
		const trailingDoc = shouldUseTrailingComma ? ifBreak(',', '') : '';

		return group([open_brace, indent([spacing, propertyDoc, trailingDoc]), spacing, close_brace]);
	}

	/** @type {Doc[]} */
	let content = [hardline];
	if (properties.length > 0) {
		// Build properties with blank line preservation
		/** @type {Doc[]} */
		const propertyParts = [];
		for (let i = 0; i < properties.length; i++) {
			if (i > 0) {
				propertyParts.push(',');

				// Check for blank lines between properties and preserve them
				// Need to account for trailing comments on previous property and
				// leading comments on current property
				const prevProp = node.properties[i - 1];
				const currentProp = node.properties[i];

				// Determine the source node (end of previous property or its trailing comments)
				/** @type {AST.Property | AST.SpreadElement | AST.Comment} */
				let sourceNode = prevProp;
				if (prevProp && prevProp.trailingComments && prevProp.trailingComments.length > 0) {
					sourceNode = prevProp.trailingComments[prevProp.trailingComments.length - 1];
				}

				// Determine the target node (start of current property or its leading comments)
				/** @type {AST.Property | AST.SpreadElement | AST.Comment} */
				let targetNode = currentProp;
				if (currentProp && currentProp.leadingComments && currentProp.leadingComments.length > 0) {
					targetNode = currentProp.leadingComments[0];
				}

				if (sourceNode && targetNode && getBlankLinesBetweenNodes(sourceNode, targetNode) > 0) {
					propertyParts.push(hardline);
					propertyParts.push(hardline); // Two hardlines = blank line
				} else {
					propertyParts.push(hardline);
				}
			}
			propertyParts.push(properties[i]);
		}

		content.push(...propertyParts);
		if (shouldUseTrailingComma) {
			content.push(',');
		}
		content.push(hardline);
	}

	return group([
		open_brace,
		indent(content.slice(0, -1)),
		content[content.length - 1],
		close_brace,
	]);
}

/**
 * Print a class declaration
 * @param {AST.ClassDeclaration | AST.ClassExpression} node - The class node
 * @param {AstPath<AST.ClassDeclaration | AST.ClassExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printClassDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('class');

	// Class name (optional for ClassExpression)
	if (node.id) {
		parts.push(' ');
		parts.push(node.id.name);
	}

	// Add TypeScript generics if present
	if (node.typeParameters) {
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	}

	if (node.superClass) {
		parts.push(' extends ');
		parts.push(path.call(print, 'superClass'));
	}

	parts.push(' ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Print a try statement (with Ripple pending block extension)
 * @param {AST.TryStatement} node - The try statement node
 * @param {AstPath<AST.TryStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @param {boolean} [directive=false] - Whether this is a JSX @try expression.
 * @returns {Doc[]}
 */
function printTryStatement(node, path, options, print, directive = false) {
	// Extract leading comments from block node to print them before 'try' keyword
	const blockNode = node.block;

	// Print block without its leading comments (they'll be printed before 'try')
	const block = path.call(
		(blockPath) => print(blockPath, { suppressLeadingComments: true }),
		'block',
	);

	/** @type {Doc[]} */
	const parts = [];

	// Print leading comments from block node before 'try' keyword
	parts.push(...extractAndPrintLeadingComments(blockNode));

	parts.push('try ');
	parts.push(block);

	if (node.pending) {
		parts.push(directive ? ' @pending ' : ' pending ');
		parts.push(path.call(print, 'pending'));
	}

	if (node.handler) {
		parts.push(directive ? ' @catch' : ' catch');
		if (node.handler.param) {
			parts.push(' (');
			parts.push(path.call(print, 'handler', 'param'));
			if (node.handler.resetParam) {
				parts.push(', ');
				parts.push(path.call(print, 'handler', 'resetParam'));
			}
			parts.push(')');
		}
		parts.push(' ');
		parts.push(path.call(print, 'handler', 'body'));
	}

	if (node.finalizer) {
		parts.push(' finally ');
		parts.push(path.call(print, 'finalizer'));
	}

	return parts;
}

/**
 * Print a class body
 * @param {AST.ClassBody} node - The class body node
 * @param {AstPath<AST.ClassBody>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printClassBody(node, path, options, print) {
	if (!node.body || node.body.length === 0) {
		return '{}';
	}

	const members = path.map(print, 'body');

	// Build content with proper blank line handling
	const contentParts = [];
	for (let i = 0; i < members.length; i++) {
		if (i > 0) {
			// Check if we should add a blank line between members
			const prevNode = node.body[i - 1];
			const currNode = node.body[i];
			if (shouldAddBlankLine(prevNode, currNode)) {
				contentParts.push(line);
			}
		}
		contentParts.push(line);
		contentParts.push(members[i]);
	}

	return group(['{', indent(contentParts), line, '}']);
}

/**
 * Print a class property definition
 * @param {AST.PropertyDefinition} node - The property definition node
 * @param {AstPath<AST.PropertyDefinition>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printPropertyDefinition(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Access modifiers (public, private, protected)
	if (node.accessibility) {
		parts.push(node.accessibility);
		parts.push(' ');
	}

	// Static keyword
	if (node.static) {
		parts.push('static ');
	}

	// Readonly keyword
	if (node.readonly) {
		parts.push('readonly ');
	}

	// Property name
	parts.push(path.call(print, 'key'));

	// Optional marker
	if (node.optional) {
		parts.push('?');
	}

	// Type annotation
	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	// Initializer
	if (node.value) {
		parts.push(' = ');
		parts.push(path.call(print, 'value'));
	}

	parts.push(semi(options));

	return parts;
}

/**
 * Print a method definition
 * @param {AST.MethodDefinition} node - The method definition node
 * @param {AstPath<AST.MethodDefinition>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printMethodDefinition(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Access modifiers (public, private, protected)
	if (node.accessibility) {
		parts.push(node.accessibility);
		parts.push(' ');
	}

	// Static keyword
	if (node.static) {
		parts.push('static ');
	}

	// Method kind and name
	if (node.kind === 'constructor') {
		// skip as it's covered by the key
	} else if (node.kind === 'get') {
		parts.push('get ');
	} else if (node.kind === 'set') {
		parts.push('set ');
	}

	// Async keyword
	if (node.value && node.value.async) {
		parts.push('async ');
	}

	if (node.value.generator) {
		parts.push('*');
	}

	// the key is 'constructor' and we already handled that above
	parts.push(...printKey(node, path, options, print));

	// Add TypeScript generics if present (always on the method node, not on value)
	if (node.typeParameters) {
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	}

	// Parameters - use proper path.map for TypeScript support
	parts.push('(');
	if (node.value && node.value.params && node.value.params.length > 0) {
		const params = path.map(print, 'value', 'params');
		for (let i = 0; i < params.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(params[i]);
		}
	}
	parts.push(')');

	// Return type
	if (node.value && node.value.returnType) {
		parts.push(': ', path.call(print, 'value', 'returnType'));
	}

	// Method body
	parts.push(' ');
	if (node.value && node.value.body) {
		parts.push(path.call(print, 'value', 'body'));
	} else {
		parts.push('{}');
	}

	return parts;
}

/**
 * Print a member expression (object.property or object[property])
 * @param {AST.MemberExpression} node - The member expression node
 * @param {AstPath<AST.MemberExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printMemberExpression(node, path, options, print) {
	let objectPart = path.call(print, 'object');
	// Preserve parentheses around the object when present
	if (node.object.metadata?.parenthesized) {
		objectPart = ['(', objectPart, ')'];
	}
	const propertyPart = path.call(print, 'property');

	let result;
	if (node.computed) {
		const openBracket = node.optional ? '?.[' : '[';
		result = [objectPart, openBracket, propertyPart, ']'];
	} else {
		const separator = node.optional ? '?.' : '.';
		result = [objectPart, separator, propertyPart];
	}

	// Preserve parentheses around the entire member expression when present
	if (node.metadata?.parenthesized) {
		// Check if there are leading comments - if so, use group with softlines to allow breaking
		const hasLeadingComments = node.leadingComments && node.leadingComments.length > 0;
		if (hasLeadingComments) {
			result = group(['(', indent([softline, result]), softline, ')']);
		} else {
			result = ['(', result, ')'];
		}
	}

	return result;
}

/**
 * Print a unary expression
 * @param {AST.UnaryExpression} node - The unary expression node
 * @param {AstPath<AST.UnaryExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printUnaryExpression(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	if (node.prefix) {
		parts.push(node.operator);
		// Add space for word operators like 'void', 'typeof', 'delete'
		const needsSpace = /^[a-z]/.test(node.operator);
		if (needsSpace) {
			parts.push(' ');
		}
		const argumentDoc = path.call(print, 'argument');
		// Preserve parentheses around the argument when present
		if (node.argument.metadata?.parenthesized) {
			parts.push('(', argumentDoc, ')');
		} else {
			parts.push(argumentDoc);
		}
	} else {
		const argumentDoc = path.call(print, 'argument');
		// Preserve parentheses around the argument when present
		if (node.argument.metadata?.parenthesized) {
			parts.push('(', argumentDoc, ')');
		} else {
			parts.push(argumentDoc);
		}
		parts.push(node.operator);
	}

	return parts;
}

/**
 * Print a yield expression
 * @param {AST.YieldExpression} node - The yield expression node
 * @param {AstPath<AST.YieldExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printYieldExpression(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('yield');

	if (node.delegate) {
		parts.push('*');
	}

	if (node.argument) {
		parts.push(' ');
		parts.push(path.call(print, 'argument'));
	}

	return parts;
}

/**
 * Print a new expression
 * @param {AST.NewExpression} node - The new expression node
 * @param {AstPath<AST.NewExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printNewExpression(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('new ');
	parts.push(path.call(print, 'callee'));

	if (node.typeArguments) {
		parts.push(path.call(print, 'typeArguments'));
	}

	if (node.arguments && node.arguments.length > 0) {
		parts.push('(');
		const argList = path.map(print, 'arguments');
		for (let i = 0; i < argList.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(argList[i]);
		}
		parts.push(')');
	} else {
		parts.push('()');
	}

	return parts;
}

/**
 * Print a template literal
 * @param {AST.TemplateLiteral} node - The template literal node
 * @param {AstPath<AST.TemplateLiteral>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTemplateLiteral(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('`');

	for (let i = 0; i < node.expressions.length; i++) {
		parts.push(node.quasis[i].value.raw);

		const expression = node.expressions[i];
		const expressionDoc = path.call(print, 'expressions', i);

		// Check if the expression will break (e.g., ternary, binary, logical)
		const needsBreaking =
			expression.type === 'ConditionalExpression' ||
			expression.type === 'BinaryExpression' ||
			expression.type === 'LogicalExpression' ||
			willBreak(expressionDoc);

		if (needsBreaking) {
			// For expressions that break, use group with indent to format nicely
			parts.push(group(['${', indent([softline, expressionDoc]), softline, '}']));
		} else {
			// For simple expressions, keep them inline
			parts.push('${');
			parts.push(expressionDoc);
			parts.push('}');
		}
	}

	// Add the final quasi (text after the last expression)
	if (node.quasis.length > node.expressions.length) {
		parts.push(node.quasis[node.quasis.length - 1].value.raw);
	}

	parts.push('`');
	return parts;
}

/**
 * Print a tagged template expression
 * @param {AST.TaggedTemplateExpression} node - The tagged template node
 * @param {AstPath<AST.TaggedTemplateExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTaggedTemplateExpression(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push(path.call(print, 'tag'));
	parts.push(path.call(print, 'quasi'));
	return parts;
}

/**
 * Print a throw statement
 * @param {AST.ThrowStatement} node - The throw statement node
 * @param {AstPath<AST.ThrowStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printThrowStatement(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('throw ');
	parts.push(path.call(print, 'argument'));
	parts.push(semi(options));
	return parts;
}

/**
 * Print a TypeScript interface declaration
 * @param {AST.TSInterfaceDeclaration} node - The interface declaration node
 * @param {AstPath<AST.TSInterfaceDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSInterfaceDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('interface ');
	parts.push(node.id.name);

	if (node.typeParameters) {
		parts.push(path.call(print, 'typeParameters'));
	}

	// Handle extends clause
	if (node.extends && node.extends.length > 0) {
		parts.push(' extends ');
		const extendsTypes = path.map(print, 'extends');
		parts.push(join(', ', extendsTypes));
	}

	parts.push(' ');
	parts.push(path.call(print, 'body'));

	return parts;
}

/**
 * Print a TypeScript interface body
 * @param {AST.TSInterfaceBody} node - The interface body node
 * @param {AstPath<AST.TSInterfaceBody>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printTSInterfaceBody(node, path, options, print) {
	if (!node.body || node.body.length === 0) {
		return '{}';
	}

	const members = path.map(print, 'body');

	// Add semicolons to all members
	const membersWithSemicolons = members.map((member) => [member, semi(options)]);

	return group(['{', indent([hardline, join(hardline, membersWithSemicolons)]), hardline, '}']);
}

/**
 * Print a TypeScript type alias declaration
 * @param {AST.TSTypeAliasDeclaration} node - The type alias node
 * @param {AstPath<AST.TSTypeAliasDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printTSTypeAliasDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const head = ['type ', node.id.name];

	if (node.typeParameters) {
		head.push(path.call(print, 'typeParameters'));
	}

	if (node.typeAnnotation.type === 'TSTypeLiteral') {
		return group([head, ' = ', path.call(print, 'typeAnnotation'), semi(options)]);
	}

	return group([head, ' =', indent([line, path.call(print, 'typeAnnotation')]), semi(options)]);
}

/**
 * Print a TypeScript union type
 * @param {AST.TSUnionType} node - The union node
 * @param {AstPath<AST.TSUnionType>} path - The AST path
 * @param {PrintFn} print - Print callback
 * @param {PrintArgs} [args] - Additional context arguments
 * @returns {Doc}
 */
function printTSUnionType(node, path, print, args) {
	const types = path.map(print, 'types');
	const inlineDoc = join(' | ', types);
	const multilineDoc = [
		'| ',
		join(
			[hardline, '| '],
			types.map((typeDoc) => align(2, typeDoc)),
		),
	];
	const shouldBreak = node.types.some(
		(typeNode, index) => !wasOriginallySingleLine(typeNode) || willBreak(types[index]),
	);

	if (args?.preferInlineSimpleUnionType && !types.some((typeDoc) => willBreak(typeDoc))) {
		return inlineDoc;
	}

	return shouldBreak ? group(multilineDoc) : conditionalGroup([inlineDoc, multilineDoc]);
}

/**
 * Print a TypeScript enum declaration
 * @param {AST.TSEnumDeclaration} node - The enum declaration node
 * @param {AstPath<AST.TSEnumDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSEnumDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Handle 'const enum' vs 'enum'
	if (node.const) {
		parts.push('const ');
	}

	parts.push('enum ');
	parts.push(node.id.name);
	parts.push(' ');

	// Print enum body
	if (!node.members || node.members.length === 0) {
		parts.push('{}');
	} else {
		const members = path.map(print, 'members');
		const membersWithCommas = [];

		for (let i = 0; i < members.length; i++) {
			membersWithCommas.push(members[i]);
			if (i < members.length - 1) {
				membersWithCommas.push(',');
				membersWithCommas.push(hardline);
			}
		}

		parts.push(
			group([
				'{',
				indent([hardline, membersWithCommas]),
				options.trailingComma !== 'none' ? ',' : '',
				hardline,
				'}',
			]),
		);
	}

	return parts;
}

/**
 * Print a TypeScript enum member
 * @param {AST.TSEnumMember} node - The enum member node
 * @param {AstPath<AST.TSEnumMember>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSEnumMember(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Print the key (id)
	if (node.id.type === 'Identifier') {
		parts.push(node.id.name);
	} else {
		// Handle computed or string literal keys
		parts.push(path.call(print, 'id'));
	}

	// Print the initializer if present
	if (node.initializer) {
		parts.push(' = ');
		parts.push(path.call(print, 'initializer'));
	}

	return parts;
}

/**
 * Print TypeScript type parameter declaration (<T, U extends V>)
 * @param {AST.TSTypeParameterDeclaration} node - The type parameter declaration node
 * @param {AstPath<AST.TSTypeParameterDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[] | Doc}
 */
function printTSTypeParameterDeclaration(node, path, options, print) {
	if (!node.params || node.params.length === 0) {
		return '';
	}
	/** @type {Doc[]} */
	const parts = [];
	parts.push('<');
	const paramList = path.map(print, 'params');
	for (let i = 0; i < paramList.length; i++) {
		if (i > 0) parts.push(', ');
		parts.push(paramList[i]);
	}
	if (node.params.length === 1 && node.extra?.trailingComma !== undefined) {
		parts.push(',');
	}
	parts.push('>');
	return parts;
}

/**
 * Print a single TypeScript type parameter
 * @param {AST.TSTypeParameter} node - The type parameter node
 * @param {AstPath<AST.TSTypeParameter>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSTypeParameter(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push(node.name);

	if (node.constraint) {
		parts.push(' extends ');
		parts.push(path.call(print, 'constraint'));
	}

	if (node.default) {
		parts.push(' = ');
		parts.push(path.call(print, 'default'));
	}

	return parts;
}

/**
 * Print TypeScript type parameter instantiation (<string, number>)
 * @param {AST.TSTypeParameterInstantiation} node - The type parameter instantiation node
 * @param {AstPath<AST.TSTypeParameterInstantiation>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printTSTypeParameterInstantiation(node, path, options, print) {
	if (!node.params || node.params.length === 0) {
		return '';
	}

	const paramList = path.map(print, 'params');

	// Check if any param has line breaks (e.g., contains object types)
	const hasBreakingParam = paramList.some((param) => willBreak(param));

	// Build inline version: <T, U>
	/** @type {Doc[]} */
	const inlineParts = ['<'];
	for (let i = 0; i < paramList.length; i++) {
		if (i > 0) inlineParts.push(', ');
		inlineParts.push(paramList[i]);
	}
	inlineParts.push('>');

	// If any param breaks, use the breaking version with proper indentation
	if (hasBreakingParam) {
		// Build breaking version: <\n  T,\n  U\n>
		const breakingParts = [];
		for (let i = 0; i < paramList.length; i++) {
			if (i > 0) breakingParts.push(',', hardline);
			breakingParts.push(paramList[i]);
		}
		return group(['<', indent([hardline, ...breakingParts]), hardline, '>']);
	}

	// Otherwise use group to allow natural breaking
	/** @type {Doc[]} */
	const parts = [];
	for (let i = 0; i < paramList.length; i++) {
		if (i > 0) parts.push(',', line);
		parts.push(paramList[i]);
	}

	return group(['<', indent([softline, ...parts]), softline, '>']);
}

/**
 * Print a switch statement
 * @param {AST.SwitchStatement} node - The switch statement node
 * @param {AstPath<AST.SwitchStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printSwitchStatement(node, path, options, print) {
	// Extract leading comments from discriminant node to print them before 'switch' keyword
	const discriminantNode = node.discriminant;

	// Print discriminant without its leading comments (they'll be printed before 'switch')
	const discriminant = path.call(
		(discriminantPath) => print(discriminantPath, { suppressLeadingComments: true }),
		'discriminant',
	);

	/** @type {Doc[]} */
	const parts = [];

	// Print leading comments from discriminant node before 'switch' keyword
	parts.push(...extractAndPrintLeadingComments(discriminantNode));

	const discriminantDoc = group(['switch (', indent([softline, discriminant]), softline, ')']);

	parts.push(discriminantDoc);

	const cases = [];
	for (let i = 0; i < node.cases.length; i++) {
		const caseDoc = [path.call(print, 'cases', i)];
		if (i < node.cases.length - 1 && isNextLineEmpty(node.cases[i], options)) {
			caseDoc.push(hardline);
		}
		cases.push(caseDoc);
	}

	const bodyDoc =
		cases.length > 0 ? [indent([hardline, join(hardline, cases)]), hardline] : hardline;

	parts.push(' {', bodyDoc, '}');

	return parts;
}

/**
 * Print a JSX switch expression. JSX switch cases use explicit template blocks:
 * `case value: { ... }`, unlike ordinary JavaScript switch cases.
 * @param {AST.SwitchStatement} node - The switch expression node
 * @param {AstPath<AST.SwitchStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printJSXSwitchExpression(node, path, options, print) {
	const discriminant = path.call(
		(discriminantPath) => print(discriminantPath, { suppressLeadingComments: true }),
		'discriminant',
	);

	/** @type {Doc[]} */
	const cases = [];
	for (let i = 0; i < node.cases.length; i++) {
		const caseDoc = [printJSXSwitchCase(node.cases[i], path, options, print, i)];
		if (i < node.cases.length - 1 && isNextLineEmpty(node.cases[i], options)) {
			caseDoc.push(hardline);
		}
		cases.push(caseDoc);
	}

	const bodyDoc =
		cases.length > 0 ? [indent([hardline, join(hardline, cases)]), hardline] : hardline;

	const discriminantDoc = group(['@switch (', indent([softline, discriminant]), softline, ')']);

	return [
		...extractAndPrintLeadingComments(node.discriminant),
		discriminantDoc,
		' {',
		bodyDoc,
		'}',
	];
}

/**
 * @param {AST.SwitchCase} node
 * @param {AstPath<AST.SwitchStatement>} path
 * @param {RippleFormatOptions} options
 * @param {PrintFn} print
 * @param {number} index
 * @returns {Doc[]}
 */
function printJSXSwitchCase(node, path, options, print, index) {
	const header = node.test
		? ['@case ', path.call(print, 'cases', index, 'test'), ':']
		: '@default:';
	const consequents = node.consequent || [];
	const printedConsequents = [];

	for (let i = 0; i < consequents.length; i++) {
		const child = consequents[i];
		if (!child || child.type === 'EmptyStatement') {
			continue;
		}
		printedConsequents.push(path.call(print, 'cases', index, 'consequent', i));
	}

	const bodyDoc =
		printedConsequents.length > 0
			? [indent([hardline, join(hardline, printedConsequents)]), hardline]
			: hardline;

	return [header, ' {', bodyDoc, '}'];
}

/**
 * Print a switch case
 * @param {AST.SwitchCase} node - The switch case node
 * @param {AstPath<AST.SwitchCase>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printSwitchCase(node, path, options, print) {
	const header = node.test ? ['case ', path.call(print, 'test'), ':'] : 'default:';

	const consequents = node.consequent || [];
	const printedConsequents = [];
	const referencedConsequents = [];

	for (let i = 0; i < consequents.length; i++) {
		const child = consequents[i];
		if (!child || child.type === 'EmptyStatement') {
			continue;
		}
		referencedConsequents.push(child);
		printedConsequents.push(path.call(print, 'consequent', i));
	}

	let bodyDoc = null;
	if (printedConsequents.length > 0) {
		const singleBlock =
			printedConsequents.length === 1 && referencedConsequents[0].type === 'BlockStatement';
		if (singleBlock) {
			bodyDoc = [' ', printedConsequents[0]];
		} else {
			bodyDoc = indent([hardline, join(hardline, printedConsequents)]);
		}
	}

	let trailingDoc = null;
	if (node.trailingComments && node.trailingComments.length > 0) {
		/** @type {Doc[]} */
		const commentDocs = [];
		/** @type {AST.Node | AST.Comment} */
		let previousNode =
			referencedConsequents.length > 0
				? referencedConsequents[referencedConsequents.length - 1]
				: node;

		for (let i = 0; i < node.trailingComments.length; i++) {
			const comment = node.trailingComments[i];
			const blankLines = previousNode ? getBlankLinesBetweenNodes(previousNode, comment) : 0;
			commentDocs.push(hardline);
			for (let j = 0; j < blankLines; j++) {
				commentDocs.push(hardline);
			}
			const commentDoc =
				comment.type === 'Line' ? ['//', comment.value] : ['/*', comment.value, '*/'];
			commentDocs.push(commentDoc);
			previousNode = comment;
		}

		trailingDoc = commentDocs;
		delete node.trailingComments;
	}

	/** @type {Doc[]} */
	const parts = [header];
	if (bodyDoc) {
		parts.push(bodyDoc);
	}
	if (trailingDoc) {
		parts.push(trailingDoc);
	}

	return parts;
}

/**
 * Print a break statement
 * @param {AST.BreakStatement} node - The break statement node
 * @param {AstPath<AST.BreakStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printBreakStatement(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('break');
	if (node.label) {
		parts.push(' ');
		parts.push(path.call(print, 'label'));
	}
	parts.push(semi(options));
	return parts;
}

/**
 * Print a continue statement
 * @param {AST.ContinueStatement} node - The continue statement node
 * @param {AstPath<AST.ContinueStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printContinueStatement(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('continue');
	if (node.label) {
		parts.push(' ');
		parts.push(path.call(print, 'label'));
	}
	parts.push(semi(options));
	return parts;
}

/**
 * Print a debugger statement
 * @param {AST.DebuggerStatement} node - The debugger statement node
 * @param {AstPath<AST.DebuggerStatement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @returns {string}
 */
function printDebuggerStatement(node, path, options) {
	return 'debugger' + semi(options);
}

/**
 * Print a sequence expression
 * @param {AST.SequenceExpression} node - The sequence expression node
 * @param {AstPath<AST.SequenceExpression>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printSequenceExpression(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('(');
	const exprList = path.map(print, 'expressions');
	for (let i = 0; i < exprList.length; i++) {
		if (i > 0) parts.push(', ');
		parts.push(exprList[i]);
	}
	parts.push(')');
	return parts;
}

/**
 * Get number of blank lines between two positions
 * @param {{ line: number }} current_pos - Current position
 * @param {{ line: number }} next_pos - Next position
 * @returns {number}
 */
function getBlankLinesBetweenPositions(current_pos, next_pos) {
	const line_gap = next_pos.line - current_pos.line;

	// lineGap = 1 means adjacent lines (no blank lines)
	// lineGap = 2 means one blank line between them
	// lineGap = 3 means two blank lines between them, etc.
	return Math.max(0, line_gap - 1);
}

/**
 * Get number of blank lines between two nodes
 * @param {AST.Node | AST.CSS.StyleSheet | AST.Comment} currentNode - Current node
 * @param {AST.Node | AST.CSS.StyleSheet | AST.Comment} nextNode - Next node
 * @returns {number}
 */
/**
 * The position to measure a leading blank line against: the first leading
 * comment if any (so the comment lines aren't miscounted as blank), else the
 * node itself.
 * @param {any} node
 * @returns {any}
 */
function leadingAnchor(node) {
	const lead = node?.leadingComments;
	if (Array.isArray(lead) && lead.length > 0 && lead[0].loc) {
		return lead[0];
	}
	return node;
}

/**
 * @param {any} currentNode
 * @param {any} nextNode
 * @returns {number}
 */
function getBlankLinesBetweenNodes(currentNode, nextNode) {
	// Return the number of blank lines between two nodes based on their location
	if (
		currentNode.loc &&
		nextNode?.loc &&
		typeof currentNode.loc.end?.line === 'number' &&
		typeof nextNode.loc.start?.line === 'number'
	) {
		return getBlankLinesBetweenPositions(currentNode.loc.end, nextNode.loc.start);
	}

	// If no location info, assume no whitespace
	return 0;
}

/**
 * Determine if a blank line should be added between nodes
 * @param {AST.Node | AST.Comment} currentNode - Current node
 * @param {AST.Node | AST.Comment} nextNode - Next node
 * @returns {boolean}
 */
function shouldAddBlankLine(currentNode, nextNode) {
	// Simplified blank line logic:
	// 1. Check if there was originally 1+ blank lines between nodes
	// 2. If yes, preserve exactly 1 blank line (collapse multiple to one)
	// 3. Only exception: add blank line after imports when followed by non-imports
	//    (this is standard Prettier behavior)

	// Determine the source node for whitespace checking
	// If currentNode has trailing comments, use the last one
	let sourceNode = currentNode;
	const currentTrailing = /** @type {AST.Node} */ (currentNode).trailingComments;
	if (currentTrailing && currentTrailing.length > 0) {
		sourceNode = currentTrailing[currentTrailing.length - 1];
	}

	// If nextNode has leading comments, check whitespace between source node and first comment
	// Otherwise check whitespace between source node and next node
	let targetNode = nextNode;
	const nextLeading = /** @type {AST.Node} */ (nextNode).leadingComments;
	if (nextLeading && nextLeading.length > 0) {
		targetNode = nextLeading[0];
	}

	// Check if there was original whitespace between the nodes
	const originalBlankLines = getBlankLinesBetweenNodes(sourceNode, targetNode);

	// Special case: Always add blank line after import declarations when followed by non-imports
	// This is standard Prettier behavior for separating imports from code
	if (currentNode.type === 'ImportDeclaration' && nextNode.type !== 'ImportDeclaration') {
		return true;
	}

	// Default behavior: preserve blank line if one or more existed originally
	return originalBlankLines > 0;
}

/**
 * Print an object pattern (destructuring)
 * @param {AST.ObjectPattern} node - The object pattern node
 * @param {AstPath<AST.ObjectPattern>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printObjectPattern(node, path, options, print) {
	const propList = path.map(print, 'properties');
	if (propList.length === 0) {
		if (node.typeAnnotation) {
			return ['{}', ': ', path.call(print, 'typeAnnotation')];
		}
		return '{}';
	}

	const allowTrailingComma =
		node.properties &&
		node.properties.length > 0 &&
		node.properties[node.properties.length - 1].type !== 'RestElement';

	const trailingCommaDoc =
		allowTrailingComma && options.trailingComma !== 'none' ? ifBreak(',', '') : '';

	// When the pattern has a type annotation, we need to format them together
	// so they break at the same time
	if (node.typeAnnotation) {
		const typeAnn = node.typeAnnotation.typeAnnotation;

		// If it's a TSTypeLiteral, format both object and type
		if (typeAnn && typeAnn.type === 'TSTypeLiteral') {
			const typeMembers = path.call(
				(path) => path.map(print, 'members'),
				'typeAnnotation',
				'typeAnnotation',
			);

			// Use softline for proper spacing - will become space when inline, line when breaking
			// Format type members with semicolons between AND after the last member
			const typeMemberDocs = join([';', line], typeMembers);

			// Don't wrap in group - let the outer params group control breaking
			const objectDoc = [
				'{',
				indent([line, join([',', line], propList), trailingCommaDoc]),
				line,
				'}',
			];
			const typeDoc =
				typeMembers.length === 0
					? '{}'
					: ['{', indent([line, typeMemberDocs, ifBreak(';', '')]), line, '}'];

			// Return combined
			return [objectDoc, ': ', typeDoc];
		}

		// For other type annotations, just concatenate
		const objectContent = group([
			'{',
			indent([line, join([',', line], propList), trailingCommaDoc]),
			line,
			'}',
		]);
		return [objectContent, ': ', path.call(print, 'typeAnnotation')];
	}

	// No type annotation - just format the object pattern
	const objectContent = group([
		'{',
		indent([line, join([',', line], propList), trailingCommaDoc]),
		line,
		'}',
	]);

	return objectContent;
}

/**
 * Print an array pattern (destructuring)
 * @param {AST.ArrayPattern} node - The array pattern node
 * @param {AstPath<AST.ArrayPattern>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printArrayPattern(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('[');
	const elementList = path.map(print, 'elements');
	for (let i = 0; i < elementList.length; i++) {
		if (i > 0) parts.push(', ');
		parts.push(elementList[i]);
	}
	parts.push(']');

	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	return parts;
}

/**
 * Print a property (object property or method)
 * @param {AST.Property} node - The property node
 * @param {AstPath<AST.Property>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[] | Doc}
 */
function printProperty(node, path, options, print) {
	if (node.shorthand) {
		// For shorthand properties, if value is AssignmentPattern, print the value (which includes the default)
		// Otherwise just print the key
		if (node.value.type === 'AssignmentPattern') {
			return path.call(print, 'value');
		}
		return path.call(print, 'key');
	}

	// Handle getter/setter methods
	if (node.kind === 'get' || node.kind === 'set') {
		const methodParts = [];
		const funcValue = /** @type {AST.FunctionExpression} */ (node.value);

		// Add get/set keyword
		methodParts.push(node.kind, ' ');

		methodParts.push(...printKey(node, path, options, print));

		// Print parameters by calling into the value path
		const paramsPart = path.call(
			(valuePath) =>
				printFunctionParameters(
					/** @type {Parameters<typeof printFunctionParameters>[0]} */ (valuePath),
					options,
					print,
				),
			'value',
		);
		methodParts.push(group(paramsPart));

		// Handle return type annotation
		if (funcValue.returnType) {
			methodParts.push(': ', path.call(print, 'value', 'returnType'));
		}

		methodParts.push(' ', path.call(print, 'value', 'body'));
		return methodParts;
	}

	// Handle method shorthand: increment() {} instead of increment: function() {}
	if (node.method && node.value.type === 'FunctionExpression') {
		const methodParts = [];
		const funcValue = /** @type {AST.FunctionExpression} */ (node.value);

		// Handle async and generator
		if (funcValue.async) {
			methodParts.push('async ');
		}

		if (funcValue.generator) {
			methodParts.push('*');
		}

		methodParts.push(...printKey(node, path, options, print));

		// Handle type parameters (generics)
		if (funcValue.typeParameters) {
			methodParts.push(path.call(print, 'value', 'typeParameters'));
		}

		// Print parameters by calling into the value path
		const paramsPart = path.call(
			(valuePath) =>
				printFunctionParameters(
					/** @type {Parameters<typeof printFunctionParameters>[0]} */ (valuePath),
					options,
					print,
				),
			'value',
		);
		methodParts.push(group(paramsPart));

		// Handle return type annotation
		if (funcValue.returnType) {
			methodParts.push(': ', path.call(print, 'value', 'returnType'));
		}

		methodParts.push(' ', path.call(print, 'value', 'body'));
		return methodParts;
	}

	/** @type {Doc[]} */
	const parts = [];
	parts.push(...printKey(node, path, options, print));

	parts.push(': ');
	parts.push(path.call(print, 'value'));
	return parts;
}

/**
 * Print a variable declarator
 * @param {AST.VariableDeclarator} node - The variable declarator node
 * @param {AstPath<AST.VariableDeclarator>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printVariableDeclarator(node, path, options, print) {
	if (node.init) {
		const id = path.call(print, 'id');
		const init = path.call(print, 'init');

		// For conditional expressions that will break, put them on a new line
		if (node.init.type === 'ConditionalExpression') {
			// Check if the ternary will break by checking if it has complex branches
			// or if the doc builder indicates it will break
			const ternaryWillBreak = willBreak(init);

			// Also check if either branch is a CallExpression (which typically breaks)
			const hasComplexBranch =
				node.init.consequent.type === 'CallExpression' ||
				node.init.alternate.type === 'CallExpression';

			// Check if test is a LogicalExpression or BinaryExpression with complex operators
			const hasComplexTest =
				node.init.test.type === 'LogicalExpression' || node.init.test.type === 'BinaryExpression';

			// Check if there are nested ternaries
			const hasNestedTernary =
				node.init.consequent.type === 'ConditionalExpression' ||
				node.init.alternate.type === 'ConditionalExpression';

			if (ternaryWillBreak || hasComplexBranch || hasComplexTest || hasNestedTernary) {
				return [id, ' =', indent([line, init])];
			}
		}

		// For arrays/objects with blank lines, use conditionalGroup to try both layouts
		// Prettier will break the declaration if keeping it inline doesn't fit
		const isArray = node.init.type === 'ArrayExpression';
		const isObject = node.init.type === 'ObjectExpression';

		if (isArray || isObject) {
			const items = isArray
				? /** @type {AST.ArrayExpression} */ (node.init).elements || []
				: /** @type {AST.ObjectExpression} */ (node.init).properties || [];
			let hasBlankLines = false;

			if (isArray) {
				for (let i = 1; i < items.length; i++) {
					const prevElement = items[i - 1];
					const currentElement = items[i];
					if (
						prevElement &&
						currentElement &&
						getBlankLinesBetweenNodes(prevElement, currentElement) > 0
					) {
						hasBlankLines = true;
						break;
					}
				}
			} else {
				for (let i = 0; i < items.length - 1; i++) {
					const current = items[i];
					const next = items[i + 1];
					if (current && next && getBlankLinesBetweenNodes(current, next) > 0) {
						hasBlankLines = true;
						break;
					}
				}
			}

			if (hasBlankLines) {
				// Provide two alternatives: inline vs broken
				// Prettier picks the broken version if inline doesn't fit
				return conditionalGroup([
					// Try inline first
					[id, ' = ', init],
					// Fall back to broken with extra indent
					[id, ' =', indent([line, init])],
				]);
			}
		}

		// For BinaryExpression or LogicalExpression, use break-after-operator layout
		// This allows the expression to break naturally based on print width
		if (node.init.type === 'BinaryExpression' || node.init.type === 'LogicalExpression') {
			// Use Prettier's break-after-operator strategy: break after = and let the expression break naturally
			const init = path.call(print, 'init');
			return group([group(id), ' =', group(indent([line, init]))]);
		}
		// For CallExpression inits, use fluid layout strategy to break after = if needed
		const isCallExpression = node.init.type === 'CallExpression';
		if (isCallExpression) {
			// Always use fluid layout for call expressions
			// This allows breaking after = when the whole line doesn't fit
			{
				// Use fluid layout: break right side first, then break after = if needed
				const groupId = Symbol('declaration');
				return group([
					group(id),
					' =',
					group(indent(line), { id: groupId }),
					indentIfBreak(init, { groupId }),
				]);
			}
		}

		if (isTemplateExpression(node.init)) {
			const groupId = Symbol('declaration');
			return group([
				group(id),
				' =',
				group(indent(line), { id: groupId }),
				indentIfBreak(init, { groupId }),
			]);
		}

		// Default: simple inline format with space
		// Use group to allow breaking if needed - but keep inline when it fits
		return group([id, ' = ', init]);
	}

	return path.call(print, 'id');
}

/**
 * Print an assignment pattern (default parameter)
 * @param {AST.AssignmentPattern} node - The assignment pattern node
 * @param {AstPath<AST.AssignmentPattern>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printAssignmentPattern(node, path, options, print) {
	// Handle default parameters like: count: number = 0
	return [path.call(print, 'left'), ' = ', path.call(print, 'right')];
}

/**
 * Print a TypeScript type literal
 * @param {AST.TSTypeLiteral} node - The type literal node
 * @param {AstPath<AST.TSTypeLiteral>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printTSTypeLiteral(node, path, options, print) {
	if (!node.members || node.members.length === 0) {
		return '{}';
	}

	const members = path.map(print, 'members');
	const inlineMembers = members.map((member, index) =>
		index < members.length - 1 ? [member, ';'] : member,
	);
	const multilineMembers = members.map((member) => [member, ';']);

	const inlineDoc = group(['{', indent([line, join(line, inlineMembers)]), line, '}']);

	const multilineDoc = group([
		'{',
		indent([hardline, join(hardline, multilineMembers)]),
		hardline,
		'}',
	]);

	return conditionalGroup(
		wasOriginallySingleLine(node) ? [inlineDoc, multilineDoc] : [multilineDoc, inlineDoc],
	);
}

/**
 * Print a TypeScript property signature in an interface
 * @param {AST.TSPropertySignature} node - The property signature node
 * @param {AstPath<AST.TSPropertySignature>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSPropertySignature(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push(path.call(print, 'key'));

	if (node.optional) {
		parts.push('?');
	}

	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	return parts;
}

/**
 * Print a TypeScript method signature in an interface
 * @param {AST.TSMethodSignature} node - The method signature node
 * @param {AstPath<AST.TSMethodSignature>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSMethodSignature(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Print the method name/key
	parts.push(path.call(print, 'key'));

	// Add optional marker if present
	if (node.optional) {
		parts.push('?');
	}

	// Add TypeScript generics/type parameters if present
	if (node.typeParameters) {
		const typeParams = path.call(print, 'typeParameters');
		if (Array.isArray(typeParams)) {
			parts.push(...typeParams);
		} else {
			parts.push(typeParams);
		}
	}

	// Print parameters - use 'parameters' property for TypeScript signature nodes
	parts.push('(');
	if (node.parameters && node.parameters.length > 0) {
		const params = path.map(print, 'parameters');
		for (let i = 0; i < params.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(params[i]);
		}
	}
	parts.push(')');

	// Return type annotation
	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	return parts;
}

/**
 * Print a TypeScript call signature in an interface
 * @param {AST.TSCallSignatureDeclaration} node - The call signature node
 * @param {AstPath<AST.TSCallSignatureDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSCallSignatureDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];

	// Add TypeScript generics/type parameters if present
	if (node.typeParameters) {
		const type_params = path.call(print, 'typeParameters');
		if (Array.isArray(type_params)) {
			parts.push(...type_params);
		} else {
			parts.push(type_params);
		}
	}

	parts.push('(');
	if (node.parameters && node.parameters.length > 0) {
		const params = path.map(print, 'parameters');
		for (let i = 0; i < params.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(params[i]);
		}
	}
	parts.push(')');

	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	return parts;
}

/**
 * Print a TypeScript construct signature in an interface or type literal
 * @param {AST.TSConstructSignatureDeclaration} node - The construct signature node
 * @param {AstPath<AST.TSConstructSignatureDeclaration>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSConstructSignatureDeclaration(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = ['new '];

	if (node.typeParameters) {
		const type_params = path.call(print, 'typeParameters');
		if (Array.isArray(type_params)) {
			parts.push(...type_params);
		} else {
			parts.push(type_params);
		}
	}

	parts.push('(');
	if (node.parameters && node.parameters.length > 0) {
		const params = path.map(print, 'parameters');
		for (let i = 0; i < params.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(params[i]);
		}
	}
	parts.push(')');

	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	return parts;
}

/**
 * Print a TypeScript type reference (e.g., Array<string>)
 * @param {AST.TSTypeReference} node - The type reference node
 * @param {AstPath<AST.TSTypeReference>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSTypeReference(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [path.call(print, 'typeName')];

	// Handle both typeArguments and typeParameters (different AST variations)
	if (node.typeArguments) {
		parts.push('<');
		const typeArgs = path.map(print, 'typeArguments', 'params');
		for (let i = 0; i < typeArgs.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(typeArgs[i]);
		}
		parts.push('>');
		// @ts-expect-error - acorn-typescript uses typeParameters instead of typeArguments
		// we normalize it in the analyze phase, but here we get the parser ast
	} else if (node.typeParameters) {
		parts.push('<');
		// @ts-expect-error - acorn-typescript uses typeParameters instead of typeArguments
		const typeParams = path.map(print, 'typeParameters', 'params');
		for (let i = 0; i < typeParams.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(typeParams[i]);
		}
		parts.push('>');
	}

	return parts;
}

/**
 * Print a TypeScript tuple type
 * @param {AST.TSTupleType} node - The tuple type node
 * @param {AstPath<AST.TSTupleType>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSTupleType(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = ['['];
	const elements = node.elementTypes ? path.map(print, 'elementTypes') : [];
	for (let i = 0; i < elements.length; i++) {
		if (i > 0) parts.push(', ');
		parts.push(elements[i]);
	}
	parts.push(']');
	return parts;
}

/**
 * Print a TypeScript named tuple member
 * @param {AST.TSNamedTupleMember} node - The named tuple member node
 * @param {AstPath<AST.TSNamedTupleMember>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSNamedTupleMember(node, path, options, print) {
	return [
		path.call(print, 'label'),
		node.optional ? '?' : '',
		': ',
		path.call(print, 'elementType'),
	];
}

/**
 * Print a TypeScript index signature
 * @param {AST.TSIndexSignature} node - The index signature node
 * @param {AstPath<AST.TSIndexSignature>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSIndexSignature(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	if (node.readonly === true) {
		parts.push('readonly ');
	}

	parts.push('[');
	const params = node.parameters ? path.map(print, 'parameters') : [];
	for (let i = 0; i < params.length; i++) {
		if (i > 0) parts.push(', ');
		parts.push(params[i]);
	}
	parts.push(']');

	if (node.typeAnnotation) {
		parts.push(': ');
		parts.push(path.call(print, 'typeAnnotation'));
	}

	return parts;
}

/**
 * Print a TypeScript constructor type
 * @param {AST.TSConstructorType} node - The constructor type node
 * @param {AstPath<AST.TSConstructorType>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[]}
 */
function printTSConstructorType(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	parts.push('new ');
	parts.push('(');
	const hasParameters = Array.isArray(node.parameters) && node.parameters.length > 0;
	if (hasParameters) {
		const params = path.map(print, 'parameters');
		for (let i = 0; i < params.length; i++) {
			if (i > 0) parts.push(', ');
			parts.push(params[i]);
		}
	}
	parts.push(')');
	parts.push(' => ');
	if (node.typeAnnotation) {
		parts.push(path.call(print, 'typeAnnotation'));
	}
	return parts;
}

/**
 * Print a TypeScript conditional type
 * @param {AST.TSConditionalType} node - The conditional type node
 * @param {AstPath<AST.TSConditionalType>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printTSConditionalType(node, path, options, print) {
	const trueType = path.call(print, 'trueType');
	const falseType = path.call(print, 'falseType');

	const shouldIndentTrueType = node.trueType.type !== 'TSConditionalType';
	const shouldIndentFalseType = node.falseType.type !== 'TSConditionalType';

	return group([
		path.call(print, 'checkType'),
		' extends ',
		path.call(print, 'extendsType'),
		indent([line, '? ', shouldIndentTrueType ? indent(trueType) : trueType]),
		indent([line, ': ', shouldIndentFalseType ? indent(falseType) : falseType]),
	]);
}

/**
 * Print a TypeScript mapped type
 * @param {AST.TSMappedType} node - The mapped type node
 * @param {AstPath<AST.TSMappedType>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc[] | Doc}
 */
function printTSMappedType(node, path, options, print) {
	const readonlyMod =
		node.readonly === true || node.readonly === '+'
			? 'readonly '
			: node.readonly === '-'
				? '-readonly '
				: '';

	let optionalMod = '';
	if (node.optional === true || node.optional === '+') {
		optionalMod = '?';
	} else if (node.optional === '-') {
		optionalMod = '-?';
	}

	/** @type {Doc[]} */
	const innerParts = [];
	const typeParam = node.typeParameter;
	innerParts.push('[');
	if (typeParam) {
		// name
		innerParts.push(typeParam.name);
		innerParts.push(' in ');
		if (typeParam.constraint) {
			innerParts.push(path.call(print, 'typeParameter', 'constraint'));
		} else {
			innerParts.push(path.call(print, 'typeParameter'));
		}
		if (node.nameType) {
			innerParts.push(' as ');
			innerParts.push(path.call(print, 'nameType'));
		}
	}
	innerParts.push(']');
	innerParts.push(optionalMod);
	if (node.typeAnnotation) {
		innerParts.push(': ');
		innerParts.push(path.call(print, 'typeAnnotation'));
	}

	return group(['{ ', readonlyMod, innerParts, ' }']);
}

/**
 * @param {AST.TSQualifiedName} node
 * @param {AstPath<AST.TSQualifiedName>} path
 * @param {RippleFormatOptions} options
 * @param {PrintFn} print
 * @returns {Doc}
 */
function printTSQualifiedName(node, path, options, print) {
	return [path.call(print, 'left'), '.', path.call(print, 'right')];
}

/**
 * @param {AST.TSImportType} node
 * @param {AstPath<AST.TSImportType>} path
 * @param {RippleFormatOptions} options
 * @param {PrintFn} print
 * @returns {Doc}
 */
function printTSImportType(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = ['import(', path.call(print, 'argument'), ')'];

	if (node.qualifier) {
		parts.push('.', path.call(print, 'qualifier'));
	}

	if (node.typeParameters) {
		parts.push(path.call(print, 'typeParameters'));
	}

	return parts;
}

/**
 * @param {AST.TSIndexedAccessType} node
 * @param {AstPath<AST.TSIndexedAccessType>} path
 * @param {RippleFormatOptions} options
 * @param {PrintFn} print
 * @returns {Doc}
 */
function printTSIndexedAccessType(node, path, options, print) {
	return [path.call(print, 'objectType'), '[', path.call(print, 'indexType'), ']'];
}

/**
 * Print direct TSRX text so it can wrap like JSX text when an element body breaks.
 * @param {string} raw
 * @returns {Doc}
 */
function printRawText(raw) {
	const text = raw.trim().replace(/(?:\r\n|\r|\n)[^\S\r\n]+/gu, ' ');
	if (!text) {
		return '';
	}

	return fill(
		text
			.split(/([^\S\r\n]+)/u)
			.filter(Boolean)
			.map((part) => {
				return /^[^\S\r\n]+$/u.test(part) ? line : replaceEndOfLine(part);
			}),
	);
}

/**
 * @param {string} raw
 * @returns {Doc | Doc[] | string}
 */
function printJSXTextChild(raw) {
	const text = raw.trim();
	if (!text) {
		return '';
	}

	const lines = text
		.split(/\r\n|\r|\n/u)
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length <= 1) {
		return lines[0] ?? '';
	}

	return join(hardline, lines);
}

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeInlineJSXText(raw) {
	const text = raw.replace(/[^\S\r\n]+/gu, ' ');
	return text.trim() || !/[\r\n]/u.test(text) ? text : '';
}

/**
 * @param {AST.Node} child
 * @returns {boolean}
 */
function isSimpleJSXExpressionChild(child) {
	if (child?.type !== 'JSXExpressionContainer') {
		return false;
	}

	const expression = child.expression;
	return (
		expression?.type === 'Identifier' ||
		expression?.type === 'Literal' ||
		expression?.type === 'TemplateLiteral' ||
		// Stock Prettier keeps a single `{expr}` child inline regardless of the
		// expression kind (member access, calls, etc.); only multiple children break.
		expression?.type === 'MemberExpression' ||
		expression?.type === 'CallExpression'
	);
}

/**
 * Print a JSX element
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node - The JSX element node
 * @param {AstPath<AST.TSRXJSXElement>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc | Doc[]}
 */
function printJSXElement(node, path, options, print) {
	// Get the tag name from the opening element
	const openingElement = node.openingElement;
	const closingElement = node.closingElement;

	// Dynamic tags (`<{expr}>`) print the opening expression for both tags so
	// they stay textually identical; static names print as plain strings.
	const tagName =
		openingElement.name.type === 'JSXExpressionContainer'
			? ['{', path.call(print, 'openingElement', 'name', 'expression'), '}']
			: printJSXElementName(openingElement.name);

	const isSelfClosing = openingElement.selfClosing;
	const hasAttributes = openingElement.attributes && openingElement.attributes.length > 0;
	const hasChildren = node.children && node.children.length > 0;

	/** @type {Doc} */
	let typeArgsDoc = '';
	if (openingElement.typeArguments) {
		typeArgsDoc = path.call(print, 'openingElement', 'typeArguments');
	}

	// Comments that sit inside the opening tag (before an attribute) are attached
	// by the parser to a body child; pull them out and key them by the attribute
	// they precede so they print in the opening tag, not jammed into the body.
	const openingTagCommentsByAttr = collectOpeningTagComments(node);
	const hasOpeningTagComments = openingTagCommentsByAttr.size > 0;

	// Format attributes
	/** @type {Doc} */
	let attributesDoc = '';
	let hasBreakingAttribute = false;
	if (hasAttributes) {
		/** @type {Doc[]} */
		const attrs = openingElement.attributes.map(
			(/** @type {AST.Node} */ attr, /** @type {number} */ i) => {
				/** @type {Doc} */
				let attrDoc = '';
				if (attr.type === 'JSXAttribute') {
					attrDoc = path.call(
						(attrPath) =>
							printJSXAttribute(
								/** @type {ESTreeJSX.JSXAttribute} */ (attrPath.node),
								/** @type {AstPath<ESTreeJSX.JSXAttribute>} */ (attrPath),
								options,
								print,
							),
						'openingElement',
						'attributes',
						i,
					);
				} else if (attr.type === 'JSXSpreadAttribute') {
					attrDoc = ['{...', path.call(print, 'openingElement', 'attributes', i, 'argument'), '}'];
				}
				if (!hasBreakingAttribute && attrDoc && willBreak(attrDoc)) {
					hasBreakingAttribute = true;
				}
				const lead = openingTagCommentsByAttr.get(i);
				if (lead) {
					/** @type {Doc[]} */
					const parts = [];
					for (const comment of lead) {
						parts.push(
							comment.type === 'Line' ? '//' + comment.value : '/*' + comment.value + '*/',
						);
						parts.push(hardline);
					}
					return [...parts, attrDoc];
				}
				return attrDoc;
			},
		);
		const attrLineBreak = options.singleAttributePerLine ? hardline : line;
		attributesDoc = indent([attrLineBreak, join(attrLineBreak, attrs)]);
	}
	const shouldForceBreak = hasBreakingAttribute || hasOpeningTagComments;

	if (isSelfClosing) {
		return group(['<', tagName, typeArgsDoc, attributesDoc, hasAttributes ? line : ' ', '/>'], {
			shouldBreak: shouldForceBreak,
		});
	}

	const openingTag = group(
		[
			'<',
			tagName,
			typeArgsDoc,
			attributesDoc,
			hasAttributes && !options.bracketSameLine ? softline : '',
			'>',
		],
		{ shouldBreak: shouldForceBreak },
	);

	// Comments before `</tag>` and the comments of a comment-only element.
	const { closingCommentDocs, innerCommentDocs } = collectElementBodyCommentDocs(
		/** @type {AST.TSRXJSXElement} */ (node),
		openingElement,
		node.closingElement,
	);
	const hasClosingComments = closingCommentDocs.length > 0;

	if (!hasChildren) {
		const bodyComments = [...innerCommentDocs, ...closingCommentDocs];
		if (bodyComments.length > 0) {
			return group([openingTag, indent(bodyComments), hardline, '</', tagName, '>']);
		}
		return [openingTag, '</', tagName, '>'];
	}

	// A `@{ … }` code block is the whole body and hugs the tags: `<div>@{ … }</div>`.
	if (node.children.length === 1 && node.children[0].type === 'JSXCodeBlock') {
		return group([openingTag, path.call(print, 'children', 0), '</', tagName, '>']);
	}

	// Format children - filter out empty text nodes and merge adjacent text nodes.
	// childNodes tracks the source node behind each doc (a text run is a single
	// JSXText) so the join can preserve authored blank lines.
	const childrenDocs = [];
	const childNodes = [];
	let currentText = '';
	let currentTextNode = null;

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];

		if (child.type === 'JSXText') {
			if (hasComment(/** @type {AST.Node & AST.NodeWithMaybeComments} */ (child))) {
				if (currentText) {
					childrenDocs.push(currentText);
					childNodes.push(currentTextNode);
					currentText = '';
					currentTextNode = null;
				}
				const printedChild = path.call(print, 'children', i);
				if (printedChild !== '') {
					childrenDocs.push(printedChild);
					childNodes.push(child);
				}
				continue;
			}
			// Accumulate text content, preserving meaningful boundary spaces.
			const text = normalizeInlineJSXText(child.value);
			if (text) {
				const nextChild = node.children[i + 1];
				const afterNextChild = node.children[i + 2];
				const nextText = afterNextChild?.type === 'JSXText' ? afterNextChild.value.trim() : '';
				if (
					tagName === 'tsrx' &&
					text.trimEnd().endsWith('=') &&
					nextChild?.type === 'JSXElement' &&
					nextText === ';'
				) {
					if (currentText) {
						childrenDocs.push(currentText);
						childNodes.push(currentTextNode);
						currentText = '';
						currentTextNode = null;
					}
					childrenDocs.push([text.trim(), ' ', path.call(print, 'children', i + 1), ';']);
					childNodes.push(child);
					i += 2;
					continue;
				}

				if (currentText) {
					currentText += currentText.endsWith(' ') || text.startsWith(' ') ? text : ' ' + text;
				} else {
					currentText = text;
					currentTextNode = child;
				}
			}
		} else {
			// If we have accumulated text, push it before the non-text node
			if (currentText) {
				childrenDocs.push(currentText);
				childNodes.push(currentTextNode);
				currentText = '';
				currentTextNode = null;
			}

			if (child.type === 'JSXExpressionContainer') {
				// Handle JSX expression containers
				childrenDocs.push([
					...printTemplateChildLeadingComments(child),
					'{',
					path.call(print, 'children', i, 'expression'),
					'}',
					...printTemplateChildTrailingComments(child),
				]);
				childNodes.push(child);
			} else {
				// Handle nested JSX elements
				childrenDocs.push(path.call(print, 'children', i));
				childNodes.push(child);
			}
		}
	}

	// Don't forget any remaining text
	if (currentText) {
		childrenDocs.push(currentText);
		childNodes.push(currentTextNode);
	}

	// A child with leading comments must break onto its own line, so the comment
	// reads above the child rather than being jammed onto the opening tag.
	const hasChildLeadingComments = node.children.some((child) => {
		const leadingComments = /** @type {AST.NodeWithMaybeComments} */ (child).leadingComments;
		return Array.isArray(leadingComments) && leadingComments.length > 0;
	});
	const forceMultiline = hasClosingComments || hasChildLeadingComments;
	const singleChildNode = childNodes.length === 1 ? childNodes[0] : null;
	const hasAuthoredMultilineSingleTextChild =
		singleChildNode?.type === 'JSXText' && /[\r\n]/u.test(singleChildNode.value);

	// Check if content can be inlined (single text node or single expression).
	// Trailing or child-leading comments force the multi-line layout. A single
	// text child stays inline when it fits and otherwise fills/wraps to printWidth.
	if (
		!forceMultiline &&
		!hasAuthoredMultilineSingleTextChild &&
		childrenDocs.length === 1 &&
		typeof childrenDocs[0] === 'string'
	) {
		// The open tag breaks for attributes independently; the text+closing get
		// their own group so the text only drops to its own (filled) lines when it
		// itself overflows — otherwise it hugs `>text</tag>`.
		return [
			openingTag,
			group([indent([softline, printRawText(childrenDocs[0])]), softline, '</', tagName, '>']),
		];
	}
	const meaningfulChildren = node.children.filter(
		(child) => child.type !== 'JSXText' || child.value.trim(),
	);
	const singleMeaningfulChild = meaningfulChildren.length === 1 ? meaningfulChildren[0] : null;
	if (
		!forceMultiline &&
		childrenDocs.length === 1 &&
		singleMeaningfulChild?.type === 'JSXExpressionContainer' &&
		isSimpleJSXExpressionChild(/** @type {AST.Node} */ (singleMeaningfulChild))
	) {
		return group([openingTag, childrenDocs[0], '</', tagName, '>']);
	}
	if (
		!forceMultiline &&
		childrenDocs.length > 1 &&
		wasOriginallySingleLine(node) &&
		node.children.some((child) => child.type === 'JSXText') &&
		node.children.every(
			(child) =>
				child.type === 'JSXText' || isSimpleJSXExpressionChild(/** @type {AST.Node} */ (child)),
		)
	) {
		return group([openingTag, ...childrenDocs, '</', tagName, '>']);
	}

	// Multiple children or complex children - format with line breaks. Text runs
	// fill/wrap to printWidth.
	const formattedChildren = [];
	for (let i = 0; i < childrenDocs.length; i++) {
		const childDoc = childrenDocs[i];
		formattedChildren.push(typeof childDoc === 'string' ? printRawText(childDoc) : childDoc);
		if (i < childrenDocs.length - 1) {
			// Preserve a single authored blank line between children (2+ collapse to 1).
			const blank = getBlankLinesBetweenNodes(childNodes[i], leadingAnchor(childNodes[i + 1])) > 0;
			formattedChildren.push(blank ? [hardline, hardline] : hardline);
		}
	}

	// Build the final element
	return group([
		openingTag,
		indent([hardline, ...formattedChildren, ...closingCommentDocs]),
		hardline,
		'</',
		tagName,
		'>',
	]);
}

/**
 * Print a JSX fragment (<>...</>)
 * @param {AST.TSRXJSXFragment} node - The JSX fragment node
 * @param {AstPath<AST.TSRXJSXFragment>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc}
 */
function printJSXFragment(node, path, options, print) {
	const hasChildren = node.children && node.children.length > 0;

	// Comments before `</>` and the comments of a comment-only fragment.
	const { closingCommentDocs, innerCommentDocs } = collectElementBodyCommentDocs(
		node,
		node.openingFragment,
		node.closingFragment,
	);

	if (!hasChildren) {
		const bodyComments = [...innerCommentDocs, ...closingCommentDocs];
		if (bodyComments.length > 0) {
			return group(['<>', indent(bodyComments), hardline, '</>']);
		}
		return '<></>';
	}

	// A `@{ … }` code block is the whole body and hugs the tags: `<>@{ … }</>`.
	if (node.children.length === 1 && node.children[0].type === 'JSXCodeBlock') {
		return group(['<>', path.call(print, 'children', 0), '</>']);
	}

	// Format children - filter out empty text nodes. childNodes tracks the source
	// node behind each doc so the join can preserve authored blank lines.
	const childrenDocs = [];
	const childNodes = [];
	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];

		if (child.type === 'JSXText') {
			if (hasComment(/** @type {AST.Node & AST.NodeWithMaybeComments} */ (child))) {
				const printedChild = path.call(print, 'children', i);
				if (printedChild !== '') {
					childrenDocs.push(printedChild);
					childNodes.push(child);
				}
				continue;
			}
			// Handle JSX text nodes - trim whitespace and only include if not empty
			const text = printJSXTextChild(child.value);
			if (text) {
				childrenDocs.push(text);
				childNodes.push(child);
			}
		} else if (child.type === 'JSXExpressionContainer') {
			// Handle JSX expression containers
			childrenDocs.push([
				...printTemplateChildLeadingComments(child),
				'{',
				path.call(print, 'children', i, 'expression'),
				'}',
				...printTemplateChildTrailingComments(child),
			]);
			childNodes.push(child);
		} else {
			// Handle nested JSX elements and fragments
			childrenDocs.push(path.call(print, 'children', i));
			childNodes.push(child);
		}
	}

	// Check if content can be inlined (single text node or single expression)
	if (
		childrenDocs.length === 1 &&
		typeof childrenDocs[0] === 'string' &&
		closingCommentDocs.length === 0
	) {
		return ['<>', childrenDocs[0], '</>'];
	}
	const meaningfulChildren = node.children.filter(
		(child) => child.type !== 'JSXText' || child.value.trim(),
	);
	if (
		childrenDocs.length === 1 &&
		meaningfulChildren.length === 1 &&
		meaningfulChildren[0].type === 'JSXElement' &&
		wasOriginallySingleLine(node) &&
		closingCommentDocs.length === 0 &&
		!willBreak(childrenDocs[0])
	) {
		// Keep the fragment inline when it fits; otherwise expand `<>` onto its own
		// lines so a breaking single child reads as `<>\n  <Child …/>\n</>` rather than
		// `<><Child` with only the child's attributes broken.
		return conditionalGroup([
			['<>', childrenDocs[0], '</>'],
			group(['<>', indent([hardline, childrenDocs[0]]), hardline, '</>']),
		]);
	}

	// Multiple children or complex children - format with line breaks
	const formattedChildren = [];
	for (let i = 0; i < childrenDocs.length; i++) {
		formattedChildren.push(childrenDocs[i]);
		if (i < childrenDocs.length - 1) {
			// Preserve a single authored blank line between children (2+ collapse to 1).
			const blank = getBlankLinesBetweenNodes(childNodes[i], leadingAnchor(childNodes[i + 1])) > 0;
			formattedChildren.push(blank ? [hardline, hardline] : hardline);
		}
	}

	// Build the final fragment
	return group([
		'<>',
		indent([hardline, ...formattedChildren, ...closingCommentDocs]),
		hardline,
		'</>',
	]);
}

/**
 * Comments written inside an opening tag, before an attribute, are attached by
 * the parser to the next visited body child (positionally they sort before the
 * opening tag's end, but the child is visited first). Pull those out of the
 * children and return a map from attribute index to the comments that precede it,
 * so the element printer can render them in the opening tag instead of the body.
 * @param {AST.TSRXJSXElement | AST.JSXStyleElement} node
 * @returns {Map<number, AST.Comment[]>}
 */
function collectOpeningTagComments(node) {
	/** @type {Map<number, AST.Comment[]>} */
	const byAttr = new Map();
	const openingElement = /** @type {AST.NodeWithLocation} */ (node.openingElement);
	const attributes = node.openingElement?.attributes ?? [];
	if (!openingElement || attributes.length === 0 || !Array.isArray(node.children)) {
		return byAttr;
	}
	const openingEnd = openingElement.end;
	/** @type {AST.Comment[]} */
	const collected = [];
	for (const child of node.children) {
		const lead = /** @type {AST.NodeWithMaybeComments} */ (child).leadingComments;
		if (!Array.isArray(lead) || lead.length === 0) continue;
		const keep = [];
		for (const comment of lead) {
			if (typeof comment.start === 'number' && comment.start < openingEnd) {
				collected.push(comment);
			} else {
				keep.push(comment);
			}
		}
		if (keep.length !== lead.length) {
			child.leadingComments = keep;
		}
	}
	if (collected.length === 0) return byAttr;
	collected.sort((a, b) => /** @type {number} */ (a.start) - /** @type {number} */ (b.start));
	let ci = 0;
	for (let ai = 0; ai < attributes.length; ai++) {
		const attrStart = /** @type {AST.NodeWithLocation} */ (attributes[ai]).start;
		/** @type {AST.Comment[]} */
		const forAttr = [];
		while (ci < collected.length && /** @type {number} */ (collected[ci].start) < attrStart) {
			forAttr.push(collected[ci]);
			ci++;
		}
		if (forAttr.length > 0) byAttr.set(ai, forAttr);
	}
	return byAttr;
}

/**
 * Build doc parts for a template child's leading comments (each on its own line).
 * Used for `{expr}` children, whose `{ … }` form is printed inline by the JSX
 * printers and so would otherwise skip the node's attached leading comments.
 * @param {AST.Node & AST.NodeWithMaybeComments} child
 * @returns {Doc[]}
 */
function printTemplateChildLeadingComments(child) {
	const comments = child.leadingComments;
	if (!comments || comments.length === 0) {
		return [];
	}
	/** @type {Doc[]} */
	const parts = [];
	for (let i = 0; i < comments.length; i++) {
		const comment = comments[i];
		if (comment.type === 'Line') {
			parts.push('//' + comment.value);
		} else if (comment.type === 'Block') {
			parts.push('/*' + comment.value + '*/');
		}
		parts.push(hardline);
		const next = comments[i + 1];
		if (next && getBlankLinesBetweenNodes(comment, next) > 0) {
			parts.push(hardline);
		}
	}
	return parts;
}

/**
 * Build doc parts for a template child's trailing comments (kept on the same
 * line as the child). Used for `{expr}` children, whose `{ … }` form is printed
 * inline by the JSX printers and so would otherwise skip the node's attached
 * trailing comments.
 * @param {AST.Node & AST.NodeWithMaybeComments} child
 * @returns {Doc[]}
 */
function printTemplateChildTrailingComments(child) {
	const comments = child.trailingComments;
	if (!comments || comments.length === 0) {
		return [];
	}
	/** @type {Doc[]} */
	const parts = [];
	for (const comment of comments) {
		if (comment.type === 'Line') {
			parts.push(lineSuffix([' ', '//' + comment.value]));
			parts.push(breakParent);
		} else if (comment.type === 'Block') {
			parts.push(' /*' + comment.value + '*/');
		}
	}
	return parts;
}

/**
 * Collect and print the comments that belong to an element/fragment body:
 * trailing comments after the last child (attached by the parser to the closing
 * tag's `leadingComments` or, when the last child is an `{expr}` container, to
 * `metadata.elementLeadingComments` positioned inside the body) and the comments
 * of a comment-only body (`innerComments`).
 * @param {AST.TSRXJSXElement | AST.TSRXJSXFragment} node
 * @param {AST.TSRXJSXElement['openingElement'] | AST.TSRXJSXFragment['openingFragment']} openingNode
 * @param {AST.TSRXJSXElement['closingElement'] | AST.TSRXJSXFragment['closingFragment']} closingNode
 * @returns {{ closingCommentDocs: Doc[], innerCommentDocs: Doc[] }}
 */
function collectElementBodyCommentDocs(node, openingNode, closingNode) {
	const openingEnd = openingNode?.end;
	const bodyMetaComments = (node.metadata?.elementLeadingComments ?? []).filter(
		(/** @type {AST.Comment} */ comment) =>
			typeof comment.start === 'number' &&
			typeof openingEnd === 'number' &&
			comment.start >= openingEnd,
	);
	const trailingComments = [...(closingNode?.leadingComments ?? []), ...bodyMetaComments].sort(
		(/** @type {AST.Comment} */ a, /** @type {AST.Comment} */ b) =>
			/** @type {number} */ (a.start) - /** @type {number} */ (b.start),
	);
	const lastMeaningfulChild = [...(node.children ?? [])]
		.reverse()
		.find((child) => child.type !== 'JSXText' || child.value.trim());
	return {
		closingCommentDocs: printElementBodyComments(trailingComments, lastMeaningfulChild),
		innerCommentDocs: printElementBodyComments(node.innerComments),
	};
}

/**
 * Build doc parts for comments attached to an element body — trailing
 * comments before `</tag>` (`closingElement.leadingComments`) or the comments of a
 * comment-only element (`innerComments`). Each comment is emitted on its own line
 * at the children indent.
 * @param {AST.Comment[] | null | undefined} commentList
 * @param {any} [previousNode]
 * @returns {Doc[]}
 */
function printElementBodyComments(commentList, previousNode = null) {
	const comments = commentList ?? [];
	if (comments.length === 0) {
		return [];
	}
	/** @type {Doc[]} */
	const parts = [];
	/** @type {AST.Node | AST.Comment | null | undefined} */
	let prev = previousNode;
	for (let i = 0; i < comments.length; i++) {
		parts.push(hardline);
		// Preserve a blank line before this comment if one existed in source.
		if (prev && getBlankLinesBetweenNodes(prev, comments[i]) > 0) {
			parts.push(hardline);
		}
		parts.push(
			comments[i].type === 'Line' ? '//' + comments[i].value : '/*' + comments[i].value + '*/',
		);
		prev = comments[i];
	}
	return parts;
}

/**
 * Print a TSRX code block: setup statements then the single render output.
 * Callers in element/fragment body position hug it to the surrounding tags;
 * on its own as an arrow body it stands alone.
 * @param {AST.JSXCodeBlock} node
 * @param {AstPath<AST.JSXCodeBlock>} path
 * @param {RippleFormatOptions} options
 * @param {PrintFn} print
 * @returns {Doc}
 */
function printJSXCodeBlock(node, path, options, print) {
	/** @type {Doc[]} */
	const parts = [];
	for (let i = 0; i < node.body.length; i++) {
		parts.push(path.call(print, 'body', i));
		if (i < node.body.length - 1) {
			parts.push(
				shouldAddBlankLine(node.body[i], node.body[i + 1]) ? [hardline, hardline] : hardline,
			);
		}
	}
	if (node.render) {
		if (node.body.length > 0) {
			// Preserve a blank line between the last setup statement and the render
			// output (measured to the render's leading comment, if any).
			const last = node.body[node.body.length - 1];
			const renderStart =
				/** @type {AST.NodeWithMaybeComments} */ (node.render).leadingComments?.[0] ?? node.render;
			parts.push(
				getBlankLinesBetweenNodes(last, renderStart) > 0 ? [hardline, hardline] : hardline,
			);
		}
		parts.push(path.call(print, 'render'));
	}
	// Trailing comments after the last statement/render inside the block.
	const innerCommentDocs = printElementBodyComments(node.innerComments);
	if (innerCommentDocs.length > 0) {
		const lastNode = node.render ?? node.body[node.body.length - 1];
		const firstComment = (node.innerComments ?? [])[0];
		if (lastNode && firstComment && getBlankLinesBetweenNodes(lastNode, firstComment) > 0) {
			parts.push(hardline);
		}
		parts.push(...innerCommentDocs);
	}
	if (parts.length === 0) {
		return '@{}';
	}
	return group(['@{', indent([hardline, ...parts]), hardline, '}']);
}

/**
 * Print a JSX attribute
 * @param {ESTreeJSX.JSXAttribute} attr - The JSX attribute node
 * @param {AstPath<ESTreeJSX.JSXAttribute>} path - The AST path
 * @param {RippleFormatOptions} options - Prettier options
 * @param {PrintFn} print - Print callback
 * @returns {Doc | Doc[]}
 */
function printJSXAttribute(attr, path, options, print) {
	// `attr.name` is either a JSXIdentifier (regular `class`, `id`, ...) or a
	// JSXNamespacedName (`xlink:href`, `xmlns:xlink`, ...). The previous cast
	// to JSXIdentifier yielded a raw AST node as `name` for namespaced attrs,
	// which then leaked into the doc tree and crashed prettier's traversal
	// with `Unexpected doc.type 'JSXIdentifier'` (see svg-attributes.tsrx +
	// tsrx-features.tsrx fixtures). Mirror printJSXElementName's logic.
	const name =
		attr.name.type === 'JSXNamespacedName'
			? /** @type {ESTreeJSX.JSXNamespacedName} */ (attr.name).namespace.name +
				':' +
				/** @type {ESTreeJSX.JSXNamespacedName} */ (attr.name).name.name
			: /** @type {ESTreeJSX.JSXIdentifier} */ (attr.name).name;

	if (attr.shorthand) {
		return ['{', name, '}'];
	}

	if (!attr.value) {
		return name;
	}

	if (attr.value.type === 'Literal') {
		const quote = options.jsxSingleQuote ? "'" : '"';
		return [
			name,
			'=',
			quote,
			/** @type {string} */ (/** @type {AST.SimpleLiteral} */ (attr.value).value),
			quote,
		];
	}

	if (attr.value.type === 'JSXExpressionContainer') {
		const expression = attr.value.expression;
		if (expression.type === 'Literal' && typeof expression.value === 'string') {
			const quote = options.jsxSingleQuote ? "'" : '"';
			return [name, '=', quote, /** @type {string} */ (expression.value), quote];
		}
		const exprDoc = path.call(
			(valuePath) => print(valuePath, { isInAttribute: true }),
			'value',
			'expression',
		);
		if (shouldBreakAttributeExpressionClosingBrace(expression, options, attr)) {
			return [name, '={', exprDoc, hardline, '}'];
		}
		return [name, '={', exprDoc, '}'];
	}

	return name;
}

/**
 * Print a JSX element name.
 * @param {AST.Node} node - The JSX element name node
 * @returns {string}
 */
function printJSXElementName(node) {
	if (node.type === 'JSXIdentifier') {
		return node.name;
	}
	if (node.type === 'JSXMemberExpression') {
		return printJSXElementName(node.object) + '.' + printJSXElementName(node.property);
	}
	if (node.type === 'JSXNamespacedName') {
		const namespace_name = node.namespace.name;
		const local_name = node.name.name;
		return namespace_name + ':' + local_name;
	}
	return 'Unknown';
}
