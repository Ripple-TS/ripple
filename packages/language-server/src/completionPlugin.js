/** @import { LanguageServicePlugin, TextEdit, CompletionItem } from '@volar/language-server'; */

import { CompletionItemKind, InsertTextFormat } from '@volar/language-server';
import {
	getVirtualCode,
	createLogging,
	isInsideImport,
	isInsideExport,
	is_ripple_document,
	is_ripple_platform_document,
} from './utils.js';

const { log } = createLogging('[Ripple Completion Plugin]');

/**
 * Snippets that require auto-import from 'ripple'
 * @type {Array<{label: string, filterText: string, detail: string, documentation: string, insertText: string, importName: string | null}>}
 */
const TRACKED_COLLECTION_SNIPPETS = [
	{
		label: 'RippleMap',
		filterText: 'RippleMap',
		detail: 'Create a RippleMap',
		documentation: 'A reactive Map that triggers updates when modified',
		insertText: 'new RippleMap(${1})',
		importName: 'RippleMap',
	},
	{
		label: 'RippleSet',
		filterText: 'RippleSet',
		detail: 'Create a RippleSet',
		documentation: 'A reactive Set that triggers updates when modified',
		insertText: 'new RippleSet(${1})',
		importName: 'RippleSet',
	},
	{
		label: 'RippleArray',
		filterText: 'RippleArray',
		detail: 'Create a RippleArray',
		documentation: 'A reactive Array that triggers updates when modified',
		insertText: 'new RippleArray(${1})',
		importName: 'RippleArray',
	},
	{
		label: 'RippleArray.from',
		filterText: 'RippleArray.from',
		detail: 'Create a RippleArray.from',
		documentation: 'A reactive Array that triggers when modified',
		insertText: 'new RippleArray.from(${1})',
		importName: 'RippleArray',
	},
	{
		label: 'RippleObject',
		filterText: 'RippleObject',
		detail: 'Create a RippleObject',
		documentation: 'A reactive Object that triggers updates when modified',
		insertText: 'new RippleObject(${1})',
		importName: 'RippleObject',
	},
	{
		label: 'RippleDate',
		filterText: 'RippleDate',
		detail: 'Create a RippleDate',
		documentation: 'A reactive Date that triggers updates when modified',
		insertText: 'new RippleDate(${1})',
		importName: 'RippleDate',
	},
	{
		label: 'RippleURL',
		filterText: 'RippleURL',
		detail: 'Create a RippleURL',
		documentation: 'A reactive URL that triggers updates when modified',
		insertText: 'new RippleURL(${1})',
		importName: 'RippleURL',
	},
	{
		label: 'RippleURLSearchParams',
		filterText: 'RippleURLSearchParams',
		detail: 'Create a RippleURLSearchParams',
		documentation: 'A reactive URLSearchParams that triggers updates when modified',
		insertText: 'new RippleURLSearchParams(${1})',
		importName: 'RippleURLSearchParams',
	},
	{
		label: 'MediaQuery',
		filterText: 'MediaQuery',
		detail: 'Create a MediaQuery',
		documentation: 'A reactive media query that triggers updates when the query match changes',
		insertText: 'new MediaQuery(${1})',
		importName: 'MediaQuery',
	},
];

/**
 * Find the ripple import statement in the document
 * @param {string} text - Full document text
 * @returns {{line: number, startChar: number, endChar: number, imports: string[], hasSemicolon: boolean, fullMatch: string} | null}
 */
function findRippleImport(text) {
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Match: import { x, y, z } from 'ripple'; (with optional semicolon and trailing whitespace)
		const match = line.match(/^import\s*\{([^}]+)\}\s*from\s*['"]ripple['"](;?)(\s*)$/);
		if (match) {
			const imports = match[1]
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
			return {
				line: i,
				startChar: 0,
				endChar: line.length,
				imports,
				hasSemicolon: match[2] === ';',
				fullMatch: line,
			};
		}
	}
	return null;
}

/**
 * Generate additionalTextEdits to add an import
 * @param {string} documentText - Full document text
 * @param {string} importName - Name to import (e.g., 'RippleMap')
 * @returns {TextEdit[]}
 */
