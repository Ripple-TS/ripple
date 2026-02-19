/**
@import * as AST from 'estree'
@import * as ESTreeJSX from 'estree-jsx'
@import { Parse } from '#parser'
@import { RipplePluginConfig } from '#compiler';
@import { ParseOptions, RippleCompileError } from 'ripple/compiler'
 */

import * as acorn from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';
import { parse_style } from './style.js';
import { walk } from 'zimmerframe';
import { regex_newline_characters } from '../../../utils/patterns.js';
import { error } from '../../errors.js';

/**
 * @typedef {(BaseParser: typeof acorn.Parser) => typeof acorn.Parser} AcornPlugin
 */

const parser = /** @type {Parse.ParserConstructor} */ (
	/** @type {unknown} */ (
		acorn.Parser.extend(
			tsPlugin({ jsx: true }),
			/** @type {AcornPlugin} */ (/** @type {unknown} */ (RipplePlugin())),
		)
	)
);

/** @type {Parse.BindingType} */
const BINDING_TYPES = {
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
function DestructuringErrors() {
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
 * @param {AST.Identifier | ESTreeJSX.JSXIdentifier} node
 * @param {string} name
 */
function set_tracked_name(node, name) {
	node.name = name.slice(1);
	node.metadata ??= { path: [] };
	node.metadata.source_name = name;
}

/**
 * Convert JSX node types to regular JavaScript node types
 * @param {ESTreeJSX.JSXIdentifier | ESTreeJSX.JSXMemberExpression | AST.Node} node - The JSX node to convert
 * @returns {AST.Identifier | AST.MemberExpression | AST.Node} The converted node
 */
function convert_from_jsx(node) {
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
function skipWhitespace(parser) {
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
		// Only update curLine/lineStart if the tokenizer hasn't already
		// advanced past this position. When parser.pos > parser.start,
		// acorn's internal skipSpace() has already processed comments and
		// whitespace beyond where we stopped, so curLine/lineStart already
		// reflect a later (correct) position that we must not overwrite.
		if (parser.pos <= parser.start) {
			parser.curLine = lineInfo.line;
			parser.lineStart = parser.start - lineInfo.column;
		}
	}

	// After skipping whitespace, update startLoc to reflect our actual position
	// so the next node's start location is correct
	parser.startLoc = lineInfo || acorn.getLineInfo(parser.input, parser.start);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function isWhitespaceTextNode(node) {
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
 * @param {AST.Element} element
 * @param {ESTreeJSX.JSXOpeningElement} open
 */

/**
 * Acorn parser plugin for Ripple syntax extensions
 * @param {RipplePluginConfig} [config] - Plugin configuration
 * @returns {(Parser: Parse.ParserConstructor) => Parse.ParserConstructor} Parser extension function
 */
function RipplePlugin(config) {
	return (/** @type {Parse.ParserConstructor} */ Parser) => {
		const original = acorn.Parser.prototype;
		const tt = Parser.tokTypes || acorn.tokTypes;
		const tc = Parser.tokContexts || acorn.tokContexts;
		// Some parser constructors (e.g. via TS plugins) expose `tokContexts` without `b_stat`.
		// If we push an undefined context, Acorn's tokenizer will later crash reading `.override`.
		const b_stat = tc.b_stat || acorn.tokContexts.b_stat;
		const tstt = Parser.acornTypeScript.tokTypes;
		const tstc = Parser.acornTypeScript.tokContexts;

		class RippleParser extends Parser {
			/** @type {AST.Node[]} */
			#path = [];
			#commentContextId = 0;
			#loose = false;
			/** @type {RippleCompileError[] | undefined} */
			#errors = undefined;
			/** @type {string | null} */
			#filename = null;

			/**
			 * @param {Parse.Options} options
			 * @param {string} input
			 */
			constructor(options, input) {
				super(options, input);
				this.#loose = options?.rippleOptions.loose === true;
				this.#errors = options?.rippleOptions.errors;
				this.#filename = options?.rippleOptions.filename || null;
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
				if (this.#loose && node.params.length === 1 && node.extra?.trailingComma === undefined) {
					error(
						'This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma, as in `<T,>() => ...`.',
						this.#filename,
						node,
						this.#errors,
					);
				}
			}

			/**
			 * Override to allow `readonly` type modifier on any type in loose mode.
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

				if (this.#loose) {
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
							/** @type {AST.RippleProperty} */ (prop).value = component_node;
						} else if (isStringLiteral) {
							// For string literal names, consume 'component'
							// parse the string key, then parse component without name
							this.next(); // consume 'component'
							prop.key = /** @type {AST.Literal} */ (this.parseExprAtom());
							prop.computed = false;

							// Parse component without name (skipName: true)
							const component_node = this.parseComponent({ skipName: true });
							/** @type {AST.RippleProperty} */ (prop).value = component_node;
						} else {
							const component_node = this.parseComponent({ requireName: true });

							prop.key = /** @type {AST.Identifier} */ (component_node.id);
							/** @type {AST.RippleProperty} */ (prop).value = component_node;
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
							/** @type {AST.RippleMethodDefinition} */ (node).value = component_node;
						} else if (isStringLiteral) {
							// For string literal names, consume 'component'
							// parse the string key, then parse component without name
							this.next(); // consume 'component'
							node.key = /** @type {AST.Literal} */ (this.parseExprAtom());
							node.computed = false;

							// Parse component without name (skipName: true)
							const component_node = this.parseComponent({ skipName: true });
							/** @type {AST.RippleMethodDefinition} */ (node).value = component_node;
						} else {
							// Use parseComponent which handles consuming 'component', parsing name, params, and body
							const component_node = this.parseComponent({ requireName: true });

							node.key = /** @type {AST.Identifier} */ (component_node.id);
							/** @type {AST.RippleMethodDefinition} */ (node).value = component_node;
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
						/** @type {AST.Property} */ (prop).value.typeParameters = typeParameters;
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
			 * Get token from character code - handles Ripple-specific tokens
			 * @type {Parse.Parser['getTokenFromCode']}
			 */
			getTokenFromCode(code) {
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
						if (prevNonWhitespaceChar === 123 /* '{' */ || prevNonWhitespaceChar === 62 /* '>' */) {
							if (!isWhitespaceAfterLt) {
								++this.pos;
								return this.finishToken(tstt.jsxTagStart);
							}
						}

						// Check if we're inside a nested function (arrow function, function expression, etc.)
						// We need to distinguish between being inside a function vs just being in nested scopes
						// (like for loops, if blocks, JSX elements, etc.)
						const nestedFunctionContext = this.context.some((ctx) => ctx.token === 'function');

						// Inside nested functions, treat < as relational/generic operator
						// BUT: if the < is followed by /, it's a closing JSX tag, not a less-than operator
						const nextChar =
							this.pos + 1 < this.input.length ? this.input.charCodeAt(this.pos + 1) : -1;
						const isClosingTag = nextChar === 47; // '/'

						if (nestedFunctionContext && !isClosingTag) {
							// Inside function - treat as TypeScript generic, not JSX
							++this.pos;
							return this.finishToken(tt.relational, '<');
						}

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

						// Check if the character after < is not whitespace
						if (allWhitespace && this.pos + 1 < this.input.length) {
							const nextChar = this.input.charCodeAt(this.pos + 1);
							if (nextChar !== 32 && nextChar !== 9 && nextChar !== 10 && nextChar !== 13) {
								++this.pos;
								return this.finishToken(tstt.jsxTagStart);
							}
						}
					}
				}

				if (code === 35) {
					// # character
					// Look ahead to see if this is followed by [ for tuple syntax or 'server' keyword
					if (this.pos + 1 < this.input.length) {
						const nextChar = this.input.charCodeAt(this.pos + 1);
						if (nextChar === 91 || nextChar === 123) {
							// [ or { character
							// This is a tuple literal #[ or #{
							// Consume both # and [ or {
							++this.pos; // consume #
							++this.pos; // consume [ or {
							if (nextChar === 123) {
								return this.finishToken(tt.braceL, '#{');
							} else {
								return this.finishToken(tt.bracketL, '#[');
							}
						}

						// Check if this is #Map or #Set
						if (this.input.slice(this.pos, this.pos + 4) === '#Map') {
							const charAfter =
								this.pos + 4 < this.input.length ? this.input.charCodeAt(this.pos + 4) : -1;
							if (charAfter === 40 || charAfter === 60) {
								// ( or < character (for generics like #Map<string, number>)
								this.pos += 4; // consume '#Map'
								return this.finishToken(tt.name, '#Map');
							} else if (this.#loose) {
								// In loose mode, produce token even without parens (incomplete syntax)
								this.pos += 4; // consume '#Map'
								return this.finishToken(tt.name, '#Map');
							}
						}
						if (this.input.slice(this.pos, this.pos + 4) === '#Set') {
							const charAfter =
								this.pos + 4 < this.input.length ? this.input.charCodeAt(this.pos + 4) : -1;
							if (charAfter === 40 || charAfter === 60) {
								// ( or < character (for generics like #Set<number>)
								this.pos += 4; // consume '#Set'
								return this.finishToken(tt.name, '#Set');
							} else if (this.#loose) {
								// In loose mode, produce token even without parens (incomplete syntax)
								this.pos += 4; // consume '#Set'
								return this.finishToken(tt.name, '#Set');
							}
						}

						// Check if this is #server
						if (this.input.slice(this.pos, this.pos + 7) === '#server') {
							// Check that next char after 'server' is whitespace, {, . (dot), or EOF
							const charAfter =
								this.pos + 7 < this.input.length ? this.input.charCodeAt(this.pos + 7) : -1;
							if (
								charAfter === 123 || // {
								charAfter === 46 || // . (dot)
								charAfter === 32 || // space
								charAfter === 9 || // tab
								charAfter === 10 || // newline
								charAfter === 13 || // carriage return
								charAfter === -1 // EOF
							) {
								// { or . or whitespace or EOF
								this.pos += 7; // consume '#server'
								return this.finishToken(tt.name, '#server');
							}
						}

						if (this.input.slice(this.pos, this.pos + 6) === '#style') {
							// Check that next char after 'style' is . (dot), [, whitespace, or EOF
							const charAfter =
								this.pos + 6 < this.input.length ? this.input.charCodeAt(this.pos + 6) : -1;
							if (
								charAfter === 46 || // . (dot)
								charAfter === 91 || // [
								charAfter === 32 || // space
								charAfter === 9 || // tab
								charAfter === 10 || // newline
								charAfter === 13 || // carriage return
								charAfter === -1 // EOF
							) {
								// { or . or whitespace or EOF
								this.pos += 6; // consume '#style'
								return this.finishToken(tt.name, '#style');
							}
						}

						// Check if this is an invalid #Identifier pattern
						// Valid patterns: #[, #{, #Map(, #Map<, #Set(, #Set<, #server, #style
						// If we see # followed by an uppercase letter that isn't Map or Set, it's an error
						// In loose mode, allow incomplete identifiers like #M, #Ma, #S, #Se for autocomplete
						if (nextChar >= 65 && nextChar <= 90) {
							// A-Z
							// Extract the identifier name
							let identEnd = this.pos + 1;
							while (identEnd < this.input.length) {
								const ch = this.input.charCodeAt(identEnd);
								if (
									(ch >= 65 && ch <= 90) ||
									(ch >= 97 && ch <= 122) ||
									(ch >= 48 && ch <= 57) ||
									ch === 95
								) {
									// A-Z, a-z, 0-9, _
									identEnd++;
								} else {
									break;
								}
							}
							const identName = this.input.slice(this.pos + 1, identEnd);
							if (identName !== 'Map' && identName !== 'Set') {
								// In loose mode, allow incomplete identifiers (prefixes of Map/Set)
								// This supports autocomplete scenarios where user is still typing
								const isIncompleteMap = 'Map'.startsWith(identName);
								const isIncompleteSet = 'Set'.startsWith(identName);

								if (!this.#loose || (!isIncompleteMap && !isIncompleteSet)) {
									this.raise(
										this.pos,
										`Invalid tracked syntax '#${identName}'. Only #Map and #Set are currently supported using shorthand tracked syntax.`,
									);
								} else {
									// In loose mode with valid prefix, consume the token and return it
									// This allows the parser to handle incomplete syntax gracefully
									this.pos = identEnd; // consume '#' + identifier
									return this.finishToken(tt.name, '#' + identName);
								}
							}
						}

						// In loose mode, handle bare # or # followed by unrecognized characters
						if (this.#loose) {
							this.pos++; // consume '#'
							return this.finishToken(tt.name, '#');
						}
					} else if (this.#loose) {
						// In loose mode, handle bare # at EOF
						this.pos++; // consume '#'
						return this.finishToken(tt.name, '#');
					}
				}
				if (code === 64) {
					// @ character
					// Look ahead to see if this is followed by a valid identifier character or opening paren
					if (this.pos + 1 < this.input.length) {
						const nextChar = this.input.charCodeAt(this.pos + 1);

						// Check if this is @( for unboxing expression syntax
						if (nextChar === 40) {
							// ( character
							this.pos += 2; // skip '@('
							return this.finishToken(tt.parenL, '@(');
						}

						// Check if the next character can start an identifier
						if (
							(nextChar >= 65 && nextChar <= 90) || // A-Z
							(nextChar >= 97 && nextChar <= 122) || // a-z
							nextChar === 95 ||
							nextChar === 36
						) {
							// _ or $

							// Check if we're in an expression context
							// In JSX expressions, inside parentheses, assignments, etc.
							// we want to treat @ as an identifier prefix rather than decorator
							const currentType = this.type;
							/**
							 * @param {Parse.TokenType} type
							 * @param {Parse.Parser} parser
							 * @param {Parse.TokTypes} tt
							 * @returns {boolean}
							 */
							function inExpression(type, parser, tt) {
								return (
									parser.exprAllowed ||
									type === tt.braceL || // Inside { }
									type === tt.parenL || // Inside ( )
									type === tt.eq || // After =
									type === tt.comma || // After ,
									type === tt.colon || // After :
									type === tt.question || // After ?
									type === tt.logicalOR || // After ||
									type === tt.logicalAND || // After &&
									type === tt.dot || // After . (for member expressions like obj.@prop)
									type === tt.questionDot // After ?. (for optional chaining like obj?.@prop)
								);
							}

							/**
							 * @param {Parse.Parser} parser
							 * @param {Parse.TokTypes} tt
							 * @returns {boolean}
							 */
							function inAwait(parser, tt) {
								return currentType === tt.name &&
									parser.value === 'await' &&
									parser.canAwait &&
									parser.preToken
									? inExpression(parser.preToken, parser, tt)
									: false;
							}

							if (inExpression(currentType, this, tt) || inAwait(this, tt)) {
								return this.readAtIdentifier();
							}
						}
					}
				}
				return super.getTokenFromCode(code);
			}

			/**
			 * Read an @ prefixed identifier
			 * @type {Parse.Parser['readAtIdentifier']}
			 */
			readAtIdentifier() {
				const start = this.pos;
				this.pos++; // skip '@'

				// Read the identifier part manually
				let word = '';
				while (this.pos < this.input.length) {
					const ch = this.input.charCodeAt(this.pos);
					if (
						(ch >= 65 && ch <= 90) || // A-Z
						(ch >= 97 && ch <= 122) || // a-z
						(ch >= 48 && ch <= 57) || // 0-9
						ch === 95 ||
						ch === 36
					) {
						// _ or $
						word += this.input[this.pos++];
					} else {
						break;
					}
				}

				if (word === '') {
					this.raise(start, 'Invalid @ identifier');
				}

				// Return the full identifier including @
				return this.finishToken(tt.name, '@' + word);
			}

			/**
			 * Override parseIdent to mark @ identifiers as tracked
			 * @type {Parse.Parser['parseIdent']}
			 */
			parseIdent(liberal) {
				const node = /** @type {AST.Identifier &AST.NodeWithLocation} */ (
					super.parseIdent(liberal)
				);
				if (node.name && node.name.startsWith('@')) {
					set_tracked_name(node, node.name);
					node.tracked = true;
				}
				return node;
			}

			/**
			 * Override parseSubscripts to handle `.@[expression]` syntax for reactive computed member access
			 * @type {Parse.Parser['parseSubscripts']}
			 */
			parseSubscripts(
				base,
				startPos,
				startLoc,
				noCalls,
				maybeAsyncArrow,
				optionalChained,
				forInit,
			) {
				// Check for `.@[` pattern for reactive computed member access
				const isDotOrOptional = this.type === tt.dot || this.type === tt.questionDot;

				if (isDotOrOptional) {
					// Check the next two characters without consuming tokens
					// this.pos currently points AFTER the dot token
					const nextChar = this.input.charCodeAt(this.pos);
					const charAfter = this.input.charCodeAt(this.pos + 1);

					// Check for @[ pattern (@ = 64, [ = 91)
					if (nextChar === 64 && charAfter === 91) {
						const node = /** @type {AST.MemberExpression} */ (this.startNodeAt(startPos, startLoc));
						node.object = base;
						node.computed = true;
						node.optional = this.type === tt.questionDot;
						node.tracked = true;

						// Consume the dot/questionDot token
						this.next();

						// Manually skip the @ character
						this.pos += 1;

						// Now call finishToken to properly consume the [ bracket
						this.finishToken(tt.bracketL);

						// Now we're positioned correctly to parse the expression
						this.next(); // Move to first token inside brackets

						// Parse the expression inside brackets
						node.property = this.parseExpression();

						// Expect closing bracket
						this.expect(tt.bracketR);

						// Finish this MemberExpression node
						base = /** @type {AST.MemberExpression} */ (this.finishNode(node, 'MemberExpression'));

						// Recursively handle any further subscripts (chaining)
						return this.parseSubscripts(
							base,
							startPos,
							startLoc,
							noCalls,
							maybeAsyncArrow,
							optionalChained,
							forInit,
						);
					}
				}

				// Fall back to default parseSubscripts implementation
				return super.parseSubscripts(
					base,
					startPos,
					startLoc,
					noCalls,
					maybeAsyncArrow,
					optionalChained,
					forInit,
				);
			}

			/**
			 * Parse expression atom - handles TrackedArray and TrackedObject literals
			 * @type {Parse.Parser['parseExprAtom']}
			 */
			parseExprAtom(refDestructuringErrors, forNew, forInit) {
				// Check if this is @(expression) for unboxing tracked values
				if (this.type === tt.parenL && this.value === '@(') {
					return this.parseTrackedExpression();
				}

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

				// Check if this is #Map( or #Set(
				if (this.type === tt.name && (this.value === '#Map' || this.value === '#Set')) {
					const type = this.value === '#Map' ? 'TrackedMapExpression' : 'TrackedSetExpression';
					return this.parseTrackedCollectionExpression(type);
				}

				// In loose mode, handle incomplete #Map/#Set prefixes (e.g., #M, #Ma, #S, #Se)
				if (
					this.#loose &&
					this.type === tt.name &&
					typeof this.value === 'string' &&
					this.value.startsWith('#')
				) {
					// Return an Identifier node for incomplete tracked syntax
					const node = /** @type {AST.Identifier} */ (this.startNode());
					node.name = this.value;
					this.next();
					return this.finishNode(node, 'Identifier');
				}

				// Check if this is a tuple literal starting with #[
				if (this.type === tt.bracketL && this.value === '#[') {
					return this.parseTrackedArrayExpression();
				} else if (this.type === tt.braceL && this.value === '#{') {
					return this.parseTrackedObjectExpression();
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
			 * Parse `@(expression)` syntax for unboxing tracked values
			 * Creates a TrackedExpression node with the argument property
			 * @type {Parse.Parser['parseTrackedExpression']}
			 */
			parseTrackedExpression() {
				const node = /** @type {AST.TrackedExpression} */ (this.startNode());
				this.next(); // consume '@(' token
				node.argument = this.parseExpression();
				this.expect(tt.parenR); // expect ')'
				return this.finishNode(node, 'TrackedExpression');
			}

			/**
			 * Override to allow TrackedExpression as a valid lvalue for update expressions
			 * @type {Parse.Parser['checkLValSimple']}
			 */
			checkLValSimple(expr, bindingType, checkClashes) {
				// Allow TrackedExpression as a valid lvalue for ++/-- operators
				if (expr.type === 'TrackedExpression') {
					return;
				}
				return super.checkLValSimple(expr, bindingType, checkClashes);
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
			 * Parse `#Map(...)` or `#Set(...)` syntax for tracked collections
			 * Creates a TrackedMap or TrackedSet node with the arguments property
			 * @type {Parse.Parser['parseTrackedCollectionExpression']}
			 */
			parseTrackedCollectionExpression(type) {
				const node =
					/** @type {(AST.TrackedMapExpression | AST.TrackedSetExpression) & AST.NodeWithLocation} */ (
						this.startNode()
					);
				this.next(); // consume '#Map' or '#Set'

				// Check if we should NOT consume the parentheses
				// This happens when #Map/#Set appears as a callee in 'new #Map(...)'
				// In this case, the parentheses and arguments belong to the NewExpression
				// We detect this by checking if next token is '(' but we just consumed a token
				// that came right after 'new' keyword (indicated by context or recent token)

				// Simple heuristic: if the input around our start position looks like 'new #Map('
				// then don't consume the parens
				const beforeStart = this.input.substring(Math.max(0, node.start - 5), node.start);
				const isAfterNew = /new\s*$/.test(beforeStart);

				if (!isAfterNew) {
					// If we reach here, it means #Map or #Set is being called without 'new'
					// Throw a TypeError to match JavaScript class constructor behavior
					const constructorName =
						type === 'TrackedMapExpression' ? '#Map (TrackedMap)' : '#Set (TrackedSet)';
					this.raise(
						node.start,
						`TypeError: Class constructor ${constructorName} cannot be invoked without 'new'`,
					);
				}

				// Don't consume parens or generics - they belong to NewExpression
				// When used as "new #Map(...)" the next token is '('
				// When used as "new #Map<K,V>(...)" the next token is '<' (relational)
				if (this.type === tt.parenL || (this.type === tt.relational && this.value === '<')) {
					node.arguments = [];
					return this.finishNode(node, type);
				}

				this.expect(tt.parenL); // expect '('

				node.arguments = [];
				// Parse arguments similar to function call arguments
				let first = true;
				while (!this.eat(tt.parenR)) {
					if (!first) {
						this.expect(tt.comma);
						if (this.afterTrailingComma(tt.parenR)) break;
					} else {
						first = false;
					}

					if (this.type === tt.ellipsis) {
						// Spread argument
						const arg = this.parseSpread();
						node.arguments.push(arg);
					} else {
						// Regular argument
						node.arguments.push(this.parseMaybeAssign(false));
					}
				}

				return this.finishNode(node, type);
			}

			/**
			 * @type {Parse.Parser['parseTrackedArrayExpression']}
			 */
			parseTrackedArrayExpression() {
				const node = /** @type {AST.TrackedArrayExpression} */ (this.startNode());
				this.next(); // consume the '#['

				node.elements = [];

				// Parse array elements similar to regular array parsing
				let first = true;
				while (!this.eat(tt.bracketR)) {
					if (!first) {
						this.expect(tt.comma);
						if (this.afterTrailingComma(tt.bracketR)) break;
					} else {
						first = false;
					}

					if (this.type === tt.comma) {
						// Hole in array
						node.elements.push(null);
					} else if (this.type === tt.ellipsis) {
						// Spread element
						const element = this.parseSpread();
						node.elements.push(element);
						if (this.type === tt.comma && this.input.charCodeAt(this.pos) === 93) {
							this.raise(this.pos, 'Trailing comma is not permitted after the rest element');
						}
					} else {
						// Regular element
						node.elements.push(this.parseMaybeAssign(false));
					}
				}

				return this.finishNode(node, 'TrackedArrayExpression');
			}

			/**
			 * @type {Parse.Parser['parseTrackedObjectExpression']}
			 */
			parseTrackedObjectExpression() {
				const node = /** @type {AST.TrackedObjectExpression} */ (this.startNode());
				this.next(); // consume the '#{'

				node.properties = [];

				// Parse object properties similar to regular object parsing
				let first = true;
				while (!this.eat(tt.braceR)) {
					if (!first) {
						this.expect(tt.comma);
						if (this.afterTrailingComma(tt.braceR)) break;
					} else {
						first = false;
					}

					if (this.type === tt.ellipsis) {
						// Spread property
						const prop = this.parseSpread();
						node.properties.push(prop);
						if (this.type === tt.comma && this.input.charCodeAt(this.pos) === 125) {
							this.raise(this.pos, 'Trailing comma is not permitted after the rest element');
						}
					} else {
						// Regular property
						node.properties.push(this.parseProperty(false, new DestructuringErrors()));
					}
				}

				return this.finishNode(node, 'TrackedObjectExpression');
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
							BINDING_TYPES.BIND_VAR,
							/** @type {AST.NodeWithLocation} */ (node.id).start,
						);
					}
				} else {
					node.id = this.type.label === 'name' ? this.parseIdent() : null;
					if (declareName && node.id) {
						this.declareName(
							node.id.name,
							BINDING_TYPES.BIND_VAR,
							/** @type {AST.NodeWithLocation} */ (node.id).start,
						);
					}
				}

				this.parseFunctionParams(node);
				this.eat(tt.braceL);
				node.body = [];
				this.#path.push(node);

				this.parseTemplateBody(node.body);
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
				let refDestructuringErrors = new DestructuringErrors();
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
				let tracked = false;

				if (this.value === 'html') {
					node.html = true;
					this.next();
					if (this.type === tt.braceR) {
						this.raise(
							this.start,
							'"html" is a Ripple keyword and must be used in the form {html some_content}',
						);
					}
					if (this.type.label === '@') {
						this.next(); // consume @
						tracked = true;
					}
				}

				node.expression =
					this.type === tt.braceR ? this.jsx_parseEmptyExpression() : this.parseExpression();
				this.expect(tt.braceR);

				if (tracked && node.expression.type === 'Identifier') {
					node.expression.tracked = true;
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
				let node = /** @type {AST.RippleAttribute | ESTreeJSX.JSXAttribute} */ (this.startNode());

				if (this.eat(tt.braceL)) {
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
						if (id.name.startsWith('@')) {
							set_tracked_name(id, id.name);
							id.tracked = true;
						}
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
				} else if (
					(this.type === tt.name || this.type === tstt.jsxName) &&
					this.value &&
					/** @type {string} */ (this.value).startsWith('@')
				) {
					set_tracked_name(node, /** @type {string} */ (this.value));
					node.tracked = true;
					this.next();
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

					// Check for .@[expression] syntax for tracked computed member access
					// After eating the dot, check if the current token is @ followed by [
					if (this.type.label === '@') {
						// Check if the next character after @ is [
						const nextChar = this.input.charCodeAt(this.pos);

						if (nextChar === 91) {
							// [ character
							memberExpr.computed = true;

							// Consume the @ token
							this.next();

							// Now this.type should be bracketL
							// Consume the [ and parse the expression inside
							this.expect(tt.bracketL);

							// Parse the expression inside brackets
							memberExpr.property = /** @type {ESTreeJSX.JSXIdentifier} */ (this.parseExpression());
							/** @type {AST.TrackedNode} */ (memberExpr.property).tracked = true;

							// Expect closing bracket
							this.expect(tt.bracketR);
						} else {
							// @ not followed by [, treat as regular tracked identifier
							memberExpr.property = this.jsx_parseIdentifier();
							memberExpr.computed = false;
						}
					} else {
						// Regular dot notation
						memberExpr.property = this.jsx_parseIdentifier();
						memberExpr.computed = false;
					}
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
					return this.finishNode(memberExpr, 'JSXMemberExpression');
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
						clause.param = this.parseCatchClauseParam();
					} else {
						if (this.options.ecmaVersion < 10) {
							this.unexpected();
						}
						clause.param = null;
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
				const inside_tsx_compat = this.#path.findLast((n) => n.type === 'TsxCompat');
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
			 * @type {Parse.Parser['parseElement']}
			 */
			parseElement() {
				const inside_head = this.#path.findLast(
					(n) => n.type === 'Element' && n.id.type === 'Identifier' && n.id.name === 'head',
				);
				// Adjust the start so we capture the `<` as part of the element
				const start = this.start - 1;
				const position = new acorn.Position(this.curLine, start - this.lineStart);

				const element = /** @type {AST.Element | AST.TsxCompat} */ (this.startNode());
				element.start = start;
				/** @type {AST.NodeWithLocation} */ (element).loc.start = position;
				element.metadata = { path: [] };
				element.children = [];

				const open = /** @type {ESTreeJSX.JSXOpeningElement & AST.NodeWithLocation} */ (
					this.jsx_parseOpeningElementAt(start, position)
				);

				// Always attach the concrete opening element node for accurate source mapping
				element.openingElement = open;

				// Check if this is a namespaced element (tsx:react)
				const is_tsx_compat = open.name.type === 'JSXNamespacedName';

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
								/** @type {ESTreeJSX.JSXExpressionContainer['expression']} */ (attr.value) =
									expression;
							}
						}
					}
				}

				if (!is_tsx_compat) {
					/** @type {AST.Element} */ (element).id = /** @type {AST.Identifier} */ (
						convert_from_jsx(/** @type {ESTreeJSX.JSXIdentifier} */ (open.name))
					);
					element.selfClosing = open.selfClosing;
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
								/** @type {AST.ScriptContent} */ ({
									type: 'ScriptContent',
									content,
									start,
									end: closingStart,
									loc: { start: contentStartLoc, end: contentEndLoc },
								}),
							];

							this.#path.pop();
						} else {
							// No closing tag
							if (!this.#loose) {
								this.raise(
									open.end,
									"Unclosed tag '<script>'. Expected '</script>' before end of component.",
								);
							}
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
							if (!this.#loose) {
								this.raise(
									open.end,
									"Unclosed tag '<style>'. Expected '</style>' before end of component.",
								);
							}
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
							parent?.type === 'TsxCompat';

						if (curContext === tstc.tc_expr && !insideTemplate) {
							this.context.pop();
						}

						/** @type {AST.Element} */ (element).css = content;
					} else {
						this.enterScope(0);
						this.parseTemplateBody(/** @type {AST.Element} */ (element).children);
						this.exitScope();

						if (element.type === 'TsxCompat') {
							this.#path.pop();

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
						} else if (this.#path[this.#path.length - 1] === element) {
							// Check if this element was properly closed
							if (!this.#loose) {
								const tagName = this.getElementName(element.id);
								this.raise(
									this.start,
									`Unclosed tag '<${tagName}>'. Expected '</${tagName}>' before end of component.`,
								);
							} else {
								element.unclosed = true;
								element.loc.end = {
									.../** @type {AST.SourceLocation} */ (element.openingElement.loc).end,
								};
								element.end = element.openingElement.end;
								this.#path.pop();
							}
						}
					}

					// Ensure we escape JSX <tag></tag> context
					const curContext = this.curContext();
					const parent = this.#path.at(-1);
					const insideTemplate =
						parent?.type === 'Component' ||
						parent?.type === 'Element' ||
						parent?.type === 'TsxCompat';

					if (curContext === tstc.tc_expr && !insideTemplate) {
						this.context.pop();
					}
				}

				if (element.closingElement && !is_tsx_compat) {
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
				const inside_tsx_compat = this.#path.findLast((n) => n.type === 'TsxCompat');

				if (!inside_func) {
					if (this.type.label === 'continue') {
						throw new Error('`continue` statements are not allowed in components');
					}
					if (this.type.label === 'break') {
						throw new Error('`break` statements are not allowed in components');
					}
				}

				if (inside_tsx_compat) {
					this.exprAllowed = true;

					while (true) {
						if (this.input.slice(this.pos, this.pos + 5) === '/tsx:') {
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

								// Stop at opening tag, closing tag, or expression
								if (ch === 60 || ch === 123) {
									// < or {
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
					// but convert other expressions to Text/Html nodes
					if (node.expression.type !== 'JSXEmptyExpression') {
						/** @type {AST.Html | AST.TextNode} */ (/** @type {unknown} */ (node)).type = node.html
							? 'Html'
							: 'Text';
						delete node.html;
					}
					body.push(node);
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
							(currentElement.type !== 'Element' && currentElement.type !== 'TsxCompat')
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
						} else {
							// Regular Element node
							openingTagName = this.getElementName(currentElement.id);
							closingTagName =
								closingElement.name?.type === 'JSXNamespacedName'
									? closingElement.name.namespace.name + ':' + closingElement.name.name.name
									: this.getElementName(closingElement.name);
						}

						if (openingTagName !== closingTagName) {
							if (!this.#loose) {
								this.raise(
									closingElement.start,
									`Expected closing tag to match opening tag. Expected '</${openingTagName}>' but found '</${closingTagName}>'`,
								);
							} else {
								// Loop through all unclosed elements on the stack
								while (this.#path.length > 0) {
									const elem = this.#path[this.#path.length - 1];

									// Stop at non-Element boundaries (Component, etc.)
									if (elem.type !== 'Element' && elem.type !== 'TsxCompat') {
										break;
									}

									const elemName =
										elem.type === 'TsxCompat' ? 'tsx:' + elem.kind : this.getElementName(elem.id);

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
						}

						const elementToClose = this.#path[this.#path.length - 1];
						if (elementToClose && elementToClose.type === 'Element') {
							const elementToCloseName = this.getElementName(
								/** @type {AST.Element} */ (elementToClose).id,
							);
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
					this.context.at(-1) === b_stat &&
					this.type === tt.braceL &&
					this.context.some((c) => c === tstc.tc_expr)
				) {
					const node = this.jsx_parseExpressionContainer();
					// Keep JSXEmptyExpression as-is (don't convert to Text)
					if (node.expression.type !== 'JSXEmptyExpression') {
						/** @type {AST.TextNode} */ (/** @type {unknown} */ (node)).type = 'Text';
					}

					return /** @type {ESTreeJSX.JSXEmptyExpression | AST.TextNode | ESTreeJSX.JSXExpressionContainer} */ (
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
				if (this.type.label === '@') {
					// Try to parse as an expression statement first using tryParse
					// This allows us to handle Ripple @ syntax like @count++ without
					// interfering with legitimate decorator syntax
					this.skip_decorator = true;
					const expressionResult = this.tryParse(() => {
						const node = /** @type {AST.ExpressionStatement} */ (this.startNode());
						this.next();
						// Force expression context to ensure @ is tokenized correctly
						const old_expr_allowed = this.exprAllowed;
						this.exprAllowed = true;
						node.expression = this.parseExpression();

						if (node.expression.type === 'UpdateExpression') {
							/** @type {AST.Expression} */
							let object = node.expression.argument;
							while (object.type === 'MemberExpression') {
								object = /** @type {AST.Expression} */ (object.object);
							}
							if (object.type === 'Identifier') {
								object.tracked = true;
							}
						} else if (node.expression.type === 'AssignmentExpression') {
							/** @type {AST.Expression | AST.Pattern | AST.Identifier} */
							let object = node.expression.left;
							while (object.type === 'MemberExpression') {
								object = /** @type {AST.Expression} */ (object.object);
							}
							if (object.type === 'Identifier') {
								object.tracked = true;
							}
						} else if (node.expression.type === 'Identifier') {
							node.expression.tracked = true;
						} else {
							// TODO?
						}

						this.exprAllowed = old_expr_allowed;
						return this.finishNode(node, 'ExpressionStatement');
					});
					this.skip_decorator = false;

					// If parsing as expression statement succeeded, use that result
					if (expressionResult.node) {
						return expressionResult.node;
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
					return node;
				}

				return super.parseStatement(context, topLevel, exports);
			}

			/**
			 * @type {Parse.Parser['parseBlock']}
			 */
			parseBlock(createNewLexicalScope, node, exitStrict) {
				const parent = this.#path.at(-1);

				if (parent?.type === 'Component' || parent?.type === 'Element') {
					if (createNewLexicalScope === void 0) createNewLexicalScope = true;
					if (node === void 0) node = /** @type {AST.BlockStatement} */ (this.startNode());

					node.body = [];
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

		return /** @type {Parse.ParserConstructor} */ (RippleParser);
	};
}

/**
 * Acorn doesn't add comments to the AST by itself. This factory returns the capabilities
 * to add them after the fact. They are needed in order to support `ripple-ignore` comments
 * in JS code and so that `prettier-plugin` doesn't remove all comments when formatting.
 * @param {string} source
 * @param {AST.CommentWithLocation[]} comments
 * @param {number} [index=0] - Starting index
 * @returns {{onComment: Parse.Options['onComment'], add_comments: (ast: AST.Node) => void}}
 */
function get_comment_handlers(source, comments, index = 0) {
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
		 * @param {AST.Node} ast
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
					const metadata = node?.metadata;

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
							// we would definitely reach the attribute first before getting to the element
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
							!element.closingElement ||
							!(
								comment.start >= /** @type {AST.NodeWithLocation} */ (element.openingElement).end &&
								comment.end <= /** @type {AST.NodeWithLocation} */ (element).end
							)
						) {
							return null;
						}

						return element;
					}

					if (metadata && metadata.commentContainerId !== undefined) {
						// For empty template elements, keep comments as `innerComments`.
						// The Prettier plugin uses `innerComments` to preserve them and
						// to avoid collapsing the element into self-closing syntax.
						const isEmptyElement =
							node.type === 'Element' && (!node.children || node.children.length === 0);
						if (!isEmptyElement) {
							while (
								comments[0] &&
								comments[0].context &&
								comments[0].context.containerId === metadata.commentContainerId &&
								comments[0].context.beforeMeaningfulChild
							) {
								const elementComment = /** @type {AST.CommentWithLocation} */ (comments.shift());

								(metadata.elementLeadingComments ||= []).push(elementComment);
							}
						}
					}

					while (
						comments[0] &&
						comments[0].start < /** @type {AST.NodeWithLocation} */ (node).start
					) {
						// Skip comments that are inside an attribute of an ancestor Element.
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
							(maybeInner.innerComments ||= []).push(
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

						const ancestorElements = /** @type {(AST.Element & AST.NodeWithLocation)[]} */ (
							path.filter((ancestor) => ancestor && ancestor.type === 'Element' && ancestor.loc)
						).sort((a, b) => a.loc.start.line - b.loc.start.line);

						const targetAncestor = ancestorElements.find(
							(ancestor) => comment.loc.start.line < ancestor.loc.start.line,
						);

						if (targetAncestor) {
							targetAncestor.metadata ??= { path: [] };
							(targetAncestor.metadata.elementLeadingComments ||= []).push(comment);
							continue;
						}

						(node.leadingComments ||= []).push(comment);
					}

					next();

					if (comments[0]) {
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
						// Handle empty Element nodes the same way as empty BlockStatements
						if (node.type === 'Element' && (!node.children || node.children.length === 0)) {
							// Collect all comments that fall within this empty element
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

							if (
								parent.type === 'BlockStatement' ||
								parent.type === 'Program' ||
								parent.type === 'Component' ||
								parent.type === 'ClassBody'
							) {
								node_array = parent.body;
							} else if (parent.type === 'SwitchStatement') {
								node_array = parent.cases;
								isSwitchCaseSibling = true;
							} else if (parent.type === 'SwitchCase') {
								node_array = parent.consequent;
							} else if (
								parent.type === 'ArrayExpression' ||
								parent.type === 'TrackedArrayExpression'
							) {
								node_array = parent.elements;
							} else if (
								parent.type === 'ObjectExpression' ||
								parent.type === 'TrackedObjectExpression'
							) {
								node_array = parent.properties;
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

							if (node_array && Array.isArray(node_array)) {
								is_last_in_array = node_array.indexOf(node) === node_array.length - 1;
							}

							if (is_last_in_array) {
								if (isParam || isArgument) {
									while (comments.length) {
										const potentialComment = comments[0];
										if (parent && potentialComment.start >= parent.end) {
											break;
										}

										const maybeInner = getEmptyElementInnerCommentTarget(potentialComment);
										if (maybeInner) {
											(maybeInner.innerComments ||= []).push(
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
										if (parent && comment.start >= parent.end) break;

										const maybeInner = getEmptyElementInnerCommentTarget(comment);
										if (maybeInner) {
											(maybeInner.innerComments ||= []).push(
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
									(maybeInner.innerComments ||= []).push(
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
									// not for Element children or other contexts
									const isStatementContext =
										parent.type === 'BlockStatement' || parent.type === 'Program';

									// Don't apply for Component - let Prettier handle comment attachment there
									// Component bodies have different comment handling via metadata.elementLeadingComments
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
											// Don't attach comments as trailing if next sibling is an Element
											// and any comment falls within the Element's line range
											// This means the comments are inside the Element (between opening and closing tags)
											const nextIsElement = nextSibling.type === 'Element';
											const commentsInsideElement =
												nextIsElement &&
												nextSibling.loc &&
												comments.some((c) => {
													if (!c.loc) return false;
													// Check if comment is on a line between Element's start and end lines
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

/**
 * Parse Ripple source code into an AST
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
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
		// Copy comments to output array
		// as add_comments modifies the original array (e.g. shift)
		for (let i = 0; i < comments.length; i++) {
			output_comments.push(comments[i]);
		}
	}

	add_comments(ast);

	return ast;
}
