/**
@import * as AST from 'estree'
@import * as ESTreeJSX from 'estree-jsx'
@import { Parse } from '@tsrx/core/types'
 */

import * as acorn from 'acorn';
import { parse_style } from './parse/style.js';
import {
	convert_from_jsx,
	skipWhitespace,
	BINDING_TYPES,
	DestructuringErrors,
} from './parse/index.js';
import { regex_newline_characters } from './utils/patterns.js';
import { error } from './errors.js';
import { DIAGNOSTIC_CODES } from './diagnostics.js';
import { TSRX_RETURN_STATEMENT_ERROR } from './analyze/validation.js';
const DYNAMIC_ELEMENT_IN_TSX_ERROR =
	'Dynamic element syntax (`<@...>`) is only supported in native TSRX templates.';
const DYNAMIC_ATTRIBUTE_NAME_ERROR =
	'Dynamic component / element syntax (`@`) is only supported on native TSRX element names, not attribute names.';

const CharCode = Object.freeze({
	tab: 9,
	lineFeed: 10,
	carriageReturn: 13,
	space: 32,
	doubleQuote: 34,
	dollar: 36,
	ampersand: 38,
	singleQuote: 39,
	openParen: 40,
	closeParen: 41,
	asterisk: 42,
	comma: 44,
	slash: 47,
	colon: 58,
	semicolon: 59,
	lessThan: 60,
	equals: 61,
	greaterThan: 62,
	at: 64,
	digit0: 48,
	digit9: 57,
	uppercaseA: 65,
	uppercaseZ: 90,
	openBracket: 91,
	backslash: 92,
	underscore: 95,
	backtick: 96,
	lowercaseA: 97,
	lowercaseZ: 122,
	openBrace: 123,
	closeBrace: 125,
});

/** @type {WeakMap<Record<string, boolean>, Map<string, number>>} */
const argument_clash_first_positions = new WeakMap();
/** @type {WeakMap<Record<string, boolean>, Set<string>>} */
const argument_clash_reported_names = new WeakMap();

/**
 * @param {Record<string, boolean>} check_clashes
 * @returns {Map<string, number>}
 */
function get_argument_clash_first_positions(check_clashes) {
	let first_positions = argument_clash_first_positions.get(check_clashes);
	if (!first_positions) {
		first_positions = new Map();
		argument_clash_first_positions.set(check_clashes, first_positions);
	}
	return first_positions;
}

/**
 * @param {Record<string, boolean>} check_clashes
 * @returns {Set<string>}
 */
function get_argument_clash_reported_names(check_clashes) {
	let reported_names = argument_clash_reported_names.get(check_clashes);
	if (!reported_names) {
		reported_names = new Set();
		argument_clash_reported_names.set(check_clashes, reported_names);
	}
	return reported_names;
}

/**
 * @param {string} input
 * @param {number} i
 */
function skip_whitespace_from(input, i) {
	while (i < input.length) {
		const ch = input.charCodeAt(i);
		if (
			ch !== CharCode.space &&
			ch !== CharCode.tab &&
			ch !== CharCode.lineFeed &&
			ch !== CharCode.carriageReturn
		)
			break;
		i++;
	}
	return i;
}

/**
 * Skip past a string literal opened at `i` with the given quote char code.
 * @param {string} input
 * @param {number} i
 * @param {number} quote
 */
function skip_string_from(input, i, quote) {
	i++;
	while (i < input.length) {
		const ch = input.charCodeAt(i);
		i++;
		if (ch === CharCode.backslash)
			i++; // backslash escape
		else if (ch === quote) return i;
	}
	return i;
}

/**
 * Scan past a balanced pair starting at `i` (which must point at `open`).
 * Returns the position after the matching close, or -1 if unbalanced.
 * @param {string} input
 * @param {number} i
 * @param {number} open
 * @param {number} close
 */
function scan_balanced_from(input, i, open, close) {
	let depth = 1;
	i++;
	while (i < input.length) {
		const ch = input.charCodeAt(i);
		if (ch === CharCode.doubleQuote || ch === CharCode.singleQuote || ch === CharCode.backtick) {
			i = skip_string_from(input, i, ch);
			continue;
		}
		if (ch === open) depth++;
		else if (ch === close && --depth === 0) return i + 1;
		i++;
	}
	return -1;
}

/**
 * Best-effort lookahead at a `<` to decide whether it starts a generic arrow
 * expression — `<...>(...)[: T] => ...`. Conservative: returns false on any
 * unexpected shape so JSX continues to parse as JSX.
 * @param {string} input
 * @param {number} pos
 */
function looks_like_generic_arrow(input, pos) {
	if (input.charCodeAt(pos) !== CharCode.lessThan) return false;

	// Match the angle brackets, skipping over string literals.
	let i = pos + 1;
	let depth = 1;
	while (i < input.length) {
		const ch = input.charCodeAt(i);
		if (ch === CharCode.doubleQuote || ch === CharCode.singleQuote || ch === CharCode.backtick) {
			i = skip_string_from(input, i, ch);
			continue;
		}
		if (ch === CharCode.lessThan) depth++;
		else if (ch === CharCode.greaterThan && --depth === 0) break;
		i++;
	}
	if (depth !== 0) return false;

	// `>` must be followed by `(...)`.
	i = skip_whitespace_from(input, i + 1);
	if (input.charCodeAt(i) !== CharCode.openParen) return false;
	i = scan_balanced_from(input, i, CharCode.openParen, CharCode.closeParen);
	if (i === -1) return false;

	// Optional `: ReturnType` before `=>`.
	i = skip_whitespace_from(input, i);
	if (input.charCodeAt(i) === CharCode.colon) {
		i++;
		while (i < input.length) {
			const ch = input.charCodeAt(i);
			if (ch === CharCode.doubleQuote || ch === CharCode.singleQuote || ch === CharCode.backtick) {
				i = skip_string_from(input, i, ch);
				continue;
			}
			if (ch === CharCode.equals && input.charCodeAt(i + 1) === CharCode.greaterThan) return true;
			if (ch === CharCode.semicolon || ch === CharCode.openBrace || ch === CharCode.closeBrace)
				return false;
			i++;
		}
		return false;
	}

	return (
		input.charCodeAt(i) === CharCode.equals && input.charCodeAt(i + 1) === CharCode.greaterThan
	);
}

/**
 * Acorn parser plugin for Ripple syntax extensions.
 * Adds support for: native TSRX templates, &[]/&{} lazy destructuring,
 * submodule imports, TSRX directives, and enhanced JSX handling.
 *
 * @param {import('../types/index').TSRXPluginConfig} [config] - Plugin configuration
 * @returns {(Parser: Parse.ParserConstructor) => Parse.ParserConstructor} Parser extension function
 */
