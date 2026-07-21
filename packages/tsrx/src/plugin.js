/**
@import * as AST from 'estree'
@import * as ESTreeJSX from 'estree-jsx'
@import { Parse } from '@tsrx/core/types'
 */

import * as acorn from 'acorn';
import { isWhitespaceTextNode, BINDING_TYPES, DestructuringErrors } from './parse/index.js';
import { parse_style } from './parse/style.js';
import { regex_newline_characters } from './utils/patterns.js';
import { error } from './errors.js';
import { DIAGNOSTIC_CODES } from './diagnostics.js';
import { TSRX_RETURN_STATEMENT_ERROR } from './analyze/validation.js';
import { is_tsrx_render_output_node } from './utils/ast.js';

const CharCode = Object.freeze({
	tab: 9,
	lineFeed: 10,
	carriageReturn: 13,
	space: 32,
	doubleQuote: 34,
	numberSign: 35,
	dollar: 36,
	ampersand: 38,
	singleQuote: 39,
	openParen: 40,
	closeParen: 41,
	asterisk: 42,
	dash: 45,
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
	closeBracket: 93,
	backslash: 92,
	underscore: 95,
	backtick: 96,
	lowercaseA: 97,
	lowercaseZ: 122,
	openBrace: 123,
	closeBrace: 125,
});

