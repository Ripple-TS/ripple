/** @import { LanguageServicePlugin, LocationLink } from '@volar/language-server'; */
// @ts-expect-error type-only import from ESM module into CJS is fine
/** @import { DefinitionLocation } from 'ripple/compiler'; */

const { TextDocument } = require('vscode-languageserver-textdocument');
const { getVirtualCode, createLogging, getWordFromPosition } = require('./utils.js');
const path = require('path');
const fs = require('fs');

const {
	normalizeFileNameOrUri,
	getRippleDirForFile,
	getCachedTypeDefinitionFile,
	getCachedTypeMatches,
} = require('@ripple-ts/typescript-plugin/src/language.js');

const { log } = createLogging('[Ripple Definition Plugin]');
/** @type {string | undefined} */
let ripple_dir;

/**
 * @returns {LanguageServicePlugin}
 */
function createDefinitionPlugin() {
	return {
		name: 'ripple-definition',
		capabilities: {
			definitionProvider: true,
		},
		create(context) {
			return {
				async provideDefinition(document, position, token) {
					// Get TypeScript definition from typescript-semantic service
					/** @type {LocationLink[]} */
					let tsDefinitions = [];
					for (const [plugin, instance] of context.plugins) {
						if (plugin.name === 'typescript-semantic' && instance.provideDefinition) {
							const result = await instance.provideDefinition(document, position, token);
							if (result) {
								tsDefinitions.push(...(Array.isArray(result) ? result : [result]));
							}
							break;
						}
					}

					const { virtualCode, sourceUri } = getVirtualCode(document, context);

					if (virtualCode.languageId !== 'ripple') {
						// like embedded css
						log(`Skipping definitions processing in the '${virtualCode.languageId}' context`);
						return tsDefinitions;
					}

					// First check for custom definitions (e.g., CSS class selectors)
					const offset = document.offsetAt(position);
					const text = document.getText();
					// Find word boundaries
					const { word, start, end } = getWordFromPosition(text, offset);
					const customMapping = virtualCode.findMappingByGeneratedRange(start, end);

					log(`Cursor position in generated code for word '${word}':`, position);
					log(`Cursor offset in generated code for word '${word}':`, offset);

					// Handle `typeReplace` definitions
					if (
						customMapping?.data.customData.definition !== false &&
						customMapping?.data.customData.definition?.typeReplace
					) {
						const { name: typeName, path: typePath } =
							customMapping.data.customData.definition.typeReplace;

						log(`Found replace definition for ${typeName}`);

						const filePath = sourceUri.fsPath || sourceUri.path;
						ripple_dir = ripple_dir ?? getRippleDirForFile(normalizeFileNameOrUri(filePath));

						if (!ripple_dir) {
							log(`Could not determine Ripple source directory for file: ${filePath}`);
							return;
						}

						const typesFilePath = path.join(ripple_dir, ...typePath.split('/'));

						const fileContent = getCachedTypeDefinitionFile(typesFilePath);

						if (!fileContent) {
							// the `getCachedTypeDefinitionFile` already logs the error
							return;
						}

						const match = getCachedTypeMatches(typeName, fileContent);

						if (match && match.index !== undefined) {
							const classStart = match.index + match[0].indexOf(typeName);
							const classEnd = classStart + typeName.length;

							// Convert offset to line/column
							const lines = fileContent.substring(0, classStart).split('\n');
							const line = lines.length - 1;
							const character = lines[lines.length - 1].length;

							const endLines = fileContent.substring(0, classEnd).split('\n');
							const endLine = endLines.length - 1;
							const endCharacter = endLines[endLines.length - 1].length;

							// Create the origin selection range for #Map/#Set
							const generatedStart = customMapping.generatedOffsets[0];
							const generatedEnd =
								generatedStart + customMapping.data.customData.generatedLengths[0];
							const originStart = document.positionAt(generatedStart);
							const originEnd = document.positionAt(generatedEnd);

							/** @type {LocationLink} */
							const locationLink = {
								targetUri: `file://${typesFilePath}`,
								targetRange: {
									start: { line, character },
									end: { line: endLine, character: endCharacter },
								},
								targetSelectionRange: {
									start: { line, character },
									end: { line: endLine, character: endCharacter },
								},
								originSelectionRange: {
									start: originStart,
									end: originEnd,
								},
							};

							log(`Created definition link to ${typesFilePath}:${line}:${character}`);
							return [locationLink];
						}
					}

					// Handle embedded code definition location, e.g. CSS class selectors
					if (
						customMapping?.data.customData.definition !== false &&
						customMapping?.data.customData.definition?.location
					) {
						const def = customMapping.data.customData.definition;
						const loc = /** @type {DefinitionLocation} */ (def.location);

						const embeddedCode = loc.embeddedId
							? virtualCode.embeddedCodes?.find(({ id }) => id === loc.embeddedId)
							: undefined;

						if (embeddedCode) {
							const embedMapping = embeddedCode.mappings[0];

							// Calculate the position in the source document
							// CSS offset relative to embedded code start + source offset of CSS region
							const sourceStartOffset = embedMapping.sourceOffsets[0] + loc.start;
							const sourceEndOffset = embedMapping.sourceOffsets[0] + loc.end;

							log(
								'Source document offsets - start for matching css:',
								sourceStartOffset,
								'end:',
								sourceEndOffset,
							);

							// Calculate line/column positions using the source document's proper encoding
							// Create a TextDocument from the source code for proper position calculations
							const sourceDocument = TextDocument.create(
								sourceUri.toString(),
								'ripple',
								0,
								virtualCode.originalCode,
							);
							const targetStart = sourceDocument.positionAt(sourceStartOffset);
							const targetEnd = sourceDocument.positionAt(sourceEndOffset);

							log('Target positions in source - start:', targetStart, 'end:', targetEnd);

							// The origin selection range should be in the virtual document
							// not in the source document!
							const generatedStart = customMapping.generatedOffsets[0];
							const generatedEnd =
								generatedStart + customMapping.data.customData.generatedLengths[0];
							const originStart = document.positionAt(generatedStart);
							const originEnd = document.positionAt(generatedEnd);

							log('Origin positions - start:', originStart, 'end:', originEnd);

							/** @type {LocationLink} */
							tsDefinitions.push({
								targetUri: sourceUri.toString(), // Use the actual source file URI
								targetRange: {
									start: targetStart,
									end: targetEnd,
								},
								targetSelectionRange: {
									start: targetStart,
									end: targetEnd,
								},
								originSelectionRange: {
									start: originStart,
									end: originEnd,
								},
							});

							return tsDefinitions;
						}
					}

					return tsDefinitions;
				},
			};
		},
	};
}

module.exports = {
	createDefinitionPlugin,
};
