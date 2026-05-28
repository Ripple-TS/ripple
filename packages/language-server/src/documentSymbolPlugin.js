/** @import * as AST from 'estree' */
/** @import { LanguageServicePlugin } from '@volar/language-server' */
/** @import { DocumentSymbol, Mapper, Range, SymbolKind as SymbolKindType } from '@volar/language-server' */
/** @import { CodeInformation } from '@volar/language-core'; */
/** @import { TSRXVirtualCodeInstance } from '@tsrx/typescript-plugin/src/language.js'; */
/** @import { CodeMapping } from '@tsrx/core/types'; */

import { getVirtualCode, is_ripple_document, createLogging } from './utils.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolKind } from '@volar/language-server';
import { builders as b } from '@tsrx/core';

/**
 * @typedef {AST.Node & {
 * 	body?: AST.Node[] | { body?: AST.Node[] };
 * }} NodeWithBody;
 */

/**
 * @typedef {AST.Node & {
 * 	id?: AST.Identifier
 * }} NodeWithId;
 */

/**
 * @typedef {[
 * Omit<DocumentSymbol, 'children'> & { children: SymbolInfo[] }, {
 * 	rangeNode: AST.Node;
 * 	selectionNode: AST.Node;
 * }]} SymbolInfo;
 */

const { log, logError } = createLogging('[Ripple Document Symbol Plugin]');
/** @type {Map<string, DocumentSymbol[]>} */
const documentSymbolCache = new Map();

/**
 * @returns {LanguageServicePlugin}
 */
export function createDocumentSymbolPlugin() {
	return {
		name: 'ripple-document-symbol',
		capabilities: {
			documentSymbolProvider: true,
		},
		create(context) {
			return {
				async provideDocumentSymbols(document) {
					if (!is_ripple_document(document.uri)) {
						// we're not processing any non-tsrx documents
						return [];
					}

					const { virtualCode, sourceMap, sourceUri } = getVirtualCode(document, context);
					const { sourceAst, languageId, originalCode } = virtualCode || {};

					if (languageId !== 'ripple') {
						log(`Skipping symbols in the '${languageId}' context`);
						return [];
					}

					const cacheKey = sourceUri.toString();
					const cachedSymbols = documentSymbolCache.get(cacheKey) ?? [];

					if (virtualCode?.fatalErrors?.length || virtualCode?.isDotCompletionMode) {
						return cachedSymbols;
					}

					// Successful virtual code should have both, but Volar's
					// map lookup and the virtual code type still expose them as optional.
					if (!sourceMap || !sourceAst) {
						return [];
					}

					const sourceDocument = TextDocument.create(
						sourceUri.toString(),
						'ripple',
						0,
						originalCode,
					);

					const symbols = mapDocumentSymbolsToGenerated(
						collectDocumentSymbols(sourceAst, sourceDocument),
						virtualCode,
						sourceDocument,
						document,
						sourceMap,
					);
					documentSymbolCache.set(cacheKey, symbols);
					return symbols;
				},
			};
		},
	};
}

/**
 * @param {SymbolInfo[]} symbols
 * @param {TSRXVirtualCodeInstance} virtualCode
 * @param {TextDocument} sourceDocument
 * @param {TextDocument} generatedDocument
 * @param {Mapper} sourceMap
 * @returns {DocumentSymbol[]}
 */
