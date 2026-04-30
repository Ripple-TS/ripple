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
	isWhitespaceTextNode,
	BINDING_TYPES,
	DestructuringErrors,
} from './parse/index.js';
import { regex_newline_characters } from './utils/patterns.js';
import { error } from './errors.js';
import { DIAGNOSTIC_CODES } from './diagnostics.js';

const JSX_EXPRESSION_VALUE_ERROR =
	'JSX elements cannot be used as expressions. Wrap with `<>...</>` or `<tsx>...</tsx>` or use elements as statements within a component.';

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
		if (ch !== 32 && ch !== 9 && ch !== 10 && ch !== 13) break;
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
		if (ch === 92)
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
		if (ch === 34 || ch === 39 || ch === 96) {
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
	if (input.charCodeAt(pos) !== 60) return false;

	// Match the angle brackets, skipping over string literals.
	let i = pos + 1;
	let depth = 1;
	while (i < input.length) {
		const ch = input.charCodeAt(i);
		if (ch === 34 || ch === 39 || ch === 96) {
			i = skip_string_from(input, i, ch);
			continue;
		}
		if (ch === 60) depth++;
		else if (ch === 62 && --depth === 0) break;
		i++;
	}
	if (depth !== 0) return false;

	// `>` must be followed by `(...)`.
	i = skip_whitespace_from(input, i + 1);
	if (input.charCodeAt(i) !== 40) return false;
	i = scan_balanced_from(input, i, 40, 41);
	if (i === -1) return false;

	// Optional `: ReturnType` before `=>`.
	i = skip_whitespace_from(input, i);
	if (input.charCodeAt(i) === 58) {
		i++;
		while (i < input.length) {
			const ch = input.charCodeAt(i);
			if (ch === 34 || ch === 39 || ch === 96) {
				i = skip_string_from(input, i, ch);
				continue;
			}
			if (ch === 61 && input.charCodeAt(i + 1) === 62) return true;
			if (ch === 59 || ch === 123 || ch === 125) return false;
			i++;
		}
		return false;
	}

	return input.charCodeAt(i) === 61 && input.charCodeAt(i + 1) === 62;
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function is_pascal_case_function(node) {
	if (node && 'id' in node && node.id && node.id.type === 'Identifier') {
		return /^[A-Z]/.test(node.id.name);
	}
	return false;
}

/**
 * @param {string} input
 * @param {number} pos
 */
function previous_word_before(input, pos) {
	let i = pos - 1;
	while (i >= 0) {
		const ch = input.charCodeAt(i);
		if (ch !== 32 && ch !== 9 && ch !== 10 && ch !== 13) break;
		i--;
	}
	const end = i + 1;
	while (i >= 0 && /[$_\p{ID_Continue}]/u.test(input[i])) {
		i--;
	}
	return input.slice(i + 1, end);
}

/**
 * Acorn parser plugin for Ripple syntax extensions.
 * Adds support for: component declarations, &[]/&{} lazy destructuring,
 * #server blocks, #style identifiers, and enhanced JSX handling.
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
		const tstt = Parser.acornTypeScript.tokTypes;
		const tstc = Parser.acornTypeScript.tokContexts;

		class TSRXParser extends Parser {
			/** @type {AST.Node[]} */
			#path = [];
			#allowTagStartAfterDoubleQuotedText = false;
			#allowDoubleQuotedTextChildAfterBrace = false;
			#commentContextId = 0;
			#collect = false;
			#loose = false;
			/** @type {AST.Node[]} */
			#functionStack = [];
			/** @type {import('../types/index').CompileError[] | undefined} */
			#errors = undefined;
			/** @type {string | null} */
			#filename = null;
			#functionBodyDepth = 0;

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

			#previousNonWhitespaceChar() {
				let index = this.pos - 1;
				while (index >= 0) {
					const ch = this.input.charCodeAt(index);
					if (ch !== 32 && ch !== 9 && ch !== 10 && ch !== 13) {
						return ch;
					}
					index--;
				}
				return null;
			}

			#isDoubleQuotedTextChildStart() {
				if (this.#path.findLast((n) => n.type === 'TsxCompat' || n.type === 'Tsx')) {
					return false;
				}

				const parent = this.#path.at(-1);
				if (!parent || (parent.type !== 'Component' && parent.type !== 'Element')) {
					return false;
				}

				const context = this.curContext();
				if (context === tstc.tc_oTag || context === tstc.tc_cTag) {
					return false;
				}

				const prev = this.#previousNonWhitespaceChar();
				return (
					prev === null ||
					prev === 34 || // "
					prev === 59 || // ;
					prev === 62 || // >
					(prev === 123 && this.#allowDoubleQuotedTextChildAfterBrace) || // {
					prev === 125 // }
				);
			}

			#readDoubleQuotedTextChildToken() {
				const start = this.pos;
				let out = '';
				this.pos++;
				let chunkStart = this.pos;

				while (this.pos < this.input.length) {
					const ch = this.input.charCodeAt(this.pos);

					if (ch === 34 /* " */) {
						out += this.input.slice(chunkStart, this.pos);
						this.pos++;
						return this.finishToken(tt.string, out);
					}

					if (ch === 38 /* & */) {
						out += this.input.slice(chunkStart, this.pos);
						out += this.jsx_readEntity();
						chunkStart = this.pos;
						continue;
					}

					if (acorn.isNewLine(ch)) {
						out += this.input.slice(chunkStart, this.pos);
						out += this.jsx_readNewLine(true);
						chunkStart = this.pos;
						continue;
					}

					this.pos++;
				}

				this.raise(start, 'Unterminated double-quoted text child');
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
			 * Override parseProperty to support component methods in object literals.
			 * Handles syntax like `{ component something() { <div /> } }`
			 * Also supports computed names: `{ component ['something']() { <div /> } }`
			 * @type {Parse.Parser['parseProperty']}
			 */
			parseProperty(isPattern, refDestructuringErrors) {
				// Check if this is a component method: component name( ... ) { ... }
				if (!isPattern && this.type === tt.name && this.value === 'component') {
					// Look ahead to see if this is "component identifier(", "component identifier<", "component [", or "component 'string'"
					const lookahead = this.input.slice(this.pos).match(/^\s*(?:(\w+)\s*[(<]|\[|['"])/);
					if (lookahead) {
						// This is a component method definition
						const prop = /** @type {AST.Property} */ (this.startNode());
						const isComputed = lookahead[0].trim().startsWith('[');
						const isStringLiteral = /^['"]/.test(lookahead[0].trim());

						if (isComputed) {
							// For computed names, consume 'component'
							// parse the key, then parse component without name
							this.next(); // consume 'component'
							this.next(); // consume '['
							prop.key = this.parseExpression();
							this.expect(tt.bracketR);
							prop.computed = true;

							// Parse component without name (skipName: true)
							const component_node = this.parseComponent({ skipName: true });
							/** @type {AST.TSRXProperty} */ (prop).value = component_node;
						} else if (isStringLiteral) {
							// For string literal names, consume 'component'
							// parse the string key, then parse component without name
							this.next(); // consume 'component'
							prop.key = /** @type {AST.Literal} */ (this.parseExprAtom());
							prop.computed = false;

							// Parse component without name (skipName: true)
							const component_node = this.parseComponent({ skipName: true });
							/** @type {AST.TSRXProperty} */ (prop).value = component_node;
						} else {
							const component_node = this.parseComponent({ requireName: true });

							prop.key = /** @type {AST.Identifier} */ (component_node.id);
							/** @type {AST.TSRXProperty} */ (prop).value = component_node;
							prop.computed = false;
						}

						prop.shorthand = false;
						prop.method = true;
						prop.kind = 'init';

						return this.finishNode(prop, 'Property');
					}
				}

				return super.parseProperty(isPattern, refDestructuringErrors);
			}

			/**
			 * Override parseClassElement to support component methods in classes.
			 * Handles syntax like `class Foo { component something() { <div /> } }`
			 * Also supports computed names: `class Foo { component ['something']() { <div /> } }`
			 * @type {Parse.Parser['parseClassElement']}
			 */
			parseClassElement(constructorAllowsSuper) {
				// Check if this is a component method: component name( ... ) { ... }
				if (this.type === tt.name && this.value === 'component') {
					// Look ahead to see if this is "component identifier(",
					// "component identifier<", "component [", or "component 'string'"
					const lookahead = this.input.slice(this.pos).match(/^\s*(?:(\w+)\s*[(<]|\[|['"])/);
					if (lookahead) {
						// This is a component method definition
						const node = /** @type {AST.MethodDefinition} */ (this.startNode());
						const isComputed = lookahead[0].trim().startsWith('[');
						const isStringLiteral = /^['"]/.test(lookahead[0].trim());

						if (isComputed) {
							// For computed names, consume 'component'
							// parse the key, then parse component without name
							this.next(); // consume 'component'
							this.next(); // consume '['
							node.key = this.parseExpression();
							this.expect(tt.bracketR);
							node.computed = true;

							// Parse component without name (skipName: true)
							const component_node = this.parseComponent({ skipName: true });
							/** @type {AST.TSRXMethodDefinition} */ (node).value = component_node;
						} else if (isStringLiteral) {
							// For string literal names, consume 'component'
							// parse the string key, then parse component without name
							this.next(); // consume 'component'
							node.key = /** @type {AST.Literal} */ (this.parseExprAtom());
							node.computed = false;

							// Parse component without name (skipName: true)
							const component_node = this.parseComponent({ skipName: true });
							/** @type {AST.TSRXMethodDefinition} */ (node).value = component_node;
						} else {
							// Use parseComponent which handles consuming 'component', parsing name, params, and body
							const component_node = this.parseComponent({ requireName: true });

							node.key = /** @type {AST.Identifier} */ (component_node.id);
							/** @type {AST.TSRXMethodDefinition} */ (node).value = component_node;
							node.computed = false;
						}

						node.static = false;
						node.kind = 'method';

						return this.finishNode(node, 'MethodDefinition');
					}
				}

				return super.parseClassElement(constructorAllowsSuper);
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
				if (!container || container.type !== 'Element') {
					return null;
				}

				const children = Array.isArray(container.children) ? container.children : [];
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
				if (code === 60 && looks_like_generic_arrow(this.input, this.pos)) {
					++this.pos;
					return this.finishToken(tt.relational, '<');
				}
				return super.readToken(code);
			}

			/**
			 * Get token from character code - handles Ripple-specific tokens
			 * @type {Parse.Parser['getTokenFromCode']}
			 */
			getTokenFromCode(code) {
				if (code === 34) {
					const is_double_quoted_text_child = this.#isDoubleQuotedTextChildStart();
					this.#allowDoubleQuotedTextChildAfterBrace = false;
					if (is_double_quoted_text_child) {
						return this.#readDoubleQuotedTextChildToken();
					}
				} else {
					this.#allowDoubleQuotedTextChildAfterBrace = false;
				}

				if (code !== 60) {
					this.#allowTagStartAfterDoubleQuotedText = false;
				}

				if (code === 60) {
					// < character
					const inComponent = this.#path.findLast((n) => n.type === 'Component');
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
						if (ch !== 32 && ch !== 9) break; // not space or tab
						lookback--;
					}

					// Check what character/token precedes the <
					if (lookback >= 0) {
						const prevChar = this.input.charCodeAt(lookback);
						prevNonWhitespaceChar = prevChar;

						// If preceded by identifier character (letter, digit, _, $) or closing paren,
						// this is likely TypeScript generics, not JSX
						const isIdentifierChar =
							(prevChar >= 65 && prevChar <= 90) || // A-Z
							(prevChar >= 97 && prevChar <= 122) || // a-z
							(prevChar >= 48 && prevChar <= 57) || // 0-9
							prevChar === 95 || // _
							prevChar === 36 || // $
							prevChar === 41; // )

						if (isIdentifierChar) {
							return super.getTokenFromCode(code);
						}
					}

					// Support parsing standalone template markup at the top-level (outside `component`)
					// for tooling like Prettier, e.g.:
					// <Something>...</Something>\n\n<Child />
					// <head><style>...</style></head>
					// We only do this when '<' is in a tag-like position.
					const nextChar =
						this.pos + 1 < this.input.length ? this.input.charCodeAt(this.pos + 1) : -1;
					const isWhitespaceAfterLt =
						nextChar === 32 || nextChar === 9 || nextChar === 10 || nextChar === 13;
					const isTagLikeAfterLt =
						!isWhitespaceAfterLt &&
						(nextChar === 47 || // '/'
							nextChar === 62 || // '>' (fragments: <>)
							nextChar === 64 || // '@'
							nextChar === 36 || // '$'
							nextChar === 95 || // '_'
							(nextChar >= 65 && nextChar <= 90) || // A-Z
							(nextChar >= 97 && nextChar <= 122)); // a-z
					const prevAllowsTagStart =
						prevNonWhitespaceChar === null ||
						prevNonWhitespaceChar === 10 || // '\n'
						prevNonWhitespaceChar === 13 || // '\r'
						prevNonWhitespaceChar === 123 || // '{'
						prevNonWhitespaceChar === 125 || // '}'
						prevNonWhitespaceChar === 62; // '>'

					if (!inComponent && prevAllowsTagStart && isTagLikeAfterLt) {
						++this.pos;
						return this.finishToken(tstt.jsxTagStart);
					}

					if (inComponent) {
						// Inside component template bodies, allow adjacent tags without requiring
						// a newline/indentation before the next '<'. This is important for inputs
						// like `<div />` and `</div><style>...</style>` which Prettier formats.
						if (
							(prevNonWhitespaceChar === 34 /* '"' */ &&
								this.#allowTagStartAfterDoubleQuotedText) ||
							prevNonWhitespaceChar === 123 /* '{' */ ||
							prevNonWhitespaceChar === 62 /* '>' */
						) {
							if (!isWhitespaceAfterLt) {
								this.#allowTagStartAfterDoubleQuotedText = false;
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
							this.input.charCodeAt(lineStart) !== 10 &&
							this.input.charCodeAt(lineStart) !== 13
						) {
							lineStart--;
						}
						lineStart++; // Move past the newline character

						// Check if all characters from line start to current position are whitespace
						let allWhitespace = true;
						for (let i = lineStart; i < this.pos; i++) {
							const ch = this.input.charCodeAt(i);
							if (ch !== 32 && ch !== 9) {
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

				if (code === 35) {
					// # character
					if (this.pos + 1 < this.input.length) {
						/** @param {string} value */
						const startsWith = (value) =>
							this.input.slice(this.pos, this.pos + value.length) === value;
						/** @param {number} length */
						const char_after = (length) =>
							this.pos + length < this.input.length ? this.input.charCodeAt(this.pos + length) : -1;
						/** @param {number} ch */
						const is_ripple_delimiter = (ch) =>
							ch === 40 || // (
							ch === 41 || // )
							ch === 60 || // <
							ch === 46 || // .
							ch === 44 || // ,
							ch === 59 || // ;
							ch === 91 || // [
							ch === 93 || // ]
							ch === 123 || // {
							ch === 125 || // }
							ch === 32 || // space
							ch === 9 || // tab
							ch === 10 || // newline
							ch === 13 || // carriage return
							ch === -1; // EOF

						if (startsWith('#server') && is_ripple_delimiter(char_after(7))) {
							this.pos += 7;
							return this.finishToken(tt.name, '#server');
						}

						if (startsWith('#style') && is_ripple_delimiter(char_after(6))) {
							this.pos += 6;
							return this.finishToken(tt.name, '#style');
						}
					}
				}
				this.#allowTagStartAfterDoubleQuotedText = false;
				return super.getTokenFromCode(code);
			}

			/**
			 * Override isLet to recognize `let &{` and `let &[` as variable declarations.
			 * Acorn's isLet checks the char after `let` and only recognizes `{`, `[`, or identifiers.
			 * The `&` char (38) is not in that set, so `let &{...}` would not be parsed as a declaration.
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
				if (nextCh === 38) {
					const afterAmp = this.input.charCodeAt(next + 1);
					if (afterAmp === 123 || afterAmp === 91) return true;
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
					if (charAfterAmp === 123 || charAfterAmp === 91) {
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
			 * Components do not use Acorn's normal function-body parser, but they
			 * should still report duplicate parameter names like functions do. Keep
			 * this validation on `BIND_OUTSIDE` so params are checked without being
			 * declared in the component template scope, preserving existing shadowing
			 * behavior.
			 *
			 * @param {AST.Pattern[]} params
			 */
			checkComponentParams(params) {
				/** @type {Record<string, boolean>} */
				const name_hash = Object.create(null);
				for (const param of params || []) {
					this.checkLValInnerPattern(param, BINDING_TYPES.BIND_OUTSIDE, name_hash);
				}
			}

			/**
			 * Parse expression atom - handles RippleArray and RippleObject literals
			 * @type {Parse.Parser['parseExprAtom']}
			 */
			parseExprAtom(refDestructuringErrors, forNew, forInit) {
				const lookahead_type = this.lookahead().type;
				const is_next_call_token = lookahead_type === tt.parenL || lookahead_type === tt.relational;

				// Check if this is #server identifier for server function calls
				if (this.type === tt.name && this.value === '#server') {
					const node = this.startNode();
					this.next();
					return /** @type {AST.ServerIdentifier} */ (this.finishNode(node, 'ServerIdentifier'));
				}

				if (this.type === tt.name && this.value === '#style') {
					const node = this.startNode();
					this.next();
					return /** @type {AST.StyleIdentifier} */ (this.finishNode(node, 'StyleIdentifier'));
				}

				// Check if this is a component expression (e.g., in object literal values)
				if (this.type === tt.name && this.value === 'component') {
					return this.parseComponent();
				}

				return super.parseExprAtom(refDestructuringErrors, forNew, forInit);
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
			 * This is needed because server blocks create nested scopes, but exports
			 * from within server blocks should still be valid if the identifier is
			 * declared in the server block's scope (not just the top-level module scope).
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

			/**
			 * @type {Parse.Parser['parseServerBlock']}
			 */
			parseServerBlock() {
				const node = /** @type {AST.ServerBlock} */ (this.startNode());
				this.next();

				const body = /** @type {AST.ServerBlockStatement} */ (this.startNode());
				node.body = body;
				body.body = [];

				this.expect(tt.braceL);
				this.enterScope(0);
				while (this.type !== tt.braceR) {
					const stmt = /** @type {AST.Statement} */ (this.parseStatement(null, true));
					body.body.push(stmt);
				}
				this.next();
				this.exitScope();
				this.finishNode(body, 'BlockStatement');

				this.awaitPos = 0;
				return this.finishNode(node, 'ServerBlock');
			}

			/**
			 * Parse a component - common implementation used by statements, expressions, and export defaults
			 * @type {Parse.Parser['parseComponent']}
			 */
			parseComponent({
				requireName = false,
				isDefault = false,
				declareName = false,
				skipName = false,
			} = {}) {
				const node = /** @type {AST.Component} */ (this.startNode());
				node.type = 'Component';
				node.css = null;
				node.default = isDefault;

				// skipName is used for computed property names where 'component' and the key
				// have already been consumed before calling parseComponent
				if (!skipName) {
					this.next(); // consume 'component'
				}
				this.enterScope(0);

				if (skipName) {
					// For computed names, the key is parsed separately, so id is null
					node.id = null;
				} else if (requireName) {
					node.id = this.parseIdent();
					if (declareName) {
						this.declareName(
							node.id.name,
							BINDING_TYPES.BIND_FUNCTION,
							/** @type {AST.NodeWithLocation} */ (node.id).start,
						);
					}
				} else {
					node.id = this.type.label === 'name' ? this.parseIdent() : null;
					if (declareName && node.id) {
						this.declareName(
							node.id.name,
							BINDING_TYPES.BIND_FUNCTION,
							/** @type {AST.NodeWithLocation} */ (node.id).start,
						);
					}
				}

				this.parseFunctionParams(node);
				this.checkComponentParams(node.params);

				// Reset before `eat(braceL)` so the lookahead `next()` it triggers reads
				// the component body's first token as if we'd entered fresh — no
				// surrounding function body should affect our parseStatement/parseBlock
				// branching while inside the template.
				const parent_function_body_depth = this.#functionBodyDepth;
				this.#functionBodyDepth = 0;

				if (this.type === tt.braceL) {
					this.#allowDoubleQuotedTextChildAfterBrace = true;
				}
				this.eat(tt.braceL);
				node.body = [];
				this.#path.push(node);

				try {
					this.parseTemplateBody(node.body);
				} finally {
					this.#functionBodyDepth = parent_function_body_depth;
				}
				this.#path.pop();
				this.exitScope();

				this.next();
				skipWhitespace(this);
				this.finishNode(node, 'Component');
				this.awaitPos = 0;

				return node;
			}

			/**
			 * @type {Parse.Parser['parseExportDefaultDeclaration']}
			 */
			parseExportDefaultDeclaration() {
				// Check if this is "export default component"
				if (this.value === 'component') {
					return this.parseComponent({ isDefault: true });
				}

				return super.parseExportDefaultDeclaration();
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
				this.#functionStack.push(node);

				try {
					return super.parseFunctionBody(node, isArrowFunction, isMethod, forInit, ...args);
				} finally {
					this.#functionStack.pop();
					this.#functionBodyDepth--;
				}
			}

			/**
			 * @type {Parse.Parser['checkUnreserved']}
			 */
			checkUnreserved(ref) {
				if (ref.name === 'component') {
					// Allow 'component' when it's followed by an identifier and '(' or '<' (component method in object literal or class)
					// e.g., { component something() { ... } } or class Foo { component something<T>() { ... } }
					// Also allow computed names: { component ['name']() { ... } }
					// Also allow string literal names: { component 'name'() { ... } }
					const nextChars = this.input.slice(this.pos).match(/^\s*(?:(\w+)\s*[(<]|\[|['"])/);
					if (!nextChars) {
						this.raise(
							ref.start,
							'"component" is a Ripple keyword and cannot be used as an identifier',
						);
					}
				}
				return super.checkUnreserved(ref);
			}

			/** @type {Parse.Parser['shouldParseExportStatement']} */
			shouldParseExportStatement() {
				if (super.shouldParseExportStatement()) {
					return true;
				}
				if (this.value === 'component') {
					return true;
				}
				return this.type.keyword === 'var';
			}

			/**
			 * @return {ESTreeJSX.JSXExpressionContainer}
			 */
			jsx_parseExpressionContainer() {
				let node = /** @type {ESTreeJSX.JSXExpressionContainer} */ (this.startNode());
				this.next();

				if (this.type === tt.name && this.value === 'html') {
					node.html = true;
					this.next();
					if (this.type === tt.braceR) {
						this.raise(
							this.start,
							'"html" is a TSRX keyword and must be used in the form {html some_content}',
						);
					}
				} else if (this.type === tt.name && this.value === 'text') {
					node.text = true;
					this.next();
					if (this.type === tt.braceR) {
						this.raise(
							this.start,
							'"text" is a TSRX keyword and must be used in the form {text some_value}',
						);
					}
				}

				node.expression =
					this.type === tt.braceR ? this.jsx_parseEmptyExpression() : this.parseExpression();
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
			 * @returns {AST.TextNode}
			 */
			parseDoubleQuotedTextChild() {
				const node = /** @type {AST.TextNode} */ (this.startNode());
				const expression = /** @type {AST.Literal} */ (this.startNode());
				node.raw = this.input.slice(this.start, this.end);
				const end = this.end;
				const endLoc = this.endLoc;

				expression.value = this.value;
				expression.raw = JSON.stringify(this.value);
				node.expression = this.finishNodeAt(expression, 'Literal', end, endLoc);

				this.#allowTagStartAfterDoubleQuotedText = true;
				try {
					this.next();
				} finally {
					this.#allowTagStartAfterDoubleQuotedText = false;
				}

				return this.finishNodeAt(node, 'Text', end, endLoc);
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
					const inside_tsx = this.#path.findLast((n) => n.type === 'TsxCompat' || n.type === 'Tsx');
					if (inside_tsx) {
						if (this.type === tt.ellipsis) {
							this.expect(tt.ellipsis);
							/** @type {ESTreeJSX.JSXSpreadAttribute} */ (node).argument = this.parseMaybeAssign();
							this.expect(tt.braceR);
							return this.finishNode(node, 'JSXSpreadAttribute');
						}
						this.unexpected();
					}

					if (this.value === 'ref') {
						this.next();
						if (this.type === tt.braceR) {
							this.raise(
								this.start,
								'"ref" is a Ripple keyword and must be used in the form {ref fn}',
							);
						}
						/** @type {AST.RefAttribute} */ (node).argument = this.parseMaybeAssign();
						this.expect(tt.braceR);
						return /** @type {AST.RefAttribute} */ (this.finishNode(node, 'RefAttribute'));
					} else if (this.type === tt.ellipsis) {
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
				/** @type {ESTreeJSX.JSXAttribute} */ (node).value =
					/** @type {ESTreeJSX.JSXAttribute['value'] | null} */ (
						this.eat(tt.eq) ? this.jsx_parseAttributeValue() : null
					);
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
						this.raise(this.start, 'value should be either an expression or a quoted text');
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
				const inside_tsx_compat = this.#path.findLast(
					(n) => n.type === 'TsxCompat' || n.type === 'Tsx',
				);
				if (inside_tsx_compat) {
					return super.jsx_readToken();
				}
				let out = '',
					chunkStart = this.pos;

				while (true) {
					if (this.pos >= this.input.length) this.raise(this.start, 'Unterminated JSX contents');
					let ch = this.input.charCodeAt(this.pos);

					switch (ch) {
						case 60: // '<'
						case 123: // '{'
							// In JSX text mode, '<' and '{' always start a tag/expression container.
							// `exprAllowed` can be false here due to surrounding parser state, but
							// throwing breaks valid templates (e.g. sibling tags after a close).
							if (ch === 60) {
								++this.pos;
								return this.finishToken(tstt.jsxTagStart);
							}
							return this.getTokenFromCode(ch);

						case 47: // '/'
							// Check if this is a comment (// or /*)
							if (this.input.charCodeAt(this.pos + 1) === 47) {
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
								break;
							} else if (this.input.charCodeAt(this.pos + 1) === 42) {
								// '/*'
								// Block comment - handle it properly
								const commentStart = this.pos;
								const startLoc = this.curPosition();
								this.pos += 2;

								let commentText = '';
								while (this.pos < this.input.length - 1) {
									if (
										this.input.charCodeAt(this.pos) === 42 &&
										this.input.charCodeAt(this.pos + 1) === 47
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
								break;
							}
							// If not a comment, fall through to default case
							this.context.push(b_stat);
							this.exprAllowed = true;
							return original.readToken.call(this, ch);

						case 38: // '&'
							out += this.input.slice(chunkStart, this.pos);
							out += this.jsx_readEntity();
							chunkStart = this.pos;
							break;

						case 62: // '>'
						case 125: {
							// '}'
							if (
								ch === 125 &&
								(this.#path.length === 0 ||
									this.#path.at(-1)?.type === 'Component' ||
									this.#path.at(-1)?.type === 'Element')
							) {
								return original.readToken.call(this, ch);
							}
							this.raise(
								this.pos,
								'Unexpected token `' +
									this.input[this.pos] +
									'`. Did you mean `' +
									(ch === 62 ? '&gt;' : '&rbrace;') +
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
							} else if (ch === 32 || ch === 9) {
								++this.pos;
							} else {
								this.context.push(b_stat);
								this.exprAllowed = true;
								return original.readToken.call(this, ch);
							}
					}
				}
			}

			/**
			 * Override jsx_parseElement to intercept expression-level JSX.
			 * This is called by acorn-jsx's parseExprAtom when it encounters <
			 * in expression position. Bare fragments are treated as shorthand
			 * for <tsx>...</tsx>; other tags must still use <tsx> or <tsx:*>.
			 * @type {Parse.Parser['jsx_parseElement']}
			 */
			jsx_parseElement() {
				const inside_tsx = this.#path.findLast((n) => n.type === 'TsxCompat' || n.type === 'Tsx');
				if (inside_tsx) {
					// Inside tsx/tsx:*, let acorn-jsx handle it normally
					return super.jsx_parseElement();
				}

				// Check if the element being parsed IS a <tsx> or <tsx:*> tag
				// Current token is jsxTagStart, this.end is position after '<'
				const tag_name_start = this.end;
				const is_fragment_tag = this.input.charCodeAt(tag_name_start) === 62;
				const char_after_tsx = this.input.charCodeAt(tag_name_start + 3);
				const is_tsx_tag =
					this.input.startsWith('tsx', tag_name_start) &&
					(tag_name_start + 3 >= this.input.length ||
						char_after_tsx === 62 || // >
						char_after_tsx === 47 || // / (self-closing)
						char_after_tsx === 32 || // space
						char_after_tsx === 9 || // tab
						char_after_tsx === 10 || // newline
						char_after_tsx === 13 || // carriage return
						char_after_tsx === 58); // : (tsx:react)

				if (is_fragment_tag || is_tsx_tag) {
					// Use Ripple's parseElement to create a Tsx/TsxCompat node.
					// Bare fragments (<></>) are shorthand for <tsx>...</tsx>.
					this.next();
					return /** @type {import('estree-jsx').JSXElement} */ (
						/** @type {unknown} */ (this.parseElement())
					);
				}

				const code = this.#functionStack.findLast(is_pascal_case_function)
					? DIAGNOSTIC_CODES.FUNCTION_COMPONENT_SYNTAX
					: this.#path.findLast((node) => node.type === 'Component') &&
						  this.#functionStack.length === 0 &&
						  previous_word_before(this.input, this.start) === 'return'
						? DIAGNOSTIC_CODES.JSX_RETURN_IN_COMPONENT
						: DIAGNOSTIC_CODES.JSX_EXPRESSION_VALUE;

				this.#report_recoverable_error(this.start, JSX_EXPRESSION_VALUE_ERROR, code);
				return super.jsx_parseElement();
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

				const element = /** @type {AST.Element | AST.Tsx | AST.TsxCompat} */ (this.startNode());
				element.start = start;
				/** @type {AST.NodeWithLocation} */ (element).loc.start = position;
				element.metadata = { path: [] };
				element.children = [];

				const open = /** @type {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} */ (
					this.jsx_parseOpeningElementAt(start, position)
				);

				// Always attach the concrete opening element node for accurate source mapping
				element.openingElement = open;

				// Fragments (<>) produce JSXOpeningFragment with no `name` property
				const is_fragment = !open.name;
				const is_tsx_compat = !is_fragment && open.name.type === 'JSXNamespacedName';
				const is_tsx =
					!is_fragment &&
					!is_tsx_compat &&
					open.name.type === 'JSXIdentifier' &&
					open.name.name === 'tsx';

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
				} else if (is_tsx) {
					/** @type {AST.Tsx} */ (element).type = 'Tsx';

					if (open.selfClosing) {
						this.raise(
							open.start,
							`TSX elements cannot be self-closing. '<tsx />' must have a closing tag '</tsx>'.`,
						);
					}
				} else if (is_fragment) {
					/** @type {AST.Tsx} */ (element).type = 'Tsx';
				} else {
					element.type = 'Element';
				}

				this.#path.push(element);

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

				if (!is_tsx_compat && !is_tsx && !is_fragment) {
					/** @type {AST.Element} */ (element).id = /** @type {AST.Identifier} */ (
						convert_from_jsx(/** @type {ESTreeJSX.JSXIdentifier} */ (open.name))
					);
					element.selfClosing = open.selfClosing;
				} else if (is_fragment) {
					element.selfClosing = false;
				}

				element.attributes = open.attributes;
				element.metadata ??= { path: [] };
				element.metadata.commentContainerId = ++this.#commentContextId;

				if (element.selfClosing) {
					this.#path.pop();

					if (this.type.label === '</>/<=/>=') {
						this.pos--;
						this.next();
					}
				} else if (is_fragment) {
					this.enterScope(0);
					this.parseTemplateBody(/** @type {AST.Element} */ (element).children);
					this.exitScope();

					if (element.type === 'Tsx') {
						this.#path.pop();

						if (!element.unclosed) {
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
							this.next();
						}
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
							const closingLineInfo = acorn.getLineInfo(this.input, closingStart);
							const closingStartLoc = new acorn.Position(
								closingLineInfo.line,
								closingLineInfo.column,
							);

							// Ensure `</script>` can't be tokenized as `<` followed by a regexp
							// start when we manually advance to the `/`.
							this.exprAllowed = false;

							// Position after '<' (so next() reads '/')
							this.pos = closingStart + 1;
							this.type = tstt.jsxTagStart;
							this.start = closingStart;
							this.startLoc = closingStartLoc;
							this.next();

							// Consume '/'
							this.next();

							const closingElement = this.jsx_parseClosingElementAt(closingStart, closingStartLoc);
							element.closingElement = closingElement;
							this.exprAllowed = false;

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
								"Unclosed tag '<script>'. Expected '</script>' before end of component.",
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

						const component = /** @type {AST.Component} */ (
							this.#path.findLast((n) => n.type === 'Component')
						);
						const parsed_css = parse_style(content, { loose: this.#loose });

						if (!inside_head) {
							if (component.css !== null) {
								throw new Error('Components can only have one style tag');
							}
							component.css = parsed_css;
							/** @type {AST.Element} */ (element).metadata.styleScopeHash = parsed_css.hash;
						}

						const newLines = content.match(regex_newline_characters)?.length;
						if (newLines) {
							this.curLine = open.loc.end.line + newLines;
							this.lineStart = start + content.lastIndexOf('\n') + 1;
						}
						if (end !== -1) {
							const closingStart = start + content.length;
							const closingLineInfo = acorn.getLineInfo(this.input, closingStart);
							const closingStartLoc = new acorn.Position(
								closingLineInfo.line,
								closingLineInfo.column,
							);

							// Ensure `</style>` can't be tokenized as `<` followed by a regexp
							// start when we manually advance to the `/`.
							this.exprAllowed = false;

							// Position after '<' (so next() reads '/')
							this.pos = closingStart + 1;
							this.type = tstt.jsxTagStart;
							this.start = closingStart;
							this.startLoc = closingStartLoc;
							this.next();

							// Consume '/'
							this.next();

							const closingElement = this.jsx_parseClosingElementAt(closingStart, closingStartLoc);
							element.closingElement = closingElement;
							this.exprAllowed = false;
							this.#path.pop();
						} else {
							this.#report_broken_markup_error(
								open.end,
								"Unclosed tag '<style>'. Expected '</style>' before end of component.",
							);
							/** @type {AST.Element} */ (element).unclosed = true;
							this.#path.pop();
						}
						// This node is used for Prettier - always add parsed CSS as children
						// for proper formatting, regardless of whether it's inside head or not
						/** @type {AST.Element} */ (element).children = [
							/** @type {AST.Node} */ (/** @type {unknown} */ (parsed_css)),
						];

						// Ensure we escape JSX <tag></tag> context
						const curContext = this.curContext();
						const parent = this.#path.at(-1);
						const insideTemplate =
							parent?.type === 'Component' ||
							parent?.type === 'Element' ||
							parent?.type === 'Tsx' ||
							parent?.type === 'TsxCompat';

						if (curContext === tstc.tc_expr && !insideTemplate) {
							this.context.pop();
						}

						/** @type {AST.Element} */ (element).css = content;
					} else {
						this.enterScope(0);
						this.parseTemplateBody(/** @type {AST.Element} */ (element).children);
						this.exitScope();

						if (element.type === 'Tsx') {
							this.#path.pop();

							if (!element.unclosed) {
								const raise_error = () => {
									this.raise(this.start, `Expected closing tag '</tsx>'`);
								};

								this.next();
								// we should expect to see </tsx>
								if (this.value !== '/') {
									raise_error();
								}
								this.next();
								if (this.value !== 'tsx') {
									raise_error();
								}
								this.next();
								if (this.type !== tstt.jsxTagEnd) {
									raise_error();
								}
								this.next();
							}
						} else if (element.type === 'TsxCompat') {
							this.#path.pop();

							if (!element.unclosed) {
								const raise_error = () => {
									this.raise(this.start, `Expected closing tag '</tsx:${element.kind}>'`);
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
								if (this.value !== element.kind) {
									raise_error();
								}
								this.next();
								if (this.type !== tstt.jsxTagEnd) {
									raise_error();
								}
								this.next();
							}
						} else if (this.#path[this.#path.length - 1] === element) {
							// Check if this element was properly closed
							const tagName = this.getElementName(element.id);
							this.#report_broken_markup_error(
								this.start,
								`Unclosed tag '<${tagName}>'. Expected '</${tagName}>' before end of component.`,
							);
							element.unclosed = true;
							element.loc.end = {
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
						parent?.type === 'Component' ||
						parent?.type === 'Element' ||
						parent?.type === 'Tsx' ||
						parent?.type === 'TsxCompat';

					if (curContext === tstc.tc_expr && !insideTemplate) {
						this.context.pop();
					}
				}

				if (element.closingElement && !is_tsx_compat && !is_tsx && element.closingElement.name) {
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
				const inside_func =
					this.context.some((n) => n.token === 'function') || this.scopeStack.length > 1;
				const inside_tsx = this.#path.findLast((n) => n.type === 'Tsx');
				const inside_tsx_compat = this.#path.findLast((n) => n.type === 'TsxCompat');

				if (!inside_func) {
					if (this.type.label === 'continue') {
						throw new Error('`continue` statements are not allowed in components');
					}
					if (this.type.label === 'break') {
						throw new Error('`break` statements are not allowed in components');
					}
				}

				if (inside_tsx) {
					this.exprAllowed = true;

					while (true) {
						if (this.type === tt.eof || this.pos >= this.input.length || this.type === tt.braceR) {
							this.#report_broken_markup_error(
								this.start,
								`Unclosed tag '<tsx>'. Expected '</tsx>' before end of component.`,
							);
							inside_tsx.unclosed = true;
							/** @type {AST.NodeWithLocation} */ (inside_tsx).loc.end = {
								.../** @type {AST.SourceLocation} */ (inside_tsx.openingElement.loc).end,
							};
							inside_tsx.end = inside_tsx.openingElement.end;
							return;
						}

						if (!inside_tsx.openingElement.name) {
							if (this.input.slice(this.pos, this.pos + 2) === '/>') {
								// Reset exprAllowed so the trailing `/` of `</>` is tokenized
								// as a slash rather than as the start of a regex literal.
								this.exprAllowed = false;
								return;
							}
						} else if (this.input.slice(this.pos, this.pos + 4) === '/tsx') {
							const after = this.input.charCodeAt(this.pos + 4);
							// Make sure it's </tsx> and not </tsx:...>
							if (after === 62 /* > */) {
								this.exprAllowed = false;
								return;
							}
						}

						if (this.type === tt.braceL) {
							const node = this.jsx_parseExpressionContainer();
							body.push(node);
						} else if (this.type === tstt.jsxTagStart) {
							// Parse JSX element
							const node = super.parseExpression();
							body.push(node);
						} else {
							const start = this.start;
							this.pos = start;
							let text = '';

							while (this.pos < this.input.length) {
								const ch = this.input.charCodeAt(this.pos);

								// Stop at opening tag, expression, or the component-closing brace
								if (ch === 60 || ch === 123 || ch === 125) {
									// < or { or }
									break;
								}

								text += this.input[this.pos];
								this.pos++;
							}

							if (text) {
								const node = /** @type {ESTreeJSX.JSXText} */ ({
									type: 'JSXText',
									value: text,
									raw: text,
									start,
									end: this.pos,
								});
								body.push(node);
							}

							// Always call next() to ensure parser makes progress
							this.next();
						}
					}
				}
				if (inside_tsx_compat) {
					this.exprAllowed = true;

					while (true) {
						if (this.type === tt.eof || this.pos >= this.input.length || this.type === tt.braceR) {
							this.#report_broken_markup_error(
								this.start,
								`Unclosed tag '<tsx:${inside_tsx_compat.kind}>'. Expected '</tsx:${inside_tsx_compat.kind}>' before end of component.`,
							);
							inside_tsx_compat.unclosed = true;
							/** @type {AST.NodeWithLocation} */ (inside_tsx_compat).loc.end = {
								.../** @type {AST.SourceLocation} */ (inside_tsx_compat.openingElement.loc).end,
							};
							inside_tsx_compat.end = inside_tsx_compat.openingElement.end;
							return;
						}

						if (this.input.slice(this.pos, this.pos + 5) === '/tsx:') {
							this.exprAllowed = false;
							return;
						}

						if (this.type === tt.braceL) {
							const node = this.jsx_parseExpressionContainer();
							body.push(node);
						} else if (this.type === tstt.jsxTagStart) {
							// Parse JSX element
							const node = super.parseExpression();
							body.push(node);
						} else {
							const start = this.start;
							this.pos = start;
							let text = '';

							while (this.pos < this.input.length) {
								const ch = this.input.charCodeAt(this.pos);

								// Stop at opening tag, expression, or the component-closing brace
								if (ch === 60 || ch === 123 || ch === 125) {
									// < or { or }
									break;
								}

								text += this.input[this.pos];
								this.pos++;
							}

							if (text) {
								const node = /** @type {ESTreeJSX.JSXText} */ ({
									type: 'JSXText',
									value: text,
									raw: text,
									start,
									end: this.pos,
								});
								body.push(node);
							}

							this.next();
						}
					}
				}
				if (this.type === tt.braceL) {
					const node = this.jsx_parseExpressionContainer();
					// Keep JSXEmptyExpression as-is (for prettier to handle comments)
					// but convert other expressions to Html/TSRXExpression/Text nodes
					if (node.expression.type !== 'JSXEmptyExpression') {
						/** @type {AST.TSRXExpression | AST.Html | AST.TextNode} */ (
							/** @type {unknown} */ (node)
						).type = node.html ? 'Html' : node.text ? 'Text' : 'TSRXExpression';
						delete node.html;
						delete node.text;
					}
					body.push(node);
				} else if (this.type === tt.string && this.input.charCodeAt(this.start) === 34) {
					body.push(this.parseDoubleQuotedTextChild());
				} else if (this.type === tt.braceR) {
					// Leaving a component/template body. We may still be in TSX/JSX tokenization
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

						const closingElement =
							/** @type {ESTreeJSX.JSXClosingElement & AST.NodeWithLocation} */ (
								this.jsx_parseClosingElementAt(startPos, startLoc)
							);
						this.exprAllowed = false;

						// Validate that the closing tag matches the opening tag
						const currentElement = this.#path[this.#path.length - 1];
						if (
							!currentElement ||
							(currentElement.type !== 'Element' &&
								currentElement.type !== 'Tsx' &&
								currentElement.type !== 'TsxCompat')
						) {
							this.raise(this.start, 'Unexpected closing tag');
						}

						/** @type {string | null} */
						let openingTagName;
						/** @type {string | null} */
						let closingTagName;

						if (currentElement.type === 'TsxCompat') {
							openingTagName = 'tsx:' + currentElement.kind;
							closingTagName =
								closingElement.name?.type === 'JSXNamespacedName'
									? closingElement.name.namespace.name + ':' + closingElement.name.name.name
									: this.getElementName(closingElement.name);
						} else if (currentElement.type === 'Tsx') {
							openingTagName = currentElement.openingElement.name ? 'tsx' : null;
							closingTagName =
								closingElement.name?.type === 'JSXNamespacedName'
									? closingElement.name.namespace.name + ':' + closingElement.name.name.name
									: this.getElementName(closingElement.name);
						} else {
							// Regular Element node (or fragment)
							openingTagName = currentElement.id ? this.getElementName(currentElement.id) : null;
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
								const elem = this.#path[this.#path.length - 1];

								// Stop at non-Element boundaries (Component, etc.)
								if (elem.type !== 'Element' && elem.type !== 'Tsx' && elem.type !== 'TsxCompat') {
									break;
								}

								const elemName =
									elem.type === 'TsxCompat'
										? 'tsx:' + elem.kind
										: elem.type === 'Tsx'
											? elem.openingElement.name
												? 'tsx'
												: null
											: elem.id
												? this.getElementName(elem.id)
												: null;

								// Found matching opening tag
								if (elemName === closingTagName) {
									break;
								}

								// Mark as unclosed and adjust location
								elem.unclosed = true;
								/** @type {AST.NodeWithLocation} */ (elem).loc.end = {
									.../** @type {AST.SourceLocation} */ (elem.openingElement.loc).end,
								};
								elem.end = elem.openingElement.end;

								this.#path.pop(); // Remove from stack
							}
						}

						const elementToClose = this.#path[this.#path.length - 1];
						if (elementToClose && elementToClose.type === 'Element') {
							const elementToCloseName = /** @type {AST.Element} */ (elementToClose).id
								? this.getElementName(/** @type {AST.Element} */ (elementToClose).id)
								: null;
							if (elementToCloseName === closingTagName) {
								/** @type {AST.Element} */ (elementToClose).closingElement = closingElement;
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
				} else {
					skipWhitespace(this);
					const node = this.parseStatement(null);
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
					const node = this.jsx_parseExpressionContainer();
					// Keep JSXEmptyExpression as-is (don't convert to TSRXExpression/Text/Html)
					if (node.expression.type !== 'JSXEmptyExpression') {
						/** @type {AST.TSRXExpression | AST.Html | AST.TextNode} */ (
							/** @type {unknown} */ (node)
						).type = node.html ? 'Html' : node.text ? 'Text' : 'TSRXExpression';
						delete node.html;
						delete node.text;
					}

					return /** @type {ESTreeJSX.JSXEmptyExpression | AST.TSRXExpression | AST.Html | AST.TextNode | ESTreeJSX.JSXExpressionContainer} */ (
						/** @type {unknown} */ (node)
					);
				}

				if (this.value === '#server') {
					// Peek ahead to see if this is a server block (#server { ... }) vs
					// a server identifier expression (#server.fn(), #server.fn().then())
					let peek_pos = this.end;
					while (peek_pos < this.input.length && /\s/.test(this.input[peek_pos])) peek_pos++;
					if (peek_pos < this.input.length && this.input.charCodeAt(peek_pos) === 123) {
						// Next non-whitespace character is '{' — parse as server block
						return this.parseServerBlock();
					}
					// Otherwise fall through to parse as expression statement (e.g., #server.fn().then(...))
				}

				if (this.value === 'component') {
					this.awaitPos = 0;
					return this.parseComponent({ requireName: true, declareName: true });
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
					return node;
				}

				// &[ or &{ at statement level — lazy destructuring assignment
				// e.g., &[data] = track(0); or &{x, y} = obj;
				if (this.type === tt.bitwiseAND) {
					const charAfterAmp = this.input.charCodeAt(this.end);
					if (charAfterAmp === 123 || charAfterAmp === 91) {
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

				// Inside a JS function body, parse `{...}` as a regular block statement,
				// even if the nearest `#path` entry is a Component/Element — we're in a
				// nested function callable, not in a template.
				if (
					this.#functionBodyDepth === 0 &&
					(parent?.type === 'Component' || parent?.type === 'Element')
				) {
					if (createNewLexicalScope === void 0) createNewLexicalScope = true;
					if (node === void 0) node = /** @type {AST.BlockStatement} */ (this.startNode());

					node.body = [];
					this.#allowDoubleQuotedTextChildAfterBrace = true;
					this.expect(tt.braceL);
					if (createNewLexicalScope) {
						this.enterScope(0);
					}
					this.parseTemplateBody(node.body);

					if (exitStrict) {
						this.strict = false;
					}
					this.exprAllowed = true;

					this.next();
					if (createNewLexicalScope) {
						this.exitScope();
					}
					return this.finishNode(node, 'BlockStatement');
				}

				return super.parseBlock(createNewLexicalScope, node, exitStrict);
			}
		}

		return /** @type {Parse.ParserConstructor} */ (TSRXParser);
	};
}