function generateImportEdit(documentText, importName) {
	const existing = findRippleImport(documentText);

	if (existing) {
		// Check if already imported
		if (existing.imports.includes(importName)) {
			return []; // Already imported, no edit needed
		}
		// Add to existing import, preserving semicolon status
		const newImports = [...existing.imports, importName].sort().join(', ');
		const semicolon = existing.hasSemicolon ? ';' : '';
		const newLine = `import { ${newImports} } from 'ripple'${semicolon}`;
		return [
			{
				range: {
					start: { line: existing.line, character: 0 },
					end: { line: existing.line, character: existing.endChar },
				},
				newText: newLine,
			},
		];
	}

	// No existing ripple import - add new one at the top
	// Find the best insertion point (after other imports, or at line 0)
	const lines = documentText.split('\n');
	let insertLine = 0;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].match(/^import\s/)) {
			insertLine = i + 1; // Insert after last import
		} else if (insertLine > 0 && !lines[i].match(/^import\s/) && lines[i].trim() !== '') {
			break; // Stop if we've passed the import block
		}
	}

	return [
		{
			range: {
				start: { line: insertLine, character: 0 },
				end: { line: insertLine, character: 0 },
			},
			newText: `import { ${importName} } from 'ripple';\n`,
		},
	];
}

/**
 * Target-neutral TSRX authoring snippets. These apply to every target (Ripple,
 * React, Solid, Preact, Vue) because they only use shared TSRX syntax — the
 * component-function shape, code blocks, and `@if`/`@for`/`@switch`/`@try` control flow.
 * Offered in every `.tsrx` file regardless of platform.
 */
const TSRX_SNIPPETS = [
	{
		label: '@{ }',
		// `@`-triggered items filter against the typed `@`; carry an explicit filterText
		// since `@` + label would produce `@@{ }`.
		filterText: '@{',
		kind: CompletionItemKind.Snippet,
		detail: 'Code block',
		documentation: 'TSRX code block for setup logic and local declarations',
		insertText: '@{\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-@{',
	},
	{
		label: '@for-of',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop',
		documentation: 'Iterate over items in a TSRX template',
		insertText: '@for (const ${1:item} of ${2:items}) {\n\t<${3:li}>{${1:item}}</${3:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-of',
	},
	{
		label: '@for-index',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with index',
		documentation: 'Iterate with index',
		insertText:
			'@for (const ${1:item} of ${2:items}; index ${3:i}) {\n\t<${4:li}>{${1:item}} at {${3}}</${4:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-index',
	},
	{
		label: '@for-key',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with key',
		documentation: 'Iterate with key for identity',
		insertText:
			'@for (const ${1:item} of ${2:items}; key ${1:item}.${3:id}) {\n\t<${4:li}>{${1:item}.${5:text}}</${4:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-key',
	},
	{
		label: '@for-@empty',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with empty fallback',
		documentation: 'Iterate over items with an empty fallback',
		insertText:
			'@for (const ${1:item} of ${2:items}; key ${1:item}.${3:id}) {\n\t<${4:li}>{${1:item}.${5:text}}</${4:li}>\n} @empty {\n\t<${6:li}>${7:No items}</${6:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-empty',
	},
	{
		label: '@for-index-key',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with key',
		documentation: 'Iterate with key for identity',
		insertText:
			'@for (const ${1:item} of ${2:items}; index ${3:i}; key ${1:item}.${4:id}) {\n\t<${5:li}>{${1:item}.${6:text}} at index {${3}}</${5:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-key-index',
	},
	{
		label: '@empty',
		kind: CompletionItemKind.Snippet,
		detail: '@empty clause',
		documentation: 'Fallback branch when an @for block has no items',
		insertText: '@empty {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-empty',
	},
	{
		label: '@default',
		kind: CompletionItemKind.Snippet,
		detail: '@default clause',
		documentation: 'Default branch inside an @switch block',
		insertText: '@default: {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-default',
	},
	{
		label: '@if-@else',
		kind: CompletionItemKind.Snippet,
		detail: 'if...else statement',
		documentation: 'Conditional rendering',
		insertText: '@if (${1:condition}) {\n\t<>\n\t\t$2\n\t</>\n} @else {\n\t<>\n\t\t$3\n\t</>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-if-else',
	},
	{
		label: '@if',
		kind: CompletionItemKind.Snippet,
		detail: '@if block',
		documentation: 'Conditional rendering',
		insertText: '@if (${1:condition}) {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-if',
	},
	{
		label: '@else',
		kind: CompletionItemKind.Snippet,
		detail: '@else clause',
		documentation: 'Fallback branch after an @if block',
		insertText: '@else {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-else',
	},
	{
		label: '@else if',
		kind: CompletionItemKind.Snippet,
		detail: '@else if clause',
		documentation: 'Chained condition after an @if block',
		insertText: '@else if (${1:condition}) {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-else-if',
	},
	{
		label: '@switch-@case',
		kind: CompletionItemKind.Snippet,
		detail: 'switch statement',
		documentation: 'Switch-based conditional rendering',
		insertText:
			"@switch (${1:value}) {\n\t@case ${2:'case1'}: {\n\t\t<>\n\t\t\t$3\n\t\t</>\n\t}\n\t@case ${4:'case2'}: {\n\t\t<>\n\t\t\t$5\n\t\t</>\n\t}\n\t@default: {\n\t\t<>\n\t\t\t$6\n\t\t</>\n\t}\n}",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-switch-case',
	},
	{
		label: '@case',
		kind: CompletionItemKind.Snippet,
		detail: '@case clause',
		documentation: 'Match branch inside an @switch block',
		insertText: '@case ${1:match}: {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-case',
	},
	{
		label: '@try-@pending',
		kind: CompletionItemKind.Snippet,
		detail: 'try...pending block',
		documentation: 'Handle async content with loading fallback',
		insertText: '@try {\n\t$1\n} @pending {\n\t<div>Loading...</div>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-try-pending',
	},
	{
		label: '@try-@pending-@catch',
		kind: CompletionItemKind.Snippet,
		detail: 'try...pending...catch block',
		documentation: 'Handle async content with loading and error fallbacks',
		insertText: '@try {\n\t$1\n} @pending {\n\t<div>Loading...</div>\n} @catch (${2:e}) {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-try-pending-catch',
	},
	{
		label: '@catch',
		kind: CompletionItemKind.Snippet,
		detail: '@catch clause',
		documentation: 'Error branch of an @try block',
		insertText: '@catch (${1:e}) {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-catch',
	},
	{
		label: '@pending',
		kind: CompletionItemKind.Snippet,
		detail: '@pending clause',
		documentation: 'Loading branch of an @try block',
		insertText: '@pending {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-pending',
	},
];