function mapDocumentSymbolsToGenerated(
	symbols,
	virtualCode,
	sourceDocument,
	generatedDocument,
	sourceMap,
) {
	/** @type {DocumentSymbol[]} */
	const mapped = [];
	/** @type {CodeMapping | null} */
	let mapping = null;

	for (const [symbol, { rangeNode, selectionNode }] of symbols) {
		/** @type {Range | null} */
		let generatedSelectionRange = null;
		mapping = virtualCode.findMappingBySourceRange(
			/** @type {AST.NodeWithLocation} */ (selectionNode).start,
			/** @type {AST.NodeWithLocation} */ (selectionNode).end,
		);
		if (mapping && isSymbolMapping(mapping.data)) {
			generatedSelectionRange = {
				start: generatedDocument.positionAt(mapping.generatedOffsets[0]),
				end: generatedDocument.positionAt(
					mapping.generatedOffsets[0] + mapping.generatedLengths[0],
				),
			};
		}

		if (!generatedSelectionRange) {
			generatedSelectionRange = sourceRangeToGeneratedRange(
				symbol.selectionRange,
				sourceDocument,
				generatedDocument,
				sourceMap,
			);
		}

		if (!generatedSelectionRange) {
			continue;
		}

		const children = symbol.children
			? mapDocumentSymbolsToGenerated(
					symbol.children,
					virtualCode,
					sourceDocument,
					generatedDocument,
					sourceMap,
				)
			: undefined;

		/** @type {Range | null} */
		let generatedRange = null;

		mapping = virtualCode.findMappingBySourceRange(
			/** @type {AST.NodeWithLocation} */ (rangeNode).start,
			/** @type {AST.NodeWithLocation} */ (rangeNode).end,
		);

		if (mapping && isSymbolMapping(mapping.data)) {
			generatedRange = {
				start: generatedDocument.positionAt(mapping.generatedOffsets[0]),
				end: generatedDocument.positionAt(
					mapping.generatedOffsets[0] + mapping.generatedLengths[0],
				),
			};
		}

		if (!generatedRange) {
			generatedRange = sourceRangeToGeneratedRange(
				symbol.range,
				sourceDocument,
				generatedDocument,
				sourceMap,
			);
		}

		if (!generatedRange) {
			generatedRange = generatedSelectionRange;
			if (children?.length) {
				generatedRange = ensureRangeContainsChildren(generatedRange, children);
			}
		}

		mapped.push({
			...symbol,
			range: generatedRange,
			selectionRange: generatedSelectionRange,
			children,
		});
	}
	return mapped;
}

/**
 * Breadcrumb providers expect parent symbol ranges to contain child symbol
 * ranges. Full component/function bodies may not have one continuous source
 * mapping after TSRX transforms, so widen the selection-range fallback around
 * any mapped child declarations.
 *
 * @param {Range} range
 * @param {DocumentSymbol[]} children
 * @returns {Range}
 */
function ensureRangeContainsChildren(range, children) {
	let start = range.start;
	let end = range.end;

	for (const child of children) {
		if (comparePositions(child.range.start, start) < 0) {
			start = child.range.start;
		}
		if (comparePositions(child.range.end, end) > 0) {
			end = child.range.end;
		}
	}

	return { start, end };
}

/**
 * @param {Range['start']} a
 * @param {Range['start']} b
 * @returns {number}
 */
function comparePositions(a, b) {
	return a.line === b.line ? a.character - b.character : a.line - b.line;
}

/**
 * @param {Range} range
 * @param {TextDocument} sourceDocument
 * @param {TextDocument} generatedDocument
 * @param {Mapper} sourceMap
 * @returns {Range | null}
 */
function sourceRangeToGeneratedRange(range, sourceDocument, generatedDocument, sourceMap) {
	const start = sourceDocument.offsetAt(range.start);
	const end = sourceDocument.offsetAt(range.end);
	for (const [generatedStart, generatedEnd] of sourceMap.toGeneratedRange(
		start,
		end,
		true,
		isSymbolMapping,
	)) {
		return {
			start: generatedDocument.positionAt(generatedStart),
			end: generatedDocument.positionAt(generatedEnd),
		};
	}
	return null;
}

/**
 * @param {CodeInformation} data
 * @returns {boolean}
 */
function isSymbolMapping(data) {
	return !!data.structure;
}

/**
 * @param {AST.Program} ast
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
export function collectDocumentSymbols(ast, document) {
	const body = Array.isArray(ast.body) ? ast.body : [];
	return collectSymbolsFromStatements(body, document);
}

/**
 * @param {AST.Node[]} statements
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function collectSymbolsFromStatements(statements, document) {
	/** @type {SymbolInfo[]} */
	const symbols = [];

	for (const statement of statements) {
		if (!statement) {
			continue;
		}

		if (
			statement.type === 'ExportNamedDeclaration' ||
			statement.type === 'ExportDefaultDeclaration'
		) {
			if (statement.declaration) {
				symbols.push(
					...createSymbolForDeclaration(
						/** @type {AST.Node} */ (statement.declaration),
						document,
						statement.type === 'ExportDefaultDeclaration' ? 'default' : undefined,
					),
				);
			}
			continue;
		}

		symbols.push(...createSymbolForDeclaration(statement, document));
	}

	return symbols;
}

/**
 * @param {AST.Node} node
 * @param {TextDocument} document
 * @param {string} [fallbackName]
 * @returns { SymbolInfo[]}
 */
