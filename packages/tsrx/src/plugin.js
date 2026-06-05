/**
@import * as AST from 'estree'
@import * as ESTreeJSX from 'estree-jsx'
@import { Parse } from '@tsrx/core/types'
 */

import * as acorn from 'acorn';
import {
	skipWhitespace,
	isWhitespaceTextNode,
	BINDING_TYPES,
	DestructuringErrors,
} from './parse/index.js';
import { parse_style } from './parse/style.js';
import { regex_newline_characters } from './utils/patterns.js';
import { error } from './errors.js';
import { DIAGNOSTIC_CODES } from './diagnostics.js';
import { TSRX_RETURN_STATEMENT_ERROR } from './analyze/validation.js';
const DYNAMIC_ATTRIBUTE_NAME_ERROR =
	'Dynamic component / element syntax (`@`) is only supported on native TSRX element names, not attribute names.';

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

/**
 * Keywords after which a `/` begins a regex literal rather than division, used
 * by the look-ahead scanners to track expression position in script content.
 */
const REGEX_PRECEDING_KEYWORDS = new Set([
	'return',
	'typeof',
	'instanceof',
	'in',
	'of',
	'new',
	'delete',
	'void',
	'do',
	'else',
	'yield',
	'await',
	'case',
	'throw',
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
			#scriptJSXElementDepth = 0;
			#forceScriptJSXElementDepth = 0;
			#suppressTemplateRawTextToken = false;
			#parsingJSXSwitchCaseScriptStatementDepth = 0;
			#templateControlFlowBlockDepth = 0;
			#templateControlFlowTryDepth = 0;
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
				const tsrx_options = options?.tsrxOptions ?? options?.rippleOptions;
				this.#collect = tsrx_options?.collect === true || tsrx_options?.loose === true;
				this.#loose = tsrx_options?.loose === true;
				this.#errors = tsrx_options?.errors;
				this.#filename = tsrx_options?.filename || null;
			}

			#resetTokenStartToCurrentPosition() {
				if (this.start !== this.pos) {
					this.start = this.pos;
					this.startLoc = this.curPosition();
				}
			}

			#previousNonWhitespaceChar() {
				let index = this.pos - 1;
				while (index >= 0) {
					const ch = this.input.charCodeAt(index);
					if (
						ch !== CharCode.space &&
						ch !== CharCode.tab &&
						ch !== CharCode.lineFeed &&
						ch !== CharCode.carriageReturn
					) {
						return ch;
					}
					index--;
				}
				return null;
			}

			/**
			 * Native TSRX template bodies share one grammar across elements and fragments.
			 * This helper keeps the parser-state setup in one place while callers keep
			 * ownership of their distinct closing delimiter handling (`}` vs `</tag>`).
			 *
			 * @param {AST.Node} node
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
				const body_start = this.start + 1;
				node.body = [];
				node.metadata = {
					...node.metadata,
					path: [],
					native_tsrx_template_block: true,
					templateMode: 'script',
					hasTemplateFenceAhead: this.#hasTemplateFenceBeforeBlockClose(body_start),
				};

				this.expect(tt.braceL);
				this.#parseNativeTemplateBody(node, node.body, {
					enterScope: createNewLexicalScope,
					pushPath: true,
				});

				if (exitStrict) {
					this.strict = false;
				}
				this.exprAllowed = true;
				if (
					node.body.length > 0 &&
					!node.metadata.hasTemplateFence &&
					!this.#hasTemplateOutput(node.body)
				) {
					this.raise(
						/** @type {AST.NodeWithLocation} */ (node).end ?? this.start,
						'Template control flow blocks with only script statements must end with `---`.',
					);
				}
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

			/**
			 * @param {any} name
			 */
			#isDynamicJSXElementName(name) {
				if (!name || typeof name !== 'object') return false;
				if (name.dynamic === true) return true;
				return name.type === 'JSXMemberExpression' && this.#isDynamicJSXElementName(name.object);
			}

			#isInsideNativeTemplateScriptSection() {
				const node = this.#currentNativeTemplateNode();
				return !!node && node.metadata?.templateMode !== 'template';
			}

			#isStyleOpeningTagStart() {
				let index = this.start + 1;
				if (this.input.charCodeAt(index) === CharCode.slash) return false;
				if (this.input.slice(index, index + 'style'.length) !== 'style') return false;

				const after = this.input.charCodeAt(index + 'style'.length);
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
			 * `---` only starts a template-output section from parser statement
			 * position. Strings, comments, regexes, and nested JS/JSX are already
			 * consumed by Acorn before this check runs.
			 */
			#templateFenceStart() {
				let index = this.start;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (ch !== CharCode.space && ch !== CharCode.tab) break;
					index++;
				}

				if (!this.#isLineStartPosition(index)) return -1;
				if (
					this.input.charCodeAt(index) !== CharCode.dash ||
					this.input.charCodeAt(index + 1) !== CharCode.dash ||
					this.input.charCodeAt(index + 2) !== CharCode.dash
				) {
					return -1;
				}

				const after = this.input.charCodeAt(index + 3);
				if (
					after !== CharCode.lineFeed &&
					after !== CharCode.carriageReturn &&
					after !== CharCode.space &&
					after !== CharCode.tab &&
					!Number.isNaN(after)
				) {
					return -1;
				}

				return index;
			}

			#hasTemplateFenceAtIndex(index) {
				let cursor = index;
				while (cursor < this.input.length) {
					const ch = this.input.charCodeAt(cursor);
					if (ch !== CharCode.space && ch !== CharCode.tab) break;
					cursor++;
				}

				if (!this.#isLineStartPosition(cursor)) return false;
				if (
					this.input.charCodeAt(cursor) !== CharCode.dash ||
					this.input.charCodeAt(cursor + 1) !== CharCode.dash ||
					this.input.charCodeAt(cursor + 2) !== CharCode.dash
				) {
					return false;
				}

				const after = this.input.charCodeAt(cursor + 3);
				return (
					after === CharCode.lineFeed ||
					after === CharCode.carriageReturn ||
					after === CharCode.space ||
					after === CharCode.tab ||
					Number.isNaN(after)
				);
			}

			#hasTemplateFenceBeforeBlockClose(index) {
				let depth = 0;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					const next = this.input.charCodeAt(index + 1);

					if (ch === CharCode.singleQuote || ch === CharCode.doubleQuote) {
						const quote = ch;
						index++;
						while (index < this.input.length) {
							const current = this.input.charCodeAt(index);
							if (
								current === CharCode.backslash &&
								this.input.charCodeAt(index - 1) !== CharCode.backslash
							) {
								index += 2;
								continue;
							}
							if (current === quote) {
								index++;
								break;
							}
							index++;
						}
						continue;
					}

					if (ch === CharCode.backtick) {
						index++;
						while (index < this.input.length) {
							const current = this.input.charCodeAt(index);
							if (
								current === CharCode.backslash &&
								this.input.charCodeAt(index - 1) !== CharCode.backslash
							) {
								index += 2;
								continue;
							}
							if (current === CharCode.backtick) {
								index++;
								break;
							}
							index++;
						}
						continue;
					}

					if (ch === CharCode.slash && next === CharCode.slash) {
						index += 2;
						while (
							index < this.input.length &&
							this.input.charCodeAt(index) !== CharCode.lineFeed &&
							this.input.charCodeAt(index) !== CharCode.carriageReturn
						) {
							index++;
						}
						continue;
					}

					if (ch === CharCode.slash && next === CharCode.asterisk) {
						index += 2;
						while (index < this.input.length) {
							if (
								this.input.charCodeAt(index) === CharCode.asterisk &&
								this.input.charCodeAt(index + 1) === CharCode.slash
							) {
								index += 2;
								break;
							}
							index++;
						}
						continue;
					}

					if (depth === 0 && this.#hasTemplateFenceAtIndex(index)) {
						return true;
					}

					if (ch === CharCode.openBrace) {
						depth++;
					} else if (ch === CharCode.closeBrace) {
						if (depth === 0) return false;
						depth--;
					}
					index++;
				}
				return false;
			}

			/**
			 * JSX element bodies also start in script mode, but text tokenization sees the
			 * whole child run before we get to parse individual statements. Look ahead
			 * for a local fence so `<div> const x = ... --- <span /> </div>` keeps the
			 * setup code as script without letting strings such as "</div>" close the
			 * scan early.
			 * @param {number} index
			 * @param {AST.Node} node
			 */
			#hasTemplateFenceBeforeElementClose(index, node) {
				const element_name =
					node.type === 'JSXFragment'
						? ''
						: node.type === 'JSXElement' || node.type === 'JSXStyleElement'
							? this.getElementName(node.openingElement?.name)
							: null;
				if (element_name === null) return false;

				/** @type {string[]} */
				const tag_stack = [];
				// Tracks whether a `/` here would begin a regex literal (expression
				// position) rather than division, so markup-looking text inside a script
				// regex such as `/<span>/` is skipped instead of parsed as a tag.
				let expr_allowed = true;

				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					const next = this.input.charCodeAt(index + 1);

					if (ch === CharCode.singleQuote || ch === CharCode.doubleQuote) {
						const quote = ch;
						index++;
						while (index < this.input.length) {
							const current = this.input.charCodeAt(index);
							if (
								current === CharCode.backslash &&
								this.input.charCodeAt(index - 1) !== CharCode.backslash
							) {
								index += 2;
								continue;
							}
							if (current === quote) {
								index++;
								break;
							}
							index++;
						}
						expr_allowed = false;
						continue;
					}

					if (ch === CharCode.backtick) {
						index++;
						while (index < this.input.length) {
							const current = this.input.charCodeAt(index);
							if (
								current === CharCode.backslash &&
								this.input.charCodeAt(index - 1) !== CharCode.backslash
							) {
								index += 2;
								continue;
							}
							if (current === CharCode.backtick) {
								index++;
								break;
							}
							index++;
						}
						expr_allowed = false;
						continue;
					}

					if (ch === CharCode.slash && next === CharCode.slash) {
						index += 2;
						while (
							index < this.input.length &&
							this.input.charCodeAt(index) !== CharCode.lineFeed &&
							this.input.charCodeAt(index) !== CharCode.carriageReturn
						) {
							index++;
						}
						continue;
					}

					if (ch === CharCode.slash && next === CharCode.asterisk) {
						index += 2;
						while (index < this.input.length) {
							if (
								this.input.charCodeAt(index) === CharCode.asterisk &&
								this.input.charCodeAt(index + 1) === CharCode.slash
							) {
								index += 2;
								break;
							}
							index++;
						}
						continue;
					}

					if (ch === CharCode.slash) {
						// A `/` in expression position opens a regex literal; skip its body so
						// any `<tag>`, `</tag>`, or `---` inside it is not read as markup.
						if (expr_allowed) {
							const regex_end = this.#scanRegexLiteralEnd(index);
							if (regex_end !== -1) {
								index = regex_end;
								expr_allowed = false;
								continue;
							}
						}
						expr_allowed = true;
						index++;
						continue;
					}

					if (tag_stack.length === 0 && this.#hasTemplateFenceAtIndex(index)) {
						return true;
					}

					if (ch === CharCode.lessThan) {
						// In expression position `<value> /…/` is a less-than comparison
						// against a regex literal, not a closing tag: `3</div>/` means
						// `3 < /div>/`. Only reinterpret when a value precedes the `<` (so it
						// is an operator) and a valid single-line regex actually follows;
						// `5</div>` (no second `/`) still reads as a closing tag.
						if (next === CharCode.slash && !expr_allowed) {
							const regex_end = this.#scanRegexLiteralEnd(index + 1);
							if (regex_end !== -1) {
								index = regex_end;
								expr_allowed = false;
								continue;
							}
						}

						// A closing tag (`</tag>`) always follows `<` with `/`; only a
						// generic arrow (`<T>() => ...`) or type argument list (`foo<T>`)
						// should be skipped here. Without the `/` guard, text like
						// `hello</b>` looks like `o<...>` and the closing tag is swallowed,
						// leaving the stack unbalanced so a later `---` fence is missed.
						if (
							next !== CharCode.slash &&
							(looks_like_generic_arrow(this.input, index) ||
								this.#canPrecedeTypeArgumentList(this.input.charCodeAt(index - 1)))
						) {
							const type_end = scan_balanced_from(
								this.input,
								index,
								CharCode.lessThan,
								CharCode.greaterThan,
							);
							if (type_end !== -1) {
								index = type_end;
								expr_allowed = false;
								continue;
							}
						}

						if (next === CharCode.slash) {
							let name_start = index + 2;
							while (
								this.input.charCodeAt(name_start) === CharCode.space ||
								this.input.charCodeAt(name_start) === CharCode.tab
							) {
								name_start++;
							}
							if (this.input.charCodeAt(name_start) === CharCode.at) {
								name_start++;
							}
							let name_end = name_start;
							while (this.#isIdentifierChar(this.input.charCodeAt(name_end))) {
								name_end++;
							}
							const close_name = this.input.slice(name_start, name_end);
							const top = tag_stack[tag_stack.length - 1];
							if (top !== undefined && top === close_name) {
								tag_stack.pop();
								index = name_end;
								expr_allowed = false;
								continue;
							}
							if (tag_stack.length === 0 && close_name === element_name) {
								return false;
							}
						} else if (
							next === CharCode.greaterThan ||
							this.#isIdentifierChar(next) ||
							next === CharCode.at
						) {
							let cursor = index + 1;
							let open_name = '';
							if (next === CharCode.greaterThan) {
								open_name = '';
								cursor++;
							} else {
								if (next === CharCode.at) cursor++;
								const name_start = cursor;
								while (this.#isIdentifierChar(this.input.charCodeAt(cursor))) {
									cursor++;
								}
								open_name = this.input.slice(name_start, cursor);
							}

							let self_closing = false;
							let quote = 0;
							while (cursor < this.input.length) {
								const current = this.input.charCodeAt(cursor);
								if (quote !== 0) {
									if (
										current === CharCode.backslash &&
										this.input.charCodeAt(cursor - 1) !== CharCode.backslash
									) {
										cursor += 2;
										continue;
									}
									if (current === quote) quote = 0;
									cursor++;
									continue;
								}
								if (current === CharCode.singleQuote || current === CharCode.doubleQuote) {
									quote = current;
									cursor++;
									continue;
								}
								if (current === CharCode.greaterThan) {
									self_closing = this.input.charCodeAt(cursor - 1) === CharCode.slash;
									break;
								}
								cursor++;
							}
							if (!self_closing) {
								tag_stack.push(open_name);
							}
							index = cursor + 1;
							expr_allowed = !self_closing;
							continue;
						}
					}

					if (this.#isIdentifierChar(ch) && !(ch >= CharCode.digit0 && ch <= CharCode.digit9)) {
						const word_start = index;
						index++;
						while (this.#isIdentifierChar(this.input.charCodeAt(index))) {
							index++;
						}
						expr_allowed = REGEX_PRECEDING_KEYWORDS.has(this.input.slice(word_start, index));
						continue;
					}

					if (ch >= CharCode.digit0 && ch <= CharCode.digit9) {
						index++;
						while (
							index < this.input.length &&
							this.#isIdentifierChar(this.input.charCodeAt(index))
						) {
							index++;
						}
						expr_allowed = false;
						continue;
					}

					expr_allowed = this.#nextExprAllowed(expr_allowed, ch);
					index++;
				}
				return false;
			}

			#parseTemplateFence() {
				const start = this.#templateFenceStart();
				if (start === -1) {
					this.unexpected();
				}

				const startLoc = acorn.getLineInfo(this.input, start);
				const end = start + 3;
				const endLoc = acorn.getLineInfo(this.input, end);
				const node = /** @type {AST.TsrxTemplateFence} */ (this.startNodeAt(start, startLoc));
				node.value = '---';
				node.metadata = { path: [] };

				this.pos = end;
				this.curLine = endLoc.line;
				this.lineStart = end - endLoc.column;
				this.next();

				return this.finishNodeAt(node, 'TsrxTemplateFence', end, endLoc);
			}

			/**
			 * @param {string} value
			 */
			#jsxTextContainsTemplateFence(value) {
				let index = 0;
				while (index < value.length) {
					const line_start = index;
					while (
						index < value.length &&
						(value.charCodeAt(index) === CharCode.space || value.charCodeAt(index) === CharCode.tab)
					) {
						index++;
					}
					if (
						value.charCodeAt(index) === CharCode.dash &&
						value.charCodeAt(index + 1) === CharCode.dash &&
						value.charCodeAt(index + 2) === CharCode.dash
					) {
						const after = value.charCodeAt(index + 3);
						if (
							after === CharCode.lineFeed ||
							after === CharCode.carriageReturn ||
							after === CharCode.space ||
							after === CharCode.tab ||
							Number.isNaN(after)
						) {
							return true;
						}
					}
					while (
						index < value.length &&
						value.charCodeAt(index) !== CharCode.lineFeed &&
						value.charCodeAt(index) !== CharCode.carriageReturn
					) {
						index++;
					}
					if (index === line_start) index++;
					if (value.charCodeAt(index) === CharCode.carriageReturn) index++;
					if (value.charCodeAt(index) === CharCode.lineFeed) index++;
				}
				return false;
			}

			#parseTemplateRawText() {
				const start = this.start;
				let index = start;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (ch === CharCode.lessThan || ch === CharCode.openBrace || ch === CharCode.closeBrace) {
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
				this.next();

				return this.finishNodeAt(node, 'JSXText', index, endLoc);
			}

			/**
			 * Native template elements start in script mode so component children can
			 * define local setup before `---`. If the body only contains template
			 * output so far, an `@if`/`@for`/`@switch`/`@try` continues that template
			 * output instead of requiring a redundant fence inside every nested tag.
			 * @param {AST.Node[]} body
			 */
			#canImplicitlyEnterTemplateOutput(body) {
				return body.every((node) => {
					switch (node.type) {
						case 'JSXElement':
						case 'JSXFragment':
						case 'JSXStyleElement':
						case 'JSXText':
						case 'JSXExpressionContainer':
						case 'JSXIfExpression':
						case 'JSXForExpression':
						case 'JSXSwitchExpression':
						case 'JSXTryExpression':
							return true;
					}
					return false;
				});
			}

			#isImplicitTemplateRawTextStart() {
				if (
					this.type === tt.braceL ||
					this.type === tt.braceR ||
					this.type === tt.eof ||
					this.type === tstt.jsxTagStart
				) {
					return false;
				}

				return !this.#isJSXControlFlowDirectiveStart();
			}

			#isSwitchCaseScriptStatementStart() {
				let index = skip_whitespace_from(this.input, this.start);

				const first = this.input.charCodeAt(index);
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

			#switchCaseLabelStart() {
				let index = this.start;
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

			#hasTemplateOutput(nodes) {
				return nodes.some((node) => {
					if (!node || node.type === 'TsrxTemplateFence') return false;
					if (node.type === 'JSXText') return !isWhitespaceTextNode(node);
					return (
						node.type === 'JSXElement' ||
						node.type === 'JSXFragment' ||
						node.type === 'JSXStyleElement' ||
						node.type === 'JSXExpressionContainer' ||
						node.type === 'JSXIfExpression' ||
						node.type === 'JSXForExpression' ||
						node.type === 'JSXSwitchExpression' ||
						node.type === 'JSXTryExpression'
					);
				});
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

				if (
					this.input.slice(wordStart, wordStart + 4) === 'case' &&
					!this.#isIdentifierChar(this.input.charCodeAt(wordStart + 4))
				) {
					return index;
				}

				if (
					this.input.slice(wordStart, wordStart + 7) === 'default' &&
					!this.#isIdentifierChar(this.input.charCodeAt(wordStart + 7))
				) {
					return index;
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

			#canPrecedeTypeArgumentList(ch) {
				return this.#isIdentifierChar(ch) || ch === CharCode.closeParen;
			}

			/**
			 * Scan a regex literal whose opening `/` is at `index`. Returns the index
			 * just past the closing `/` and any flags, or -1 if it is not a valid
			 * single-line regex literal (e.g. it runs into a newline first). Used by the
			 * look-ahead fence scanners so that markup-looking text inside a script regex
			 * (`/<span>/`, `/---/`) is not mistaken for real template syntax.
			 * @param {number} index
			 */
			#scanRegexLiteralEnd(index) {
				let i = index + 1;
				let in_class = false;
				while (i < this.input.length) {
					const ch = this.input.charCodeAt(i);
					if (ch === CharCode.lineFeed || ch === CharCode.carriageReturn) return -1;
					if (ch === CharCode.backslash) {
						i += 2;
						continue;
					}
					if (ch === CharCode.openBracket) {
						in_class = true;
					} else if (ch === CharCode.closeBracket) {
						in_class = false;
					} else if (ch === CharCode.slash && !in_class) {
						i++;
						while (i < this.input.length && this.#isIdentifierChar(this.input.charCodeAt(i))) {
							i++;
						}
						return i;
					}
					i++;
				}
				return -1;
			}

			/**
			 * Advance the expression-position flag used by the fence scanners after the
			 * character (or token) at `index` has been consumed. `expr_allowed` is true
			 * when a following `/` would begin a regex literal rather than division. The
			 * scanners only need a coarse approximation: values close expression position,
			 * operators and most punctuation reopen it.
			 * @param {boolean} expr_allowed
			 * @param {number} ch
			 * @returns {boolean}
			 */
			#nextExprAllowed(expr_allowed, ch) {
				if (
					ch === CharCode.space ||
					ch === CharCode.tab ||
					ch === CharCode.lineFeed ||
					ch === CharCode.carriageReturn
				) {
					return expr_allowed;
				}
				if (
					ch === CharCode.closeParen ||
					ch === CharCode.closeBracket ||
					ch === CharCode.closeBrace
				) {
					return false;
				}
				return true;
			}

			#parseJSXSwitchCaseRawText() {
				const start = this.start;
				let index = start;
				while (index < this.input.length) {
					const boundary = this.#switchCaseBoundaryStart(index);
					if (boundary !== -1) {
						index = boundary;
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
				this.next();

				return this.finishNodeAt(node, 'JSXText', index, endLoc);
			}

			#shouldReadTemplateRawTextToken() {
				if (
					this.#closingNativeTemplateNode ||
					this.#readingJSXControlFlowDirectiveKeyword ||
					this.#readingJSXControlFlowHeader ||
					this.#parsingJSXSwitchCaseScriptStatementDepth > 0 ||
					this.#jsxExpressionContainerDepth > 0
				) {
					return false;
				}
				const current_context_token = this.curContext()?.token;
				if (current_context_token === '<tag' || current_context_token === '</tag') {
					return false;
				}
				const current_template_node = this.#currentNativeTemplateNode();
				if (!current_template_node || this.#isJSXControlFlowDirectiveAt(this.pos)) {
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
				const opening = this.#openingNativeTemplateNode;
				if (
					opening &&
					current_template_node === opening &&
					/** @type {any} */ (opening).openingElement?.selfClosing &&
					this.input.charCodeAt(this.pos - 1) === CharCode.greaterThan &&
					this.input.charCodeAt(this.pos - 2) === CharCode.slash
				) {
					const enclosing = this.#path.findLast(
						(node) => node !== opening && this.#isNativeTemplateNode(node),
					);
					if (!enclosing) {
						return false;
					}
					return (
						enclosing.metadata?.templateMode === 'template' ||
						!this.#hasTemplateFenceBeforeElementClose(this.pos, enclosing)
					);
				}
				return (
					current_template_node.metadata?.templateMode === 'template' ||
					!this.#hasTemplateFenceBeforeElementClose(this.pos, current_template_node)
				);
			}

			#readTemplateRawTextToken() {
				const start = this.pos;
				let index = start;
				while (index < this.input.length) {
					const ch = this.input.charCodeAt(index);
					if (ch === CharCode.lessThan || ch === CharCode.openBrace || ch === CharCode.closeBrace) {
						break;
					}
					index++;
				}

				const endLoc = acorn.getLineInfo(this.input, index);
				const value = this.input.slice(start, index);
				if (value.match(regex_newline_characters)) {
					this.curLine = endLoc.line;
					this.lineStart = index - endLoc.column;
				}
				this.pos = index;
				return this.finishToken(tstt.jsxText, value);
			}

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

			#parseJSXControlFlowExpression() {
				const start = this.start;
				const startLoc = this.startLoc;
				const keywordStart = start + 1;
				this.pos = keywordStart;
				this.start = keywordStart;
				this.startLoc = acorn.getLineInfo(this.input, keywordStart);
				this.#readingJSXControlFlowDirectiveKeyword = true;
				try {
					this.nextToken();
				} finally {
					this.#readingJSXControlFlowDirectiveKeyword = false;
				}

				const label = this.type.keyword || this.type.label;
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

			#parseTemplateControlFlowStatement() {
				if (this.type === tt.braceL) {
					return this.#parseTemplateControlFlowBlock();
				}
				return this.parseStatement(null);
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
				node.consequent = this.#parseTemplateControlFlowStatement();
				node.alternate = null;

				if (this.type === tt._else) {
					const previous_reading_header = this.#readingJSXControlFlowHeader;
					this.#readingJSXControlFlowHeader = true;
					try {
						this.next();
					} finally {
						this.#readingJSXControlFlowHeader = previous_reading_header;
					}
					const label = this.type.keyword || this.type.label;
					node.alternate =
						label === 'if'
							? this.#parseTemplateIfStatement()
							: this.#parseTemplateControlFlowStatement();
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

				/** @type {AST.SwitchCase | undefined} */
				let current;
				let sawDefault = false;
				while (this.type !== tt.braceR) {
					if (this.type === tstt.jsxText && this.#rewindToSwitchCaseLabel()) {
						continue;
					}

					if (this.type === tt._case || this.type === tt._default) {
						const isCase = this.type === tt._case;
						if (current) {
							this.finishNode(current, 'SwitchCase');
						}
						current = /** @type {AST.SwitchCase} */ (this.startNode());
						current.consequent = [];
						node.cases.push(current);
						const previous_reading_header = this.#readingJSXControlFlowHeader;
						this.#readingJSXControlFlowHeader = true;
						try {
							this.next();
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
						continue;
					}

					if (!current) {
						this.unexpected();
					}
					this.#parseJSXSwitchCaseConsequent(current.consequent);
				}

				this.exitScope();
				if (current) {
					this.finishNode(current, 'SwitchCase');
				}
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
			 */
			#parseJSXSwitchCaseConsequent(consequent) {
				if (this.type === tt.braceL) {
					consequent.push(this.#parseNativeTemplateExpressionContainer());
					return;
				}

				if (this.type === tstt.jsxText && this.#isSwitchCaseScriptStatementStart()) {
					this.context = this.context.filter(
						(context) =>
							context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag,
					);
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
					consequent.push(/** @type {any} */ (this.#parseJSXSwitchCaseRawText()));
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
					const node = /** @type {AST.BreakStatement} */ (this.startNode());
					this.next();
					node.label = null;
					if (this.type === tstt.jsxText && this.value?.startsWith(';')) {
						const start = this.start;
						const loc = acorn.getLineInfo(this.input, start + 1);
						this.pos = start + 1;
						this.start = start + 1;
						this.startLoc = loc;
						this.curLine = loc.line;
						this.lineStart = start + 1 - loc.column;
						this.exprAllowed = true;
						this.next();
					} else {
						this.semicolon();
					}
					consequent.push(this.finishNode(node, 'BreakStatement'));
					return;
				}
				if (label === 'break' || label === 'continue' || label === 'return' || label === 'throw') {
					consequent.push(this.parseStatement(null));
					return;
				}

				consequent.push(this.#parseJSXSwitchCaseRawText());
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
			 * @param {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} open
			 * @param {AST.JSXStyleElement} node
			 * @param {boolean} insideHead
			 */
			#parseStyleElement(open, node, insideHead) {
				const contentStart = open.end;
				const input = this.input.slice(contentStart);
				const relativeCloseStart = input.indexOf('</style>');
				const content = relativeCloseStart === -1 ? input : input.slice(0, relativeCloseStart);
				const parsedCss = parse_style(content, { loose: this.#loose });

				if (!insideHead) {
					node.metadata.styleScopeHash = parsedCss.hash;
				}

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
					const nameEnd = nameStart + 'style'.length;
					const nameStartInfo = acorn.getLineInfo(this.input, nameStart);
					const nameEndInfo = acorn.getLineInfo(this.input, nameEnd);
					const name = /** @type {ESTreeJSX.JSXIdentifier} */ (
						this.startNodeAt(
							nameStart,
							new acorn.Position(nameStartInfo.line, nameStartInfo.column),
						)
					);
					name.name = 'style';
					name.tracked = false;
					this.finishNodeAt(
						name,
						'JSXIdentifier',
						nameEnd,
						new acorn.Position(nameEndInfo.line, nameEndInfo.column),
					);
					const closingEnd = closingStart + '</style>'.length;
					const closingEndInfo = acorn.getLineInfo(this.input, closingEnd);
					const closingElement = /** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
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
					this.exprAllowed = false;
					this.pos = closingEnd;
					this.curLine = closingEndInfo.line;
					this.lineStart = closingEnd - closingEndInfo.column;
					this.next();
				} else {
					this.#report_broken_markup_error(
						open.end,
						"Unclosed tag '<style>'. Expected '</style>' before end of template.",
					);
					node.unclosed = true;
				}

				node.css = content;
				node.children = [/** @type {AST.Node} */ (/** @type {unknown} */ (parsedCss))];

				const curContext = this.curContext();
				const parent = this.#path.at(-1);
				const insideTemplate = this.#isNativeTemplateNode(parent);

				if (curContext === tstc.tc_expr && !insideTemplate) {
					this.context.pop();
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
				const ctx = this.context;
				const ci = ctx.length - 1;
				const top = ctx[ci];
				const second = ctx[ci - 1];

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
					(child) => child && !isWhitespaceTextNode(child),
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
				const suppressTemplateRawTextToken = this.#suppressTemplateRawTextToken;
				this.#suppressTemplateRawTextToken = false;
				const context = this.curContext();
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
				if (context === tstc.tc_expr || context === tstc.tc_oTag || context === tstc.tc_cTag) {
					return super.readToken(code);
				}
				if (code === CharCode.lessThan) {
					if (
						this.#canPrecedeTypeArgumentList(this.input.charCodeAt(this.pos - 1)) ||
						looks_like_generic_arrow(this.input, this.pos)
					) {
						++this.pos;
						return this.finishToken(tt.relational, '<');
					}
					const next = this.input.charCodeAt(this.pos + 1);
					const isTagLikeAfterLt =
						next === CharCode.slash ||
						next === CharCode.greaterThan ||
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
				return super.readToken(code);
			}

			/**
			 * Get token from character code - handles Ripple-specific tokens
			 * @type {Parse.Parser['getTokenFromCode']}
			 */
			getTokenFromCode(code) {
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

				if (
					(code === CharCode.numberSign || code === CharCode.slash) &&
					this.#functionBodyDepth === 0 &&
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

						if (
							isIdentifierChar &&
							this.#canPrecedeTypeArgumentList(this.input.charCodeAt(this.pos - 1))
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
				this.#jsxExpressionContainerDepth++;
				try {
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
					this.expect(tt.braceR);
				} finally {
					this.#jsxExpressionContainerDepth--;
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
							id.tracked = false;
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
						if (this.type === tt.ellipsis) {
							this.expect(tt.ellipsis);
						} else {
							this.pos = this.start + 3;
							this.nextToken();
						}
						/** @type {ESTreeJSX.JSXSpreadAttribute} */ (node).argument = this.parseMaybeAssign();
						this.expect(tt.braceR);
						return this.finishNode(node, 'JSXSpreadAttribute');
					} else if (this.lookahead().type === tt.ellipsis) {
						this.expect(tt.ellipsis);
						/** @type {ESTreeJSX.JSXSpreadAttribute} */ (node).argument = this.parseMaybeAssign();
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
						id.tracked = false;
						this.finishNodeAt(id, 'JSXIdentifier', name_end, name_end_loc);
						const name = /** @type {AST.Identifier} */ (
							this.startNodeAt(name_start, name_start_loc)
						);
						name.name = name_value;
						this.finishNodeAt(name, 'Identifier', name_end, name_end_loc);
						const expression = /** @type {ESTreeJSX.JSXExpressionContainer} */ (
							this.startNodeAt(node.start, /** @type {AST.NodeWithLocation} */ (node).loc.start)
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
				if (this.#isDynamicJSXElementName(/** @type {ESTreeJSX.JSXAttribute} */ (node).name)) {
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
						/** @type {any} */ (node).dynamic = true;
						this.next();
					} else {
						// Unexpected token after @
						this.unexpected();
					}
				} else if (this.type === tt.name || this.type.keyword || this.type === tstt.jsxName) {
					node.name = /** @type {string} */ (this.value);
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
			 * @type {Parse.Parser['parseTryStatement']}
			 */
			parseTryStatement(node) {
				if (this.#templateControlFlowTryDepth > 0) {
					this.#templateControlFlowTryDepth--;
					try {
						this.next();
						node.block = this.#parseTemplateControlFlowBlock();
						node.handler = null;

						if (this.value === 'pending') {
							this.next();
							node.pending = this.#parseTemplateControlFlowBlock();
						} else {
							node.pending = null;
						}

						if (this.type === tt._catch) {
							const clause = /** @type {AST.CatchClause} */ (this.startNode());
							const previous_reading_header = this.#readingJSXControlFlowHeader;
							this.#readingJSXControlFlowHeader = true;
							try {
								this.next();
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
							clause.body = this.#parseTemplateControlFlowBlock(false);
							this.exitScope();
							node.handler = this.finishNode(clause, 'CatchClause');
						}
						node.finalizer = this.eat(tt._finally) ? this.#parseTemplateControlFlowBlock() : null;

						if (!node.handler && !node.finalizer && !node.pending) {
							this.raise(
								/** @type {AST.NodeWithLocation} */ (node).start,
								'Missing catch or finally clause',
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
							if (this.#shouldReadTemplateRawTextToken()) {
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
								if (this.#shouldReadTemplateRawTextToken()) {
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
					if (this.#isStyleOpeningTagStart()) {
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
			 * @type {Parse.Parser['jsx_parseElementAt']}
			 */
			jsx_parseElementAt(startPos, startLoc) {
				if (this.input.charCodeAt(startPos + 1) === CharCode.at) {
					const previous_script_jsx_element_depth = this.#scriptJSXElementDepth;
					this.#scriptJSXElementDepth = 0;
					try {
						return /** @type {ESTreeJSX.JSXElement} */ (
							/** @type {unknown} */ (this.parseElement())
						);
					} finally {
						this.#scriptJSXElementDepth = previous_script_jsx_element_depth;
					}
				}

				return super.jsx_parseElementAt(startPos, startLoc);
			}

			/**
			 * @type {Parse.Parser['jsx_parseOpeningElementAt']}
			 */
			jsx_parseOpeningElementAt(startPos, startLoc) {
				const node = /** @type {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} */ (
					this.startNodeAt(startPos, startLoc)
				);
				node.attributes = [];
				const nodeName = this.jsx_parseElementName();
				if (nodeName) node.name = nodeName;
				if (this.#isDynamicJSXElementName(nodeName)) {
					/** @type {any} */ (node).dynamic = true;
				}
				if (this.match(tt.relational) || this.match(tt.bitShift)) {
					const typeArguments = this.tsTryParseAndCatch(() =>
						this.tsParseTypeArgumentsInExpression(),
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
				return this.finishNode(node, nodeName ? 'JSXOpeningElement' : 'JSXOpeningFragment');
			}

			/**
			 * @type {Parse.Parser['parseElement']}
			 */
			parseElement() {
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
				const is_style = tag_name === 'style';
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
					/** @type {ESTreeJSX.JSXFragment} */ (node).closingFragment = null;
				} else {
					if (is_style) {
						/** @type {AST.JSXStyleElement} */ (node).type = 'JSXStyleElement';
						/** @type {AST.JSXStyleElement} */ (node).openingElement = open;
						/** @type {AST.JSXStyleElement} */ (node).closingElement = null;
					} else {
						/** @type {ESTreeJSX.JSXElement} */ (node).type = 'JSXElement';
						/** @type {ESTreeJSX.JSXElement} */ (node).openingElement = open;
						/** @type {ESTreeJSX.JSXElement} */ (node).closingElement = null;
						if (open.dynamic) {
							/** @type {any} */ (node).dynamic = true;
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

					// Ensure we escape JSX <tag></tag> context
					const curContext = this.curContext();
					const parent = this.#path.at(-1);
					const insideTemplate = this.#isNativeTemplateNode(parent);

					if (curContext === tstc.tc_expr && !insideTemplate) {
						this.context.pop();
					}
				}

				this.finishNode(node, node.type);
				return node;
			}

			/**
			 * @type {Parse.Parser['parseTemplateBody']}
			 */
			parseTemplateBody(body) {
				const inside_func =
					this.context.some((n) => n.token === 'function') || this.scopeStack.length > 1;
				const current_template_node = this.#currentNativeTemplateNode();
				if (!current_template_node) return;

				const is_template_output = current_template_node.metadata?.templateMode === 'template';

				if (!is_template_output && this.type === tstt.jsxText) {
					const jsx_text_value = String(this.value ?? '');
					const has_template_fence_ahead = current_template_node.metadata
						?.native_tsrx_template_block
						? current_template_node.metadata?.hasTemplateFenceAhead
						: this.#jsxTextContainsTemplateFence(jsx_text_value) ||
							this.#hasTemplateFenceBeforeElementClose(this.start, current_template_node);
					const should_enter_template_text =
						jsx_text_value.trim() !== '' &&
						!has_template_fence_ahead &&
						this.#canImplicitlyEnterTemplateOutput(body);
					if (should_enter_template_text) {
						current_template_node.metadata ??= { path: [] };
						current_template_node.metadata.templateMode = 'template';
					}
					this.pos = this.start;
					if (!should_enter_template_text) {
						this.context = this.context.filter(
							(context) =>
								context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag,
						);
						this.startLoc = this.curPosition();
						if (this.curContext() !== b_stat) {
							this.context.push(b_stat);
						}
						this.exprAllowed = true;
						this.#suppressTemplateRawTextToken = true;
					}
					this.next();
					this.parseTemplateBody(body);
					return;
				}

				if (!is_template_output && this.#templateFenceStart() !== -1) {
					body.push(this.#parseTemplateFence());
					current_template_node.metadata ??= { path: [] };
					current_template_node.metadata.templateMode = 'template';
					current_template_node.metadata.hasTemplateFence = true;
					this.parseTemplateBody(body);
					return;
				}

				if (!inside_func) {
					if (this.type.label === 'continue') {
						throw new Error('`continue` statements are not allowed in native templates');
					}
					if (this.type.label === 'break') {
						throw new Error('`break` statements are not allowed in native templates');
					}
				}

				if (
					!is_template_output &&
					this.#isJSXControlFlowDirectiveStart() &&
					this.#canImplicitlyEnterTemplateOutput(body)
				) {
					current_template_node.metadata ??= { path: [] };
					current_template_node.metadata.templateMode = 'template';
					body.push(this.#parseJSXControlFlowExpression());
					this.parseTemplateBody(body);
					return;
				}

				if (this.type === tt.braceL) {
					// A `{expr}` child is template output, not script setup. Enter template
					// output mode (mirroring the jsxText/control-flow branches) so elements
					// nested in the expression (`{items.map((i) => <li>...)}`) are not treated
					// as living in this element's script section.
					if (!is_template_output && this.#canImplicitlyEnterTemplateOutput(body)) {
						current_template_node.metadata ??= { path: [] };
						current_template_node.metadata.templateMode = 'template';
					}
					body.push(this.#parseNativeTemplateExpressionContainer());
				} else if (is_template_output && this.type === tstt.jsxText) {
					// A nested element with its own script section can leak a JSX
					// expression context, so the whitespace after its closing tag is
					// mis-tokenized as a stale text token whose start was advanced onto the
					// following `<`. Real JSX text never starts at `<`, so drop the leaked
					// context and re-read the tag instead of emitting an empty node.
					if (this.input.charCodeAt(this.start) === CharCode.lessThan) {
						while (this.curContext() === tstc.tc_expr) {
							this.context.pop();
						}
						this.pos = this.start;
						this.exprAllowed = true;
						this.next();
						this.parseTemplateBody(body);
						return;
					}
					body.push(this.#parseTemplateRawText());
				} else if (is_template_output && this.#isJSXControlFlowDirectiveStart()) {
					body.push(this.#parseJSXControlFlowExpression());
				} else if (this.type === tt.braceR) {
					// Leaving a native template body. We may still be in TSX/JSX tokenization
					// context (e.g. after parsing markup), but the closing `}` is a JS token.
					// If we don't reset this here, the following `next()` can read EOF using
					// `jsx_readToken()` and throw "Unterminated JSX contents".
					while (this.curContext() === tstc.tc_expr) {
						this.context.pop();
					}
					return;
				} else if (
					this.type === tstt.jsxTagStart ||
					(this.input.charCodeAt(this.start) === CharCode.lessThan &&
						this.input.charCodeAt(this.start + 1) === CharCode.slash)
				) {
					const startPos = this.start;
					const startLoc = this.startLoc;
					if (this.type === tstt.jsxTagStart) {
						this.next();
					} else {
						// A control-flow block inside a native template can leave the tokenizer
						// in normal JS mode, so a closing tag may arrive as a relational
						// `<` token. Re-enter JSX closing-tag parsing manually.
						this.pos = startPos + 1;
						this.type = tstt.jsxTagStart;
						this.start = startPos;
						this.startLoc = startLoc;
						this.exprAllowed = false;
						this.next();
					}
					if (this.value === '/' || this.type === tt.slash) {
						// Consume '/'
						this.next();

						let closingElement;
						this.#closingNativeTemplateNode = true;
						try {
							closingElement = /** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
								this.jsx_parseClosingElementAt(startPos, startLoc)
							);
						} finally {
							this.#closingNativeTemplateNode = false;
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
						skipWhitespace(this);
						return;
					}
					const node = this.parseElement();
					if (node !== null) {
						body.push(node);
					}
				} else if (is_template_output && this.type === tt.eof) {
					return;
				} else if (is_template_output) {
					body.push(this.#parseTemplateRawText());
				} else {
					skipWhitespace(this);
					if (this.#templateFenceStart() !== -1) {
						body.push(this.#parseTemplateFence());
						current_template_node.metadata ??= { path: [] };
						current_template_node.metadata.templateMode = 'template';
						current_template_node.metadata.hasTemplateFence = true;
						this.parseTemplateBody(body);
						return;
					}
					if (
						!(
							current_template_node.metadata?.native_tsrx_template_block &&
							current_template_node.metadata?.hasTemplateFenceAhead
						) &&
						!this.#hasTemplateFenceBeforeElementClose(this.start, current_template_node) &&
						this.#canImplicitlyEnterTemplateOutput(body) &&
						this.#isImplicitTemplateRawTextStart()
					) {
						current_template_node.metadata ??= { path: [] };
						current_template_node.metadata.templateMode = 'template';
						body.push(this.#parseTemplateRawText());
						this.parseTemplateBody(body);
						return;
					}
					const previous_context = this.context;
					this.context = previous_context.filter(
						(context) =>
							context !== tstc.tc_expr && context !== tstc.tc_oTag && context !== tstc.tc_cTag,
					);
					let pushed_statement_context = false;
					if (this.curContext() !== b_stat) {
						this.context.push(b_stat);
						pushed_statement_context = true;
					}
					this.exprAllowed = true;
					const previous_path = this.#path;
					this.#path = [];
					this.#forceScriptJSXElementDepth++;
					this.#functionBodyDepth++;
					let node;
					try {
						node = this.parseStatement(null);
					} finally {
						this.#functionBodyDepth--;
						this.#forceScriptJSXElementDepth--;
						this.#path = previous_path;
						if (pushed_statement_context && this.curContext() === b_stat) {
							this.context.pop();
						}
						this.context = previous_context;
					}
					if (current_template_node.metadata?.templateMode === 'template') {
						this.#report_invalid_template_return_statements(node);
					}
					body.push(node);

					// Ensure we're not in JSX context before recursing
					// This is important when elements are parsed at statement level
					if (this.curContext() === tstc.tc_expr) {
						this.context.pop();
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