/**
 * Generic (non-`@`) TSRX authoring snippet: the component-function shape. Target-neutral, so it
 * is offered in every `.tsrx` file. Kept out of `TSRX_SNIPPETS` because it is not an `@`-directive
 * — it must not be offered when the user is typing `@`, and it is the one snippet that still makes
 * sense inside an `export` declaration (`export function Name(props)` followed by a code block).
 */
const COMPONENT_SNIPPET = {
	label: 'function component',
	kind: CompletionItemKind.Snippet,
	detail: 'TSRX component function',
	documentation: 'Create a new TSRX component',
	insertText: 'function ${1:ComponentName}(${2:props}) @{\n\t$0\n}',
	insertTextFormat: InsertTextFormat.Snippet,
	sortText: '0-function-component',
};

/**
 * Ripple-runtime-only snippets: reactivity primitives (`track`/`effect`/`untrack`)
 * and server modules. These reference the `ripple` runtime API, so they are only
 * offered when the file is compiled by the Ripple target (see `is_ripple_platform_file`).
 * Showing them for React/Solid/Preact/Vue `.tsrx` files would suggest APIs that
 * don't exist in those targets.
 */
const RIPPLE_API_SNIPPETS = [
	{
		label: 'module server',
		kind: CompletionItemKind.Snippet,
		detail: 'Server-only submodule (module level)',
		documentation:
			'Declares a server-only submodule. Import exported functions with `import { loadData } from server` before using them.\nMust be at module top level.\n\nUsage:\nmodule server {\n  export async function loadData() { ... }\n}\n\nimport { loadData } from server;',
		insertText: 'module server {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-module-server',
	},
	{
		label: 'track',
		kind: CompletionItemKind.Snippet,
		detail: 'Reactive state with track',
		documentation: 'Create a reactive tracked value',
		insertText: 'let ${1:name} = track(${2:initialValue});',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-track',
	},
	{
		label: 'track-derived',
		kind: CompletionItemKind.Snippet,
		detail: 'Derived reactive value',
		documentation: 'Create a derived reactive value',
		insertText: 'let ${1:name} = track(() => ${2:dependency});',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-track-derived',
	},
	{
		label: 'track-getter-setter',
		kind: CompletionItemKind.Snippet,
		detail: 'track with get/set',
		documentation: 'Create tracked value with custom getter/setter',
		insertText:
			'let ${1:name} = track(${2:0},\n\t(current) => {\n\t\t$3\n\t\treturn current;\n\t},\n\t(next, prev) => {\n\t\t$4\n\t\treturn next;\n\t}\n);',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-track-getter-setter',
	},
	{
		label: 'effect',
		kind: CompletionItemKind.Snippet,
		detail: 'Create an effect',
		documentation: 'Run side effects when reactive dependencies change',
		insertText: 'effect(() => {\n\t${1:console.log(value);}\n});',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-effect',
	},
	{
		label: 'untrack',
		kind: CompletionItemKind.Snippet,
		detail: 'Untrack reactive value',
		documentation: 'Read reactive value without creating dependency',
		insertText: 'untrack(() => ${1:value})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-untrack',
	},
];