// Transparent wrappers to look through when validating a dynamic tag
// expression (`<{expr}>`), and syntax that disqualifies one outright.
const DYNAMIC_TAG_WRAPPER_TYPES = new Set([
	'TSAsExpression',
	'TSTypeAssertion',
	'TSNonNullExpression',
	'ParenthesizedExpression',
	'ChainExpression',
]);
const DYNAMIC_TAG_DISALLOWED_TYPES = new Set([
	'SpreadElement',
	'ExperimentalSpreadProperty',
	'ObjectExpression',
	'ArrayExpression',
	'CallExpression',
	'NewExpression',
	'TaggedTemplateExpression',
]);

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
		const q_tmpl = tc.q_tmpl || acorn.tokContexts.q_tmpl;
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
			#jsxAttributeValueExpressionDepth = 0;
			#jsxExpressionContainerDepth = 0;
			// Context-stack length at the start of each open `{ … }` expression container.
			// A control-flow directive (`@if`/`@for`/…) parsed inside a container strips
			// JSX contexts so its header/body tokenize as JS; without a floor it would also
			// strip the enclosing element's and container's contexts (which nothing rebuilds),
			// underflowing the context stack when the surrounding markup closes. The directive
			// filter preserves everything below the innermost baseline. See
			// `#filterTemplateScriptContexts`.
			/** @type {number[]} */
			#expressionContainerContextBaselines = [];
			// `#path` length at the start of each open `{ … }` expression container.
			// Raw template text inside a container belongs only to an element opened
			// inside it (`{<div>   a</div>}`); at the container's own expression level
			// (`{cond ? (<Outer>…</Outer>) : null}` after the `)`) the next characters
			// are JS, and reading them as raw text would swallow tokens like `: null`.
			/** @type {number[]} */
			#expressionContainerPathBaselines = [];
			#consumeContainerBraceAfterScope = false;
			#scriptJSXElementDepth = 0;
			#forceScriptJSXElementDepth = 0;
			#suppressTemplateRawTextToken = false;
			#templateScriptParsingDepth = 0;
			#controlFlowBlockAllowsNativeReturn = false;
			#parsingJSXSwitchCaseScriptStatementDepth = 0;
			#templateControlFlowBlockDepth = 0;
			#templateControlFlowTryDepth = 0;
			/** @type {Parse.Parser['context']} */
			context = [b_stat];
			/** @type {AST.Node | null} */
			#openingNativeTemplateNode = null;
			#closingNativeTemplateNode = false;
			#readingJSXControlFlowDirectiveKeyword = false;
			#readingJSXControlFlowHeader = false;

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
				this.context ??= [b_stat];
				const tsrx_options = options?.tsrxOptions ?? options?.rippleOptions;
				this.#collect = tsrx_options?.collect === true || tsrx_options?.loose === true;
				this.#loose = tsrx_options?.loose === true;
				this.#errors = tsrx_options?.errors;
				this.#filename = tsrx_options?.filename || null;
			}

			/** @this {Parse.Parser} */
			#resetTokenStartToCurrentPosition() {
				if (this.start !== this.pos) {
					this.start = this.pos;
					this.startLoc = this.curPosition();
				}
			}

			/**
			 * Native TSRX template bodies share one grammar across elements and fragments.
			 * This helper keeps the parser-state setup in one place while callers keep
			 * ownership of their distinct closing delimiter handling (`}` vs `</tag>`).
			 *
			 * @param {AST.Node & { body?: AST.Node }} node
			 * @param {AST.Node[]} body
			 * @param {{
			 *   enterScope?: boolean,
			 *   pushPath?: boolean,
			 *   resetFunctionBodyDepth?: boolean,
			 * }} [options]
			 */
			#parseNativeTemplateBody(
				node,
				body,
				{ enterScope = false, pushPath = false, resetFunctionBodyDepth = false } = {},
			) {
				const parent_function_body_depth = this.#functionBodyDepth;

				if (resetFunctionBodyDepth) {
					this.#functionBodyDepth = 0;
				}
				if (enterScope) {
					this.enterScope(0);
				}
				if (pushPath) {
					this.#path.push(node);
				}

				try {
					this.parseTemplateBody(body);
				} finally {
					if (pushPath) {
						this.#path.pop();
					}
					if (enterScope) {
						this.exitScope();
					}
					if (resetFunctionBodyDepth) {
						this.#functionBodyDepth = parent_function_body_depth;
					}
				}
			}

			/**
			 * @param {boolean} [createNewLexicalScope]
			 * @param {AST.BlockStatement} [node]
			 * @param {boolean} [exitStrict]
			 * @returns {AST.BlockStatement}
			 */
			#parseTemplateControlFlowBlock(createNewLexicalScope = true, node, exitStrict) {
				node ??= /** @type {AST.BlockStatement} */ (this.startNode());
				// Consume the flag for this block only; nested control-flow blocks
				// parsed inside the body must not inherit it.
				const allows_native_return = this.#controlFlowBlockAllowsNativeReturn;
				this.#controlFlowBlockAllowsNativeReturn = false;
				node.body = [];
				node.metadata = {
					...node.metadata,
					path: [],
					native_tsrx_template_block: true,
					templateMode: 'script',
					allows_native_return,
				};

				// A directive's `{ }` IS a code block (§2 rule 8): setup statements then
				// at most one render node. Code-only blocks are allowed (§2 rule 6). Hide
				// the enclosing template from `#path` so the body tokenizes as code (not
				// JSX raw text); render nodes re-establish their own path via `parseElement`.
				const enclosing_context = this.context;
				const enclosing_path = this.#path;
				this.context = enclosing_context.filter(
					(context) =>
						context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag,
				);
				if (this.curContext() !== b_stat) {
					this.context.push(b_stat);
				}
				this.#path = [];
				if (createNewLexicalScope) {
					this.enterScope(0);
				}
				try {
					this.expect(tt.braceL);
					this.#parseCodeBlockBody(node.body);
				} finally {
					if (createNewLexicalScope) {
						this.exitScope();
					}
					this.#path = enclosing_path;
				}

				if (exitStrict) {
					this.strict = false;
				}
				this.exprAllowed = true;
				this.context = enclosing_context;
				const previous_reading_header = this.#readingJSXControlFlowHeader;
				this.#readingJSXControlFlowHeader = true;
				try {
					this.next();
				} finally {
					this.#readingJSXControlFlowHeader = previous_reading_header;
				}
				return this.finishNode(node, 'BlockStatement');
			}

			/**
			 * @param {AST.Node | undefined} node
			 */
			#isNativeTemplateNode(node) {
				return (
					node?.metadata?.native_tsrx_template_block ||
					(node?.type === 'JSXElement' && node.metadata?.native_tsrx) ||
					(node?.type === 'JSXFragment' && node.metadata?.native_tsrx) ||
					(node?.type === 'JSXStyleElement' && node.metadata?.native_tsrx)
				);
			}

			#currentNativeTemplateNode() {
				return (
					this.#openingNativeTemplateNode ??
					this.#path.findLast((node) => this.#isNativeTemplateNode(node))
				);
			}

			/**
			 * @param {AST.Node | undefined} node
			 * @param {string} name
			 */
			#isNativeElementNamed(node, name) {
				return (
					(node?.type === 'JSXElement' || node?.type === 'JSXStyleElement') &&
					node.metadata?.native_tsrx &&
					this.getElementName(node.openingElement?.name) === name
				);
			}

			#isInsideNativeTemplateScriptSection() {
				const node = this.#currentNativeTemplateNode();
				return !!node && node.metadata?.templateMode !== 'template';
			}

			/**
			 * Whether the `<` token at `this.start` opens the given raw-text element
			 * (`<style` or `<script` followed by `>`, `/`, or whitespace).
			 * @param {string} tagName
			 */
			#isRawTextOpeningTagStart(tagName) {
				let index = this.start + 1;
				if (this.input.charCodeAt(index) === CharCode.slash) return false;
				if (this.input.slice(index, index + tagName.length) !== tagName) return false;

				const after = this.input.charCodeAt(index + tagName.length);
				return (
					after === CharCode.greaterThan ||
					after === CharCode.slash ||
					after === CharCode.space ||
					after === CharCode.tab ||
					after === CharCode.lineFeed ||
					after === CharCode.carriageReturn
				);
			}

			/**
			 * @param {number} index
			 */
			#isLineStartPosition(index) {
				for (let i = index - 1; i >= 0; i--) {
					const ch = this.input.charCodeAt(i);
					if (ch === CharCode.lineFeed || ch === CharCode.carriageReturn) return true;
					if (ch !== CharCode.space && ch !== CharCode.tab) return false;
				}
				return true;
			}

			/**
			 * @param {number} index
			 */
			#previousNonSpaceTabIndex(index) {
				let cursor = index - 1;
				while (
					cursor >= 0 &&
					(this.input.charCodeAt(cursor) === CharCode.space ||
						this.input.charCodeAt(cursor) === CharCode.tab)
				) {
					cursor--;
				}
				return cursor;
			}

			/**
			 * @param {number} end_index Inclusive index of the keyword's last character.
			 * @param {string} keyword
			 */
			#keywordEndsAt(end_index, keyword) {
				const start = end_index - keyword.length + 1;
				if (start < 0) return false;
				if (this.input.slice(start, end_index + 1) !== keyword) return false;
				return !this.#isIdentifierChar(this.input.charCodeAt(start - 1));
			}

			/**
			 * Returns true when a `<` at `index` can start TypeScript type
			 * parameters/arguments in expression-like code rather than a JSX tag.
			 * Most type argument lists are adjacent to the previous token (`foo<T>`,
			 * `build<T>()`, `Map<K, V>`). The whitespace-separated form is valid for
			 * anonymous generic function expressions (`function <T>() {}`); generic
			 * arrows are handled separately by `looks_like_generic_arrow`.
			 *
			 * @param {number} index
			 */
			#canStartTypeParameterOrArgumentList(index) {
				const previous = this.#previousNonSpaceTabIndex(index);
				if (previous < 0) return false;
				if (previous === index - 1) {
					return this.#canPrecedeTypeArgumentList(this.input.charCodeAt(previous));
				}
				return this.#keywordEndsAt(previous, 'function');
			}

			#parseTemplateRawText() {
				const start = this.start;
				// The current jsxText token spans `[start, token_end]`. Comments inside
				// that span were already consumed and recorded by the tokenizer
				// (`jsx_readToken`); only comments at/after `token_end` (e.g. a body that
				// opens with a comment, where the raw-text token stops before it) still
				// need recording here. Either way we drop `//` lines from the JSXText value
				// and always advance past them so the scan can't re-tokenize the same spot.
				const token_end = this.end;
				let index = start;
				let value = '';
				while (index < this.input.length) {
					if (this.#isTemplateLineCommentStart(index, start)) {
						const comment_start = index;
						index += 2;
						while (
							index < this.input.length &&
							this.input.charCodeAt(index) !== CharCode.lineFeed &&
							this.input.charCodeAt(index) !== CharCode.carriageReturn
						) {
							index++;
						}

						if (comment_start >= token_end) {
							this.#emitTemplateLineComment(comment_start, index, null);
						}
						continue;
					}
					if (this.#isTemplateBlockCommentStart(index)) {
						const comment_start = index;
						const comment_start_loc = acorn.getLineInfo(this.input, comment_start);
						const close = this.input.indexOf('*/', index + 2);
						const value_end = close === -1 ? this.input.length : close;
						index = close === -1 ? this.input.length : close + 2;
						if (this.options.onComment && comment_start >= token_end) {
							const comment_end_loc = acorn.getLineInfo(this.input, index);
							this.options.onComment(
								true,
								this.input.slice(comment_start + 2, value_end),
								comment_start,
								index,
								new acorn.Position(comment_start_loc.line, comment_start_loc.column),
								new acorn.Position(comment_end_loc.line, comment_end_loc.column),
								null,
							);
						}
						continue;
					}
					const ch = this.input.charCodeAt(index);
					if (
						ch === CharCode.lessThan ||
						ch === CharCode.openBrace ||
						ch === CharCode.closeBrace ||
						this.#isCodeBlockStart(index) ||
						this.#isJSXControlFlowDirectiveAt(index)
					) {
						break;
					}
					value += this.input[index];
					index++;
				}

				const endLoc = acorn.getLineInfo(this.input, index);
				const node = /** @type {ESTreeJSX.JSXText} */ (this.startNodeAt(start, this.startLoc));
				node.value = value;
				node.raw = this.input.slice(start, index);

				if (node.raw.match(regex_newline_characters)) {
					this.curLine = endLoc.line;
					this.lineStart = index - endLoc.column;
				}
				this.pos = index;
				this.#popTemplateLiteralTokenContext();
				this.next();

				return this.finishNodeAt(node, 'JSXText', index, endLoc);
			}

			/**
			 * JSX significant-whitespace rule for a template text child. Non-whitespace
			 * text is always kept; whitespace-only text is kept only when it is an
			 * intentional inline space (no newline) separating two siblings, and dropped
			 * when it is layout indentation (contains a newline).
			 *
			 * @param {ESTreeJSX.JSXText} node
			 */
			#shouldKeepTemplateTextNode(node) {
				if (!isWhitespaceTextNode(node)) {
					return true;
				}
				return node.value !== '' && !regex_newline_characters.test(node.value);
			}

			#skipTrailingLayoutWhitespace() {
				let index = this.start;
				let has_newline = false;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (ch === CharCode.lineFeed || ch === CharCode.carriageReturn) {
						has_newline = true;
						index++;
					} else if (ch === CharCode.space || ch === CharCode.tab) {
						index++;
					} else if (ch === CharCode.slash && this.input.charCodeAt(index + 1) === CharCode.slash) {
						const comment_start = index;
						while (index < this.input.length && !this.#isNewlineCharCode(index)) {
							index++;
						}
						this.#emitTemplateLineComment(comment_start, index, null);
					} else {
						break;
					}
				}
				if (!has_newline) return;
				const loc = acorn.getLineInfo(this.input, index);
				this.start = index;
				this.startLoc = new acorn.Position(loc.line, loc.column);
				if (this.pos <= index) {
					this.curLine = loc.line;
					this.lineStart = index - loc.column;
				}
			}

			/**
			 * @param {number} index
			 */
			#isNewlineCharCode(index) {
				const ch = this.input.charCodeAt(index);
				return ch === CharCode.lineFeed || ch === CharCode.carriageReturn;
			}

			/**
			 * @param {number} start
			 * @param {number} end
			 * @param {Parse.CommentMetaData | null} metadata
			 */
			#emitTemplateLineComment(start, end, metadata) {
				if (!this.options.onComment) return;
				this.options.onComment(
					false,
					this.input.slice(start + 2, end),
					start,
					end,
					acorn.getLineInfo(this.input, start),
					acorn.getLineInfo(this.input, end),
					metadata,
				);
			}

			#isSwitchCaseScriptStatementStart() {
				let index = skip_whitespace_from(this.input, this.start);

				const first = this.input.charCodeAt(index);

				if (first === CharCode.openBracket || first === CharCode.openBrace) {
					let depth = 0;
					let i = index;
					for (; i < this.input.length; i++) {
						const ch = this.input.charCodeAt(i);
						if (
							ch === CharCode.openBracket ||
							ch === CharCode.openBrace ||
							ch === CharCode.openParen
						) {
							depth++;
						} else if (
							ch === CharCode.closeBracket ||
							ch === CharCode.closeBrace ||
							ch === CharCode.closeParen
						) {
							depth--;
							if (depth === 0) {
								i++;
								break;
							}
						}
					}
					if (depth !== 0) return false;
					i = skip_whitespace_from(this.input, i);
					if (this.input.charCodeAt(i) !== CharCode.equals) return false;
					const next = this.input.charCodeAt(i + 1);
					return next !== CharCode.equals && next !== CharCode.greaterThan;
				}

				if (
					!this.#isIdentifierChar(first) ||
					(first >= CharCode.digit0 && first <= CharCode.digit9)
				) {
					return false;
				}

				const word_start = index;
				index++;
				while (this.#isIdentifierChar(this.input.charCodeAt(index))) {
					index++;
				}
				const word = this.input.slice(word_start, index);
				if (
					word === 'const' ||
					word === 'let' ||
					word === 'var' ||
					word === 'function' ||
					word === 'class' ||
					word === 'if' ||
					word === 'for' ||
					word === 'switch' ||
					word === 'try' ||
					word === 'throw'
				) {
					return true;
				}

				index = skip_whitespace_from(this.input, index);
				if (this.input.charCodeAt(index) !== CharCode.equals) return false;
				const next = this.input.charCodeAt(index + 1);
				return next !== CharCode.equals && next !== CharCode.greaterThan;
			}

			#switchCaseLabelStart(index = this.start) {
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (
						ch !== CharCode.space &&
						ch !== CharCode.tab &&
						ch !== CharCode.lineFeed &&
						ch !== CharCode.carriageReturn
					) {
						break;
					}
					index++;
				}
				if (!this.#isLineStartPosition(index)) return -1;
				if (this.input.charCodeAt(index) !== CharCode.at) return -1;
				index++;
				if (
					this.input.slice(index, index + 4) === 'case' &&
					!this.#isIdentifierChar(this.input.charCodeAt(index + 4))
				) {
					return index;
				}
				if (
					this.input.slice(index, index + 7) === 'default' &&
					!this.#isIdentifierChar(this.input.charCodeAt(index + 7))
				) {
					return index;
				}
				return -1;
			}

			#rewindToSwitchCaseLabel() {
				const start = this.#switchCaseLabelStart();
				if (start === -1) return false;
				while (this.curContext() === tstc.tc_expr) {
					this.context.pop();
				}
				this.pos = start;
				this.start = start;
				this.startLoc = acorn.getLineInfo(this.input, start);
				this.exprAllowed = true;
				this.#suppressTemplateRawTextToken = true;
				this.next();
				return true;
			}

			/**
			 * @param {number} index
			 */
			#switchCaseBoundaryStart(index) {
				if (!this.#isLineStartPosition(index)) return -1;
				let wordStart = index;
				while (wordStart < this.input.length) {
					const ch = this.input.charCodeAt(wordStart);
					if (ch !== CharCode.space && ch !== CharCode.tab) break;
					wordStart++;
				}

				const ch = this.input.charCodeAt(wordStart);
				if (ch === CharCode.closeBrace) return index;
				if (ch === CharCode.at) {
					const keywordStart = wordStart + 1;
					if (
						this.input.slice(keywordStart, keywordStart + 4) === 'case' &&
						!this.#isIdentifierChar(this.input.charCodeAt(keywordStart + 4))
					) {
						return index;
					}

					if (
						this.input.slice(keywordStart, keywordStart + 7) === 'default' &&
						!this.#isIdentifierChar(this.input.charCodeAt(keywordStart + 7))
					) {
						return index;
					}
				}

				for (const keyword of ['break', 'continue', 'return', 'throw']) {
					if (
						this.input.slice(wordStart, wordStart + keyword.length) === keyword &&
						!this.#isIdentifierChar(this.input.charCodeAt(wordStart + keyword.length))
					) {
						return index;
					}
				}

				return -1;
			}

			/**
			 * @param {number} ch
			 */
			#isIdentifierChar(ch) {
				return (
					(ch >= CharCode.uppercaseA && ch <= CharCode.uppercaseZ) ||
					(ch >= CharCode.lowercaseA && ch <= CharCode.lowercaseZ) ||
					(ch >= CharCode.digit0 && ch <= CharCode.digit9) ||
					ch === CharCode.underscore ||
					ch === CharCode.dollar
				);
			}

			/**
			 * @param {number} ch
			 */
			#canPrecedeTypeArgumentList(ch) {
				return this.#isIdentifierChar(ch) || ch === CharCode.closeParen;
			}

			/** @this {TSRXParser & Parse.Parser} */
			#parseJSXSwitchCaseRawText() {
				const start = this.start;
				let index = start;
				let found_boundary = false;
				while (index < this.input.length) {
					const boundary = this.#switchCaseBoundaryStart(index);
					if (boundary !== -1) {
						index = boundary;
						found_boundary = true;
						break;
					}

					const ch = this.input.charCodeAt(index);
					if (
						ch === CharCode.lessThan ||
						ch === CharCode.openBrace ||
						ch === CharCode.closeBrace ||
						ch === CharCode.at
					) {
						break;
					}
					index++;
				}

				const endLoc = acorn.getLineInfo(this.input, index);
				const node = /** @type {ESTreeJSX.JSXText} */ (this.startNodeAt(start, this.startLoc));
				node.value = this.input.slice(start, index);
				node.raw = node.value;

				if (node.value.match(regex_newline_characters)) {
					this.curLine = endLoc.line;
					this.lineStart = index - endLoc.column;
				}
				this.pos = index;
				if (found_boundary) {
					this.#filterTemplateScriptContexts();
					if (this.curContext() !== b_stat) {
						this.context.push(b_stat);
					}
					this.exprAllowed = true;
					this.#suppressTemplateRawTextToken = true;
				}
				this.next();

				return this.finishNodeAt(node, 'JSXText', index, endLoc);
			}

			/**
			 * @param {boolean} [allow_inside_expression_container] When set, do not bail
			 *   purely because we are inside a `{ … }` expression container. A JSX
			 *   element nested in a container (e.g. `{<div>   a</div>}`) is still a
			 *   template-mode element whose text children are raw JSX text; the rest of
			 *   the directive/comment/boundary checks below still apply, so a directive
			 *   body inside an expression container is correctly excluded.
			 */
			#shouldReadTemplateRawTextToken(allow_inside_expression_container = false) {
				if (
					this.#closingNativeTemplateNode ||
					this.#readingJSXControlFlowDirectiveKeyword ||
					this.#readingJSXControlFlowHeader ||
					this.#parsingJSXSwitchCaseScriptStatementDepth > 0 ||
					this.#templateScriptParsingDepth > 0 ||
					(!allow_inside_expression_container && this.#jsxExpressionContainerDepth > 0)
				) {
					return false;
				}
				const current_context_token = this.curContext()?.token;
				if (current_context_token === '<tag' || current_context_token === '</tag') {
					return false;
				}
				if (this.labels.some((label) => label.kind === 'switch')) {
					return false;
				}
				const current_template_node = this.#currentNativeTemplateNode();
				if (!current_template_node || this.#isJSXControlFlowDirectiveAt(this.pos)) {
					return false;
				}
				// Inside an expression container (only reachable with
				// `allow_inside_expression_container`), raw text belongs to an element
				// opened inside the container. When the innermost native template element
				// sits below the container's path baseline we are at the container's own
				// expression level — e.g. after `(<Outer>…</Outer>)` in
				// `{cond ? (<Outer>…</Outer>) : null}` — and the following characters are
				// JS tokens, not template text.
				if (this.#jsxExpressionContainerDepth > 0 && !this.#openingNativeTemplateNode) {
					const path_baseline = this.#expressionContainerPathBaselines.at(-1) ?? 0;
					let inside_container = false;
					for (let i = this.#path.length - 1; i >= path_baseline; i--) {
						if (this.#isNativeTemplateNode(this.#path[i])) {
							inside_container = true;
							break;
						}
					}
					if (!inside_container) {
						return false;
					}
				}
				if (this.#isTemplateLineCommentStart(this.pos)) {
					return false;
				}
				if (this.#switchCaseLabelStart(this.pos) !== -1) {
					return false;
				}
				if (this.input.charCodeAt(this.pos - 1) === CharCode.lessThan) {
					return false;
				}
				if (
					this.input.charCodeAt(this.pos - 1) === CharCode.slash &&
					this.input.charCodeAt(this.pos - 2) === CharCode.lessThan
				) {
					return false;
				}
				if (
					this.input.charCodeAt(this.pos) === CharCode.slash &&
					this.input.charCodeAt(this.pos + 1) === CharCode.greaterThan
				) {
					return false;
				}
				if (
					this.input.charCodeAt(this.pos) === CharCode.greaterThan &&
					this.input.charCodeAt(this.pos - 1) === CharCode.slash &&
					this.input.charCodeAt(this.pos - 2) === CharCode.lessThan
				) {
					return false;
				}
				// Just past a self-closing tag's `/>`: that element has no body, so any
				// following raw text belongs to an enclosing template, not to it. With no
				// enclosing template (e.g. a top-level `return <div />`), the trailing
				// text is plain JS and must not be read as template raw text.
				// Inter-token whitespace has already advanced `pos`; `lastTokEnd` still
				// identifies the consumed `/>` boundary.
				const opening = this.#openingNativeTemplateNode;
				if (
					opening &&
					current_template_node === opening &&
					/** @type {any} */ (opening).openingElement?.selfClosing &&
					this.input.charCodeAt(this.lastTokEnd - 1) === CharCode.greaterThan &&
					this.input.charCodeAt(this.lastTokEnd - 2) === CharCode.slash
				) {
					const enclosing = this.#path.findLast(
						(node) => node !== opening && this.#isNativeTemplateNode(node),
					);
					if (!enclosing) {
						return false;
					}
					return true;
				}
				return true;
			}

			#readTemplateRawTextToken() {
				const start = this.pos;
				const index = this.#templateRawTextEnd(start);

				const endLoc = acorn.getLineInfo(this.input, index);
				const value = this.input.slice(start, index);
				if (value.match(regex_newline_characters)) {
					this.curLine = endLoc.line;
					this.lineStart = index - endLoc.column;
				}
				this.pos = index;
				return this.finishToken(tstt.jsxText, value);
			}

			/**
			 * A `//` is a comment only when nothing but whitespace precedes it on its
			 * line, or — given `run_start`, the position where the current text run
			 * began (right after a sibling element, code block, or expression
			 * container) — since that boundary. Once real text has begun, `//` is
			 * literal so inline text like `https://…` stays text.
			 * @param {number} index
			 * @param {number} [run_start]
			 */
			#isTemplateLineCommentStart(index, run_start = -1) {
				if (
					this.input.charCodeAt(index) !== CharCode.slash ||
					this.input.charCodeAt(index + 1) !== CharCode.slash
				) {
					return false;
				}
				if (this.#isLineStartPosition(index)) return true;
				if (run_start < 0) return false;
				for (let i = index - 1; i >= run_start; i--) {
					const ch = this.input.charCodeAt(i);
					if (ch === CharCode.lineFeed || ch === CharCode.carriageReturn) return false;
					if (ch !== CharCode.space && ch !== CharCode.tab) return false;
				}
				return true;
			}

			/**
			 * Unlike `//` (which is only a comment at line-start so inline text like
			 * `https://…` stays text), `/*` starts a comment anywhere in template
			 * text, matching `jsx_readToken`.
			 * @param {number} index
			 */
			#isTemplateBlockCommentStart(index) {
				return (
					this.input.charCodeAt(index) === CharCode.slash &&
					this.input.charCodeAt(index + 1) === CharCode.asterisk
				);
			}

			/**
			 * @param {number} start
			 */
			#templateRawTextEnd(start) {
				let index = start;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (
						ch === CharCode.lessThan ||
						ch === CharCode.openBrace ||
						ch === CharCode.closeBrace ||
						this.#isJSXControlFlowDirectiveAt(index) ||
						this.#isTemplateLineCommentStart(index, start) ||
						this.#isTemplateBlockCommentStart(index)
					) {
						break;
					}
					index++;
				}
				return index;
			}

			/**
			 * @param {number} index
			 */
			#isJSXControlFlowDirectiveAt(index) {
				if (this.input.charCodeAt(index) !== CharCode.at) return false;

				let cursor = index + 1;
				if (!this.#isIdentifierChar(this.input.charCodeAt(cursor))) return false;

				const word_start = cursor;
				cursor++;
				while (this.#isIdentifierChar(this.input.charCodeAt(cursor))) {
					cursor++;
				}

				const word = this.input.slice(word_start, cursor);
				const next_non_whitespace = skip_whitespace_from(this.input, cursor);
				const next = this.input.charCodeAt(next_non_whitespace);
				if (this.#isIdentifierChar(this.input.charCodeAt(cursor))) {
					return false;
				}
				if (word === 'try') {
					return next === CharCode.openBrace;
				}
				if (word === 'for') {
					if (next === CharCode.openParen) return true;
					if (
						this.input.slice(next_non_whitespace, next_non_whitespace + 5) === 'await' &&
						!this.#isIdentifierChar(this.input.charCodeAt(next_non_whitespace + 5))
					) {
						const after_await = skip_whitespace_from(this.input, next_non_whitespace + 5);
						return this.input.charCodeAt(after_await) === CharCode.openParen;
					}
					return false;
				}
				return (word === 'if' || word === 'switch') && next === CharCode.openParen;
			}

			#isJSXControlFlowDirectiveStart() {
				return this.#isJSXControlFlowDirectiveAt(this.start);
			}

			/**
			 * `@{ … }` code block: an `@` immediately followed by `{` at child/body
			 * position. This is the marker that switches a body from plain JSX to a JS
			 * code block (§2). Whitespace between `@` and `{` is not allowed — they must
			 * be adjacent so it can never be confused with an `@directive` or a literal
			 * `@` followed by an expression container.
			 * @param {number} index
			 */
			#isCodeBlockStart(index) {
				return (
					this.input.charCodeAt(index) === CharCode.at &&
					this.input.charCodeAt(index + 1) === CharCode.openBrace
				);
			}

			/**
			 * True when the body position starting at `this.start` opens a `@{ … }`
			 * code block, skipping leading whitespace.
			 */
			#atCodeBlockStart() {
				const index = skip_whitespace_from(this.input, this.start);
				return this.#isCodeBlockStart(index);
			}

			/**
			 * Inside a code block (`@{ … }` or a directive's `{ }`), decides whether the
			 * next thing is the single bare render node (`<tag …>`, `<>…</>`, or an
			 * `@if`/`@for`/`@switch`/`@try` directive) rather than a setup statement.
			 *
			 * Render output that begins with `<` is recognized by the tokenizer
			 * (`getTokenFromCode`): it emits `jsxTagStart` for a `<` that opens a tag — at
			 * the start of a line, or in an expression position such as after `;`/`{`/`=>` —
			 * which the `jsxTagStart` fast path below covers. The char-based fallback for a
			 * raw `<` therefore only treats it as render output when the tag starts its own
			 * line or follows a `;` on the same line (so one-liners such as
			 * `@{ const foo = 1; <>{foo}</> }` work). A `<` the tokenizer left as a
			 * relational operator while trailing a value on the same line is the comparison
			 * it looks like (`aaa <b` is `aaa < b`, never a `<b>` tag), so it stays setup
			 * code rather than being mistaken for render output.
			 */
			#atRenderNodeStart() {
				if (this.type === tstt.jsxTagStart) return true;
				const index = skip_whitespace_from(this.input, this.start);
				const ch = this.input.charCodeAt(index);
				if (ch === CharCode.lessThan) {
					const next = this.input.charCodeAt(index + 1);
					if (next === CharCode.slash) return false;
					const tagLike =
						next === CharCode.greaterThan ||
						next === CharCode.openBrace ||
						next === CharCode.at ||
						next === CharCode.dollar ||
						next === CharCode.underscore ||
						(next >= CharCode.uppercaseA && next <= CharCode.uppercaseZ) ||
						(next >= CharCode.lowercaseA && next <= CharCode.lowercaseZ);
					const previous = this.#previousNonSpaceTabIndex(index);
					const afterSemicolon =
						previous >= 0 && this.input.charCodeAt(previous) === CharCode.semicolon;
					return tagLike && (this.#isLineStartPosition(index) || afterSemicolon);
				}
				return this.#isCodeBlockStart(index) || this.#isJSXControlFlowDirectiveAt(index);
			}

			/**
			 * Parse one setup statement inside a code block as ordinary TS, with the
			 * native-template path hidden so `<` reads as a relational/type operator
			 * (`value < limit`, `foo<T>()`) rather than a JSX tag, and any JSX value
			 * (`const x = <div/>`) parses as a plain JSX expression.
			 */
			#parseCodeBlockSetupStatement() {
				const previous_context = this.context;
				const at_template_literal = this.type === tt.backQuote;
				let pushed_statement_context = false;
				if (at_template_literal) {
					if (this.curContext() !== q_tmpl) {
						this.context.push(q_tmpl);
					}
				} else {
					this.context = previous_context.filter(
						(context) =>
							context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag,
					);
					if (this.curContext() !== b_stat) {
						this.context.push(b_stat);
						pushed_statement_context = true;
					}
				}
				this.exprAllowed = true;
				const previous_path = this.#path;
				this.#path = [];
				this.#templateScriptParsingDepth++;
				let node;
				try {
					if (this.type === tstt.jsxText || this.type === tstt.jsxName) {
						const loc = acorn.getLineInfo(this.input, this.start);
						this.pos = this.start;
						this.curLine = loc.line;
						this.lineStart = this.start - loc.column;
						this.nextToken();
					}
					node = this.parseStatement(null);
				} finally {
					this.#templateScriptParsingDepth--;
					this.#path = previous_path;
					if (pushed_statement_context && this.curContext() === b_stat) {
						this.context.pop();
					}
					if (!at_template_literal) {
						this.context = previous_context;
					}
				}
				if (this.curContext() === tstc.tc_expr) {
					this.context.pop();
				}
				return node;
			}

			/**
			 * Parse the single bare render node of a code block — a JSX element/fragment
			 * (parsed as a native TSRX element so its own body may again be plain JSX or
			 * a nested `@{ … }`) or an `@if`/`@for`/`@switch`/`@try` directive.
			 */
			#parseCodeBlockRenderNode() {
				const at_index = skip_whitespace_from(this.input, this.start);
				// Reposition onto the render token so it re-tokenizes in a clean context
				// (a preceding setup statement's context restore can strip the JSX tag
				// contexts the trailing `<`/`@` token first pushed).
				if (this.start !== at_index) {
					const loc = acorn.getLineInfo(this.input, at_index);
					this.pos = at_index;
					this.start = at_index;
					this.startLoc = new acorn.Position(loc.line, loc.column);
					this.curLine = loc.line;
					this.lineStart = at_index - loc.column;
				}

				if (this.#isCodeBlockStart(at_index)) {
					return /** @type {AST.Node} */ (/** @type {unknown} */ (this.#parseCodeBlock()));
				}

				if (this.#isJSXControlFlowDirectiveAt(at_index)) {
					return /** @type {AST.Node} */ (
						/** @type {unknown} */ (this.#parseJSXControlFlowExpression())
					);
				}

				// Re-read the `<` so its `jsxTagStart` pushes the opening-tag contexts.
				this.pos = at_index;
				this.exprAllowed = true;
				this.next();
				if (this.type !== tstt.jsxTagStart) {
					this.unexpected();
				}
				this.next();
				if (this.value === '/' || this.type === tt.slash) {
					this.unexpected();
				}
				const node = this.parseElement();
				if (!node) {
					this.unexpected();
				}
				if (this.curContext() === tstc.tc_expr) {
					this.context.pop();
				}
				return /** @type {AST.Node} */ (/** @type {unknown} */ (node));
			}

			/**
			 * Shared `Statement* RenderOutput?` grammar for the body of a `@{ … }` code
			 * block and the `{ }` of an `@if`/`@for`/`@switch`/`@try` directive (§2
			 * rules 4–8). Fills `flat` with the setup statements followed by at most one
			 * trailing render node. Leaves the tokenizer positioned at the closing `}`.
			 * @param {AST.Node[]} flat
			 */
			#parseCodeBlockBody(flat) {
				let render_seen = false;
				while (this.type !== tt.braceR && this.type !== tt.eof) {
					// A bare `;` is an empty statement carrying no meaning. JSX render
					// output does not consume a trailing `;`, so one written after the
					// render node (`<>…</>;`) would otherwise parse as a statement and
					// trip the "statements cannot follow the rendered output" rule. Skip
					// stray semicolons silently here; prettier strips them on format.
					if (this.type === tt.semi) {
						this.next();
						continue;
					}
					if (this.#atRenderNodeStart()) {
						const render_node = this.#parseCodeBlockRenderNode();
						if (render_seen) {
							this.#report_recoverable_error_range(
								/** @type {number} */ (render_node.start),
								/** @type {number} */ (render_node.end),
								"A code block renders a single node; wrap multiple nodes or text in a fragment '<>…</>'.",
							);
						}
						flat.push(render_node);
						render_seen = true;
						continue;
					}
					const statement = this.#parseCodeBlockSetupStatement();
					if (statement) {
						if (render_seen) {
							// A statement after the rendered output: code must come first.
							this.#report_recoverable_error_range(
								/** @type {number} */ (statement.start),
								/** @type {number} */ (statement.end),
								"Code must be at the top of '@{ }'; statements cannot follow the rendered output.",
							);
						}
						flat.push(statement);
					}
				}
			}

			/**
			 * Parse an explicit `@{ … }` code block (`this.start` at `@`). Returns a
			 * `JSXCodeBlock` whose `body` holds the setup statements and `render` the
			 * single optional render output (§9).
			 */
			#parseCodeBlock({ allowReturnStatements = false } = {}) {
				const start = this.start;
				const startLoc = this.startLoc;
				const node = /** @type {AST.JSXCodeBlock} */ (this.startNodeAt(start, startLoc));
				node.body = [];
				node.render = null;
				node.metadata = { path: [] };

				// The body parses as JS, so swap the surrounding JSX/template token
				// contexts for a clean statement context and hide the enclosing template
				// from `#path` so the body tokenizes as code (not JSX raw text). Both are
				// restored before the closing `}` is consumed so the following `</tag>`
				// tokenizes against the same template context the body opened in.
				const enclosing_context = this.context;
				const enclosing_path = this.#path;
				const braceStart = start + 1;
				this.context = enclosing_context.filter(
					(context) =>
						context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag,
				);
				if (this.curContext() !== b_stat) {
					this.context.push(b_stat);
				}
				const braceLoc = acorn.getLineInfo(this.input, braceStart);
				this.pos = braceStart;
				this.start = braceStart;
				this.startLoc = new acorn.Position(braceLoc.line, braceLoc.column);
				this.curLine = braceLoc.line;
				this.lineStart = braceStart - braceLoc.column;
				this.exprAllowed = true;
				this.#path = [];
				this.next();
				this.expect(tt.braceL);

				/** @type {AST.Node[]} */
				const flat = [];
				this.enterScope(0);
				try {
					this.#parseCodeBlockBody(flat);
				} finally {
					this.exitScope();
					this.#path = enclosing_path;
				}

				const last = flat[flat.length - 1];
				if (is_tsrx_render_output_node(last)) {
					node.render = last;
					node.body = /** @type {AST.Statement[]} */ (flat.slice(0, -1));
				} else {
					node.body = /** @type {AST.Statement[]} */ (flat);
				}
				if (!allowReturnStatements) {
					this.#report_invalid_template_return_statements(node.body);
				}

				if (this.type !== tt.braceR) {
					this.unexpected();
				}
				// Restore the enclosing template context, then consume `}` and read the
				// following token (typically the parent's `</tag>`) against it. Finish the
				// node after the `}` so its range spans the whole `@{ … }` (this is what
				// lets trailing comments before `}` attach to the block, not the parent's
				// closing tag).
				const brace_close_end = this.end;
				const brace_close_end_loc = this.endLoc;
				this.context = enclosing_context;
				this.next();
				this.finishNodeAt(node, 'JSXCodeBlock', brace_close_end, brace_close_end_loc);
				return node;
			}

			/**
			 * At-sign constructs are expressions (§6a, §2 rule 9): code blocks and the
			 * if/for/switch/try directive forms may be returned, assigned, or passed
			 * anywhere an expression is expected. Only code blocks and the four reserved
			 * control-flow keywords are intercepted; any other at-sign form, such as a
			 * decorated class expression, falls through so decorators keep working.
			 * @type {Parse.Parser['parseExprAtom']}
			 */
			parseExprAtom(refDestructuringErrors, forInit, forNew) {
				if (this.input.charCodeAt(this.start) === CharCode.at) {
					if (this.#isCodeBlockStart(this.start)) {
						return /** @type {any} */ (this.#parseCodeBlock());
					}
					if (this.#isJSXControlFlowDirectiveAt(this.start)) {
						return /** @type {any} */ (this.#parseJSXControlFlowExpression());
					}
				}
				return super.parseExprAtom(refDestructuringErrors, forInit, forNew);
			}

			/**
			 * @param {AST.Node} node
			 * @param {string} type
			 * @param {number} start
			 * @param {AST.Position} startLoc
			 */
			#finishJSXControlFlowExpression(node, type, start, startLoc) {
				node.start = start;
				/** @type {AST.NodeWithLocation} */ (node).loc.start = startLoc;
				node.metadata ??= { path: [] };
				/** @type {any} */ (node).statementType = node.type;
				/** @type {any} */ (node).type = type;
				return node;
			}

			/**
			 * Drop the JSX tokenizer contexts (`tc_expr`/`tc_oTag`/`tc_cTag`) so the
			 * directive header/body tokenizes as JavaScript, while preserving every
			 * context below the innermost open `{ … }` expression container. Those lower
			 * contexts belong to the enclosing markup (the container brace, the element
			 * that holds the `{ … }`, any outer fragment); a plain filter would drop them
			 * too and underflow the context stack when that markup later closes. Outside
			 * any expression container the baseline is 0, so this matches the original
			 * "strip everything" behavior the bare-template path relies on.
			 */
			#filterTemplateScriptContexts() {
				const baseline = this.#expressionContainerContextBaselines.at(-1) ?? 0;
				this.context = this.context.filter(
					(context, index) =>
						index < baseline ||
						(context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag),
				);
			}

			#parseJSXControlFlowExpression() {
				const start = this.start;
				const startLoc = this.startLoc;
				const keywordStart = start + 1;
				this.pos = keywordStart;
				this.start = keywordStart;
				this.startLoc = acorn.getLineInfo(this.input, keywordStart);
				this.curLine = this.startLoc.line;
				this.lineStart = keywordStart - this.startLoc.column;
				this.#filterTemplateScriptContexts();
				if (this.curContext() !== b_stat) {
					this.context.push(b_stat);
				}
				this.exprAllowed = true;
				this.#readingJSXControlFlowDirectiveKeyword = true;
				try {
					this.nextToken();
				} finally {
					this.#readingJSXControlFlowDirectiveKeyword = false;
				}

				const label = this.type.keyword || this.type.label || this.value;
				if (label === 'if') {
					return this.#finishJSXControlFlowExpression(
						this.#parseTemplateIfStatement(),
						'JSXIfExpression',
						start,
						startLoc,
					);
				}

				if (label === 'for') {
					this.#templateControlFlowBlockDepth++;
					let node;
					const previous_reading_header = this.#readingJSXControlFlowHeader;
					this.#readingJSXControlFlowHeader = true;
					try {
						node = this.#finishJSXControlFlowExpression(
							this.parseStatement(null),
							'JSXForExpression',
							start,
							startLoc,
						);
					} finally {
						this.#readingJSXControlFlowHeader = previous_reading_header;
						this.#templateControlFlowBlockDepth--;
					}
					if (
						/** @type {any} */ (node).statementType !== 'ForOfStatement' &&
						/** @type {any} */ (node).statementType !== 'ForInStatement' &&
						/** @type {any} */ (node).statementType !== 'ForStatement'
					) {
						this.raise(start, 'Expected `for` after `@`.');
					}
					if (/** @type {any} */ (node).body?.type !== 'BlockStatement') {
						this.raise(
							/** @type {any} */ (node).body?.start ?? start,
							'Expected `{` after JSX control-flow directive.',
						);
					}
					if (this.#eatJSXForEmptyKeyword()) {
						if (this.type !== tt.braceL) {
							this.raise(this.start, 'Expected `{` after JSX control-flow directive.');
						}
						this.#templateControlFlowBlockDepth++;
						try {
							/** @type {any} */ (node).empty = this.parseBlock();
						} finally {
							this.#templateControlFlowBlockDepth--;
						}
					} else if (this.#isUnprefixedDirectiveClauseContinuation('empty', ['{'])) {
						this.raise(this.start, 'Expected `@empty` after `@for` block.');
					} else {
						/** @type {any} */ (node).empty = null;
					}
					return node;
				}

				if (label === 'switch') {
					return this.#parseJSXSwitchExpression(start, startLoc);
				}

				if (label === 'try') {
					this.#templateControlFlowTryDepth++;
					try {
						return this.#finishJSXControlFlowExpression(
							this.parseStatement(null),
							'JSXTryExpression',
							start,
							startLoc,
						);
					} finally {
						this.#templateControlFlowTryDepth--;
					}
				}

				this.raise(start, 'Expected `@if`, `@for`, `@switch`, or `@try`.');
			}

			/**
			 * @param {string} keyword
			 */
			#eatJSXDirectiveClauseKeyword(keyword) {
				const keywordStart = skip_whitespace_from(this.input, this.start);
				if (this.input.charCodeAt(keywordStart) !== CharCode.at) {
					return false;
				}
				const wordStart = keywordStart + 1;
				if (
					this.input.slice(wordStart, wordStart + keyword.length) !== keyword ||
					this.#isIdentifierChar(this.input.charCodeAt(wordStart + keyword.length))
				) {
					return false;
				}

				this.pos = wordStart;
				this.start = wordStart;
				this.startLoc = acorn.getLineInfo(this.input, wordStart);
				this.curLine = this.startLoc.line;
				this.lineStart = wordStart - this.startLoc.column;
				this.#filterTemplateScriptContexts();
				if (this.curContext() !== b_stat) {
					this.context.push(b_stat);
				}
				this.exprAllowed = true;
				this.#readingJSXControlFlowDirectiveKeyword = true;
				try {
					this.nextToken();
				} finally {
					this.#readingJSXControlFlowDirectiveKeyword = false;
				}
				this.next();
				return true;
			}

			#eatJSXForEmptyKeyword() {
				return this.#eatJSXDirectiveClauseKeyword('empty');
			}

			/**
			 * @param {string} keyword
			 */
			#eatJSXDirectiveBareClauseKeyword(keyword) {
				const wordStart = skip_whitespace_from(this.input, this.start);
				if (
					this.input.slice(wordStart, wordStart + keyword.length) !== keyword ||
					this.#isIdentifierChar(this.input.charCodeAt(wordStart + keyword.length))
				) {
					return false;
				}

				this.pos = wordStart;
				this.start = wordStart;
				this.startLoc = acorn.getLineInfo(this.input, wordStart);
				this.curLine = this.startLoc.line;
				this.lineStart = wordStart - this.startLoc.column;
				this.#filterTemplateScriptContexts();
				if (this.curContext() !== b_stat) {
					this.context.push(b_stat);
				}
				this.exprAllowed = true;
				this.#readingJSXControlFlowDirectiveKeyword = true;
				try {
					this.nextToken();
				} finally {
					this.#readingJSXControlFlowDirectiveKeyword = false;
				}
				return true;
			}

			/**
			 * @param {string} keyword
			 * @param {string[]} continuations
			 */
			#isUnprefixedDirectiveClauseContinuation(keyword, continuations) {
				const keywordStart = skip_whitespace_from(this.input, this.start);
				if (
					this.input.slice(keywordStart, keywordStart + keyword.length) !== keyword ||
					this.#isIdentifierChar(this.input.charCodeAt(keywordStart + keyword.length))
				) {
					return false;
				}

				const continuationStart = skip_whitespace_from(this.input, keywordStart + keyword.length);
				for (const continuation of continuations) {
					if (continuation.length === 1 && this.input[continuationStart] === continuation) {
						return true;
					}
					if (
						this.input.slice(continuationStart, continuationStart + continuation.length) ===
							continuation &&
						!this.#isIdentifierChar(this.input.charCodeAt(continuationStart + continuation.length))
					) {
						return true;
					}
				}
				return false;
			}

			/**
			 * @returns {'case' | 'default' | null}
			 */
			#eatJSXSwitchCaseClauseKeyword() {
				if (this.#eatJSXDirectiveClauseKeyword('case')) {
					return 'case';
				}
				if (this.#eatJSXDirectiveClauseKeyword('default')) {
					return 'default';
				}
				return null;
			}

			#parseTemplateControlFlowStatement() {
				if (this.type !== tt.braceL) {
					this.raise(this.start, 'Expected `{` after JSX control-flow directive.');
				}
				return this.#parseTemplateControlFlowBlock();
			}

			#parseTemplateIfStatement() {
				const node = /** @type {AST.IfStatement} */ (this.startNode());
				const previous_reading_header = this.#readingJSXControlFlowHeader;
				this.#readingJSXControlFlowHeader = true;
				try {
					this.next();
					node.test = this.parseParenExpression();
				} finally {
					this.#readingJSXControlFlowHeader = previous_reading_header;
				}
				node.consequent = /** @type {AST.Statement} */ (this.#parseTemplateControlFlowStatement());
				node.alternate = null;

				if (this.#eatJSXDirectiveClauseKeyword('else')) {
					node.alternate = this.#eatJSXDirectiveBareClauseKeyword('if')
						? this.#parseTemplateIfStatement()
						: /** @type {AST.Statement} */ (this.#parseTemplateControlFlowStatement());
				} else if (this.#isUnprefixedDirectiveClauseContinuation('else', ['{', 'if'])) {
					this.raise(this.start, 'Expected `@else` after `@if` block.');
				}

				return this.finishNode(node, 'IfStatement');
			}

			/**
			 * @param {number} start
			 * @param {AST.Position} startLoc
			 */
			#parseJSXSwitchExpression(start, startLoc) {
				const node = /** @type {AST.SwitchStatement} */ (this.startNodeAt(start, startLoc));
				const previous_reading_header = this.#readingJSXControlFlowHeader;
				this.#readingJSXControlFlowHeader = true;
				try {
					this.next();
					node.discriminant = this.parseParenExpression();
				} finally {
					this.#readingJSXControlFlowHeader = previous_reading_header;
				}
				node.cases = [];
				this.expect(tt.braceL);
				this.labels.push({ kind: 'switch' });
				this.enterScope(0);

				let sawDefault = false;
				while (this.type !== tt.braceR) {
					if (this.type === tstt.jsxText && this.#rewindToSwitchCaseLabel()) {
						continue;
					}

					const clauseStart = this.start;
					const clauseStartLoc = this.startLoc;
					const clause = this.#eatJSXSwitchCaseClauseKeyword();
					if (clause) {
						const isCase = clause === 'case';
						const current = /** @type {AST.SwitchCase} */ (
							this.startNodeAt(clauseStart, clauseStartLoc)
						);
						current.consequent = [];
						const previous_reading_header = this.#readingJSXControlFlowHeader;
						this.#readingJSXControlFlowHeader = true;
						try {
							if (isCase) {
								current.test = this.parseExpression();
							} else {
								if (sawDefault) {
									this.raiseRecoverable(this.lastTokStart, 'Multiple default clauses');
								}
								sawDefault = true;
								current.test = null;
							}
							this.expect(tt.colon);
						} finally {
							this.#readingJSXControlFlowHeader = previous_reading_header;
						}
						this.expect(tt.braceL);
						while (this.type !== tt.braceR) {
							this.#parseJSXSwitchCaseConsequent(current.consequent);
						}
						this.expect(tt.braceR);
						node.cases.push(this.finishNode(current, 'SwitchCase'));
						continue;
					}

					this.unexpected();
				}

				this.exitScope();
				this.next();
				this.labels.pop();
				return this.#finishJSXControlFlowExpression(
					this.finishNode(node, 'SwitchStatement'),
					'JSXSwitchExpression',
					start,
					startLoc,
				);
			}

			/**
			 * @param {AST.Node[]} consequent
			 * @this {TSRXParser & Parse.Parser}
			 */
			#parseJSXSwitchCaseConsequent(consequent) {
				if (this.type === tt.braceL) {
					consequent.push(this.#parseNativeTemplateExpressionContainer());
					return;
				}

				// A non-whitespace, non-directive case consequent that the tokenizer read
				// as raw text is a setup statement (in the new design bare text must be
				// wrapped in `<>`, so anything left here is code, e.g.
				// `props.status satisfies never`, `doThing()`, `x = 1`). Re-tokenize it as
				// JS and parse it as a statement instead of treating it as text.
				if (
					this.type === tstt.jsxText &&
					String(this.value ?? '').trim() !== '' &&
					!this.#isJSXControlFlowDirectiveStart() &&
					this.#switchCaseLabelStart(this.start) === -1
				) {
					const raw = String(this.value ?? '').trimStart();
					if (/^break\b/.test(raw)) {
						this.raise(this.start, '`break` is invalid inside `@switch` cases.');
					}
					if (/^return\b/.test(raw)) {
						this.raise(this.start, '`return` is invalid inside `@switch` cases.');
					}
					this.#filterTemplateScriptContexts();
					this.pos = this.start;
					this.startLoc = this.curPosition();
					if (this.curContext() !== b_stat) {
						this.context.push(b_stat);
					}
					this.exprAllowed = true;
					this.#parsingJSXSwitchCaseScriptStatementDepth++;
					try {
						this.#suppressTemplateRawTextToken = true;
						this.next();
						consequent.push(this.parseStatement(null));
					} finally {
						this.#parsingJSXSwitchCaseScriptStatementDepth--;
					}
					return;
				}

				if (this.type === tstt.jsxText) {
					const text = this.#parseJSXSwitchCaseRawText();
					if (!isWhitespaceTextNode(text)) {
						consequent.push(/** @type {any} */ (text));
					}
					return;
				}

				if (
					this.type === tstt.jsxTagStart ||
					this.input.charCodeAt(this.start) === CharCode.lessThan
				) {
					const startPos = this.start;
					const startLoc = this.startLoc;
					if (this.type === tstt.jsxTagStart) {
						this.next();
					} else {
						this.pos = startPos + 1;
						this.type = tstt.jsxTagStart;
						this.start = startPos;
						this.startLoc = startLoc;
						this.exprAllowed = false;
						this.next();
					}
					if (this.value === '/' || this.type === tt.slash) {
						this.unexpected();
					}
					const node = this.parseElement();
					if (!node) {
						this.unexpected();
					}
					consequent.push(/** @type {any} */ (node));
					return;
				}

				if (this.#isJSXControlFlowDirectiveStart()) {
					consequent.push(/** @type {any} */ (this.#parseJSXControlFlowExpression()));
					return;
				}

				if (this.#isSwitchCaseScriptStatementStart()) {
					this.#parsingJSXSwitchCaseScriptStatementDepth++;
					try {
						consequent.push(this.parseStatement(null));
					} finally {
						this.#parsingJSXSwitchCaseScriptStatementDepth--;
					}
					return;
				}

				const label = this.type.keyword || this.type.label;
				if (label === 'break') {
					this.raise(this.start, '`break` is invalid inside `@switch` cases.');
				}
				if (label === 'return') {
					this.raise(this.start, '`return` is invalid inside `@switch` cases.');
				}
				if (label === 'continue' || label === 'throw') {
					consequent.push(this.parseStatement(null));
					return;
				}

				// Anything else here is JS read as ordinary tokens (e.g.
				// `props.status satisfies never`, `doThing()`): a setup statement, not text
				// (bare text in a case must be wrapped in `<>`). Clear the JSX/template
				// token contexts so the statement and the following `}`/`case` tokenize as
				// code.
				if (this.type !== tstt.jsxText && this.type !== tt.eof) {
					this.#filterTemplateScriptContexts();
					if (this.curContext() !== b_stat) {
						this.context.push(b_stat);
					}
					this.#parsingJSXSwitchCaseScriptStatementDepth++;
					try {
						consequent.push(this.parseStatement(null));
					} finally {
						this.#parsingJSXSwitchCaseScriptStatementDepth--;
					}
					return;
				}

				const text = this.#parseJSXSwitchCaseRawText();
				if (!isWhitespaceTextNode(text)) {
					consequent.push(text);
				}
			}

			/**
			 * @param {ESTreeJSX.JSXOpeningElement} openingElement
			 * @returns {ESTreeJSX.JSXOpeningFragment}
			 */
			#toOpeningFragment(openingElement) {
				const openingFragment = /** @type {ESTreeJSX.JSXOpeningFragment} */ (
					/** @type {unknown} */ (openingElement)
				);
				openingFragment.type = 'JSXOpeningFragment';
				delete (/** @type {any} */ (openingFragment).name);
				delete (/** @type {any} */ (openingFragment).attributes);
				delete (/** @type {any} */ (openingFragment).selfClosing);
				return openingFragment;
			}

			/**
			 * @param {ESTreeJSX.JSXClosingElement} closingElement
			 * @returns {ESTreeJSX.JSXClosingFragment}
			 */
			#toClosingFragment(closingElement) {
				const closingFragment = /** @type {ESTreeJSX.JSXClosingFragment} */ (
					/** @type {unknown} */ (closingElement)
				);
				closingFragment.type = 'JSXClosingFragment';
				delete (/** @type {any} */ (closingFragment).name);
				return closingFragment;
			}

			/**
			 * Read a raw-text element body: capture everything between the opening `>`
			 * and the literal `</tagName>` verbatim (never as template markup),
			 * synthesize the closing element, and restore the tokenizer state past it.
			 * Shared by `<style>` and `<script>`.
			 *
			 * @param {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} open
			 * @param {AST.JSXStyleElement | AST.TSRXJSXElement} node
			 * @param {'style' | 'script'} tagName
			 * @returns {string} The raw body text
			 */
			#parseRawTextElement(open, node, tagName) {
				const closeTag = `</${tagName}>`;
				const contentStart = open.end;
				const input = this.input.slice(contentStart);
				const relativeCloseStart = input.indexOf(closeTag);
				const content = relativeCloseStart === -1 ? input : input.slice(0, relativeCloseStart);

				const newLines = content.match(regex_newline_characters)?.length;
				if (newLines) {
					this.curLine = open.loc.end.line + newLines;
					this.lineStart = contentStart + content.lastIndexOf('\n') + 1;
				}

				if (relativeCloseStart !== -1) {
					const closingStart = contentStart + content.length;
					const closingLineInfo = acorn.getLineInfo(this.input, closingStart);
					const closingStartLoc = new acorn.Position(closingLineInfo.line, closingLineInfo.column);
					const nameStart = closingStart + 2;
					const nameEnd = nameStart + tagName.length;
					const nameStartInfo = acorn.getLineInfo(this.input, nameStart);
					const nameEndInfo = acorn.getLineInfo(this.input, nameEnd);
					const name = /** @type {ESTreeJSX.JSXIdentifier} */ (
						this.startNodeAt(
							nameStart,
							new acorn.Position(nameStartInfo.line, nameStartInfo.column),
						)
					);
					name.name = tagName;
					this.finishNodeAt(
						name,
						'JSXIdentifier',
						nameEnd,
						new acorn.Position(nameEndInfo.line, nameEndInfo.column),
					);
					const closingEnd = closingStart + closeTag.length;
					const closingEndInfo = acorn.getLineInfo(this.input, closingEnd);
					const closingElement =
						/** @type {ESTreeJSX.TSRXJSXClosingElement & AST.NodeWithLocation} */ (
							this.startNodeAt(closingStart, closingStartLoc)
						);
					closingElement.name = name;
					this.finishNodeAt(
						closingElement,
						'JSXClosingElement',
						closingEnd,
						new acorn.Position(closingEndInfo.line, closingEndInfo.column),
					);
					node.closingElement = closingElement;
					const parent = this.#path.at(-2);
					const insideTemplate = this.#isNativeTemplateNode(parent);
					if (this.curContext() === tstc.tc_expr && !insideTemplate) {
						this.context.pop();
					}
					this.exprAllowed = false;
					this.pos = closingEnd;
					this.curLine = closingEndInfo.line;
					this.lineStart = closingEnd - closingEndInfo.column;
					if (insideTemplate && relativeCloseStart === 0) {
						// Acorn has already tokenized the adjacent closing tag; TSRX
						// synthesizes that close manually, so drop the stale tag context.
						if (this.curContext() === tstc.tc_oTag) {
							this.context.pop();
						}
						if (this.curContext() === tstc.tc_expr) {
							this.context.pop();
						}
					}
					if (!insideTemplate && this.#path.at(-1) === node) {
						this.#path.pop();
						try {
							this.next();
						} finally {
							this.#path.push(node);
						}
					} else {
						this.next();
					}
				} else {
					this.#report_broken_markup_error(
						open.end,
						`Unclosed tag '<${tagName}>'. Expected '${closeTag}' before end of template.`,
					);
					node.unclosed = true;
				}

				return content;
			}

			/**
			 * @param {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} open
			 * @param {AST.JSXStyleElement} node
			 * @param {boolean} insideHead
			 */
			#parseStyleElement(open, node, insideHead) {
				const filename = this.#filename;
				if (!filename) {
					throw new Error(
						'<style> elements require a filename: pass one to parse so style scope hashes are unique per file.',
					);
				}
				const content = this.#parseRawTextElement(open, node, 'style');
				const parsedCss = parse_style(
					content,
					{
						filename,
						line: open.loc.start.line,
						column: open.loc.start.column,
					},
					{ loose: this.#loose },
				);

				if (!insideHead) {
					node.metadata.styleScopeHash = parsedCss.hash;
				}

				node.css = content;
				node.children = [parsedCss];
			}

			/**
			 * Parse a `<script>` element as a raw-text element, exactly like `<style>`:
			 * the body is captured verbatim as `node.content`, letting authors write real
			 * JS/TS (with `<`, `{`, `}`) and letting the editor treat the body as an
			 * embedded TypeScript/JavaScript document.
			 *
			 * Mirroring `JSXStyleElement` (raw `css` string + parsed children), the body
			 * is exposed twice: verbatim on `content`, and as a single `JSXText` child so
			 * generic element paths (factory targets, static hoisting, printers) emit the
			 * body without knowing about raw-text elements. Consumers that handle
			 * `content` directly (the Ripple transforms, the prettier plugin) must skip
			 * the children instead of emitting both.
			 *
			 * @param {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} open
			 * @param {AST.TSRXJSXElement} node
			 */
			#parseScriptElement(open, node) {
				const content = this.#parseRawTextElement(open, node, 'script');
				node.content = content;
				node.children = [];

				if (content.length > 0) {
					const bodyStartInfo = acorn.getLineInfo(this.input, open.end);
					const text = /** @type {ESTreeJSX.JSXText} */ (
						this.startNodeAt(open.end, new acorn.Position(bodyStartInfo.line, bodyStartInfo.column))
					);
					text.value = content;
					text.raw = content;
					const bodyEnd = open.end + content.length;
					const bodyEndInfo = acorn.getLineInfo(this.input, bodyEnd);
					this.finishNodeAt(
						text,
						'JSXText',
						bodyEnd,
						new acorn.Position(bodyEndInfo.line, bodyEndInfo.column),
					);
					node.children = [/** @type {AST.Node} */ (text)];
				}
			}

			#parseNativeTemplateExpressionContainer() {
				const allow_trailing_semicolon = this.#allowExpressionContainerTrailingSemicolon;
				this.#allowExpressionContainerTrailingSemicolon = true;
				// One-shot: marks this as a template *child* container (not an attribute
				// value or script-mode JSX child), so `jsx_parseExpressionContainer`
				// consumes the closing `}` after leaving container scope.
				this.#consumeContainerBraceAfterScope = true;
				let node;
				try {
					node = this.jsx_parseExpressionContainer();
				} finally {
					this.#allowExpressionContainerTrailingSemicolon = allow_trailing_semicolon;
					this.#consumeContainerBraceAfterScope = false;
				}
				return /** @type {ESTreeJSX.JSXExpressionContainer} */ (/** @type {unknown} */ (node));
			}

			#popTemplateTokenContextBeforeExpressionChild() {
				let index = this.pos;
				let has_newline = false;

				// JSXText-only template fragments can leave the tokenizer in JSX text mode.
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
			 * @param {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} node
			 * @returns {boolean}
			 */
			#hasDirectStatementChild(node) {
				const children = /** @type {AST.Node[]} */ (/** @type {unknown} */ (node.children ?? []));
				return children.some(
					(child) => child.type.endsWith('Statement') || child.type === 'VariableDeclaration',
				);
			}

			/**
			 * @param {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment} node
			 */
			#popTokenContextsAfterTemplateExpressionElement(node) {
				// A fragment in expression position (`() => <>…</>`) leaves the tokenizer
				// at `exprAllowed === false`, unlike a self-closing element. When the next
				// token is a `;` or ASI can insert one, the following statement may
				// legitimately open with a JSX tag (`<List/>`), so restore expression
				// position to match the element path.
				if ((this.type === tt.semi || this.canInsertSemicolon()) && node.type === 'JSXFragment') {
					this.exprAllowed = true;
				}
				// A JSX element/fragment used as a ternary consequent (`cond ? <a>…</a> : …`)
				// likewise leaves the tokenizer at `exprAllowed === false`, so the `<` after
				// the `:` would not start a tag. Restore expression position so the alternate
				// branch parses as JSX too. This applies to both elements and fragments,
				// unlike the `;`/ASI case above (a `:` only follows a value, so the next
				// token always begins the alternate expression).
				if (this.type === tt.colon) {
					this.exprAllowed = true;
				}
				const ctx = this.context;
				const ci = ctx.length - 1;
				const top = ctx[ci];
				const second = ctx[ci - 1];

				// A paired JSX element/fragment finishes on the closing tag's `>`, which
				// leaves `exprAllowed` false even when the already-read next token is a
				// comma. Re-arm expression mode for the value after that comma, matching
				// the tokenizer state produced by a self-closing JSX element.
				if (this.type === tt.comma) {
					this.exprAllowed = true;
				}

				// Expression-bodied templates (no statement child) followed by `,`
				// in an object/array literal need surgical fixups; statement-bodied
				// templates fall through to the JSX-expression-container strip.
				const has_stmt_child = this.#hasDirectStatementChild(node);
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
					this.#report_recoverable_error_range(
						/** @type {AST.NodeWithLocation} */ (node).start ?? this.start,
						/** @type {AST.NodeWithLocation} */ (node).end ?? this.start + 1,
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
			 * @returns {Parse.CommentMetaData | null}
			 */
			#createCommentMetadata() {
				if (this.#path.length === 0) {
					return null;
				}

				const container = this.#path[this.#path.length - 1];
				if (!this.#isNativeTemplateNode(container)) {
					return null;
				}

				const children = Array.isArray(/** @type {any} */ (container).children)
					? /** @type {any} */ (container).children
					: [];
				const hasMeaningfulChildren = children.some(
					(/** @type {any} */ child) => child && !isWhitespaceTextNode(child),
				);

				if (hasMeaningfulChildren) {
					return null;
				}

				container.metadata ??= { path: [] };
				if (container.metadata.commentContainerId === undefined) {
					container.metadata.commentContainerId = ++this.#commentContextId;
				}

				return /*** @type {Parse.CommentMetaData} */ ({
					containerId: container.metadata.commentContainerId,
					childIndex: children.length,
					beforeMeaningfulChild: !hasMeaningfulChildren,
				});
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
				} else if (this.#isDynamicJSXElementName(node)) {
					// Dynamic tags (`<{Tag}>`) name by expression source. The braces keep
					// them from colliding with static tag names ('style', 'head', ...) and
					// read as source syntax in error messages (`</{Tag}>`).
					const expression = /** @type {AST.Expression} */ (/** @type {any} */ (node).expression);
					return `{${this.input.slice(expression.start, expression.end).trim()}}`;
				}
				return null;
			}

			/**
			 * @param {any} name
			 * @returns {boolean}
			 */
			#isDynamicJSXElementName(name) {
				return !!(name && name.type === 'JSXExpressionContainer' && name.isDynamic === true);
			}

			/**
			 * Dynamic tag expressions must be able to resolve to an element name:
			 * an identifier, member access, static string, or a runtime expression
			 * composed of those. Constructed values (calls, spreads, concatenation,
			 * interpolation, object/array literals) and static non-string literals
			 * can never be valid tag names.
			 * @param {any} expression
			 * @returns {boolean}
			 */
			#isValidDynamicTagExpression(expression) {
				let node = expression;
				while (node && DYNAMIC_TAG_WRAPPER_TYPES.has(node.type)) {
					node = node.expression;
				}
				if (!node || node.type?.startsWith?.('JSX')) return false;
				if (node.type === 'Identifier') return node.name !== 'undefined';
				if (node.type === 'Literal') return typeof node.value === 'string';
				if (node.type === 'UnaryExpression' && node.operator === 'void') return false;
				return !this.#containsDisallowedDynamicTagSyntax(node);
			}

			/**
			 * @param {any} node
			 * @param {Set<any>} [seen]
			 * @returns {boolean}
			 */
			#containsDisallowedDynamicTagSyntax(node, seen = new Set()) {
				if (!node || typeof node !== 'object' || seen.has(node)) return false;
				seen.add(node);
				if (Array.isArray(node)) {
					return node.some((child) => this.#containsDisallowedDynamicTagSyntax(child, seen));
				}
				if (
					DYNAMIC_TAG_DISALLOWED_TYPES.has(node.type) ||
					(node.type === 'TemplateLiteral' && node.expressions.length > 0) ||
					(node.type === 'BinaryExpression' && node.operator === '+')
				) {
					return true;
				}
				for (const key of Object.keys(node)) {
					if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
					if (this.#containsDisallowedDynamicTagSyntax(node[key], seen)) return true;
				}
				return false;
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
				const suppressTemplateRawTextToken = this.#suppressTemplateRawTextToken;
				this.#suppressTemplateRawTextToken = false;
				const context = this.curContext();
				if (
					code !== CharCode.lessThan &&
					code !== CharCode.greaterThan &&
					code !== CharCode.openBrace &&
					code !== CharCode.closeBrace &&
					!suppressTemplateRawTextToken &&
					this.#shouldReadTemplateRawTextToken()
				) {
					return this.#readTemplateRawTextToken();
				}
				if (
					code === CharCode.greaterThan &&
					this.input.charCodeAt(this.pos - 1) === CharCode.equals
				) {
					const start = this.pos - 1;
					const loc = acorn.getLineInfo(this.input, start);
					this.start = start;
					this.startLoc = loc;
					this.pos++;
					return this.finishToken(tt.arrow);
				}
				if (code === CharCode.lessThan && this.type !== tstt.jsxText) {
					// After a JSX text token a `<` can only open a tag; without this guard
					// text ending in an identifier character (`hello<div>`) would read as
					// the start of a type argument list (`hello<T>`).
					const next = this.input.charCodeAt(this.pos + 1);
					if (
						next !== CharCode.slash &&
						(looks_like_generic_arrow(this.input, this.pos) ||
							this.#canStartTypeParameterOrArgumentList(this.pos))
					) {
						++this.pos;
						return this.finishToken(tt.relational, '<');
					}
				}
				if (context === tstc.tc_expr || context === tstc.tc_oTag || context === tstc.tc_cTag) {
					return super.readToken(code);
				}
				if (code === CharCode.lessThan) {
					const next = this.input.charCodeAt(this.pos + 1);
					const isTagLikeAfterLt =
						next === CharCode.slash ||
						next === CharCode.greaterThan ||
						next === CharCode.openBrace ||
						next === CharCode.at ||
						next === CharCode.dollar ||
						next === CharCode.underscore ||
						(next >= CharCode.uppercaseA && next <= CharCode.uppercaseZ) ||
						(next >= CharCode.lowercaseA && next <= CharCode.lowercaseZ);
					if (this.exprAllowed && isTagLikeAfterLt) {
						++this.pos;
						return this.finishToken(tstt.jsxTagStart);
					}
				}
				return super.readToken(code);
			}

			/**
			 * Get token from character code - handles Ripple-specific tokens
			 * @type {Parse.Parser['getTokenFromCode']}
			 */
			getTokenFromCode(code) {
				// acorn-typescript only recognizes `@` as the at-token when it is not
				// reading a type. A return-type annotation (`function f(): T @{ … }`)
				// finishes while still `inType`, so its trailing `@` reaches the base
				// tokenizer, which throws "Unexpected character '@'". Emit the at-token
				// here so the `@{ … }` code block that follows the type can be parsed.
				if (code === CharCode.at && this.inType) {
					++this.pos;
					return this.finishToken(tstt.at);
				}

				if (
					code === CharCode.greaterThan &&
					this.input.charCodeAt(this.pos - 1) === CharCode.equals
				) {
					const start = this.pos - 1;
					const loc = acorn.getLineInfo(this.input, start);
					this.start = start;
					this.startLoc = loc;
					this.pos++;
					return this.finishToken(tt.arrow);
				}

				// Callback props that return native templates without a semicolon can
				// leave the attribute expression context above the still-open tag. Drop
				// it before tokenizing `/>`, otherwise Acorn treats `/` as a regexp.
				if (
					code === CharCode.slash &&
					this.input.charCodeAt(this.pos + 1) === CharCode.greaterThan
				) {
					while (
						this.context.length > 0 &&
						this.curContext() !== tstc.tc_oTag &&
						this.curContext() !== tstc.tc_expr
					) {
						this.context.pop();
					}
					if (this.curContext() !== tstc.tc_oTag) {
						this.context.push(tstc.tc_oTag);
					}
					this.exprAllowed = false;
				}

				// A `/` or `#` in template TEXT position joins the text run as a
				// literal character (`<div>5/2</div>`, `<div>#tag</div>`). This must
				// not fire in the JS positions that can sit under a template element
				// on the path: inside a `{ … }` expression container (an attribute or
				// child expression — `<rect x={a / 2}/>`, `{this.#x}`) or inside a
				// control-flow directive header (`@if (a / 2 > 1)`), where `/` is
				// division and `#` is a private-field access.
				if (
					(code === CharCode.numberSign || code === CharCode.slash) &&
					this.#functionBodyDepth === 0 &&
					this.#jsxExpressionContainerDepth === 0 &&
					!this.#readingJSXControlFlowHeader &&
					this.#isNativeTemplateNode(this.#path.at(-1)) &&
					!(
						code === CharCode.slash &&
						(this.input.charCodeAt(this.pos - 1) === CharCode.lessThan ||
							this.input.charCodeAt(this.pos + 1) === CharCode.greaterThan)
					)
				) {
					++this.pos;
					return this.finishToken(tt.name, this.input.slice(this.start, this.pos));
				}

				if (code === CharCode.lessThan) {
					// < character
					const parent = this.#path.at(-1);
					const inNativeTemplate =
						this.#functionBodyDepth === 0 && this.#isNativeTemplateNode(parent);
					/** @type {number | null} */
					let prevNonWhitespaceChar = null;
					const nextChar =
						this.pos + 1 < this.input.length ? this.input.charCodeAt(this.pos + 1) : -1;

					// Check if this could be TypeScript generics instead of JSX
					// TypeScript generics usually appear adjacent to an expression token,
					// for example: Array<T>, func<T>(), new Map<K,V>(), method<T>().
					// This check applies everywhere, not just inside components

					// Look back to see what precedes the <
					const lookback = this.#previousNonSpaceTabIndex(this.pos);

					// Check what character/token precedes the <
					if (lookback >= 0) {
						const prevChar = this.input.charCodeAt(lookback);
						prevNonWhitespaceChar = prevChar;

						if (
							nextChar !== CharCode.slash &&
							this.#canStartTypeParameterOrArgumentList(this.pos)
						) {
							++this.pos;
							return this.finishToken(tt.relational, '<');
						}
					}

					// Support parsing standalone template markup at the top-level
					// for tooling like Prettier, e.g.:
					// <Something>...</Something>\n\n<Child />
					// <head><style>...</style></head>
					// We only do this when '<' is in a tag-like position.
					const isWhitespaceAfterLt =
						nextChar === CharCode.space ||
						nextChar === CharCode.tab ||
						nextChar === CharCode.lineFeed ||
						nextChar === CharCode.carriageReturn;
					const isTagLikeAfterLt =
						!isWhitespaceAfterLt &&
						(nextChar === CharCode.slash ||
							nextChar === CharCode.greaterThan ||
							nextChar === CharCode.openBrace ||
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
						prevNonWhitespaceChar === CharCode.closeBrace ||
						prevNonWhitespaceChar === CharCode.greaterThan;

					if (!inNativeTemplate && this.exprAllowed && isTagLikeAfterLt) {
						++this.pos;
						return this.finishToken(tstt.jsxTagStart);
					}

					if (!inNativeTemplate && prevAllowsTagStart && isTagLikeAfterLt) {
						++this.pos;
						return this.finishToken(tstt.jsxTagStart);
					}

					if (inNativeTemplate) {
						// Inside native template bodies, allow adjacent tags without requiring
						// a newline/indentation before the next '<'. This is important for inputs
						// like `<div />` and `</div><style>...</style>` which Prettier formats.
						if (
							prevNonWhitespaceChar === CharCode.openBrace ||
							prevNonWhitespaceChar === CharCode.greaterThan
						) {
							if (!isWhitespaceAfterLt) {
								++this.pos;
								return this.finishToken(tstt.jsxTagStart);
							}
						}

						// `<` inside a nested function body is intercepted earlier in
						// `readToken` so it never reaches this path.

						// Check if everything before this position on the current line is whitespace
						let lineStart = this.pos - 1;
						while (
							lineStart >= 0 &&
							this.input.charCodeAt(lineStart) !== CharCode.lineFeed &&
							this.input.charCodeAt(lineStart) !== CharCode.carriageReturn
						) {
							lineStart--;
						}
						lineStart++; // Move past the newline character

						// Check if all characters from line start to current position are whitespace
						let allWhitespace = true;
						for (let i = lineStart; i < this.pos; i++) {
							const ch = this.input.charCodeAt(i);
							if (ch !== CharCode.space && ch !== CharCode.tab) {
								allWhitespace = false;
								break;
							}
						}

						// At the start of a line inside template bodies, only treat `<` as
						// a tag start when the following character can actually begin a tag.
						if (allWhitespace && isTagLikeAfterLt) {
							++this.pos;
							return this.finishToken(tstt.jsxTagStart);
						}
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
				const previous_reading_header = this.#readingJSXControlFlowHeader;
				this.#readingJSXControlFlowHeader = false;
				try {
					node.body = /** @type {AST.BlockStatement} */ (this.parseStatement('for'));
				} finally {
					this.#readingJSXControlFlowHeader = previous_reading_header;
				}
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
					// Allow a `@{ … }` code block as the body of a function, method, or
					// arrow function, so components can be written as `function Something()
					// @{ … }`, `{ Render() @{ … } }`, or `const Something = () => @{ … }`.
					//
					// A return-type annotation sits between the params and the body
					// (`function f(): T @{ … }`). acorn-typescript parses it inside
					// `super.parseFunctionBody` and then demands a `{` block, so the `@{ … }`
					// would never be seen. Parse the return type here first (exactly as
					// acorn-typescript does) so `this.start` lands on the `@` that follows.
					if (!isArrowFunction && this.match(tt.colon)) {
						node.returnType = this.tsParseTypeOrTypePredicateAnnotation(tt.colon);
					}
					if (this.#isCodeBlockStart(this.start)) {
						node.body = this.#parseCodeBlock({ allowReturnStatements: true });
						this.checkParams(node, false);
						this.exitScope();
						return node;
					}
					return super.parseFunctionBody(node, isArrowFunction, isMethod, forInit, ...args);
				} finally {
					this.#functionBodyDepth--;
				}
			}

			/**
			 * @return {ESTreeJSX.JSXExpressionContainer}
			 */
			jsx_parseExpressionContainer() {
				// Template child containers consume `}` after leaving container scope, so
				// the following sibling — which may be raw template text — tokenizes
				// normally (acorn already preserves whitespace in the surrounding
				// `tc_expr` context). Attribute-value and script-mode JSX containers keep
				// consuming `}` in scope: their following token is part of the tag or JS,
				// never template text.
				const consumeBraceAfterScope = this.#consumeContainerBraceAfterScope;
				this.#consumeContainerBraceAfterScope = false;
				let node = /** @type {ESTreeJSX.JSXExpressionContainer} */ (this.startNode());
				this.#jsxExpressionContainerDepth++;
				let pushed_context_baseline = false;
				try {
					this.next();

					// Record the context-stack depth now that the container's `{` brace
					// context is on the stack. A control-flow directive parsed inside this
					// container must not strip anything below this floor (see
					// `#filterTemplateScriptContexts`).
					this.#expressionContainerContextBaselines.push(this.context.length);
					this.#expressionContainerPathBaselines.push(this.#path.length);
					pushed_context_baseline = true;

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
					if (!consumeBraceAfterScope) {
						this.expect(tt.braceR);
					}
				} finally {
					this.#jsxExpressionContainerDepth--;
					if (pushed_context_baseline) {
						this.#expressionContainerContextBaselines.pop();
						this.#expressionContainerPathBaselines.pop();
					}
				}

				if (consumeBraceAfterScope) {
					this.expect(tt.braceR);
				}

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
				let node = /** @type {ESTreeJSX.JSXAttribute | ESTreeJSX.JSXSpreadAttribute} */ (
					this.startNode()
				);

				if (this.type === tt.braceL) {
					let name_start = skip_whitespace_from(this.input, this.start + 1);
					const first = this.input.charCodeAt(name_start);
					if (
						this.#isIdentifierChar(first) &&
						!(first >= CharCode.digit0 && first <= CharCode.digit9)
					) {
						let name_end = name_start + 1;
						while (this.#isIdentifierChar(this.input.charCodeAt(name_end))) {
							name_end++;
						}
						const brace_start = skip_whitespace_from(this.input, name_end);
						if (this.input.charCodeAt(brace_start) === CharCode.closeBrace) {
							const name_start_loc = acorn.getLineInfo(this.input, name_start);
							const name_end_loc = acorn.getLineInfo(this.input, name_end);
							const name_value = this.input.slice(name_start, name_end);
							const id = /** @type {ESTreeJSX.JSXIdentifier} */ (
								this.startNodeAt(name_start, name_start_loc)
							);
							id.name = name_value;
							this.finishNodeAt(id, 'JSXIdentifier', name_end, name_end_loc);
							const name = /** @type {AST.Identifier} */ (
								this.startNodeAt(name_start, name_start_loc)
							);
							name.name = name_value;
							this.finishNodeAt(name, 'Identifier', name_end, name_end_loc);
							const expression = /** @type {ESTreeJSX.JSXExpressionContainer} */ (
								this.startNodeAt(this.start, this.startLoc)
							);
							expression.expression = name;
							this.finishNodeAt(
								expression,
								'JSXExpressionContainer',
								brace_start + 1,
								acorn.getLineInfo(this.input, brace_start + 1),
							);
							/** @type {ESTreeJSX.JSXAttribute} */ (node).name = id;
							/** @type {any} */ (node).value = expression;
							/** @type {any} */ (node).shorthand = true;

							const end = brace_start + 1;
							const endLoc = acorn.getLineInfo(this.input, end);
							this.pos = end;
							this.curLine = endLoc.line;
							this.lineStart = end - endLoc.column;
							if (this.curContext()?.token === '{') {
								this.context.pop();
							}
							this.exprAllowed = false;
							this.next();
							return this.finishNodeAt(node, 'JSXAttribute', end, endLoc);
						}
					}
				}

				if (this.eat(tt.braceL)) {
					if (this.type === tt.ellipsis || this.input.slice(this.start, this.start + 3) === '...') {
						this.#suppressTemplateRawTextToken = true;
						if (this.type === tt.ellipsis) {
							this.expect(tt.ellipsis);
						} else {
							this.pos = this.start + 3;
							this.nextToken();
						}
						this.#templateScriptParsingDepth++;
						try {
							/** @type {ESTreeJSX.JSXSpreadAttribute} */ (node).argument = this.parseMaybeAssign();
						} finally {
							this.#templateScriptParsingDepth--;
						}
						this.expect(tt.braceR);
						return this.finishNode(node, 'JSXSpreadAttribute');
					} else if (this.lookahead().type === tt.ellipsis) {
						this.#suppressTemplateRawTextToken = true;
						this.expect(tt.ellipsis);
						this.#templateScriptParsingDepth++;
						try {
							/** @type {ESTreeJSX.JSXSpreadAttribute} */ (node).argument = this.parseMaybeAssign();
						} finally {
							this.#templateScriptParsingDepth--;
						}
						this.expect(tt.braceR);
						return this.finishNode(node, 'JSXSpreadAttribute');
					} else {
						if (!(this.type === tt.name || this.type.keyword || this.type === tstt.jsxName)) {
							this.unexpected();
						}
						const name_start = this.start;
						const name_start_loc = this.startLoc;
						const name_end = this.end;
						const name_end_loc = this.endLoc;
						const name_value = /** @type {string} */ (this.value);
						const id = /** @type {ESTreeJSX.JSXIdentifier} */ (
							this.startNodeAt(name_start, name_start_loc)
						);
						id.name = name_value;
						this.finishNodeAt(id, 'JSXIdentifier', name_end, name_end_loc);
						const name = /** @type {AST.Identifier} */ (
							this.startNodeAt(name_start, name_start_loc)
						);
						name.name = name_value;
						this.finishNodeAt(name, 'Identifier', name_end, name_end_loc);
						const expression = /** @type {ESTreeJSX.JSXExpressionContainer} */ (
							this.startNodeAt(
								/** @type {number} */ (node.start),
								/** @type {AST.NodeWithLocation} */ (node).loc.start,
							)
						);
						expression.expression = name;
						/** @type {ESTreeJSX.JSXAttribute} */ (node).name = id;
						/** @type {any} */ (node).value = this.finishNodeAt(
							expression,
							'JSXExpressionContainer',
							this.end + 1,
							this.endLoc,
						);
						/** @type {any} */ (node).shorthand = true;
						this.next();
						this.expect(tt.braceR);
						return this.finishNode(node, 'JSXAttribute');
					}
				}
				/** @type {ESTreeJSX.JSXAttribute} */ (node).name = this.jsx_parseNamespacedName();
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

				if (this.type === tt.name || this.type.keyword || this.type === tstt.jsxName) {
					node.name = /** @type {string} */ (this.value);
					this.next();
				} else {
					return super.jsx_parseIdentifier();
				}

				return this.finishNode(node, 'JSXIdentifier');
			}

			#parseJSXDynamicElementName() {
				const container = this.jsx_parseExpressionContainer();
				container.isDynamic = true;
				if (!this.#isValidDynamicTagExpression(container.expression)) {
					this.raise(
						/** @type {number} */ (container.expression?.start ?? container.start),
						'Dynamic element names must be an identifier, member expression, static string, or runtime expression; calls, spreads, string concatenation, string interpolation, and static null, undefined, boolean, number, object, and array literals are not valid tag names.',
					);
				}
				return container;
			}

			/**
			 * @type {Parse.Parser['jsx_parseElementName']}
			 */
			jsx_parseElementName() {
				if (this.type === tstt.jsxTagEnd) {
					return '';
				}

				if (this.type === tt.braceL) {
					return this.#parseJSXDynamicElementName();
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
						this.#jsxAttributeValueExpressionDepth++;
						try {
							return this.jsx_parseExpressionContainer();
						} finally {
							this.#jsxAttributeValueExpressionDepth--;
						}
					case tstt.jsxTagStart:
					case tt.string:
						return this.parseExprAtom();
					default:
						this.raise(this.start, 'value should be either an expression or a quoted text');
				}
			}

			/**
			 * `@try`/`@pending`/`@catch` blocks are template control-flow blocks like
			 * `@if`/`@for`/`@switch`: `return` is not allowed inside them. A `return`
			 * is only valid in the JS setup at the top of a `@{ … }` code block, never
			 * inside a `@`-directive block. Report any direct `return` with the same
			 * template-return diagnostic used elsewhere.
			 * @returns {AST.BlockStatement}
			 */
			#parseTemplateControlFlowReturnBlock(createNewLexicalScope = true) {
				const block = this.#parseTemplateControlFlowBlock(createNewLexicalScope);
				this.#report_invalid_template_return_statements(block.body);
				return block;
			}

			/**
			 * @type {Parse.Parser['parseTryStatement']}
			 */
			parseTryStatement(node) {
				if (this.#templateControlFlowTryDepth > 0) {
					this.#templateControlFlowTryDepth--;
					try {
						this.next();
						node.block = this.#parseTemplateControlFlowReturnBlock();
						node.handler = null;

						if (this.#eatJSXDirectiveClauseKeyword('pending')) {
							node.pending = this.#parseTemplateControlFlowReturnBlock();
						} else if (this.#isUnprefixedDirectiveClauseContinuation('pending', ['{'])) {
							this.raise(this.start, 'Expected `@pending` after `@try` block.');
						} else {
							node.pending = null;
						}

						const clauseStart = this.start;
						const clauseStartLoc = this.startLoc;
						if (this.#eatJSXDirectiveClauseKeyword('catch')) {
							if (this.type === tt._catch || this.value === 'catch') {
								this.next();
							}
							const paramStart = skip_whitespace_from(this.input, this.start);
							if (this.input.charCodeAt(paramStart) === CharCode.openParen) {
								this.pos = paramStart;
								this.start = paramStart;
								this.startLoc = acorn.getLineInfo(this.input, paramStart);
								this.curLine = this.startLoc.line;
								this.lineStart = paramStart - this.startLoc.column;
								this.#filterTemplateScriptContexts();
								if (this.curContext() !== b_stat) {
									this.context.push(b_stat);
								}
								this.exprAllowed = true;
								this.#suppressTemplateRawTextToken = true;
								try {
									this.nextToken();
								} finally {
									this.#suppressTemplateRawTextToken = false;
								}
							}
							const clause = /** @type {AST.CatchClause} */ (
								this.startNodeAt(clauseStart, clauseStartLoc)
							);
							const previous_reading_header = this.#readingJSXControlFlowHeader;
							this.#readingJSXControlFlowHeader = true;
							try {
								if (this.eat(tt.parenL)) {
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
							} finally {
								this.#readingJSXControlFlowHeader = previous_reading_header;
							}
							clause.body = this.#parseTemplateControlFlowReturnBlock(false);
							this.exitScope();
							node.handler = this.finishNode(clause, 'CatchClause');
						} else if (this.#isUnprefixedDirectiveClauseContinuation('catch', ['{', '('])) {
							this.raise(this.start, 'Expected `@catch` after `@try` block.');
						}
						node.finalizer = null;

						if (!node.handler && !node.pending) {
							this.raise(
								/** @type {AST.NodeWithLocation} */ (node).start,
								'Missing `@catch` or `@pending` after `@try` block.',
							);
						}
						return this.finishNode(node, 'TryStatement');
					} finally {
						this.#templateControlFlowTryDepth++;
					}
				}

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
				if (this.#scriptJSXElementDepth > 0 || this.#path.length === 0) {
					if (
						this.input.charCodeAt(this.pos) === CharCode.closeBrace &&
						this.context.includes(tstc.tc_expr)
					) {
						this.#resetTokenStartToCurrentPosition();
						return original.readToken.call(this, CharCode.closeBrace);
					}

					let index = this.pos;
					while (
						this.input.charCodeAt(index) === CharCode.space ||
						this.input.charCodeAt(index) === CharCode.tab ||
						this.input.charCodeAt(index) === CharCode.lineFeed ||
						this.input.charCodeAt(index) === CharCode.carriageReturn
					) {
						index++;
					}
					if (
						index !== this.pos &&
						this.input.charCodeAt(index) === CharCode.slash &&
						this.input.charCodeAt(index + 1) === CharCode.greaterThan &&
						this.context.includes(tstc.tc_expr)
					) {
						const loc = acorn.getLineInfo(this.input, index);
						this.pos = index;
						this.start = index;
						this.startLoc = loc;
						this.curLine = loc.line;
						this.lineStart = index - loc.column;
						this.exprAllowed = false;
						if (this.curContext() !== tstc.tc_oTag) {
							this.context.push(tstc.tc_oTag);
						}
						return original.readToken.call(this, CharCode.slash);
					}
				}
				if (this.#scriptJSXElementDepth > 0 || this.#path.length === 0) {
					return super.jsx_readToken();
				}

				let out = '',
					chunkStart = this.pos;

				while (true) {
					if (this.pos >= this.input.length) {
						const inside_open_template = this.#path.findLast((n) => this.#isNativeTemplateNode(n));
						if (!inside_open_template) {
							while (this.curContext() === tstc.tc_expr) {
								this.context.pop();
							}
							return this.finishToken(tt.eof);
						}
						this.raise(this.start, 'Unterminated JSX contents');
					}
					let ch = this.input.charCodeAt(this.pos);

					switch (ch) {
						case CharCode.equals:
							if (
								!this.#shouldReadTemplateRawTextToken() &&
								this.input.charCodeAt(this.pos + 1) === CharCode.greaterThan
							) {
								this.#resetTokenStartToCurrentPosition();
								this.pos += 2;
								return this.finishToken(tt.arrow);
							}
							if (this.#shouldReadTemplateRawTextToken()) {
								++this.pos;
								break;
							}
							this.#resetTokenStartToCurrentPosition();
							this.context.push(b_stat);
							this.exprAllowed = true;
							return original.readToken.call(this, ch);

						case CharCode.lessThan:
						case CharCode.openBrace:
							if (out || this.pos > chunkStart) {
								return this.finishToken(tstt.jsxText, out + this.input.slice(chunkStart, this.pos));
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

						case CharCode.slash:
							// Check if this is a comment (// or /*)
							if (this.input.charCodeAt(this.pos + 1) === CharCode.slash) {
								// '//'
								// Line comment - handle it properly
								const commentStart = this.pos;
								const startLoc = this.curPosition();
								this.pos += 2;

								let commentText = '';
								while (this.pos < this.input.length) {
									const nextCh = this.input.charCodeAt(this.pos);
									if (acorn.isNewLine(nextCh)) break;
									commentText += this.input[this.pos];
									this.pos++;
								}

								const commentEnd = this.pos;
								const endLoc = this.curPosition();

								// Call onComment if it exists
								if (this.options.onComment) {
									const metadata = this.#createCommentMetadata();
									this.options.onComment(
										false,
										commentText,
										commentStart,
										commentEnd,
										startLoc,
										endLoc,
										metadata,
									);
								}

								// Continue processing from current position
								chunkStart = this.pos;
								break;
							} else if (this.input.charCodeAt(this.pos + 1) === CharCode.asterisk) {
								// '/*'
								// Block comment - handle it properly
								const commentStart = this.pos;
								const startLoc = this.curPosition();
								this.pos += 2;

								let commentText = '';
								while (this.pos < this.input.length - 1) {
									if (
										this.input.charCodeAt(this.pos) === CharCode.asterisk &&
										this.input.charCodeAt(this.pos + 1) === CharCode.slash
									) {
										this.pos += 2;
										break;
									}
									commentText += this.input[this.pos];
									this.pos++;
								}

								const commentEnd = this.pos;
								const endLoc = this.curPosition();

								// Call onComment if it exists
								if (this.options.onComment) {
									const metadata = this.#createCommentMetadata();
									this.options.onComment(
										true,
										commentText,
										commentStart,
										commentEnd,
										startLoc,
										endLoc,
										metadata,
									);
								}

								// Continue processing from current position
								chunkStart = this.pos;
								break;
							}
							// Like the default case below, a slash joins the raw text run even
							// when the element is nested inside a `{ … }` expression container
							// (`{cond && (<a>x/y</a>)}`, `{a}/{b}` between child expressions).
							// Bailing to JS tokenization here would read the `/` as the start
							// of a regular expression.
							if (this.#shouldReadTemplateRawTextToken(true)) {
								++this.pos;
								break;
							}
							this.#resetTokenStartToCurrentPosition();
							this.context.push(b_stat);
							this.exprAllowed = true;
							return original.readToken.call(this, ch);

						case CharCode.ampersand:
							out += this.input.slice(chunkStart, this.pos);
							out += this.jsx_readEntity();
							chunkStart = this.pos;
							break;

						case CharCode.greaterThan:
						case CharCode.closeBrace: {
							if (
								ch === CharCode.greaterThan &&
								this.input.charCodeAt(this.pos - 1) === CharCode.equals &&
								!this.#shouldReadTemplateRawTextToken()
							) {
								const start = this.pos - 1;
								const loc = acorn.getLineInfo(this.input, start);
								this.start = start;
								this.startLoc = loc;
								this.pos++;
								return this.finishToken(tt.arrow);
							}
							if (
								this.#isInsideNativeTemplateScriptSection() ||
								(ch === CharCode.closeBrace &&
									(this.#path.length === 0 || this.#isNativeTemplateNode(this.#path.at(-1))))
							) {
								this.#resetTokenStartToCurrentPosition();
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
								// A JSX element nested inside a `{ … }` expression container is
								// still a template-mode element whose text children are raw JSX
								// text (e.g. `{<div>   a</div>}`). The default raw-text check bails
								// for everything inside an expression container, so without the
								// `allow_inside_expression_container` form the first non-space char
								// would re-anchor the token start and drop the leading whitespace
								// this loop already skipped. Keep scanning so the full run —
								// leading indentation included — is captured, matching the
								// bare-template path. Directive bodies (`@if`/`@for`/…) inside the
								// element still fall through to JS tokenization via the other
								// checks in `#shouldReadTemplateRawTextToken`.
								if (this.#shouldReadTemplateRawTextToken(true)) {
									++this.pos;
									break;
								}
								this.#resetTokenStartToCurrentPosition();
								this.context.push(b_stat);
								this.exprAllowed = true;
								return original.readToken.call(this, ch);
							}
					}
				}
			}

			/**
			 * Override jsx_parseElement to use TSRX template parsing only where the
			 * fragment/element body can contain TSRX-only syntax.
			 * @type {Parse.Parser['jsx_parseElement']}
			 */
			jsx_parseElement() {
				if (this.#forceScriptJSXElementDepth > 0 || this.#isInsideNativeTemplateScriptSection()) {
					if (this.#isRawTextOpeningTagStart('style') || this.#isRawTextOpeningTagStart('script')) {
						this.next();
						return /** @type {ESTreeJSX.JSXElement | AST.JSXStyleElement} */ (
							/** @type {unknown} */ (this.parseElement())
						);
					}

					this.#scriptJSXElementDepth++;
					try {
						return super.jsx_parseElement();
					} finally {
						this.#scriptJSXElementDepth--;
					}
				}

				this.next();
				const parsed = /** @type {import('estree-jsx').JSXElement} */ (
					/** @type {unknown} */ (this.parseElement())
				);
				this.#popTokenContextsAfterTemplateExpressionElement(parsed);
				return parsed;
			}

			/**
			 * @type {Parse.Parser['jsx_parseOpeningElementAt']}
			 */
			jsx_parseOpeningElementAt(startPos, startLoc) {
				const node = /** @type {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} */ (
					this.startNodeAt(/** @type {number} */ (startPos), /** @type {AST.Position} */ (startLoc))
				);
				node.attributes = [];
				const nodeName = this.jsx_parseElementName();
				if (nodeName) node.name = /** @type {any} */ (nodeName);
				if (this.#isDynamicJSXElementName(nodeName)) {
					/** @type {any} */ (node).isDynamic = true;
				}
				if (this.match(tt.relational) || this.match(tt.bitShift)) {
					const typeArguments = /** @type {any} */ (this).tsTryParseAndCatch(() =>
						/** @type {any} */ (this).tsParseTypeArgumentsInExpression(),
					);
					if (typeArguments) node.typeArguments = typeArguments;
				}
				while (this.type !== tt.slash && this.type !== tstt.jsxTagEnd) {
					node.attributes.push(this.jsx_parseAttribute());
				}
				node.selfClosing = this.eat(tt.slash);

				const opening_template_node = this.#openingNativeTemplateNode;
				let pushed_opening_template_node = false;
				if (opening_template_node) {
					if (nodeName) {
						/** @type {any} */ (opening_template_node).type =
							this.getElementName(nodeName) === 'style' ? 'JSXStyleElement' : 'JSXElement';
						/** @type {any} */ (opening_template_node).openingElement = node;
						/** @type {any} */ (opening_template_node).closingElement = null;
						if (this.#isDynamicJSXElementName(nodeName)) {
							/** @type {any} */ (opening_template_node).isDynamic = true;
						}
					} else {
						/** @type {any} */ (opening_template_node).type = 'JSXFragment';
						/** @type {any} */ (opening_template_node).openingFragment =
							this.#toOpeningFragment(node);
						/** @type {any} */ (opening_template_node).closingFragment = null;
					}
					this.#path.push(opening_template_node);
					pushed_opening_template_node = true;
				}

				try {
					this.expect(tstt.jsxTagEnd);
				} finally {
					if (pushed_opening_template_node) {
						this.#path.pop();
					}
				}
				if (nodeName) {
					return this.finishNode(node, 'JSXOpeningElement');
				}
				return /** @type {any} */ (
					/** @type {any} */ (this).finishNode(node, 'JSXOpeningFragment')
				);
			}

			/**
			 * @type {Parse.Parser['parseElement']}
			 */
			parseElement() {
				// Depth the tokenizer context must return to once this element closes:
				// the stack with the element's own opening `<` contexts (a trailing
				// tc_oTag/tc_expr) stripped off. A balanced element should leave the
				// stack here; the body (especially a control-flow block) can otherwise
				// leave residue that breaks tokenizing the following JS token when the
				// element is in expression position.
				let pre_element_context_depth = this.context.length;
				while (pre_element_context_depth > 0) {
					const ctx = this.context[pre_element_context_depth - 1];
					if (ctx === tstc.tc_expr || ctx === tstc.tc_oTag || ctx === tstc.tc_cTag) {
						pre_element_context_depth--;
					} else {
						break;
					}
				}

				// Adjust the start so we capture the `<` as part of the element
				const start = this.start - 1;
				const position = new acorn.Position(this.curLine, start - this.lineStart);

				const node =
					/** @type {ESTreeJSX.JSXElement | ESTreeJSX.JSXFragment | AST.JSXStyleElement} */ (
						/** @type {unknown} */ (this.startNode())
					);
				node.start = start;
				/** @type {AST.NodeWithLocation} */ (node).loc.start = position;
				node.metadata = {
					path: [],
					native_tsrx: true,
					templateMode: 'script',
				};
				node.children = [];

				const previous_opening_native_template_node = this.#openingNativeTemplateNode;
				this.#openingNativeTemplateNode = node;
				let open;
				try {
					open = /** @type {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} */ (
						this.jsx_parseOpeningElementAt(start, position)
					);
				} finally {
					this.#openingNativeTemplateNode = previous_opening_native_template_node;
				}
				const tag_name = open.name ? this.getElementName(open.name) : null;
				const is_dynamic = this.#isDynamicJSXElementName(open.name);
				const is_style = tag_name === 'style';
				const is_script = tag_name === 'script';
				const inside_head = this.#path.findLast((n) => this.#isNativeElementNamed(n, 'head'));

				// Fragments (<>) produce JSXOpeningFragment with no `name` property
				const is_fragment = !open.name;
				const parent_template_node = this.#currentNativeTemplateNode();
				const parent_is_template_output =
					parent_template_node?.metadata?.templateMode === 'template';
				node.metadata.templateMode =
					is_fragment && parent_is_template_output ? 'template' : 'script';
				if (!is_fragment && open.name.type === 'JSXNamespacedName') {
					const namespace_node = /** @type {ESTreeJSX.JSXNamespacedName} */ (open.name);
					const tagName = namespace_node.namespace.name + ':' + namespace_node.name.name;
					this.raise(
						open.start,
						`Namespaced elements are not supported in TSRX templates: <${tagName}>.`,
					);
				}

				if (is_fragment) {
					/** @type {ESTreeJSX.JSXFragment} */ (node).type = 'JSXFragment';
					/** @type {ESTreeJSX.JSXFragment} */ (node).openingFragment =
						this.#toOpeningFragment(open);
					/** @type {any} */ (node).closingFragment = null;
				} else {
					if (is_style) {
						/** @type {AST.JSXStyleElement} */ (node).type = 'JSXStyleElement';
						/** @type {AST.JSXStyleElement} */ (node).openingElement =
							/** @type {AST.JSXStyleElement['openingElement']} */ (open);
						/** @type {AST.JSXStyleElement} */ (node).closingElement =
							/** @type {AST.JSXStyleElement['closingElement']} */ (null);
					} else {
						/** @type {ESTreeJSX.JSXElement} */ (node).type = 'JSXElement';
						/** @type {ESTreeJSX.JSXElement} */ (node).openingElement = open;
						/** @type {ESTreeJSX.JSXElement} */ (node).closingElement = null;
						if (is_dynamic) {
							/** @type {any} */ (node).isDynamic = true;
						}
					}
				}

				// Opening-tag parsing can tokenize comments that appear before the first
				// child. Preserve that early container id so the comment stays associated
				// with this element during comment attachment/printing.
				if (node.metadata.commentContainerId === undefined) {
					node.metadata.commentContainerId = ++this.#commentContextId;
				}

				this.#path.push(node);

				if (!is_fragment && open.selfClosing) {
					this.#path.pop();
				} else if (is_style) {
					this.#parseStyleElement(open, /** @type {AST.JSXStyleElement} */ (node), !!inside_head);
					this.#path.pop();
				} else if (is_script) {
					this.#parseScriptElement(open, /** @type {AST.TSRXJSXElement} */ (node));
					this.#path.pop();
				} else {
					this.#parseNativeTemplateBody(node, /** @type {AST.Node[]} */ (node.children), {
						enterScope: true,
						resetFunctionBodyDepth: true,
					});

					if (this.#path[this.#path.length - 1] === node) {
						const displayTag = is_fragment
							? ''
							: this.getElementName(/** @type {ESTreeJSX.JSXElement} */ (node).openingElement.name);
						this.#report_broken_markup_error(
							this.start,
							`Unclosed tag '<${displayTag}>'. Expected '</${displayTag}>' before end of template.`,
						);
						/** @type {any} */ (node).unclosed = true;
						/** @type {AST.SourceLocation} */ (node.loc).end = {
							.../** @type {AST.SourceLocation} */ (
								is_fragment
									? /** @type {ESTreeJSX.JSXFragment} */ (node).openingFragment.loc
									: /** @type {ESTreeJSX.JSXElement} */ (node).openingElement.loc
							).end,
						};
						node.end = is_fragment
							? /** @type {ESTreeJSX.JSXFragment} */ (node).openingFragment.end
							: /** @type {ESTreeJSX.JSXElement} */ (node).openingElement.end;
						this.#path.pop();
					}

					// A balanced element must leave the tokenizer context exactly where it
					// began. The body (especially a control-flow block) can leave residue
					// above the children context — the children tc_expr plus a spurious
					// b_stat from an @if/@for block save-restore — which the old single
					// tc_expr pop missed when the b_stat sat on top. In expression position,
					// unwind back to the pre-element depth so the following JS token (e.g. a
					// comma/brace closing an enclosing object) tokenizes as code, not text.
					const parent = this.#path.at(-1);
					const insideTemplate = this.#isNativeTemplateNode(parent);

					if (!insideTemplate && this.context.length > pre_element_context_depth) {
						this.context.length = pre_element_context_depth;
					}
				}

				if ((is_style || is_script) && /** @type {AST.JSXStyleElement} */ (node).closingElement) {
					const closing = /** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
						/** @type {AST.JSXStyleElement} */ (node).closingElement
					);
					return this.finishNodeAt(node, node.type, closing.end, closing.loc.end);
				}

				return this.finishNode(node, node.type);
			}

			/**
			 * @type {Parse.Parser['parseTemplateBody']}
			 */
			parseTemplateBody(body) {
				const current_template_node = this.#currentNativeTemplateNode();
				if (!current_template_node) return;
				current_template_node.metadata ??= { path: [] };
				current_template_node.metadata.templateMode = 'template';

				if (this.#atCodeBlockStart()) {
					const at_index = skip_whitespace_from(this.input, this.start);
					if (this.start !== at_index) {
						const ws_start = this.start;
						const ws_start_loc = this.startLoc;
						const ws_value = this.input.slice(ws_start, at_index);
						const text_node = /** @type {ESTreeJSX.JSXText} */ (
							this.startNodeAt(ws_start, ws_start_loc)
						);
						text_node.value = ws_value;
						text_node.raw = ws_value;
						const loc = acorn.getLineInfo(this.input, at_index);
						const at_position = new acorn.Position(loc.line, loc.column);
						this.finishNodeAt(text_node, 'JSXText', at_index, at_position);
						if (this.#shouldKeepTemplateTextNode(text_node)) {
							body.push(text_node);
						}
						this.pos = at_index;
						this.start = at_index;
						this.startLoc = at_position;
						this.curLine = loc.line;
						this.lineStart = at_index - loc.column;
					}
					body.push(/** @type {any} */ (this.#parseCodeBlock()));
					this.parseTemplateBody(body);
					return;
				}

				if (this.type === tt.braceL) {
					body.push(this.#parseNativeTemplateExpressionContainer());
				} else if (this.type === tstt.jsxText) {
					// A nested element with its own body can leak a JSX expression context,
					// so the whitespace after its closing tag is mis-tokenized as a stale
					// text token whose start was advanced onto the following `<`. Real JSX
					// text never starts at `<`, so drop the leaked context and re-read the
					// tag instead of emitting an empty node.
					if (this.input.charCodeAt(this.start) === CharCode.lessThan) {
						if (this.input.charCodeAt(this.start + 1) === CharCode.slash) {
							while (this.curContext() === tstc.tc_expr) {
								this.context.pop();
							}
						} else {
							let native_depth = 0;
							for (const node of this.#path) {
								if (this.#isNativeTemplateNode(node)) native_depth++;
							}
							let tc_expr_depth = 0;
							for (const context of this.context) {
								if (context === tstc.tc_expr) tc_expr_depth++;
							}
							while (tc_expr_depth > native_depth && this.curContext() === tstc.tc_expr) {
								this.context.pop();
								tc_expr_depth--;
							}
						}
						this.pos = this.start;
						this.exprAllowed = true;
						this.next();
						this.parseTemplateBody(body);
						return;
					}
					const text = this.#parseTemplateRawText();
					if (this.#shouldKeepTemplateTextNode(text)) {
						body.push(text);
					}
				} else if (this.#isJSXControlFlowDirectiveStart()) {
					const directive = this.#parseJSXControlFlowExpression();
					body.push(directive);
					// `#parseTemplateControlFlowBlock` reads the token after the block's
					// closing `}` in a code (b_stat) context, which runs `skipSpace()` and
					// advances `start` past any whitespace. The following token is therefore a
					// JS token (e.g. the `else` keyword), and when it is actually sibling
					// template raw text it reaches `#parseTemplateRawText` having lost the
					// space(s) between `}` and the text (e.g. `@if (x) { … } else` -> the text
					// "else" instead of " else"). JSX text after a plain element keeps that
					// whitespace, so when raw text follows and only whitespace was skipped,
					// rewind `start` to the block's end to re-include the dropped whitespace.
					const blockEnd = directive.end;
					const nextCh = this.input.charCodeAt(this.start);
					const startsRawText =
						this.type !== tt.eof &&
						nextCh !== CharCode.lessThan &&
						nextCh !== CharCode.openBrace &&
						nextCh !== CharCode.closeBrace &&
						!this.#isJSXControlFlowDirectiveStart();
					if (
						startsRawText &&
						typeof blockEnd === 'number' &&
						this.start > blockEnd &&
						/^\s*$/.test(this.input.slice(blockEnd, this.start))
					) {
						const loc = acorn.getLineInfo(this.input, blockEnd);
						this.pos = blockEnd;
						this.start = blockEnd;
						this.startLoc = new acorn.Position(loc.line, loc.column);
					}
				} else if (this.type === tt.braceR) {
					// Leaving a native template body. We may still be in TSX/JSX tokenization
					// context (e.g. after parsing markup), but the closing `}` is a JS token.
					// If we don't reset this here, the following `next()` can read EOF using
					// `jsx_readToken()` and throw "Unterminated JSX contents".
					while (this.curContext() === tstc.tc_expr) {
						this.context.pop();
					}
					return;
				} else if (this.type === tstt.jsxTagStart) {
					const startPos = this.start;
					const startLoc = this.startLoc;
					this.next();
					if (this.value === '/' || this.type === tt.slash) {
						// Consume '/'
						this.next();

						const closingNode = this.startNodeAt(startPos, startLoc);
						const inside_parent_template =
							this.#jsxExpressionContainerDepth === 0 &&
							this.#templateScriptParsingDepth === 0 &&
							this.#path.slice(0, -1).some((node) => this.#isNativeTemplateNode(node));
						this.#closingNativeTemplateNode = true;
						/** @type {ReturnType<Parse.Parser['jsx_parseElementName']>} */
						let closingName;
						try {
							closingName = this.jsx_parseElementName();
						} finally {
							this.#closingNativeTemplateNode = false;
						}
						if (closingName) {
							/** @type {ESTreeJSX.JSXClosingElement} */ (closingNode).name =
								/** @type {ESTreeJSX.JSXIdentifier} */ (closingName);
						}
						const current = /** @type {ESTreeJSX.JSXFragment | ESTreeJSX.JSXElement} */ (
							this.#path[this.#path.length - 1]
						);
						const current_name = this.#isNativeTemplateNode(current)
							? current.type === 'JSXFragment'
								? ''
								: current.openingElement?.name
									? this.getElementName(current.openingElement.name)
									: null
							: null;
						const closing_name_str = !closingName
							? ''
							: closingName.type === 'JSXNamespacedName'
								? closingName.namespace.name + ':' + closingName.name.name
								: this.getElementName(closingName);
						if (!(inside_parent_template && current_name === closing_name_str)) {
							this.#closingNativeTemplateNode = true;
						}
						this.expect(tstt.jsxTagEnd);
						this.#closingNativeTemplateNode = false;
						const closingElement =
							/** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
								this.finishNode(
									closingNode,
									closingName ? 'JSXClosingElement' : 'JSXClosingFragment',
								)
							);
						if (this.#isDynamicJSXElementName(closingElement.name)) {
							/** @type {any} */ (closingElement).isDynamic = true;
						}
						this.exprAllowed = false;

						// Validate that the closing tag matches the opening tag
						const currentElement = /** @type {any} */ (this.#path[this.#path.length - 1]);
						if (!this.#isNativeTemplateNode(currentElement)) {
							this.raise(this.start, 'Unexpected closing tag');
						}

						/** @type {string | null} */
						let openingTagName;
						/** @type {string | null} */
						let closingTagName;

						if (currentElement.type === 'JSXFragment') {
							openingTagName = '';
							closingTagName = !closingElement.name
								? ''
								: closingElement.name.type === 'JSXNamespacedName'
									? closingElement.name.namespace.name + ':' + closingElement.name.name.name
									: this.getElementName(closingElement.name);
						} else {
							openingTagName = currentElement.openingElement?.name
								? this.getElementName(currentElement.openingElement.name)
								: null;
							closingTagName = closingElement.name
								? closingElement.name?.type === 'JSXNamespacedName'
									? closingElement.name.namespace.name + ':' + closingElement.name.name.name
									: this.getElementName(closingElement.name)
								: null;
						}

						if (openingTagName !== closingTagName) {
							// A closing tag that matches no open element on the path is not a
							// mismatch we can recover from by marking ancestors unclosed — it is
							// simply an unexpected closing tag (e.g. `<div></span>`).
							const normalized_closing_name = closingTagName ?? '';
							const matches_open_element = this.#path.some((node) => {
								const elem = /** @type {any} */ (node);
								if (!this.#isNativeTemplateNode(elem)) return false;
								const elemName =
									elem.type === 'JSXFragment'
										? ''
										: elem.openingElement?.name
											? this.getElementName(elem.openingElement.name)
											: null;
								return elemName === normalized_closing_name;
							});
							if (!matches_open_element && this.#collect) {
								this.raise(closingElement.start, 'Unexpected closing tag');
							}
							// this will throw if not collecting errors
							this.#report_broken_markup_error(
								closingElement.start,
								`Expected closing tag to match opening tag. Expected '</${openingTagName}>' but found '</${closingTagName}>'`,
								DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG,
							);
							// Loop through all unclosed elements on the stack
							while (this.#path.length > 0) {
								const elem = /** @type {any} */ (this.#path[this.#path.length - 1]);

								// Stop at non-template boundaries.
								if (!this.#isNativeTemplateNode(elem)) {
									break;
								}

								const elemName =
									elem.type === 'JSXFragment'
										? ''
										: elem.openingElement?.name
											? this.getElementName(elem.openingElement.name)
											: null;

								// Found matching opening tag
								if (elemName === closingTagName) {
									break;
								}

								// Mark as unclosed and adjust location
								elem.unclosed = true;
								/** @type {AST.NodeWithLocation} */ (elem).loc.end = {
									.../** @type {AST.SourceLocation} */ (
										elem.type === 'JSXFragment' ? elem.openingFragment.loc : elem.openingElement.loc
									).end,
								};
								elem.end =
									elem.type === 'JSXFragment' ? elem.openingFragment.end : elem.openingElement.end;

								this.#path.pop(); // Remove from stack
							}
						}

						const elementToClose = /** @type {any} */ (this.#path[this.#path.length - 1]);
						if (this.#isNativeTemplateNode(elementToClose)) {
							const elementToCloseName =
								elementToClose.type === 'JSXFragment'
									? ''
									: elementToClose.openingElement?.name
										? this.getElementName(elementToClose.openingElement.name)
										: null;
							if (elementToCloseName === closingTagName) {
								if (elementToClose.type === 'JSXFragment') {
									elementToClose.closingFragment = this.#toClosingFragment(closingElement);
								} else {
									elementToClose.closingElement = closingElement;
								}
							}
						}

						this.#path.pop();
						this.#skipTrailingLayoutWhitespace();
						return;
					}
					const node = this.parseElement();
					if (node !== null) {
						body.push(node);
					}
				} else if (this.type === tt.eof) {
					return;
				} else {
					const text = this.#parseTemplateRawText();
					if (this.#shouldKeepTemplateTextNode(text)) {
						body.push(text);
					}
				}

				this.parseTemplateBody(body);
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
				if (
					context !== 'for' &&
					context !== 'if' &&
					this.#functionBodyDepth === 0 &&
					this.context.at(-1) === b_stat &&
					this.type === tt.braceL &&
					this.context.some((c) => c === tstc.tc_expr)
				) {
					return /** @type {ESTreeJSX.JSXExpressionContainer} */ (
						this.#parseNativeTemplateExpressionContainer()
					);
				}

				if (this.type === tstt.jsxTagStart) {
					if (this.#forceScriptJSXElementDepth > 0) {
						return /** @type {AST.Statement} */ (
							/** @type {unknown} */ (super.parseStatement(context, topLevel, exports))
						);
					}

					this.next();
					if (this.value === '/') this.unexpected();
					const node = this.parseElement();

					if (!node) {
						this.unexpected();
					}
					if (
						this.#functionBodyDepth > 0 &&
						node.type === 'JSXFragment' &&
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
					return node;
				}

				if (
					this.input.charCodeAt(this.start) === CharCode.at &&
					(this.#isCodeBlockStart(this.start) || this.#isJSXControlFlowDirectiveStart())
				) {
					const node = /** @type {AST.ExpressionStatement} */ (this.startNode());
					node.expression = /** @type {AST.Expression} */ (this.parseExpression());
					this.semicolon();
					return /** @type {AST.ExpressionStatement} */ (
						this.finishNode(node, 'ExpressionStatement')
					);
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

				if (this.#isNativeTemplateNode(parent) && this.#templateControlFlowBlockDepth > 0) {
					this.#templateControlFlowBlockDepth--;
					try {
						return this.#parseTemplateControlFlowBlock(createNewLexicalScope, node, exitStrict);
					} finally {
						this.#templateControlFlowBlockDepth++;
					}
				}

				if (this.#functionBodyDepth > 0 && this.#isNativeTemplateNode(parent)) {
					let pushed_statement_context = false;
					if (this.curContext() !== b_stat) {
						this.context.push(b_stat);
						pushed_statement_context = true;
					}
					try {
						return super.parseBlock(createNewLexicalScope, node, exitStrict);
					} finally {
						if (pushed_statement_context && this.curContext() === b_stat) {
							this.context.pop();
						}
					}
				}

				return super.parseBlock(createNewLexicalScope, node, exitStrict);
			}
		}

		return /** @type {Parse.ParserConstructor} */ (TSRXParser);
	};
}