function createSymbolForDeclaration(node, document, fallbackName) {
	const type = node.type;
	let id = /** @type {NodeWithId} */ (node).id ?? null;
	let name = id ? getIdentifierName(id) : null;

	switch (type) {
		case 'FunctionDeclaration': {
			const children = getChildSymbols(node, document);
			if (!id || !name) {
				if (fallbackName) {
					name = fallbackName;
					id = createFallbackIdentifierNode(node, 'function');
				} else {
					return children;
				}
			}

			return [createNamedNodeSymbol(name, SymbolKind.Function, node, id, document, children)];
		}
		case 'ClassDeclaration': {
			const children = getClassChildSymbols(node, document);
			if (!id || !name) {
				if (fallbackName) {
					name = fallbackName;
					id = createFallbackIdentifierNode(node, 'class');
				} else {
					return children;
				}
			}

			return [createNamedNodeSymbol(name, SymbolKind.Class, node, id, document, children)];
		}
		case 'VariableDeclaration': {
			return createVariableDeclarationSymbols(node, document);
		}
		case 'TSInterfaceDeclaration': {
			// default export cannot be unnamed
			if (!id || !name) {
				return [];
			}

			return [createNamedNodeSymbol(name, SymbolKind.Interface, node, id, document)];
		}
		case 'TSTypeAliasDeclaration': {
			// default export cannot be unnamed
			if (!id || !name) {
				return [];
			}

			return [createNamedNodeSymbol(name, SymbolKind.TypeParameter, node, id, document)];
		}
		default: {
			return [];
		}
	}
}

/**
 * @param {AST.VariableDeclaration} node
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function createVariableDeclarationSymbols(node, document) {
	const kind = node.kind === 'const' ? SymbolKind.Constant : SymbolKind.Variable;
	/** @type {SymbolInfo[]} */
	const symbols = [];

	for (const declaration of node.declarations) {
		if (declaration.id.type === 'Identifier') {
			symbols.push(
				createNamedNodeSymbol(
					declaration.id.name,
					kind,
					declaration,
					declaration.id,
					document,
					declaration.init ? getInitializerChildSymbols(declaration.init, document) : [],
				),
			);
			continue;
		}

		symbols.push(...createBindingPatternSymbols(declaration.id, kind, document));
	}

	return symbols;
}

/**
 * @param {AST.Pattern} pattern
 * @param {SymbolKindType} kind
 * @param {TextDocument} document
 * @param {AST.Node} [rangeNode]
 * @returns {SymbolInfo[]}
 */
function createBindingPatternSymbols(pattern, kind, document, rangeNode = pattern) {
	switch (pattern.type) {
		case 'Identifier': {
			return [createNamedNodeSymbol(pattern.name, kind, rangeNode, pattern, document)];
		}
		case 'ObjectPattern': {
			/** @type {SymbolInfo[]} */
			const symbols = [];

			for (const property of pattern.properties) {
				if (property.type === 'RestElement') {
					symbols.push(...createBindingPatternSymbols(property.argument, kind, document, property));
				} else {
					symbols.push(...createBindingPatternSymbols(property.value, kind, document, property));
				}
			}

			return symbols;
		}
		case 'ArrayPattern': {
			/** @type {SymbolInfo[]} */
			const symbols = [];

			for (const element of pattern.elements) {
				if (element) {
					symbols.push(...createBindingPatternSymbols(element, kind, document, element));
				}
			}

			return symbols;
		}
		case 'RestElement': {
			return createBindingPatternSymbols(pattern.argument, kind, document, pattern);
		}
		case 'AssignmentPattern': {
			return createBindingPatternSymbols(pattern.left, kind, document, pattern);
		}
		default: {
			return [];
		}
	}
}

/**
 * @param {AST.Node} node
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function getInitializerChildSymbols(node, document) {
	if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
		return getChildSymbols(node, document);
	}

	return [];
}

/**
 * @param {AST.Node | NodeWithBody} node
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function getChildSymbols(node, document) {
	const body = /** @type {NodeWithBody} */ (node).body;
	if (isTemplateNode(/** @type {AST.Node} */ (body))) {
		return getTemplateChildSymbols(/** @type {AST.Node} */ (body), document);
	}

	if (Array.isArray(body)) {
		const statements = /** @type {AST.Statement[]} */ (body);
		return [
			...collectSymbolsFromStatements(statements, document),
			...statements.flatMap((statement) => getReturnedTemplateSymbols(statement, document)),
		];
	} else if (Array.isArray(body?.body)) {
		const statements = /** @type {AST.Statement[]} */ (body.body);
		return [
			...collectSymbolsFromStatements(statements, document),
			...statements.flatMap((statement) => getReturnedTemplateSymbols(statement, document)),
		];
	}
	return [];
}