/**
 * Import suggestions for Ripple
 */
const RIPPLE_IMPORTS = [
	{
		label: 'import track',
		kind: CompletionItemKind.Snippet,
		detail: 'Import track from ripple',
		insertText: "import { track } from 'ripple';",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-import-track',
	},
	{
		label: 'import effect',
		kind: CompletionItemKind.Snippet,
		detail: 'Import effect from ripple',
		insertText: "import { effect } from 'ripple';",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-import-effect',
	},
	{
		label: 'import untrack',
		kind: CompletionItemKind.Snippet,
		detail: 'Import untrack from ripple',
		insertText: "import { untrack } from 'ripple';",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-import-untrack',
	},
	// {
	// 	label: 'import ripple-types',
	// 	kind: CompletionItemKind.Snippet,
	// 	detail: 'Import Ripple types',
	// 	insertText: "import type { Tracked, PropsWithChildren, Component } from 'ripple';",
	// 	insertTextFormat: InsertTextFormat.Snippet,
	// 	sortText: '0-import-types',
	// },
];

/**
 * @returns {LanguageServicePlugin}
 */
export function createCompletionPlugin() {
	return {
		name: 'ripple-completion-enhancer',
		capabilities: {
			completionProvider: {
				// Trigger on Ripple-specific syntax:
				// '<' - JSX/HTML tags
				// '{' - expression and statement snippets
				// '@' - template control flow
				triggerCharacters: ['<', '{', '@'],
				resolveProvider: false,
			},
		},
		// leaving context for future use
		create(context) {
			return {
				// Mark this as providing additional completions, not replacing existing ones
				// This ensures TypeScript/JavaScript completions are still shown alongside Ripple snippets
				isAdditionalCompletion: true,
				async provideCompletionItems(document, position, completionContext, _token) {
					if (!is_ripple_document(document.uri)) {
						return { items: [], isIncomplete: false };
					}

					const { virtualCode } = getVirtualCode(document, context);

					if (virtualCode && virtualCode.languageId !== 'ripple') {
						// Check if we're inside an embedded code (like CSS in <style> blocks)
						// If so, don't provide Ripple snippets - let CSS completions take priority
						log(`Skipping Ripple completions in the '${virtualCode.languageId}' context`);
						return { items: [], isIncomplete: false };
					}

					const line = document.getText({
						start: { line: position.line, character: 0 },
						end: position,
					});

					/** @type {CompletionItem[]} */
					const items = [];

					// Debug: log trigger info with clear marker
					// triggerKind: 1 = Invoked (Ctrl+Space), 2 = TriggerCharacter, 3 = TriggerForIncompleteCompletions
					log('🔔 Completion triggered:', {
						triggerKind: completionContext.triggerKind,
						triggerKindName:
							completionContext.triggerKind === 1
								? 'Invoked'
								: completionContext.triggerKind === 2
									? 'TriggerCharacter'
									: completionContext.triggerKind === 3
										? 'Incomplete'
										: 'Unknown',
						triggerCharacter: completionContext.triggerCharacter || '(none)',
						position: `${position.line}:${position.character}`,
						lineEnd: line.substring(Math.max(0, line.length - 30)),
					});

					const fullText = document.getText();
					const cursorOffset = document.offsetAt(position);

					// All targets share the `.tsrx` extension, so resolve which one this file
					// belongs to. Ripple-runtime suggestions (`track`/`effect`/`RippleMap`/
					// `import … from 'ripple'`, …) are only offered for Ripple files; TSRX
					// authoring snippets (`@if`/`@for`/`@{ }`/component shape) are offered for all.
					const is_ripple = is_ripple_platform_document(document.uri);

					if (isInsideImport(fullText, cursorOffset)) {
						if (is_ripple) {
							items.push(...RIPPLE_IMPORTS);
						}
						return { items, isIncomplete: false };
					} else if (isInsideExport(fullText, cursorOffset)) {
						// `export function Name(props) @{ }` is a valid component declaration, so keep
						// offering the component snippet — otherwise typing `export func…` shows nothing at
						// all. Template control-flow and reactivity snippets don't apply after `export`.
						// Incomplete so VS Code re-requests as the user types (see the general path below).
						items.push(COMPONENT_SNIPPET);
						return { items, isIncomplete: true };
					}

					// Template directives + code block when typing `@` (e.g. `@`, `@i`, `@for`).
					// A lone `@` is a syntax error until completed, so surfacing these lets the
					// user resolve it immediately by picking a directive or a `@{ }` code block.
					const directiveMatch = line.match(/@(\w*)$/);
					if (directiveMatch) {
						const replaceRange = {
							start: {
								line: position.line,
								character: position.character - directiveMatch[0].length,
							},
							end: position,
						};

						for (const snippet of TSRX_SNIPPETS) {
							items.push({
								label: snippet.label,
								filterText: snippet.filterText ?? snippet.label,
								kind: CompletionItemKind.Snippet,
								detail: snippet.detail,
								documentation: snippet.documentation,
								insertTextFormat: InsertTextFormat.Snippet,
								sortText: snippet.sortText,
								textEdit: { range: replaceRange, newText: snippet.insertText },
							});
						}
						// The `@`-directive list is complete (all of it is returned on the first `@`),
						// so mark it complete. `isIncomplete: true` would make VS Code re-request on
						// every keystroke and re-filter by the language word — which excludes `@`, so
						// the word for `@i` is just `i` and never lines up with items whose textEdit
						// starts at the `@`, dropping them. `false` lets VS Code cache the list and
						// filter client-side against each item's range (`@i` → `@if`), which is stable.
						return { items, isIncomplete: false };
					}

					// RippleMap/RippleSet completions when typing R, M... (Ripple runtime only).
					// Also detects if 'new' is already typed before it to avoid duplicating
					const trackedMatch = is_ripple && line.match(/(new\s+)?[R,M]([\w\.]*)$/);

					if (trackedMatch) {
						const hasNew = !!trackedMatch[1];
						const typed = trackedMatch[2].toLowerCase();

						for (const snippet of TRACKED_COLLECTION_SNIPPETS) {
							// Match if typing matches start of 'rackedMap', 'rackedSet' (after T)
							const afterT = snippet.label.slice(1).toLowerCase(); // 'rackedmap' or 'rackedset'
							if (typed === '' || afterT.startsWith(typed)) {
								// Determine insert text - skip 'new ' if already present
								const insertText = hasNew
									? `${snippet.label}(\${1})`
									: `new ${snippet.label}(\${1})`;

								items.push({
									label: snippet.label,
									filterText: snippet.filterText,
									kind: CompletionItemKind.Snippet,
									detail: snippet.detail,
									documentation: snippet.documentation,
									insertText: insertText,
									insertTextFormat: InsertTextFormat.Snippet,
									sortText: '0-' + snippet.label.toLowerCase(),
									// Replace 'T...' or 'new T...' depending on what was typed
									textEdit: {
										range: {
											start: {
												line: position.line,
												character: position.character - trackedMatch[0].length,
											},
											end: position,
										},
										newText: insertText,
									},
									additionalTextEdits: snippet
										? snippet.importName != null
											? generateImportEdit(fullText, snippet.importName)
											: undefined
										: undefined,
								});
							}
						}
					}

					// Debug: show what word we're matching
					const wordMatch = line.match(/(\w+)$/);
					log('Current word:', wordMatch ? wordMatch[1] : '');

					// Always provide the target-neutral TSRX authoring snippets: the component shape plus
					// the `@`-directives (so typing e.g. `if` still surfaces `@if`). Ripple-runtime snippets
					// (track/effect/untrack/module server) are only added for Ripple files, so
					// React/Solid/Preact/Vue `.tsrx` files don't see APIs they can't use.
					items.push(COMPONENT_SNIPPET, ...TSRX_SNIPPETS);
					if (is_ripple) {
						items.push(...RIPPLE_API_SNIPPETS);
					}

					// Mark the list incomplete so VS Code re-requests on every keystroke instead of caching
					// it and filtering client-side. Unlike the `@` path, these snippets aren't behind a
					// trigger character, so once VS Code caches an `isIncomplete: false` list it never
					// refreshes: after you erase and retype, it keeps filtering the stale cache and the
					// snippets never reappear until the editor reloads. The list is a small static array,
					// so re-requesting each keystroke is cheap.
					return { items, isIncomplete: true };
				},
			};
		},
	};
}
