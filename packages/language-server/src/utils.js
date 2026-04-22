/** @import { TextDocument } from 'vscode-languageserver-textdocument' */
/** @import { LanguageServiceContext, Mapper, SourceScript } from '@volar/language-server' */
/** @import {TSRXVirtualCodeInstance} from '@tsrx/typescript-plugin/src/language.js'; */
/** @import { isIdentifierObfuscated, deobfuscateIdentifier, IDENTIFIER_OBFUSCATION_PREFIX } from '@tsrx/core' */

import { URI } from 'vscode-uri';
import {
	createLogging,
	getWordFromPosition,
	charAllowedWordRegex,
	DEBUG,
} from '@tsrx/typescript-plugin/src/utils.js';

const IMPORT_EXPORT_REGEX = {
	import: {
		findBefore: /import\s+(?:\{[^}]*|\*\s+as\s+\w*|\w*)$/s,
		sameLine: /^import\s/,
	},
	export: {
		findBefore: /export\s+(?:\{[^}]*|\*\s+as\s+\w*|\w*)$/s,
		sameLine: /^export\s/,
	},
	from: /from\s*['"][^'"]*['"]\s*;?/,
};

export const RIPPLE_EXTENSIONS = ['.tsrx'];

/** @type {typeof isIdentifierObfuscated} */
let is_identifier_obfuscated;
/** @type {typeof deobfuscateIdentifier} */
let deobfuscate_identifier;
/** @type {typeof IDENTIFIER_OBFUSCATION_PREFIX} */
let identifier_obfuscation_prefix;
/** @type {RegExp} */
let obfuscated_identifier_regex;

import('@tsrx/core').then((imports) => {
	is_identifier_obfuscated = imports.isIdentifierObfuscated;
	deobfuscate_identifier = imports.deobfuscateIdentifier;
	identifier_obfuscation_prefix = imports.IDENTIFIER_OBFUSCATION_PREFIX;
	obfuscated_identifier_regex = new RegExp(
		escapeRegExp(identifier_obfuscation_prefix) + charAllowedWordRegex.source + '+',
		'gm',
	);
});

/**
 * @param {string} source
 * @returns {string}
 */
function escapeRegExp(source) {
	// $& means the whole matched source
	return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} text
 * @returns {string}
 */
export function deobfuscateIdentifiers(text) {
	return text.replace(obfuscated_identifier_regex, (match) => deobfuscate_identifier(match));
}

/**
 * @param  {...string} contents
 * @returns string
 */
export function concatMarkdownContents(...contents) {
	return contents.join('\n\n<br>\n\n---\n\n<br><br>\n\n');
}

/**
 * Get virtual code from the encoded document URI
 * @param {LanguageServiceContext} context
 * @param {TextDocument} document
 * @returns
	{{
 		virtualCode: TSRXVirtualCodeInstance;
		sourceUri: URI;
		sourceScript: SourceScript<URI> | undefined;
		sourceMap: Mapper | undefined;
	}}
 */
export function getVirtualCode(document, context) {
	const uri = URI.parse(document.uri);
	const decoded = /** @type {[documentUri: URI, embeddedCodeId: string]} */ (
		context.decodeEmbeddedDocumentUri(uri)
	);
	const [sourceUri, virtualCodeId] = decoded;
	const sourceScript = context.language.scripts.get(sourceUri);
	const virtualCode = /** @type {TSRXVirtualCodeInstance} */ (
		sourceScript?.generated?.embeddedCodes.get(virtualCodeId)
	);

	const sourceMap =
		sourceScript && virtualCode ? context.language.maps.get(virtualCode, sourceScript) : undefined;

	return { virtualCode, sourceUri, sourceScript, sourceMap };
}

/**
 * @param {'import' | 'export'} type
 * @param {string} text
 * @param {number} start
 * @returns {boolean}
 */
function isInsideImportOrExport(type, text, start) {
	const textBeforeCursor = text.slice(0, start);

	// Find the last 'import' keyword before cursor
	const lastImportMatch = textBeforeCursor.match(IMPORT_EXPORT_REGEX[type].findBefore);
	if (!lastImportMatch) {
		// Check if we're on a line that starts with import
		const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
		const lineBeforeCursor = textBeforeCursor.slice(lineStart);
		return IMPORT_EXPORT_REGEX[type].sameLine.test(lineBeforeCursor.trim());
	}

	// We found an import - check if it's been closed with 'from'
	const importStart = textBeforeCursor.lastIndexOf(type);
	const textFromImport = text.slice(importStart);

	// Find the end of this import statement (semicolon or newline after 'from "..."')
	const fromMatch = textFromImport.match(IMPORT_EXPORT_REGEX.from);
	if (!fromMatch || fromMatch.index === undefined) {
		// No 'from' found yet - we're inside an incomplete import
		return true;
	}

	const importEndOffset = importStart + fromMatch.index + fromMatch[0].length;

	// If cursor is before the import ends, we're inside it
	return start < importEndOffset;
}

/**
 * @param {string} text
 * @param {number} start
 * @returns {boolean}
 */
export function isInsideImport(text, start) {
	return isInsideImportOrExport('import', text, start);
}

/**
 * @param {string} text
 * @param {number} start
 * @returns {boolean}
 */
export function isInsideExport(text, start) {
	return isInsideImportOrExport('export', text, start);
}

/**
 * @param {string} document_uri
 * @returns {boolean}
 */
export function is_ripple_document(document_uri) {
	return RIPPLE_EXTENSIONS.some((extension) => document_uri.endsWith(extension));
}

export { createLogging, getWordFromPosition, DEBUG };