/**
 * @param {AST.Node} node
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function getReturnedTemplateSymbols(node, document) {
	if (node.type !== 'ReturnStatement' || !node.argument) {
		return [];
	}

	return getTemplateChildSymbols(/** @type {AST.Node} */ (node.argument), document);
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function isTemplateNode(node) {
	return (
		!!node &&
		(node.type === 'Tsrx' ||
			node.type === 'Tsx' ||
			node.type === 'Element' ||
			node.type === 'JSXElement' ||
			node.type === 'JSXFragment')
	);
}

/**
 * @param {AST.Node} node
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function getTemplateChildSymbols(node, document) {
	if (!isTemplateNode(node)) {
		return [];
	}

	const children = Array.isArray(/** @type {{ children?: AST.Node[] }} */ (node).children)
		? /** @type {{ children: AST.Node[] }} */ (node).children
		: [];

	return [
		...collectSymbolsFromStatements(children, document),
		...children.flatMap((child) => getTemplateChildSymbols(child, document)),
	];
}

/**
 * @param {AST.ClassDeclaration} node
 * @param {TextDocument} document
 * @returns {SymbolInfo[]}
 */
function getClassChildSymbols(node, document) {
	const body = !Array.isArray(node.body) && node.body?.body ? node.body.body : [];
	/** @type {SymbolInfo[]} */
	const symbols = [];

	for (const member of body) {
		if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') {
			continue;
		}
		const name = getPropertyName(member.key);
		if (!name) {
			continue;
		}
		symbols.push(
			createNamedNodeSymbol(
				name,
				member.type === 'PropertyDefinition' ? SymbolKind.Property : SymbolKind.Method,
				member,
				member.key || member,
				document,
			),
		);
	}

	return symbols;
}

/**
 * @param {AST.Node | undefined | null} node
 * @returns {string | null}
 */
function getPropertyName(node) {
	if (!node) {
		return null;
	}
	if (node.type === 'Identifier') {
		return node.name || null;
	}
	if (node.type === 'Literal' && typeof node.value === 'string') {
		return node.value;
	}
	return null;
}

/**
 * @param {AST.Identifier | null | undefined } node
 * @returns {string | null}
 */
function getIdentifierName(node) {
	return node?.name || null;
}

/**
 * @param {AST.Node} node
 * @param {string} keyword
 * @returns {AST.Identifier}
 */
function createFallbackIdentifierNode(node, keyword) {
	let { start, loc } = /** @type {AST.NodeWithLocation} */ (node);
	loc = {
		start: { ...loc.start },
		end: { line: loc.start.line, column: loc.start.column + keyword.length },
	};
	return b.id(keyword, { start, end: start + keyword.length, loc });
}

/**
 * @param {string} name
 * @param {SymbolKindType} kind
 * @param {AST.Node} rangeNode
 * @param {AST.Node} selectionNode
 * @param {TextDocument} document
 * @param {SymbolInfo[]} [children]
 * @returns {SymbolInfo}
 */
function createNamedNodeSymbol(name, kind, rangeNode, selectionNode, document, children = []) {
	const adjustedSelectionNode = adjustNodeEnd(selectionNode);
	return [
		{
			name,
			kind,
			range: createRange(rangeNode, document),
			selectionRange: createRange(adjustedSelectionNode, document),
			children,
		},
		{ rangeNode, selectionNode: adjustedSelectionNode },
	];
}

/**
 * @param {AST.Node} node
 * @param {TextDocument} document
 * @returns {Range}
 */
function createRange(node, document) {
	const start = /** @type {AST.NodeWithLocation} */ (node).start;
	const end =
		node.type === 'Identifier' && typeof node.name === 'string'
			? start + node.name.length
			: /** @type {AST.NodeWithLocation} */ (node).end;
	return {
		start: document.positionAt(start),
		end: document.positionAt(end),
	};
}

/**
 * @param {AST.Node} node
 * @returns {AST.Node}
 */
function adjustNodeEnd(node) {
	if (node.type === 'Identifier' && typeof node.name === 'string') {
		return {
			...node,
			end: /** @type {AST.NodeWithLocation} */ (node).start + node.name.length,
		};
	}
	return node;
}