export function TSRXPlugin(config) {
	return (/** @type {Parse.ParserConstructor} */ Parser) => {
		const original = acorn.Parser.prototype;
		const tt = Parser.tokTypes || acorn.tokTypes;
		const tc = Parser.tokContexts || acorn.tokContexts;
		// Some parser constructors (e.g. via TS plugins) expose `tokContexts` without `b_stat`.
		// If we push an undefined context, Acorn's tokenizer will later crash reading `.override`.
		const b_stat = tc.b_stat || acorn.tokContexts.b_stat;
		const b_expr = tc.b_expr || acorn.tokContexts.b_expr;
		const tstt = Parser.acornTypeScript.tokTypes;
		const tstc = Parser.acornTypeScript.tokContexts;

		class TSRXParser extends Parser {
			/** @type {AST.Node[]} */
			#path = [];
			#commentContextId = 0;
			#collect = false;
			#loose = false;
			/** @type {import('../types/index').CompileError[] | undefined} */
			#errors = undefined;
			/** @type {string | null} */
			#filename = null;
			#functionBodyDepth = 0;
			#allowExpressionContainerTrailingSemicolon = false;
			#tsxIslandExpressionDepth = 0;
			#insideNativeCodeBlock = false;

			/**
			 * @type {Parse.Parser['finishNode']}
			 */
			finishNode(node, type) {
				const finished = super.finishNode(node, type);
				if (type === 'TSModuleDeclaration') {
					const start = /** @type {number} */ (finished.start);
					const source = this.input.slice(start, start + 'namespace'.length);
					finished.metadata ??= { path: [] };
					finished.metadata.module_keyword = source.startsWith('namespace')
						? 'namespace'
						: 'module';
				}
				return finished;
			}

			/**
			 * @param {Parse.Options} options
			 * @param {string} input
			 */
			constructor(options, input) {
				super(options, input);
				const tsrx_options = options?.tsrxOptions ?? options?.rippleOptions;
				this.#collect = tsrx_options?.collect === true || tsrx_options?.loose === true;
				this.#loose = tsrx_options?.loose === true;
				this.#errors = tsrx_options?.errors;
				this.#filename = tsrx_options?.filename || null;
			}

			/**
			 * Native TSRX template bodies share one grammar across elements and fragments.
			 * This helper keeps the parser-state setup in one place while callers keep
			 * ownership of their distinct closing delimiter handling (`}` vs `</tag>`).
			 *
			 * @param {AST.Node[]} body
			 * @param {{
			 *   enterScope?: boolean,
			 *   resetFunctionBodyDepth?: boolean,
			 * }} [options]
			 */
			#parseNativeTemplateBody(body, { enterScope = false, resetFunctionBodyDepth = false } = {}) {
				const parent_function_body_depth = this.#functionBodyDepth;

				if (resetFunctionBodyDepth) {
					this.#functionBodyDepth = 0;
				}
				if (enterScope) {
					this.enterScope(0);
				}

				try {
					this.parseTemplateBody(body);
				} finally {
					if (enterScope) {
						this.exitScope();
					}
					if (resetFunctionBodyDepth) {
						this.#functionBodyDepth = parent_function_body_depth;
					}
				}
			}

			/**
			 * @param {AST.Node[]} children
			 */
			#reportDynamicJsxElementsInTsx(children) {
				for (const child of children) {
					if (child?.type === 'JSXElement') {
						const name = child.openingElement?.name;
						const is_dynamic_name =
							(name?.type === 'JSXIdentifier' && name.tracked) ||
							(name?.type === 'JSXMemberExpression' &&
								name.object.type === 'JSXIdentifier' &&
								name.object.tracked);
						if (is_dynamic_name) {
							this.#report_recoverable_error_range(
								/** @type {AST.NodeWithLocation} */ (name).start ?? child.start,
								/** @type {AST.NodeWithLocation} */ (name).end ?? child.end,
								DYNAMIC_ELEMENT_IN_TSX_ERROR,
							);
						}
						this.#reportDynamicJsxElementsInTsx(/** @type {AST.Node[]} */ (child.children));
					} else if (child?.type === 'TsxCompat') {
						this.#reportDynamicJsxElementsInTsx(/** @type {AST.Node[]} */ (child.children));
					}
				}
			}

			#parseNativeTemplateExpressionContainer() {
				const allow_trailing_semicolon = this.#allowExpressionContainerTrailingSemicolon;
				this.#allowExpressionContainerTrailingSemicolon = true;
				let node;
				try {
					node = this.jsx_parseExpressionContainer();
				} finally {
					this.#allowExpressionContainerTrailingSemicolon = allow_trailing_semicolon;
				}
				// Keep JSXEmptyExpression as-is (for prettier to handle comments)
				// but convert other expressions to native TSRX child nodes.
				if (node.expression.type !== 'JSXEmptyExpression') {
					/** @type {AST.TSRXExpression} */ (/** @type {unknown} */ (node)).type = 'TSRXExpression';
				}

				return /** @type {ESTreeJSX.JSXEmptyExpression | AST.TSRXExpression | ESTreeJSX.JSXExpressionContainer} */ (
					/** @type {unknown} */ (node)
				);
			}

			/**
			 * @param {AST.TsxCompat} island
			 * @param {AST.Node[]} body
			 */
			#parseTsxIslandBody(island, body) {
				const tagName = `tsx:${island.kind}`;

				this.exprAllowed = true;

				while (true) {
					if (this.type === tt.eof || this.pos >= this.input.length || this.type === tt.braceR) {
						const displayTag = tagName || '';
						this.#report_broken_markup_error(
							this.start,
							`Unclosed tag '<${displayTag}>'. Expected '</${displayTag}>' before end of template.`,
						);
						island.unclosed = true;
						/** @type {AST.NodeWithLocation} */ (island).loc.end = {
							.../** @type {AST.SourceLocation} */ (island.openingElement.loc).end,
						};
						island.end = island.openingElement.end;
						return;
					}

					if (this.#isAtTsxIslandClosing()) {
						this.exprAllowed = false;
						return;
					}

					if (this.type === tt.braceL) {
						body.push(this.#parseTsxIslandExpressionContainer());
					} else if (this.type === tstt.jsxTagStart) {
						body.push(super.jsx_parseElement());
					} else {
						const node = this.#parseTsxIslandText();
						if (node) {
							body.push(node);
						}
						this.#popTemplateLiteralTokenContext();
						this.next();
					}
				}
			}

			#parseTsxIslandExpressionContainer() {
				this.#tsxIslandExpressionDepth++;
				try {
					if (!this.#isAtReservedTemplateExpressionContainer()) {
						return this.jsx_parseExpressionContainer();
					}

					const node = /** @type {ESTreeJSX.JSXExpressionContainer} */ (this.startNode());
					this.next();
					this.next();
					const expression = /** @type {AST.Expression | ESTreeJSX.JSXEmptyExpression} */ (
						/** @type {unknown} */ (this.parseElement())
					);
					node.expression = expression;
					this.#popTokenContextsAfterTemplateExpressionElement(
						/** @type {AST.TsrxFragment | AST.TsxCompat} */ (/** @type {unknown} */ (expression)),
					);
					this.expect(tt.braceR);
					return this.finishNode(node, 'JSXExpressionContainer');
				} finally {
					this.#tsxIslandExpressionDepth--;
				}
			}

			#isAtReservedTemplateExpressionContainer() {
				if (this.type !== tt.braceL) {
					return false;
				}

				let index = this.start + 1;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (
						ch === CharCode.space ||
						ch === CharCode.tab ||
						ch === CharCode.lineFeed ||
						ch === CharCode.carriageReturn
					) {
						index++;
					} else {
						break;
					}
				}

				if (this.input.charCodeAt(index) !== CharCode.lessThan) {
					return false;
				}

				return this.#isReservedTemplateTagNameStart(index + 1);
			}

			/**
			 * @param {number} index
			 */
			#isReservedTemplateTagNameStart(index) {
				return this.input.startsWith('tsx:', index);
			}

			/**
			 */
			#isAtTsxIslandClosing() {
				return this.input.slice(this.pos, this.pos + 5) === '/tsx:';
			}

			#parseTsxIslandText() {
				const start = this.start;
				this.pos = start;
				let text = '';

				while (this.pos < this.input.length) {
					const ch = this.input.charCodeAt(this.pos);

					// Stop at opening tag, expression, or the template-closing brace
					if (ch === CharCode.lessThan || ch === CharCode.openBrace || ch === CharCode.closeBrace) {
						break;
					}

					text += this.input[this.pos];
					this.pos++;
				}

				if (!text) {
					return null;
				}

				return /** @type {ESTreeJSX.JSXText} */ ({
					type: 'JSXText',
					value: text,
					raw: text,
					start,
					end: this.pos,
				});
			}

			#popTsxTokenContextBeforeTemplateExpressionChild() {
				let index = this.pos;
				let has_newline = false;

				// Text-only compat islands can leave the tokenizer in JSX text mode.
				// Only unwind it for ASI before a following TSRX `{expr}` child;
				// fragment props like `content={<></>}` still need the JSX context.
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (ch === CharCode.space || ch === CharCode.tab) {
						index++;
					} else if (ch === CharCode.lineFeed || ch === CharCode.carriageReturn) {
						has_newline = true;
						index++;
					} else if (
						ch === CharCode.slash &&
						this.input.charCodeAt(index + 1) === CharCode.asterisk
					) {
						const end = this.input.indexOf('*/', index + 2);
						const comment_end = end === -1 ? this.input.length : end + 2;
						if (this.input.slice(index, comment_end).match(regex_newline_characters)) {
							has_newline = true;
						}
						index = comment_end;
					} else if (ch === CharCode.slash && this.input.charCodeAt(index + 1) === CharCode.slash) {
						has_newline = true;
						index += 2;
						while (index < this.input.length) {
							const comment_ch = this.input.charCodeAt(index);
							if (comment_ch === CharCode.lineFeed || comment_ch === CharCode.carriageReturn) break;
							index++;
						}
					} else {
						break;
					}
				}

				if (!has_newline || this.input.charCodeAt(index) !== CharCode.openBrace) {
					return;
				}

				const context_index = this.context.lastIndexOf(tstc.tc_expr);
				if (context_index !== -1) {
					this.context.length = context_index;
				}
			}

			#popTemplateLiteralTokenContext() {
				while (this.curContext()?.token === '`') {
					this.context.pop();
				}
			}

			/**
			 * @param {number} index
			 * @returns {number}
			 */
			#skipWhitespaceAndComments(index) {
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (
						ch === CharCode.space ||
						ch === CharCode.tab ||
						ch === CharCode.lineFeed ||
						ch === CharCode.carriageReturn
					) {
						index++;
					} else if (
						ch === CharCode.slash &&
						this.input.charCodeAt(index + 1) === CharCode.asterisk
					) {
						const end = this.input.indexOf('*/', index + 2);
						index = end === -1 ? this.input.length : end + 2;
					} else if (ch === CharCode.slash && this.input.charCodeAt(index + 1) === CharCode.slash) {
						index += 2;
						while (index < this.input.length) {
							const comment_ch = this.input.charCodeAt(index);
							if (comment_ch === CharCode.lineFeed || comment_ch === CharCode.carriageReturn) break;
							index++;
						}
					} else {
						break;
					}
				}
				return index;
			}

			/**
			 * @param {number} index
			 */
			#setRawPosition(index) {
				const loc = acorn.getLineInfo(this.input, index);
				this.pos = index;
				this.start = index;
				this.end = index;
				this.curLine = loc.line;
				this.lineStart = index - loc.column;
				this.startLoc = loc;
				this.endLoc = loc;
			}

			/**
			 * @param {number} index
			 */
			#readJavaScriptFrom(index) {
				this.context = [b_stat];
				this.exprAllowed = true;
				this.#setRawPosition(index);
				this.next();
			}

			/**
			 * @param {number} index
			 */
			#isNativeCodeBlockFenceAt(index) {
				if (!this.input.startsWith('---', index)) {
					return false;
				}

				let line_start = index - 1;
				while (
					line_start >= 0 &&
					this.input.charCodeAt(line_start) !== CharCode.lineFeed &&
					this.input.charCodeAt(line_start) !== CharCode.carriageReturn
				) {
					line_start--;
				}
				line_start++;

				for (let i = line_start; i < index; i++) {
					const ch = this.input.charCodeAt(i);
					if (ch !== CharCode.space && ch !== CharCode.tab) {
						return false;
					}
				}

				let cursor = index + 3;
				while (cursor < this.input.length) {
					const ch = this.input.charCodeAt(cursor);
					if (ch === CharCode.space || ch === CharCode.tab) {
						cursor++;
						continue;
					}
					return (
						ch === CharCode.lineFeed ||
						ch === CharCode.carriageReturn ||
						cursor === this.input.length
					);
				}

				return true;
			}

			#consumeNativeCodeBlockFenceLine() {
				let index = this.start + 3;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (ch === CharCode.space || ch === CharCode.tab) {
						index++;
					} else {
						break;
					}
				}

				if (this.input.charCodeAt(index) === CharCode.carriageReturn) {
					index++;
					if (this.input.charCodeAt(index) === CharCode.lineFeed) {
						index++;
					}
				} else if (this.input.charCodeAt(index) === CharCode.lineFeed) {
					index++;
				}

				this.#readJavaScriptFrom(index);
			}

			/**
			 * @param {number} index
			 */
			#isRenderControlFlowAt(index) {
				if (this.input.charCodeAt(index) !== CharCode.at) {
					return false;
				}

				const rest = this.input.slice(index + 1);
				return /^(if|switch|for|try)\b/.test(rest);
			}

			/**
			 * @param {number} index
			 */
			#findNativeTemplateTextEnd(index) {
				let cursor = index;
				while (cursor < this.input.length) {
					const ch = this.input.charCodeAt(cursor);
					if (
						ch === CharCode.lessThan ||
						ch === CharCode.openBrace ||
						ch === CharCode.closeBrace ||
						this.#isNativeCodeBlockFenceAt(cursor) ||
						this.#isRenderControlFlowAt(cursor)
					) {
						break;
					}
					cursor++;
				}
				return cursor;
			}

			/**
			 * @returns {ESTreeJSX.JSXText | null}
			 */
			#parseNativeTemplateText() {
				const start = this.start;
				const end = this.#findNativeTemplateTextEnd(start);
				if (end <= start) {
					return null;
				}

				const value = this.input.slice(start, end);
				const startLoc = acorn.getLineInfo(this.input, start);
				const endLoc = acorn.getLineInfo(this.input, end);
				this.#setRawPosition(end);

				return /** @type {ESTreeJSX.JSXText} */ ({
					type: 'JSXText',
					value,
					raw: value,
					start,
					end,
					loc: { start: startLoc, end: endLoc },
					metadata: { path: [] },
				});
			}

			/**
			 * @param {AST.Node[]} body
			 */
			#skipNativeTemplateWhitespace(body) {
				const start = this.start;
				let cursor = start;
				let has_newline = false;

				while (cursor < this.input.length) {
					const ch = this.input.charCodeAt(cursor);
					if (ch === CharCode.space || ch === CharCode.tab) {
						cursor++;
					} else if (ch === CharCode.lineFeed || ch === CharCode.carriageReturn) {
						has_newline = true;
						cursor++;
					} else {
						break;
					}
				}

				const parent = this.#path.at(-1);
				const inside_template =
					parent?.type === 'Element' ||
					parent?.type === 'TsrxFragment' ||
					parent?.type === 'TsxCompat';

				if (cursor > start && inside_template && body.length > 0 && !has_newline) {
					return;
				}

				skipWhitespace(this);
			}

			/**
			 * @param {string} name
			 * @param {number} start
			 */
			#createStaticClosingElement(name, start) {
				const end = start + name.length + 3;
				const nameStart = start + 2;
				const nameEnd = nameStart + name.length;
				return /** @type {ESTreeJSX.JSXClosingElement} */ ({
					type: 'JSXClosingElement',
					name: {
						type: 'JSXIdentifier',
						name,
						start: nameStart,
						end: nameEnd,
						loc: {
							start: acorn.getLineInfo(this.input, nameStart),
							end: acorn.getLineInfo(this.input, nameEnd),
						},
						metadata: { path: [] },
					},
					start,
					end,
					loc: {
						start: acorn.getLineInfo(this.input, start),
						end: acorn.getLineInfo(this.input, end),
					},
					metadata: { path: [] },
				});
			}

			/**
			 * @param {AST.Element | AST.TsrxFragment | AST.TsxCompat} node
			 */
			#getTemplateNodeName(node) {
				if (node.type === 'TsxCompat') {
					return 'tsx:' + node.kind;
				}
				if (node.type === 'TsrxFragment') {
					return '';
				}
				return node.id ? this.getElementName(node.id) : null;
			}

			/**
			 * @param {ESTreeJSX.JSXClosingElement | ESTreeJSX.JSXClosingFragment} node
			 */
			#getTemplateClosingName(node) {
				if (node.type === 'JSXClosingFragment') {
					return '';
				}
				if (node.name?.type === 'JSXNamespacedName') {
					return node.name.namespace.name + ':' + node.name.name.name;
				}
				return node.name ? this.getElementName(node.name) : null;
			}

			/**
			 * @param {number} startPos
			 * @param {acorn.Position} startLoc
			 */
			#parseTemplateClosingElement(startPos, startLoc) {
				const isRootTemplateExpression = this.#path.length === 1;
				let closingElement;
				if (isRootTemplateExpression) {
					closingElement = /** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
						this.startNodeAt(startPos, startLoc)
					);
					const nodeName =
						this.type === tstt.jsxTagEnd
							? null
							: /** @type {ESTreeJSX.JSXIdentifier} */ (this.jsx_parseElementName());
					if (nodeName) closingElement.name = nodeName;
					if (this.type !== tstt.jsxTagEnd) {
						this.unexpected();
					}
					this.finishNodeAt(
						closingElement,
						nodeName ? 'JSXClosingElement' : 'JSXClosingFragment',
						this.end,
						this.endLoc,
					);
					this.#setRawPosition(this.end);
				} else {
					closingElement = /** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
						this.jsx_parseClosingElementAt(startPos, startLoc)
					);
				}
				this.exprAllowed = false;

				const currentElement = this.#path[this.#path.length - 1];
				if (
					!currentElement ||
					(currentElement.type !== 'Element' &&
						currentElement.type !== 'TsrxFragment' &&
						currentElement.type !== 'TsxCompat')
				) {
					this.raise(this.start, 'Unexpected closing tag');
				}

				const openingTagName = this.#getTemplateNodeName(currentElement);
				const closingTagName = this.#getTemplateClosingName(closingElement);

				if (openingTagName !== closingTagName) {
					this.#report_broken_markup_error(
						closingElement.start,
						`Expected closing tag to match opening tag. Expected '</${openingTagName}>' but found '</${closingTagName}>'`,
						DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG,
					);

					while (this.#path.length > 0) {
						const elem = this.#path[this.#path.length - 1];
						if (
							elem.type !== 'Element' &&
							elem.type !== 'TsrxFragment' &&
							elem.type !== 'TsxCompat'
						) {
							break;
						}

						if (this.#getTemplateNodeName(elem) === closingTagName) {
							break;
						}

						elem.unclosed = true;
						/** @type {AST.NodeWithLocation} */ (elem).loc.end = {
							.../** @type {AST.SourceLocation} */ (elem.openingElement.loc).end,
						};
						elem.end = elem.openingElement.end;
						this.#path.pop();
					}
				}

				const elementToClose = this.#path[this.#path.length - 1];
				if (
					elementToClose &&
					(elementToClose.type === 'Element' || elementToClose.type === 'TsrxFragment')
				) {
					if (this.#getTemplateNodeName(elementToClose) === closingTagName) {
						elementToClose.closingElement = closingElement;
					}
				}

				this.#path.pop();
			}

			#popSkippedTemplateElementTokenContext() {
				const ctx = this.context;
				const ci = ctx.length - 1;
				if (ctx[ci] === tstc.tc_oTag && ctx[ci - 1] === tstc.tc_expr) {
					ctx.length = ci - 1;
				} else if (ctx[ci] === tstc.tc_expr && ctx[ci - 1] === tstc.tc_oTag) {
					ctx.length = ci;
				}
			}

			/**
			 * @param {AST.Node[]} body
			 * @returns {boolean}
			 */
			#parseTemplateTag(body) {
				const startPos = this.start;
				const startLoc = acorn.getLineInfo(this.input, startPos);
				if (this.type !== tstt.jsxTagStart || this.start !== startPos) {
					this.#setRawPosition(startPos);
					this.next();
				}

				if (!this.context.includes(tstc.tc_oTag)) {
					this.context.push(tstc.tc_oTag);
				}
				this.next();
				if (this.value === '/' || this.type === tt.slash) {
					this.next();
					this.#parseTemplateClosingElement(startPos, startLoc);
					return true;
				}

				const node = this.parseElement();
				if (node) body.push(node);
				return false;
			}

			#parseRenderControlStatement() {
				this.#readJavaScriptFrom(this.start + 1);
				const label = this.type?.label;
				if (label !== 'if' && label !== 'switch' && label !== 'for' && label !== 'try') {
					this.raise(this.start, 'Expected @if, @switch, @for, or @try');
				}
				const node = this.parseStatement(null);
				this.#report_invalid_template_return_statements(node);
				node.metadata ??= { path: [] };
				node.metadata.tsrx_render_control_flow = true;
				return node;
			}

			#parseNativeCodeBlock() {
				const node = /** @type {AST.Node & { body: AST.Node[] }} */ (this.startNode());
				node.body = [];
				this.#consumeNativeCodeBlockFenceLine();
				const was_inside_native_code_block = this.#insideNativeCodeBlock;
				this.#insideNativeCodeBlock = true;
				try {
					while (this.type !== tt.eof) {
						if (this.#isNativeCodeBlockFenceAt(this.start)) {
							const end = this.start + 3;
							const endLoc = acorn.getLineInfo(this.input, end);
							this.#consumeNativeCodeBlockFenceLine();
							return this.finishNodeAt(node, 'TSRXCodeBlock', end, endLoc);
						}

						if (this.type === tt.braceR) {
							this.raise(this.start, 'Unclosed TSRX code block. Expected closing ---');
						}

						const statement = this.parseStatement(null);
						this.#report_invalid_template_return_statements(statement);
						node.body.push(statement);
					}
				} finally {
					this.#insideNativeCodeBlock = was_inside_native_code_block;
				}

				this.raise(this.start, 'Unclosed TSRX code block. Expected closing ---');
			}

			/** @returns {number} */
			#countFollowingRightBraces() {
				let index = this.end;
				let count = 0;
				while (index < this.input.length) {
					index = this.#skipWhitespaceAndComments(index);
					if (this.input.charCodeAt(index) !== CharCode.closeBrace) break;
					count++;
					index++;
				}
				return count;
			}

			/**
			 * @param {AST.TsrxFragment | AST.TsxCompat} node
			 */
			#popTokenContextsAfterTemplateExpressionElement(node) {
				const ctx = this.context;
				const ci = ctx.length - 1;
				const top = ctx[ci];
				const second = ctx[ci - 1];

				// Expression-bodied templates (no statement child) followed by `,`
				// in an object/array literal need surgical fixups; statement-bodied
				// templates fall through to the JSX-expression-container strip.
				const has_stmt_child = node.children?.some(
					(child) => child.type.endsWith('Statement') || child.type === 'VariableDeclaration',
				);
				if (this.type === tt.comma && !has_stmt_child) {
					// Tail `..., (b_expr)+, tc_expr, b_stat`: the JSX expression
					// container leaks an extra `tc_expr, b_stat`. Pop them, and if
					// the JSX container also closes immediately (`}}` ahead), drop
					// one of the doubled-up `b_expr` contexts too.
					if (top === b_stat && second === tstc.tc_expr) {
						let expr_count = 0;
						for (let i = ci - 2; ctx[i] === b_expr; i--) expr_count++;
						const following_braces = this.#countFollowingRightBraces();
						if (expr_count === 2 || following_braces > 1) {
							if (following_braces > 1 && expr_count > 1) {
								ctx.splice(ci - 2, expr_count - 1);
								ctx.pop();
								this.exprAllowed = false;
								return;
							}
							if (expr_count === 2 && following_braces === 0) {
								// Fragment expression value followed by another
								// object/array entry inside a JSX expression
								// container (`{ a: <></>, b: ... }` or
								// `[<></>, ...]`): strip both the leaked tc_expr
								// and b_stat so the next entry parses as an
								// expression, and leave exprAllowed alone so a
								// following `<` still tokenizes as jsxTagStart.
								ctx.length = ci - 1;
								return;
							}
							ctx.pop();
							this.exprAllowed = false;
							return;
						}
					}
					// Tail `..., b_expr, b_expr` for fragments-with-children
					// inside an array or object literal: re-arm expression mode
					// so the next item parses as an expression value, not a JSX
					// child. If the surrounding b_expr chain has already been
					// consumed, push one back so the subsequent item still has
					// a literal context. Leave exprAllowed alone so a following
					// `<` still tokenizes as jsxTagStart.
					if (top === b_expr && second === b_expr) {
						if (ctx[ci - 2] !== b_expr && ctx[ci - 2] !== tstc.tc_oTag) {
							ctx.push(b_expr);
						}
						return;
					}
				}

				if (
					this.type === tt.braceR &&
					this.#path.at(-1)?.type === 'Element' &&
					!ctx.includes(tstc.tc_oTag)
				) {
					const next_index = this.#skipWhitespaceAndComments(this.end);
					const next_char = this.input.charCodeAt(next_index);
					if (
						next_char === CharCode.slash ||
						next_char === CharCode.greaterThan ||
						(this.context.includes(tstc.tc_oTag) && acorn.isIdentifierStart(next_char, true))
					) {
						ctx.push(tstc.tc_oTag);
						return;
					}
				}

				if (this.type === tt.braceR && top === tstc.tc_oTag && second === tstc.tc_expr) {
					ctx.push(b_expr);
					return;
				}

				// Inside a native template JSX expression container — strip
				// both the leaked `b_stat` and the container's `tc_expr`.
				if (top === b_stat && second === tstc.tc_expr) {
					ctx.length = ci - 1;
					return;
				}
				// Statement-bodied native template attributes can leave the attribute's
				// expression contexts above the still-open JSX tag context. Strip
				// those so a following `/>` stays in JSX opening-tag mode.
				if (
					this.type === tt.braceR &&
					top === tstc.tc_expr &&
					second === b_expr &&
					ctx[ci - 2] === tstc.tc_oTag
				) {
					ctx.length = ci - 1;
					return;
				}
				// Closing token after the template at expression position. For `}`
				// only pop if it actually closes this `b_expr` — otherwise the
				// brace targets an inner callback/object body that should pop it
				// naturally on the next token step.
				if (
					(this.type === tt.braceR &&
						top === b_expr &&
						(this.#countFollowingRightBraces() === 0 || second === b_expr)) ||
					(this.type === tt.parenR && top?.token === '(') ||
					(this.type === tt.bracketR && top?.token === '[')
				) {
					ctx.pop();
					this.exprAllowed = false;
				}
			}

			/**
			 * @param {number} position
			 * @param {number} end
			 * @param {string} message
			 * @param {string} [code]
			 */
			#report_recoverable_error_range(position, end, message, code) {
				const start = Math.max(0, Math.min(position, this.input.length));
				const range_end = Math.max(start, Math.min(end, this.input.length));
				const start_loc = acorn.getLineInfo(this.input, start);
				const end_loc = acorn.getLineInfo(this.input, range_end);

				error(
					message,
					this.#filename,
					/** @type {AST.NodeWithLocation} */ ({
						start,
						end: range_end,
						loc: {
							start: start_loc,
							end: end_loc,
						},
					}),
					this.#collect ? this.#errors : undefined,
					undefined,
					code,
				);
			}

			/**
			 * @param {number} position
			 * @param {string} message
			 * @param {string} [code]
			 */
			#report_recoverable_error(position, message, code) {
				this.#report_recoverable_error_range(position, position + 1, message, code);
			}

			/**
			 * @param {number} position
			 * @param {string} message
			 * @param {string} [code]
			 */
			#report_broken_markup_error(position, message, code = DIAGNOSTIC_CODES.UNCLOSED_TAG) {
				if (this.#loose) return;
				if (this.#collect) {
					this.#report_recoverable_error(position, message, code);
					return;
				}
				this.raise(position, message);
			}

			/**
			 * @param {AST.Node | AST.Node[] | unknown} maybe_node
			 * @param {boolean} [inside_nested_function]
			 * @param {boolean} [inside_loop]
			 */
			#report_invalid_template_return_statements(
				maybe_node,
				inside_nested_function = false,
				inside_loop = false,
			) {
				if (!maybe_node || typeof maybe_node !== 'object') {
					return;
				}

				let node = /** @type {AST.Node} */ (maybe_node);
				if (
					node.type === 'FunctionDeclaration' ||
					node.type === 'FunctionExpression' ||
					node.type === 'ArrowFunctionExpression'
				) {
					inside_nested_function = true;
				}

				if (
					node.type === 'ForStatement' ||
					node.type === 'ForInStatement' ||
					node.type === 'ForOfStatement' ||
					node.type === 'WhileStatement' ||
					node.type === 'DoWhileStatement'
				) {
					inside_loop = true;
				}

				if (!inside_nested_function && !inside_loop && node.type === 'ReturnStatement') {
					node.metadata = {
						...node.metadata,
						invalid_tsrx_template_return: true,
					};
					this.#report_recoverable_error(
						/** @type {AST.NodeWithLocation} */ (node).start ?? this.start,
						TSRX_RETURN_STATEMENT_ERROR,
						DIAGNOSTIC_CODES.TEMPLATE_RETURN_STATEMENT,
					);
					return;
				}

				if (Array.isArray(node)) {
					for (const child of /** @type {AST.Node[]} */ (node)) {
						this.#report_invalid_template_return_statements(
							child,
							inside_nested_function,
							inside_loop,
						);
					}
					return;
				}

				for (const key of Object.keys(node)) {
					if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
						continue;
					}
					this.#report_invalid_template_return_statements(
						/** @type {Record<string, unknown>} */ (node)[key],
						inside_nested_function,
						inside_loop,
					);
				}
			}

			/**
			 * When collecting, keep parsing after duplicate declaration diagnostics so
			 * editor tooling can continue producing AST and mappings.
			 * @param {number} position
			 * @param {string | { message?: string }} message
			 */
			raiseRecoverable(position, message) {
				const error_message =
					typeof message === 'string'
						? message
						: typeof message?.message === 'string'
							? message.message
							: String(message);

				if (
					error_message.includes('has already been declared') ||
					error_message === 'Argument name clash'
				) {
					this.#report_recoverable_error(position, error_message);
					return;
				}

				return super.raiseRecoverable(position, error_message);
			}

			/**
			 * Override to allow single-parameter generic arrow functions without trailing comma.
			 * By default, @sveltejs/acorn-typescript throws an error for `<T>() => {}` when JSX is enabled
			 * because it can't disambiguate from JSX. However, the parser still parses it correctly
			 * using tryParse - it just throws afterwards. By overriding this to do nothing, we allow
			 * the valid parse to succeed.
			 * @param {AST.TSTypeParameterDeclaration} node
			 */
			reportReservedArrowTypeParam(node) {
				// Allow <T>() => {} syntax without requiring trailing comma
				if (this.#collect && node.params.length === 1 && node.extra?.trailingComma === undefined) {
					error(
						'This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma, as in `<T,>() => ...`.',
						this.#filename,
						node,
						this.#errors,
					);
				}
			}

			/**
			 * Override to allow `readonly` type modifier on any type when collecting.
			 * By default, @sveltejs/acorn-typescript throws an error for `readonly { ... }`
			 * because TypeScript only permits `readonly` on array and tuple types.
			 * Suppress the error in the strict mode as ts is compiled away.
			 * @param {AST.TSTypeOperator} node
			 */
			tsCheckTypeAnnotationForReadOnly(node) {
				const typeAnnotation = /** @type {AST.TypeNode} */ (node.typeAnnotation);
				if (typeAnnotation.type === 'TSTupleType' || typeAnnotation.type === 'TSArrayType') {
					// Valid readonly usage, no error needed
					return;
				}

				if (this.#collect) {
					error(
						"'readonly' type modifier is only permitted on array and tuple literal types.",
						this.#filename,
						typeAnnotation,
						this.#errors,
					);
				}
			}

			/**
			 * Override parsePropertyValue to support TypeScript generic methods in object literals.
			 * By default, acorn-typescript doesn't handle `{ method<T>() {} }` syntax.
			 * This override checks for type parameters before parsing the method.
			 * @type {Parse.Parser['parsePropertyValue']}
			 */
			parsePropertyValue(
				prop,
				isPattern,
				isGenerator,
				isAsync,
				startPos,
				startLoc,
				refDestructuringErrors,
				containsEsc,
			) {
				// Check if this is a method with type parameters (e.g., `method<T>() {}`)
				// We need to parse type parameters before the parentheses
				if (
					!isPattern &&
					!isGenerator &&
					!isAsync &&
					this.type === tt.relational &&
					this.value === '<'
				) {
					// Try to parse type parameters
					const typeParameters = this.tsTryParseTypeParameters();
					if (typeParameters && this.type === tt.parenL) {
						// This is a method with type parameters
						/** @type {AST.Property} */ (prop).method = true;
						/** @type {AST.Property} */ (prop).kind = 'init';
						/** @type {AST.Property} */ (prop).value = this.parseMethod(false, false);
						/** @type {AST.FunctionExpression} */ (
							/** @type {AST.Property} */ (prop).value
						).typeParameters = typeParameters;
						return;
					}
				}

				return super.parsePropertyValue(
					prop,
					isPattern,
					isGenerator,
					isAsync,
					startPos,
					startLoc,
					refDestructuringErrors,
					containsEsc,
				);
			}

			/**
			 * Acorn expects `this.context` to always contain at least one tokContext.
			 * Some of our template/JSX escape hatches can pop contexts aggressively;
			 * if the stack becomes empty, Acorn will crash reading `curContext().override`.
			 * @type {Parse.Parser['nextToken']}
			 */
			nextToken() {
				while (this.context.length && this.context[this.context.length - 1] == null) {
					this.context.pop();
				}
				if (this.context.length === 0) {
					this.context.push(b_stat);
				}
				return super.nextToken();
			}

			/**
			 * Helper method to get the element name from a JSX identifier or member expression
			 * @type {Parse.Parser['getElementName']}
			 */
			getElementName(node) {
				if (!node) return null;
				if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
					return node.name;
				} else if (node.type === 'MemberExpression' || node.type === 'JSXMemberExpression') {
					// For components like <Foo.Bar>, return "Foo.Bar"
					return this.getElementName(node.object) + '.' + this.getElementName(node.property);
				}
				return null;
			}

			/**
			 * `<T,>(x: T) => x` and `<T>(x: T): T => x` should parse as generic
			 * arrow functions, not JSX elements. acorn-typescript's `readToken`
			 * can otherwise tokenize `<` as `jsxTagStart` when expression parsing
			 * allows JSX, bypassing our `getTokenFromCode` override. We intercept
			 * only when the source from `<` actually looks like a generic arrow
			 * expression, so JSX like `<div>` keeps parsing normally.
			 *
			 * @type {Parse.Parser['readToken']}
			 */
			readToken(code) {
				if (code === CharCode.lessThan && looks_like_generic_arrow(this.input, this.pos)) {
					++this.pos;
					return this.finishToken(tt.relational, '<');
				}
				if (code === CharCode.lessThan && this.#isJsxValueStartAfterPunctuation()) {
					++this.pos;
					return this.finishToken(tstt.jsxTagStart);
				}
				return super.readToken(code);
			}

			#isJsxValueStartAfterPunctuation() {
				let lookback = this.pos - 1;
				while (lookback >= 0) {
					const ch = this.input.charCodeAt(lookback);
					if (ch !== CharCode.space && ch !== CharCode.tab) break;
					lookback--;
				}
				if (lookback < 0) return false;
				const prev = this.input.charCodeAt(lookback);
				return (
					prev === CharCode.comma ||
					prev === CharCode.colon ||
					prev === CharCode.openBracket ||
					prev === CharCode.openParen ||
					prev === CharCode.equals
				);
			}

			/**
			 * Get token from character code - handles Ripple-specific tokens
			 * @type {Parse.Parser['getTokenFromCode']}
			 */
			getTokenFromCode(code) {
				// Callback props that return native templates without a semicolon can
				// leave the attribute expression context above the still-open tag. Drop
				// it before tokenizing `/>`, otherwise Acorn treats `/` as a regexp.
				if (
					code === CharCode.slash &&
					this.input.charCodeAt(this.pos + 1) === CharCode.greaterThan &&
					this.context.includes(tstc.tc_oTag)
				) {
					while (this.context.length > 0 && this.curContext() !== tstc.tc_oTag) {
						this.context.pop();
					}
					this.exprAllowed = false;
				}
				if (code === CharCode.lessThan) {
					// < character
					/** @type {number | null} */
					let prevNonWhitespaceChar = null;

					// Check if this could be TypeScript generics instead of JSX
					// TypeScript generics appear after: identifiers, closing parens, 'new' keyword
					// For example: Array<T>, func<T>(), new Map<K,V>(), method<T>()
					// This check applies everywhere, not just inside components

					// Look back to see what precedes the <
					let lookback = this.pos - 1;

					// Skip whitespace backwards
					while (lookback >= 0) {
						const ch = this.input.charCodeAt(lookback);
						if (ch !== CharCode.space && ch !== CharCode.tab) break; // not space or tab
						lookback--;
					}

					// Check what character/token precedes the <
					if (lookback >= 0) {
						const prevChar = this.input.charCodeAt(lookback);
						prevNonWhitespaceChar = prevChar;

						// If preceded by identifier character (letter, digit, _, $) or closing paren,
						// this is likely TypeScript generics, not JSX
						const isIdentifierChar =
							(prevChar >= CharCode.uppercaseA && prevChar <= CharCode.uppercaseZ) ||
							(prevChar >= CharCode.lowercaseA && prevChar <= CharCode.lowercaseZ) ||
							(prevChar >= CharCode.digit0 && prevChar <= CharCode.digit9) ||
							prevChar === CharCode.underscore ||
							prevChar === CharCode.dollar ||
							prevChar === CharCode.closeParen;

						if (isIdentifierChar) {
							return super.getTokenFromCode(code);
						}
					}

					// Support parsing standalone template markup at the top-level
					// for tooling like Prettier, e.g.:
					// <Something>...</Something>\n\n<Child />
					// <head><style>...</style></head>
					// We only do this when '<' is in a tag-like position.
					const nextChar =
						this.pos + 1 < this.input.length ? this.input.charCodeAt(this.pos + 1) : -1;
					const isWhitespaceAfterLt =
						nextChar === CharCode.space ||
						nextChar === CharCode.tab ||
						nextChar === CharCode.lineFeed ||
						nextChar === CharCode.carriageReturn;
					const isTagLikeAfterLt =
						!isWhitespaceAfterLt &&
						(nextChar === CharCode.slash ||
							nextChar === CharCode.greaterThan ||
							nextChar === CharCode.at ||
							nextChar === CharCode.dollar ||
							nextChar === CharCode.underscore ||
							(nextChar >= CharCode.uppercaseA && nextChar <= CharCode.uppercaseZ) ||
							(nextChar >= CharCode.lowercaseA && nextChar <= CharCode.lowercaseZ));
					const prevAllowsTagStart =
						prevNonWhitespaceChar === null ||
						prevNonWhitespaceChar === CharCode.lineFeed || // '\n'
						prevNonWhitespaceChar === CharCode.carriageReturn || // '\r'
						prevNonWhitespaceChar === CharCode.openBrace ||
						prevNonWhitespaceChar === CharCode.openBracket ||
						prevNonWhitespaceChar === CharCode.openParen ||
						prevNonWhitespaceChar === CharCode.closeBrace ||
						prevNonWhitespaceChar === CharCode.comma ||
						prevNonWhitespaceChar === CharCode.colon ||
						prevNonWhitespaceChar === CharCode.equals ||
						prevNonWhitespaceChar === CharCode.greaterThan;

					if (prevAllowsTagStart && isTagLikeAfterLt) {
						++this.pos;
						return this.finishToken(tstt.jsxTagStart);
					}
				}

				return super.getTokenFromCode(code);
			}

			/**
			 * Override isLet to recognize `let &{` and `let &[` as variable declarations.
			 * Acorn's isLet checks the char after `let` and only recognizes `{`, `[`, or identifiers.
			 * The `&` character is not in that set, so `let &{...}` would not be parsed as a declaration.
			 * @type {Parse.Parser['isLet']}
			 */
			isLet(context) {
				if (!this.isContextual('let')) return false;
				const skip = /\s*/y;
				skip.lastIndex = this.pos;
				const match = skip.exec(this.input);
				if (!match) return super.isLet(context);
				const next = this.pos + match[0].length;
				const nextCh = this.input.charCodeAt(next);
				// If next char is &, check if char after & is { or [
				if (nextCh === CharCode.ampersand) {
					const afterAmp = this.input.charCodeAt(next + 1);
					if (afterAmp === CharCode.openBrace || afterAmp === CharCode.openBracket) return true;
				}
				return super.isLet(context);
			}

			/**
			 * Parse binding atom - handles lazy destructuring patterns (&{...} and &[...])
			 * When & is directly followed by { or [, parse as a lazy destructuring pattern.
			 * The resulting ObjectPattern/ArrayPattern node gets a `lazy: true` flag.
			 */
			parseBindingAtom() {
				if (this.type === tt.bitwiseAND) {
					// Check that the char immediately after & is { or [ (no whitespace)
					const charAfterAmp = this.input.charCodeAt(this.end);
					if (charAfterAmp === CharCode.openBrace || charAfterAmp === CharCode.openBracket) {
						// & directly followed by { or [ — lazy destructuring
						this.next(); // consume &, now current token is { or [
						const pattern = super.parseBindingAtom();
						/** @type {AST.ObjectPattern | AST.ArrayPattern} */ (pattern).lazy = true;
						return pattern;
					}
				}
				return super.parseBindingAtom();
			}

			/**
			 * Acorn reports only the second duplicate function parameter. When collecting,
			 * report the first one too so editor diagnostics can underline both
			 * binding sites. Keep strict mode on Acorn's normal fatal path.
			 *
			 * @type {Parse.Parser['checkLValSimple']}
			 */
			checkLValSimple(expr, bindingType = BINDING_TYPES.BIND_NONE, checkClashes) {
				if (
					this.#collect &&
					expr.type === 'Identifier' &&
					bindingType !== BINDING_TYPES.BIND_NONE &&
					checkClashes
				) {
					const first_positions = get_argument_clash_first_positions(checkClashes);
					const reported_names = get_argument_clash_reported_names(checkClashes);
					const first_position = first_positions.get(expr.name);

					if (Object.prototype.hasOwnProperty.call(checkClashes, expr.name)) {
						if (first_position != null && !reported_names.has(expr.name)) {
							this.#report_recoverable_error_range(
								first_position,
								first_position + expr.name.length,
								'Argument name clash',
							);
							reported_names.add(expr.name);
						}
						const start = /** @type {number} */ (expr.start);
						this.#report_recoverable_error_range(
							start,
							/** @type {number} */ (expr.end ?? start + expr.name.length),
							'Argument name clash',
						);
						return;
					}

					const result = super.checkLValSimple(expr, bindingType, checkClashes);
					first_positions.set(expr.name, /** @type {number} */ (expr.start));
					return result;
				}

				return super.checkLValSimple(expr, bindingType, checkClashes);
			}

			/**
			 * Override to track parenthesized expressions in metadata
			 * This allows the prettier plugin to preserve parentheses where they existed
			 * @type {Parse.Parser['parseParenAndDistinguishExpression']}
			 */
			parseParenAndDistinguishExpression(canBeArrow, forInit) {
				const startPos = this.start;
				const expr = super.parseParenAndDistinguishExpression(canBeArrow, forInit);

				// If the expression's start position is after the opening paren,
				// it means it was wrapped in parentheses. Mark it in metadata.
				if (expr && /** @type {AST.NodeWithLocation} */ (expr).start > startPos) {
					expr.metadata ??= { path: [] };
					expr.metadata.parenthesized = true;
				}

				return expr;
			}

			/**
			 * Override checkLocalExport to check all scopes in the scope stack.
			 * This is needed because submodules create nested scopes, but exports
			 * from within submodules should still be valid if the identifier is
			 * declared in the submodule scope (not just the top-level module scope).
			 * @type {Parse.Parser['checkLocalExport']}
			 */
			checkLocalExport(id) {
				const { name } = id;
				if (this.hasImport(name)) return;
				// Check all scopes in the scope stack, not just the top-level scope
				for (let i = this.scopeStack.length - 1; i >= 0; i--) {
					const scope = this.scopeStack[i];
					if (scope.lexical.indexOf(name) !== -1 || scope.var.indexOf(name) !== -1) {
						// Found in a scope, remove from undefinedExports if it was added
						delete this.undefinedExports[name];
						return;
					}
				}
				// Not found in any scope, add to undefinedExports for later error
				this.undefinedExports[name] = id;
			}

			/** @type {Parse.Parser['parseForStatement']} */
			parseForStatement(node) {
				this.next();
				let awaitAt =
					this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual('await')
						? this.lastTokStart
						: -1;
				this.labels.push({ kind: 'loop' });
				this.enterScope(0);
				this.expect(tt.parenL);

				if (this.type === tt.semi) {
					if (awaitAt > -1) this.unexpected(awaitAt);
					return this.parseFor(node, null);
				}

				// @ts-ignore — acorn internal: isLet accepts 0 args at runtime
				let isLet = this.isLet();
				if (this.type === tt._var || this.type === tt._const || isLet) {
					let init = /** @type {AST.VariableDeclaration} */ (this.startNode()),
						kind = isLet ? 'let' : /** @type {AST.VariableDeclaration['kind']} */ (this.value);
					this.next();
					this.parseVar(init, true, kind);
					this.finishNode(init, 'VariableDeclaration');
					return this.parseForAfterInitWithIndex(
						/** @type {AST.ForInStatement | AST.ForOfStatement} */ (node),
						init,
						awaitAt,
					);
				}

				// Handle other cases like using declarations if they exist
				let startsWithLet = this.isContextual('let'),
					isForOf = false;
				let usingKind =
					this.isUsing && this.isUsing(true)
						? 'using'
						: this.isAwaitUsing && this.isAwaitUsing(true)
							? 'await using'
							: null;
				if (usingKind) {
					let init = /** @type {AST.VariableDeclaration} */ (this.startNode());
					this.next();
					if (usingKind === 'await using') {
						if (!this.canAwait) {
							this.raise(this.start, 'Await using cannot appear outside of async function');
						}
						this.next();
					}
					this.parseVar(init, true, usingKind);
					this.finishNode(init, 'VariableDeclaration');
					return this.parseForAfterInitWithIndex(
						/** @type {AST.ForInStatement | AST.ForOfStatement} */ (node),
						init,
						awaitAt,
					);
				}

				let containsEsc = this.containsEsc;
				let refDestructuringErrors = new /** @type {new () => Parse.DestructuringErrors} */ (
					/** @type {unknown} */ (DestructuringErrors)
				)();
				let initPos = this.start;
				let init_expr =
					awaitAt > -1
						? this.parseExprSubscripts(refDestructuringErrors, 'await')
						: this.parseExpression(true, refDestructuringErrors);

				if (
					this.type === tt._in ||
					(isForOf = this.options.ecmaVersion >= 6 && this.isContextual('of'))
				) {
					if (awaitAt > -1) {
						// implies `ecmaVersion >= 9`
						if (this.type === tt._in) this.unexpected(awaitAt);
						/** @type {AST.ForOfStatement} */ (node).await = true;
					} else if (isForOf && this.options.ecmaVersion >= 8) {
						if (
							init_expr.start === initPos &&
							!containsEsc &&
							init_expr.type === 'Identifier' &&
							init_expr.name === 'async'
						)
							this.unexpected();
						else if (this.options.ecmaVersion >= 9)
							/** @type {AST.ForOfStatement} */ (node).await = false;
					}
					if (startsWithLet && isForOf)
						this.raise(
							/** @type {AST.NodeWithLocation} */ (init_expr).start,
							"The left-hand side of a for-of loop may not start with 'let'.",
						);
					const init = this.toAssignable(init_expr, false, refDestructuringErrors);
					this.checkLValPattern(init);
					return this.parseForInWithIndex(
						/** @type {AST.ForInStatement | AST.ForOfStatement} */ (node),
						init,
					);
				} else {
					this.checkExpressionErrors(refDestructuringErrors, true);
				}

				if (awaitAt > -1) this.unexpected(awaitAt);
				return this.parseFor(node, init_expr);
			}

			/** @type {Parse.Parser['parseForAfterInitWithIndex']} */
			parseForAfterInitWithIndex(node, init, awaitAt) {
				if (
					(this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual('of'))) &&
					init.declarations.length === 1
				) {
					if (this.options.ecmaVersion >= 9) {
						if (this.type === tt._in) {
							if (awaitAt > -1) {
								this.unexpected(awaitAt);
							}
						} else {
							/** @type {AST.ForOfStatement} */ (node).await = awaitAt > -1;
						}
					}
					return this.parseForInWithIndex(
						/** @type {AST.ForInStatement | AST.ForOfStatement} */ (node),
						init,
					);
				}
				if (awaitAt > -1) {
					this.unexpected(awaitAt);
				}
				return this.parseFor(node, init);
			}

			/** @type {Parse.Parser['parseForInWithIndex']} */
			parseForInWithIndex(node, init) {
				const isForIn = this.type === tt._in;
				this.next();

				if (
					init.type === 'VariableDeclaration' &&
					init.declarations[0].init != null &&
					(!isForIn ||
						this.options.ecmaVersion < 8 ||
						this.strict ||
						init.kind !== 'var' ||
						init.declarations[0].id.type !== 'Identifier')
				) {
					this.raise(
						/** @type {AST.NodeWithLocation} */ (init).start,
						`${isForIn ? 'for-in' : 'for-of'} loop variable declaration may not have an initializer`,
					);
				}

				node.left = init;
				node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();

				// Check for our extended syntax: "; index varName"
				if (!isForIn && this.type === tt.semi) {
					this.next(); // consume ';'

					if (this.isContextual('index')) {
						this.next(); // consume 'index'
						/** @type {AST.ForOfStatement} */ (node).index = /** @type {AST.Identifier} */ (
							this.parseExpression()
						);
						if (
							/** @type {AST.Identifier} */ (/** @type {AST.ForOfStatement} */ (node).index)
								.type !== 'Identifier'
						) {
							this.raise(this.start, 'Expected identifier after "index" keyword');
						}
						this.eat(tt.semi);
					}

					if (this.isContextual('key')) {
						this.next(); // consume 'key'
						/** @type {AST.ForOfStatement} */ (node).key = this.parseExpression();
					}

					if (this.isContextual('index')) {
						this.raise(this.start, '"index" must come before "key" in for-of loop');
					}
				} else if (!isForIn) {
					// Set index to null for standard for-of loops
					/** @type {AST.ForOfStatement} */ (node).index = null;
				}

				this.expect(tt.parenR);
				node.body = /** @type {AST.BlockStatement} */ (this.parseStatement('for'));
				this.exitScope();
				this.labels.pop();
				return this.finishNode(node, isForIn ? 'ForInStatement' : 'ForOfStatement');
			}

			/**
			 * @type {Parse.Parser['parseFunctionBody']}
			 */
			parseFunctionBody(node, isArrowFunction, isMethod, forInit, ...args) {
				this.#functionBodyDepth++;
				try {
					return super.parseFunctionBody(node, isArrowFunction, isMethod, forInit, ...args);
				} finally {
					this.#functionBodyDepth--;
				}
			}

			/**
			 * @return {ESTreeJSX.JSXExpressionContainer}
			 */
			jsx_parseExpressionContainer() {
				let node = /** @type {ESTreeJSX.JSXExpressionContainer} */ (this.startNode());
				this.next();

				node.expression =
					this.type === tt.braceR ? this.jsx_parseEmptyExpression() : this.parseExpression();
				if (this.#allowExpressionContainerTrailingSemicolon && this.type === tt.semi) {
					if (this.#collect) {
						this.#report_recoverable_error(
							this.start,
							'TSRX expression containers do not use semicolons. Remove this semicolon.',
							DIAGNOSTIC_CODES.TEMPLATE_EXPRESSION_TRAILING_SEMICOLON,
						);
					}
					this.next();
				}
				if (this.#path.at(-1)?.type === 'Element') {
					const next_index = this.#skipWhitespaceAndComments(this.end);
					const next_char = this.input.charCodeAt(next_index);
					if (
						next_char === CharCode.slash ||
						next_char === CharCode.greaterThan ||
						acorn.isIdentifierStart(next_char, true)
					) {
						if (this.context.includes(tstc.tc_oTag)) {
							while (this.context.length > 0 && this.curContext() !== tstc.tc_oTag) {
								this.context.pop();
							}
						} else {
							this.context.push(tstc.tc_oTag);
						}
					}
				}
				this.expect(tt.braceR);

				return this.finishNode(node, 'JSXExpressionContainer');
			}

			/**
			 * @type {Parse.Parser['jsx_parseEmptyExpression']}
			 */
			jsx_parseEmptyExpression() {
				// Override to properly handle the range for JSXEmptyExpression
				// The range should be from after { to before }
				const node = /** @type {ESTreeJSX.JSXEmptyExpression} */ (
					this.startNodeAt(this.lastTokEnd, this.lastTokEndLoc)
				);
				node.end = this.start;
				node.loc.end = this.startLoc;
				return this.finishNodeAt(node, 'JSXEmptyExpression', this.start, this.startLoc);
			}

			/**
			 * @type {Parse.Parser['jsx_parseTupleContainer']}
			 */
			jsx_parseTupleContainer() {
				const t = /** @type {ESTreeJSX.JSXExpressionContainer} */ (this.startNode());
				return (
					this.next(),
					(t.expression =
						this.type === tt.bracketR ? this.jsx_parseEmptyExpression() : this.parseExpression()),
					this.expect(tt.bracketR),
					this.finishNode(t, 'JSXExpressionContainer')
				);
			}

			/**
			 * @type {Parse.Parser['jsx_parseAttribute']}
			 */
			jsx_parseAttribute() {
				let node =
					/** @type {AST.TSRXAttribute | ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute} */ (
						this.startNode()
					);

				if (this.eat(tt.braceL)) {
					const current_template_node = this.#path.at(-1);
					if (current_template_node?.type === 'TsxCompat') {
						if (this.type === tt.ellipsis) {
							this.expect(tt.ellipsis);
							/** @type {ESTreeJSX.JSXSpreadAttribute} */ (node).argument = this.parseMaybeAssign();
							this.expect(tt.braceR);
							return this.finishNode(node, 'JSXSpreadAttribute');
						}
						this.unexpected();
					}

					if (this.type === tt.ellipsis) {
						this.expect(tt.ellipsis);
						/** @type {AST.SpreadAttribute} */ (node).argument = this.parseMaybeAssign();
						this.expect(tt.braceR);
						return this.finishNode(node, 'SpreadAttribute');
					} else if (this.lookahead().type === tt.ellipsis) {
						this.expect(tt.ellipsis);
						/** @type {AST.SpreadAttribute} */ (node).argument = this.parseMaybeAssign();
						this.expect(tt.braceR);
						return this.finishNode(node, 'SpreadAttribute');
					} else {
						const id = /** @type {AST.Identifier} */ (this.parseIdentNode());
						id.tracked = false;
						this.finishNode(id, 'Identifier');
						/** @type {AST.Attribute} */ (node).name = id;
						/** @type {AST.Attribute} */ (node).value = id;
						/** @type {AST.Attribute} */ (node).shorthand = true; // Mark as shorthand since name and value are the same
						this.next();
						this.expect(tt.braceR);
						return this.finishNode(node, 'Attribute');
					}
				}
				/** @type {ESTreeJSX.JSXAttribute} */ (node).name = this.jsx_parseNamespacedName();
				if (
					/** @type {ESTreeJSX.JSXAttribute} */ (node).name.type === 'JSXIdentifier' &&
					/** @type {ESTreeJSX.JSXIdentifier} */ (/** @type {ESTreeJSX.JSXAttribute} */ (node).name)
						.tracked
				) {
					this.#report_recoverable_error_range(
						/** @type {AST.NodeWithLocation} */ (node).start,
						/** @type {AST.NodeWithLocation} */ (/** @type {ESTreeJSX.JSXAttribute} */ (node).name)
							.end ??
							node.end ??
							node.start,
						DYNAMIC_ATTRIBUTE_NAME_ERROR,
					);
				}
				const value = /** @type {ESTreeJSX.JSXAttribute['value'] | null} */ (
					this.eat(tt.eq) ? this.jsx_parseAttributeValue() : null
				);
				/** @type {ESTreeJSX.JSXAttribute} */ (node).value = value;
				return this.finishNode(node, 'JSXAttribute');
			}

			/**
			 * @type {Parse.Parser['jsx_parseNamespacedName']}
			 */
			jsx_parseNamespacedName() {
				const base = this.jsx_parseIdentifier();
				if (!this.eat(tt.colon)) return base;
				const node = /** @type {ESTreeJSX.JSXNamespacedName} */ (
					this.startNodeAt(
						/** @type {AST.NodeWithLocation} */ (base).start,
						/** @type {AST.NodeWithLocation} */ (base).loc.start,
					)
				);
				node.namespace = base;
				node.name = this.jsx_parseIdentifier();
				return this.finishNode(node, 'JSXNamespacedName');
			}

			/**
			 * @type {Parse.Parser['jsx_parseIdentifier']}
			 */
			jsx_parseIdentifier() {
				const node = /** @type {ESTreeJSX.JSXIdentifier} */ (this.startNode());

				if (this.type.label === '@') {
					this.next(); // consume @

					if (this.type === tt.name || this.type === tstt.jsxName) {
						node.name = /** @type {string} */ (this.value);
						node.tracked = true;
						this.next();
					} else {
						// Unexpected token after @
						this.unexpected();
					}
				} else if (this.type === tt.name || this.type.keyword || this.type === tstt.jsxName) {
					node.name = /** @type {string} */ (this.value);
					node.tracked = false; // Explicitly mark as not tracked
					this.next();
				} else {
					return super.jsx_parseIdentifier();
				}

				return this.finishNode(node, 'JSXIdentifier');
			}

			/**
			 * @type {Parse.Parser['jsx_parseElementName']}
			 */
			jsx_parseElementName() {
				if (this.type === tstt.jsxTagEnd) {
					return '';
				}

				let node = this.jsx_parseNamespacedName();

				if (node.type === 'JSXNamespacedName') {
					return node;
				}

				if (this.eat(tt.dot)) {
					let memberExpr = /** @type {ESTreeJSX.JSXMemberExpression} */ (
						this.startNodeAt(
							/** @type {AST.NodeWithLocation} */ (node).start,
							/** @type {AST.NodeWithLocation} */ (node).loc.start,
						)
					);
					memberExpr.object = node;
					memberExpr.property = this.jsx_parseIdentifier();
					memberExpr.computed = false;
					memberExpr = this.finishNode(memberExpr, 'JSXMemberExpression');
					while (this.eat(tt.dot)) {
						let newMemberExpr = /** @type {ESTreeJSX.JSXMemberExpression} */ (
							this.startNodeAt(
								/** @type {AST.NodeWithLocation} */ (memberExpr).start,
								/** @type {AST.NodeWithLocation} */ (memberExpr).loc.start,
							)
						);
						newMemberExpr.object = memberExpr;
						newMemberExpr.property = this.jsx_parseIdentifier();
						newMemberExpr.computed = false;
						memberExpr = this.finishNode(newMemberExpr, 'JSXMemberExpression');
					}
					return memberExpr;
				}
				return node;
			}

			/** @type {Parse.Parser['jsx_parseAttributeValue']} */
			jsx_parseAttributeValue() {
				switch (this.type) {
					case tt.braceL:
						return this.jsx_parseExpressionContainer();
					case tstt.jsxTagStart:
					case tt.string:
						return this.parseExprAtom();
					default:
						this.raise(this.start, 'value should be either an expression or a quoted string');
				}
			}

			/**
			 * @type {Parse.Parser['parseTryStatement']}
			 */
			parseTryStatement(node) {
				this.next();
				node.block = this.parseBlock();
				node.handler = null;

				if (this.value === 'pending') {
					this.next();
					node.pending = this.parseBlock();
				} else {
					node.pending = null;
				}

				if (this.type === tt._catch) {
					const clause = /** @type {AST.CatchClause} */ (this.startNode());
					this.next();
					if (this.eat(tt.parenL)) {
						// Parse first param (error) manually to support optional second param (reset).
						// We can't use parseCatchClauseParam() because it eats the closing paren.
						const param = this.parseBindingAtom();
						const simple = param.type === 'Identifier';
						this.enterScope(simple ? BINDING_TYPES.BIND_SIMPLE_CATCH : 0);
						this.checkLValPattern(
							param,
							simple ? BINDING_TYPES.BIND_SIMPLE_CATCH : BINDING_TYPES.BIND_LEXICAL,
						);
						const type = this.tsTryParseTypeAnnotation();
						if (type) {
							param.typeAnnotation = type;
							this.resetEndLocation(param);
						}
						clause.param = param;

						// Optional second parameter: reset function
						if (this.eat(tt.comma)) {
							const reset_param = this.parseBindingAtom();
							this.checkLValSimple(reset_param, BINDING_TYPES.BIND_LEXICAL);
							const reset_type = this.tsTryParseTypeAnnotation();
							if (reset_type) {
								reset_param.typeAnnotation = reset_type;
								this.resetEndLocation(reset_param);
							}
							clause.resetParam = reset_param;
						} else {
							clause.resetParam = null;
						}

						this.expect(tt.parenR);
					} else {
						clause.param = null;
						clause.resetParam = null;
						this.enterScope(0);
					}
					clause.body = this.parseBlock(false);
					this.exitScope();
					node.handler = this.finishNode(clause, 'CatchClause');
				}
				node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null;

				if (!node.handler && !node.finalizer && !node.pending) {
					this.raise(
						/** @type {AST.NodeWithLocation} */ (node).start,
						'Missing catch or finally clause',
					);
				}
				return this.finishNode(node, 'TryStatement');
			}

			/** @type {Parse.Parser['jsx_readToken']} */
			jsx_readToken() {
				const current_template_node = this.#path.at(-1);
				if (current_template_node?.type === 'TsxCompat') {
					return super.jsx_readToken();
				}

				const raw_text_tag = current_template_node?.metadata?.rawTextTag;
				if (typeof raw_text_tag === 'string') {
					const closing_tag = `</${raw_text_tag}>`;
					const closing_start = this.input.indexOf(closing_tag, this.pos);
					const end = closing_start === -1 ? this.input.length : closing_start;
					const text = this.input.slice(this.pos, end);
					this.pos = end;
					return this.finishToken(tstt.jsxText, text);
				}

				let out = '',
					chunkStart = this.pos;

				while (true) {
					if (this.pos >= this.input.length) {
						const inside_open_template = this.#path.at(-1);
						if (!inside_open_template) {
							while (this.curContext() === tstc.tc_expr) {
								this.context.pop();
							}
							return this.finishToken(tt.eof);
						}
						this.raise(this.start, 'Unterminated JSX contents');
					}
					let ch = this.input.charCodeAt(this.pos);

					if (this.#isRenderControlFlowAt(this.pos)) {
						if (this.pos > chunkStart) {
							out += this.input.slice(chunkStart, this.pos);
							return this.finishToken(tstt.jsxText, out);
						}
						this.start = this.pos;
						this.startLoc = this.curPosition();
						this.pos++;
						return this.finishToken(tt.name, '@');
					}

					if (this.#isNativeCodeBlockFenceAt(this.pos)) {
						if (this.pos > chunkStart) {
							out += this.input.slice(chunkStart, this.pos);
							return this.finishToken(tstt.jsxText, out);
						}
						this.start = this.pos;
						this.startLoc = this.curPosition();
						this.pos += 3;
						return this.finishToken(tt.name, '---');
					}

					if (
						ch === CharCode.slash &&
						this.input.charCodeAt(this.pos + 1) === CharCode.greaterThan
					) {
						if (this.pos > chunkStart) {
							out += this.input.slice(chunkStart, this.pos);
							return this.finishToken(tstt.jsxText, out);
						}
						if (this.context.includes(tstc.tc_oTag)) {
							while (this.context.length > 0 && this.curContext() !== tstc.tc_oTag) {
								this.context.pop();
							}
						} else {
							this.context.push(tstc.tc_oTag);
						}
						this.start = this.pos;
						this.startLoc = this.curPosition();
						this.exprAllowed = false;
						return original.readToken.call(this, ch);
					}

					switch (ch) {
						case CharCode.lessThan:
						case CharCode.openBrace:
							if (this.pos > chunkStart) {
								out += this.input.slice(chunkStart, this.pos);
								return this.finishToken(tstt.jsxText, out);
							}
							// In JSX text mode, '<' and '{' always start a tag/expression container.
							// `exprAllowed` can be false here due to surrounding parser state, but
							// throwing breaks valid templates (e.g. sibling tags after a close).
							this.start = this.pos;
							this.startLoc = this.curPosition();
							if (ch === CharCode.lessThan) {
								++this.pos;
								return this.finishToken(tstt.jsxTagStart);
							}
							return this.getTokenFromCode(ch);

						case CharCode.ampersand:
							out += this.input.slice(chunkStart, this.pos);
							out += this.jsx_readEntity();
							chunkStart = this.pos;
							break;

						case CharCode.greaterThan:
						case CharCode.closeBrace: {
							if (
								ch === CharCode.closeBrace &&
								(this.#path.length === 0 ||
									this.#path.at(-1)?.type === 'Element' ||
									this.#path.at(-1)?.type === 'TsrxFragment')
							) {
								if (this.start !== this.pos) {
									this.start = this.pos;
									this.startLoc = this.curPosition();
								}
								return original.readToken.call(this, ch);
							}
							this.raise(
								this.pos,
								'Unexpected token `' +
									this.input[this.pos] +
									'`. Did you mean `' +
									(ch === CharCode.greaterThan ? '&gt;' : '&rbrace;') +
									'` or ' +
									'`{"' +
									this.input[this.pos] +
									'"}' +
									'`?',
							);
						}

						default:
							if (acorn.isNewLine(ch)) {
								out += this.input.slice(chunkStart, this.pos);
								out += this.jsx_readNewLine(true);
								chunkStart = this.pos;
							} else if (ch === CharCode.space || ch === CharCode.tab) {
								++this.pos;
							} else {
								++this.pos;
							}
					}
				}
			}

			/**
			 * Override jsx_parseElement to parse tags and bare fragments as native TSRX
			 * by default. Explicit <tsx:*> islands keep ordinary TSX parsing for
			 * their children.
			 * @type {Parse.Parser['jsx_parseElement']}
			 */
			jsx_parseElement() {
				// Current token is jsxTagStart, this.end is position after '<'
				const tag_name_start = this.end;
				const current_template_node = this.#path.at(-1);
				const inside_tsx_island = current_template_node?.type === 'TsxCompat';
				const should_restore_js_context =
					this.#insideNativeCodeBlock || current_template_node === undefined;
				if (inside_tsx_island) {
					if (this.input.charCodeAt(tag_name_start) === CharCode.at) {
						this.#report_recoverable_error_range(
							this.start,
							tag_name_start + 1,
							DYNAMIC_ELEMENT_IN_TSX_ERROR,
						);
					}
					// Inside tsx/tsx:*, let acorn-jsx handle regular TSX tags normally.
					return super.jsx_parseElement();
				}

				this.next();
				const parsed = /** @type {import('estree-jsx').JSXElement} */ (
					/** @type {unknown} */ (this.parseElement())
				);
				if (!inside_tsx_island) {
					this.#popTokenContextsAfterTemplateExpressionElement(
						/** @type {AST.TsrxFragment | AST.TsxCompat} */ (/** @type {unknown} */ (parsed)),
					);
					if (
						should_restore_js_context &&
						(this.type === tstt.jsxText || this.start === this.end)
					) {
						this.context = [b_stat];
						this.#setRawPosition(this.start);
						this.next();
					}
				} else if (this.type === tt.braceR && this.curContext() === tstc.tc_expr) {
					if (this.#tsxIslandExpressionDepth === 0) {
						// Acorn still owns the surrounding JSX expression container.
						// Keep a block-expression context for its closing `}` so the
						// parent TSX tag continues tokenizing as JSX afterward.
						this.context.push(b_expr);
					}
				}
				return parsed;
			}

			/**
			 * @type {Parse.Parser['parseElement']}
			 */
			parseElement() {
				const inside_head = this.#path.findLast(
					(n) => n.type === 'Element' && n.id && n.id.type === 'Identifier' && n.id.name === 'head',
				);
				// Adjust the start so we capture the `<` as part of the element
				const start = this.start - 1;
				const position = new acorn.Position(this.curLine, start - this.lineStart);

				const element = /** @type {AST.Element | AST.TsrxFragment | AST.TsxCompat} */ (
					this.startNode()
				);
				element.start = start;
				/** @type {AST.NodeWithLocation} */ (element).loc.start = position;
				element.metadata = { path: [] };
				element.children = [];
				element.type = 'Element';
				this.#path.push(element);
				if (this.value === 'style' || this.value === 'script') {
					element.metadata.rawTextTag = this.value;
				}

				const open = /** @type {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} */ (
					this.jsx_parseOpeningElementAt(start, position)
				);

				// Always attach the concrete opening element node for accurate source mapping
				element.openingElement = open;

				// Fragments (<>) produce JSXOpeningFragment with no `name` property
				const is_fragment = !open.name;
				const is_tsx_compat =
					!is_fragment &&
					open.name.type === 'JSXNamespacedName' &&
					open.name.namespace.name === 'tsx';
				if (is_tsx_compat) {
					const namespace_node = /** @type {ESTreeJSX.JSXNamespacedName} */ (open.name);
					/** @type {AST.TsxCompat} */ (element).type = 'TsxCompat';
					/** @type {AST.TsxCompat} */ (element).kind = namespace_node.name.name; // e.g., "react" from "tsx:react"

					if (open.selfClosing) {
						const tagName = namespace_node.namespace.name + ':' + namespace_node.name.name;
						this.raise(
							open.start,
							`TSX compatibility elements cannot be self-closing. '<${tagName} />' must have a closing tag '</${tagName}>'.`,
						);
					}
				} else if (is_fragment) {
					/** @type {AST.TsrxFragment} */ (element).type = 'TsrxFragment';
				} else {
					element.type = 'Element';
				}

				for (const attr of open.attributes) {
					if (attr.type === 'JSXAttribute') {
						/** @type {AST.Attribute} */ (/** @type {unknown} */ (attr)).type = 'Attribute';
						if (attr.name.type === 'JSXIdentifier') {
							/** @type {AST.Identifier} */ (/** @type {unknown} */ (attr.name)).type =
								'Identifier';
						}
						if (attr.value !== null) {
							if (attr.value.type === 'JSXExpressionContainer') {
								const expression = attr.value.expression;
								if (expression.type === 'Literal') {
									expression.was_expression = true;
								}
								// @ts-ignore — intentional AST node conversion from JSX to Ripple
								/** @type {ESTreeJSX.JSXAttribute} */ (attr).value =
									/** @type {ESTreeJSX.JSXExpressionContainer['expression']} */ (expression);
							}
						}
					}
				}

				if (!is_tsx_compat && !is_fragment) {
					/** @type {AST.Element} */ (element).id = /** @type {AST.Identifier} */ (
						convert_from_jsx(/** @type {ESTreeJSX.JSXIdentifier} */ (open.name))
					);
					element.selfClosing = open.selfClosing;
				} else if (is_fragment) {
					element.selfClosing = false;
				}

				element.attributes = open.attributes;
				element.metadata ??= { path: [] };
				// Opening-tag parsing can tokenize comments that appear before the first
				// child. Preserve that early container id so the comment stays associated
				// with this element during comment attachment/printing.
				if (element.metadata.commentContainerId === undefined) {
					element.metadata.commentContainerId = ++this.#commentContextId;
				}

				if (element.selfClosing) {
					this.#path.pop();

					if (this.type.label === '</>/<=/>=') {
						this.pos--;
						this.next();
					}
				} else if (is_fragment) {
					this.#parseNativeTemplateBody(/** @type {AST.Element} */ (element).children, {
						enterScope: true,
						resetFunctionBodyDepth: true,
					});

					if (this.#path[this.#path.length - 1] === element) {
						this.#path.pop();
					}

					if (!element.unclosed && !element.closingElement) {
						const raise_error = () => {
							this.raise(this.start, `Expected closing tag '</>'`);
						};

						this.next();
						if (this.value !== '/') {
							raise_error();
						}
						this.next();
						if (this.type !== tstt.jsxTagEnd) {
							raise_error();
						}
						this.#popTsxTokenContextBeforeTemplateExpressionChild();
						this.next();
					}
				} else {
					if (/** @type {ESTreeJSX.JSXIdentifier} */ (open.name).name === 'script') {
						let content = '';

						// TODO implement this where we get a string for content of the content of the script tag
						// This is a temporary workaround to get the content of the script tag
						const start = open.end;
						const input = this.input.slice(start);
						const end = input.indexOf('</script>');
						content = end === -1 ? input : input.slice(0, end);

						const newLines = content.match(regex_newline_characters)?.length;
						if (newLines) {
							this.curLine = open.loc.end.line + newLines;
							this.lineStart = start + content.lastIndexOf('\n') + 1;
						}
						if (end !== -1) {
							const closingStart = start + content.length;
							const closingEnd = closingStart + '</script>'.length;
							element.closingElement = this.#createStaticClosingElement('script', closingStart);
							this.exprAllowed = false;
							this.#setRawPosition(closingEnd);
							this.#popSkippedTemplateElementTokenContext();
							this.next();

							const contentStartLineInfo = acorn.getLineInfo(this.input, start);
							const contentStartLoc = new acorn.Position(
								contentStartLineInfo.line,
								contentStartLineInfo.column,
							);

							const contentEndLineInfo = acorn.getLineInfo(this.input, closingStart);
							const contentEndLoc = new acorn.Position(
								contentEndLineInfo.line,
								contentEndLineInfo.column,
							);

							element.children = [
								/** @type {AST.ScriptContent} */ (
									/** @type {unknown} */ ({
										type: 'ScriptContent',
										content,
										start,
										end: closingStart,
										loc: { start: contentStartLoc, end: contentEndLoc },
									})
								),
							];

							this.#path.pop();
						} else {
							// No closing tag
							this.#report_broken_markup_error(
								open.end,
								"Unclosed tag '<script>'. Expected '</script>' before end of template.",
							);
							/** @type {AST.Element} */ (element).unclosed = true;
							this.#path.pop();
						}
					} else if (/** @type {ESTreeJSX.JSXIdentifier} */ (open.name).name === 'style') {
						// jsx_parseOpeningElementAt treats ID selectors (ie. #myid) or type selectors (ie. div) as identifier and read it
						// So backtrack to the end of the <style> tag to make sure everything is included
						const start = open.end;
						const input = this.input.slice(start);
						const end = input.indexOf('</style>');
						const content = end === -1 ? input : input.slice(0, end);

						const parsed_css = parse_style(content, { loose: this.#loose });
						if (!inside_head) {
							/** @type {AST.Element} */ (element).metadata.styleScopeHash = parsed_css.hash;
						}

						const newLines = content.match(regex_newline_characters)?.length;
						if (newLines) {
							this.curLine = open.loc.end.line + newLines;
							this.lineStart = start + content.lastIndexOf('\n') + 1;
						}
						if (end !== -1) {
							const closingStart = start + content.length;
							const closingEnd = closingStart + '</style>'.length;
							element.closingElement = this.#createStaticClosingElement('style', closingStart);
							this.exprAllowed = false;
							this.#setRawPosition(closingEnd);
							this.#popSkippedTemplateElementTokenContext();
							this.#path.pop();

							const parent = this.#path.at(-1);
							const insideTemplate =
								parent?.type === 'Element' ||
								parent?.type === 'TsrxFragment' ||
								parent?.type === 'TsxCompat';

							if (!insideTemplate) {
								while (this.curContext() === tstc.tc_expr) {
									this.context.pop();
								}
							}

							this.next();
						} else {
							this.#report_broken_markup_error(
								open.end,
								"Unclosed tag '<style>'. Expected '</style>' before end of template.",
							);
							/** @type {AST.Element} */ (element).unclosed = true;
							this.#path.pop();
						}
						// This node is used for Prettier - always add parsed CSS as children
						// for proper formatting, regardless of whether it's inside head or not
						/** @type {AST.Element} */ (element).children = [
							/** @type {AST.Node} */ (/** @type {unknown} */ (parsed_css)),
						];

						/** @type {AST.Element} */ (element).css = content;
					} else {
						this.#parseNativeTemplateBody(/** @type {AST.Element} */ (element).children, {
							enterScope: true,
							resetFunctionBodyDepth: true,
						});
						if (/** @type {AST.TsxCompat} */ (element).type === 'TsxCompat') {
							this.#reportDynamicJsxElementsInTsx(/** @type {AST.Element} */ (element).children);
							this.#path.pop();

							if (!element.unclosed) {
								const raise_error = () => {
									this.raise(
										this.start,
										`Expected closing tag '</tsx:${/** @type {AST.TsxCompat} */ (element).kind}>'`,
									);
								};

								this.next();
								// we should expect to see </tsx:kind>
								if (this.value !== '/') {
									raise_error();
								}
								this.next();
								if (this.value !== 'tsx') {
									raise_error();
								}
								this.next();
								if (this.type.label !== ':') {
									raise_error();
								}
								this.next();
								if (this.value !== /** @type {AST.TsxCompat} */ (element).kind) {
									raise_error();
								}
								this.next();
								if (this.type !== tstt.jsxTagEnd) {
									raise_error();
								}
								this.#popTsxTokenContextBeforeTemplateExpressionChild();
								this.next();
							}
						} else if (
							/** @type {AST.TsrxFragment} */ (element).type === 'TsrxFragment' &&
							this.#path[this.#path.length - 1] === element
						) {
							const displayTag = element.openingElement.name ? 'tsrx' : '';
							this.#report_broken_markup_error(
								this.start,
								`Unclosed tag '<${displayTag}>'. Expected '</${displayTag}>' before end of template.`,
							);
							element.unclosed = true;
							/** @type {AST.SourceLocation} */ (element.loc).end = {
								.../** @type {AST.SourceLocation} */ (element.openingElement.loc).end,
							};
							element.end = element.openingElement.end;
							this.#path.pop();
						} else if (
							element.type === 'Element' &&
							this.#path[this.#path.length - 1] === element
						) {
							// Check if this element was properly closed
							const tagName = this.getElementName(element.id);
							this.#report_broken_markup_error(
								this.start,
								`Unclosed tag '<${tagName}>'. Expected '</${tagName}>' before end of template.`,
							);
							element.unclosed = true;
							/** @type {AST.SourceLocation} */ (element.loc).end = {
								.../** @type {AST.SourceLocation} */ (element.openingElement.loc).end,
							};
							element.end = element.openingElement.end;
							this.#path.pop();
						}
					}

					// Ensure we escape JSX <tag></tag> context
					const curContext = this.curContext();
					const parent = this.#path.at(-1);
					const insideTemplate =
						parent?.type === 'Element' ||
						parent?.type === 'TsrxFragment' ||
						parent?.type === 'TsxCompat';

					if (curContext === tstc.tc_expr && !insideTemplate) {
						this.context.pop();
					}
				}

				if (element.closingElement && !is_tsx_compat && element.closingElement.name) {
					/** @type {unknown} */ (element.closingElement.name) = convert_from_jsx(
						element.closingElement.name,
					);
				}

				this.finishNode(element, element.type);
				return element;
			}

			/**
			 * @type {Parse.Parser['parseTemplateBody']}
			 */
			parseTemplateBody(body) {
				while (this.type !== tt.eof && this.start < this.input.length) {
					this.#skipNativeTemplateWhitespace(/** @type {AST.Node[]} */ (body));
					const current_template_node = this.#path.at(-1);
					const current_char = this.input.charCodeAt(this.start);

					if (current_template_node?.type === 'TsxCompat') {
						this.#parseTsxIslandBody(
							/** @type {AST.TsxCompat} */ (current_template_node),
							/** @type {AST.Node[]} */ (/** @type {unknown} */ (body)),
						);
						return;
					}

					if (this.#isNativeCodeBlockFenceAt(this.start)) {
						// `---` fences opt back into ordinary JavaScript statements.
						body.push(this.#parseNativeCodeBlock());
						continue;
					}

					if (this.#isRenderControlFlowAt(this.start)) {
						// `@if`, `@for`, `@switch`, and `@try` are template control flow,
						// not ordinary JavaScript. They are only recognized in template bodies.
						body.push(this.#parseRenderControlStatement());
						continue;
					}

					if (current_char === CharCode.openBrace && this.type !== tt.braceL) {
						this.#setRawPosition(this.start);
						this.next();
					} else if (current_char === CharCode.closeBrace && this.type !== tt.braceR) {
						this.#setRawPosition(this.start);
						this.next();
					}

					if (this.type === tt.braceL || current_char === CharCode.openBrace) {
						body.push(this.#parseNativeTemplateExpressionContainer());
						continue;
					}

					if (this.type === tt.braceR || current_char === CharCode.closeBrace) {
						while (this.curContext() === tstc.tc_expr) {
							this.context.pop();
						}
						return;
					}

					if (this.type === tstt.jsxTagStart || current_char === CharCode.lessThan) {
						if (!this.context.includes(tstc.tc_oTag)) {
							this.context.push(tstc.tc_oTag);
						}
						if (this.#parseTemplateTag(/** @type {AST.Node[]} */ (body))) {
							return;
						}
						continue;
					}

					const node = this.#parseNativeTemplateText();
					if (node?.value.trim()) {
						body.push(node);
					}
					if (!node) return;
					this.#popTemplateLiteralTokenContext();
					if (
						this.input.charCodeAt(this.start) === CharCode.lessThan &&
						!this.context.includes(tstc.tc_oTag)
					) {
						this.context.push(tstc.tc_oTag);
					}

					if (this.curContext() === tstc.tc_expr) {
						this.context.pop();
					}
				}
			}

			/**
			 * Parse proposal-style imports from an inline module declaration:
			 * `import { foo } from server;`
			 *
			 * Acorn's import parser currently requires a string literal source. TSRX
			 * extends only the source position; all specifier parsing stays delegated
			 * to Acorn/@sveltejs/acorn-typescript.
			 * @type {Parse.Parser['parseImport']}
			 */
			parseImport(node) {
				const tokenIsIdentifier = /** @type {any} */ (Parser.acornTypeScript).tokenIsIdentifier;
				const parser = /** @type {any} */ (this);
				const import_node = /** @type {any} */ (node);
				let enterHead = parser.lookahead();
				import_node.importKind = 'value';
				parser.importOrExportOuterKind = 'value';
				if (tokenIsIdentifier(enterHead.type) || this.match(tt.star) || this.match(tt.braceL)) {
					let ahead = parser.lookahead(2);
					if (
						ahead.type !== tt.comma &&
						!parser.isContextualWithState('from', ahead) &&
						ahead.type !== tt.eq &&
						parser.ts_eatContextualWithState('type', 1, enterHead)
					) {
						parser.importOrExportOuterKind = 'type';
						import_node.importKind = 'type';
						enterHead = parser.lookahead();
						ahead = parser.lookahead(2);
					}
					if (tokenIsIdentifier(enterHead.type) && ahead.type === tt.eq) {
						this.next();
						const importNode = parser.tsParseImportEqualsDeclaration(node);
						parser.importOrExportOuterKind = 'value';
						return importNode;
					}
				}
				this.next();
				if (this.type === tt.string) {
					import_node.specifiers = [];
					import_node.source = this.parseExprAtom();
				} else {
					import_node.specifiers = this.parseImportSpecifiers();
					this.expectContextual('from');
					if (this.type === tt.string) {
						import_node.source = this.parseExprAtom();
					} else if (tokenIsIdentifier(this.type)) {
						const source = this.parseIdent(false);
						source.metadata ??= { path: [] };
						import_node.source = source;
					} else {
						this.unexpected();
					}
				}
				parser.parseMaybeImportAttributes(node);
				this.semicolon();
				this.finishNode(node, 'ImportDeclaration');
				parser.importOrExportOuterKind = 'value';
				return import_node;
			}

			/**
			 * @type {Parse.Parser['parseStatement']}
			 */
			parseStatement(context, topLevel, exports) {
				const parent = this.#path.at(-1);
				const inside_template =
					parent?.type === 'Element' ||
					parent?.type === 'TsrxFragment' ||
					parent?.type === 'TsxCompat';

				if (!this.#insideNativeCodeBlock && inside_template) {
					if (this.#isNativeCodeBlockFenceAt(this.start)) {
						return this.#parseNativeCodeBlock();
					}

					if (this.#isRenderControlFlowAt(this.start)) {
						return this.#parseRenderControlStatement();
					}
				}

				if (this.type === tstt.jsxTagStart) {
					this.next();
					if (this.value === '/') {
						this.unexpected();
					}
					const node = this.parseElement();

					if (!node) {
						this.unexpected();
					}
					if (
						this.#functionBodyDepth > 0 &&
						node.type === 'TsrxFragment' &&
						this.curContext() === b_stat
					) {
						this.context.pop();
						if (this.curContext() === tstc.tc_expr) {
							this.context.pop();
						}
						if (this.curContext() === b_stat) {
							this.context.pop();
						}
					}
					if (this.start === this.end) {
						this.context = [b_stat];
						this.#setRawPosition(this.start);
						this.next();
					}
					if (this.type === tt.semi) {
						this.next();
					}
					return node;
				}

				// &[ or &{ at statement level — lazy destructuring assignment
				// e.g., &[data] = track(0); or &{x, y} = obj;
				if (this.type === tt.bitwiseAND) {
					const charAfterAmp = this.input.charCodeAt(this.end);
					if (charAfterAmp === CharCode.openBrace || charAfterAmp === CharCode.openBracket) {
						const node = /** @type {AST.ExpressionStatement} */ (this.startNode());
						const assign_node = /** @type {AST.AssignmentExpression} */ (this.startNode());
						this.next(); // consume &
						// Parse the left-hand side (array or object expression)
						const left = /** @type {AST.ArrayPattern | AST.ObjectPattern} */ (
							/** @type {unknown} */ (this.parseExprAtom())
						);
						// Convert expression to destructuring pattern
						this.toAssignable(left, false);
						left.lazy = true;
						// Expect = operator
						this.expect(tt.eq);
						// Parse the right-hand side
						assign_node.operator = '=';
						assign_node.left = left;
						assign_node.right = /** @type {AST.Expression} */ (this.parseMaybeAssign());
						node.expression = /** @type {AST.AssignmentExpression} */ (
							this.finishNode(assign_node, 'AssignmentExpression')
						);
						this.semicolon();
						return /** @type {AST.ExpressionStatement} */ (
							this.finishNode(node, 'ExpressionStatement')
						);
					}
				}

				return super.parseStatement(context, topLevel, exports);
			}

			/**
			 * @type {Parse.Parser['parseBlock']}
			 */
			parseBlock(createNewLexicalScope, node, exitStrict) {
				const parent = this.#path.at(-1);

				// In template bodies, `{...}` after `@if`, `@for`, etc. is another
				// template body. Inside `---` fences, `{...}` is ordinary JavaScript.
				if (
					this.#functionBodyDepth === 0 &&
					!this.#insideNativeCodeBlock &&
					(parent?.type === 'Element' || parent?.type === 'TsrxFragment')
				) {
					if (createNewLexicalScope === void 0) createNewLexicalScope = true;
					if (node === void 0) node = /** @type {AST.BlockStatement} */ (this.startNode());

					node.body = [];
					this.expect(tt.braceL);
					this.#parseNativeTemplateBody(node.body, {
						enterScope: createNewLexicalScope,
					});

					if (exitStrict) {
						this.strict = false;
					}
					this.exprAllowed = true;

					this.next();
					return this.finishNode(node, 'BlockStatement');
				}

				return super.parseBlock(createNewLexicalScope, node, exitStrict);
			}
		}

		return /** @type {Parse.ParserConstructor} */ (TSRXParser);
	};
}
