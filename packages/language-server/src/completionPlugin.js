/** @import { LanguageServicePlugin, TextEdit, CompletionItem } from '@volar/language-server'; */

const { CompletionItemKind, InsertTextFormat } = require('@volar/language-server');
const { getVirtualCode, createLogging, isInsideImport, isInsideExport } = require('./utils.js');

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
 * Ripple-specific completion enhancements
 * Adds custom completions for Ripple syntax patterns
 */
const RIPPLE_SNIPPETS = [
	{
		label: '#ripple.',
		kind: CompletionItemKind.Snippet,
		detail: 'Ripple namespace APIs',
		documentation:
			'Type #ripple. to access all built-in Ripple namespace APIs (track, map, set, style, server, etc.).',
		insertText: '#ripple.',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-#-namespace',
	},
	{
		label: '#ripple[]',
		kind: CompletionItemKind.Snippet,
		detail: 'Ripple Reactive Array Literal, shorthand for new RippleArray',
		documentation: 'Create a new Ripple Array Literal',
		insertText: '#ripple[${1}]',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-#-array-literal',
	},
	{
		label: '#ripple{}',
		kind: CompletionItemKind.Snippet,
		detail: 'Ripple Reactive Object Literal, shorthand for new RippleObject',
		documentation: 'Create a new Ripple Object Literal',
		insertText: '#ripple{${1}}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-#-object-literal',
	},
	{
		label: 'component',
		kind: CompletionItemKind.Snippet,
		detail: 'Ripple Component',
		documentation: 'Create a new Ripple component',
		insertText: 'component ${1:ComponentName}(${2:props}) {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-component',
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
		insertText: 'let ${1:name} = track(() => ${2:@dependency});',
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
		label: 'trackSplit',
		kind: CompletionItemKind.Snippet,
		detail: 'Split props with trackSplit',
		documentation: 'Destructure props while preserving reactivity',
		insertText: "const [${1:children}, ${2:rest}] = trackSplit(props, [${3:'children'}]);",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-trackSplit',
	},
	{
		label: 'effect',
		kind: CompletionItemKind.Snippet,
		detail: 'Create an effect',
		documentation: 'Run side effects when reactive dependencies change',
		insertText: 'effect(() => {\n\t${1:console.log(@value);}\n});',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-effect',
	},
	{
		label: 'for-of',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop',
		documentation: 'Iterate over items in Ripple template',
		insertText: 'for (const ${1:item} of ${2:items}) {\n\t<${3:li}>{${1:item}}</${3:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-of',
	},
	{
		label: 'for-index',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with index',
		documentation: 'Iterate with index',
		insertText:
			'for (const ${1:item} of ${2:items}; index ${3:i}) {\n\t<${4:li}>{${1:item}}{" at "}{${3:i}}</${4:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-index',
	},
	{
		label: 'for-key',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with key',
		documentation: 'Iterate with key for identity',
		insertText:
			'for (const ${1:item} of ${2:items}; key ${1:item}.${3:id}) {\n\t<${4:li}>{${1:item}.${5:text}}</${4:li}>\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-key',
	},
	{
		label: 'for-index-key',
		kind: CompletionItemKind.Snippet,
		detail: 'for...of loop with key',
		documentation: 'Iterate with key for identity',
		insertText:
			"for (const ${1:item} of ${2:items}; index ${3:i}; key ${1:item}.${4:id}) {\n\t<${5:li}>{${1:item}.${6:text}}{' at index '}{${3}}</${5:li}>\n}",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-for-key-index',
	},
	{
		label: 'if-else',
		kind: CompletionItemKind.Snippet,
		detail: 'if...else statement',
		documentation: 'Conditional rendering',
		insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$3\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-if-else',
	},
	{
		label: 'switch-case',
		kind: CompletionItemKind.Snippet,
		detail: 'switch statement',
		documentation: 'Switch-based conditional rendering',
		insertText:
			"switch (${1:value}) {\n\tcase ${2:'case1'}:\n\t\t$3\n\t\tbreak;\n\tcase ${4:'case2'}:\n\t\t$5\n\t\tbreak;\n\tdefault:\n\t\t$6\n}",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-switch-case',
	},
	{
		label: 'untrack',
		kind: CompletionItemKind.Snippet,
		detail: 'Untrack reactive value',
		documentation: 'Read reactive value without creating dependency',
		insertText: 'untrack(() => @${1:value})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-untrack',
	},
	{
		label: 'try-pending',
		kind: CompletionItemKind.Snippet,
		detail: 'try...pending block',
		documentation: 'Handle async content with loading fallback',
		insertText: "try {\n\t$1\n} pending {\n\t<div>{'Loading...'}</div>\n}",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-try-pending',
	},
];

/**
 * All #ripple.* namespace completions — no imports required.
 * Shown when the cursor follows `#ripple` or `#ripple.`
 * @type {CompletionItem[]}
 */
const RIPPLE_NAMESPACE_SNIPPETS = [
	{
		label: '#ripple.track',
		kind: CompletionItemKind.Snippet,
		detail: 'Reactive tracked value (no import needed)',
		documentation:
			'Creates a reactive tracked value. Equivalent to track() but requires no import.\n\nUsage: let count = #ripple.track(0);\nDerived: let double = #ripple.track(() => @count * 2);',
		insertText: '#ripple.track(${1:initialValue})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-track',
	},
	{
		label: '#ripple.trackSplit',
		kind: CompletionItemKind.Snippet,
		detail: 'Reactive prop splitting (no import needed)',
		documentation:
			"Destructures props while preserving reactivity. Equivalent to trackSplit() but requires no import.\n\nUsage: const [children, rest] = #ripple.trackSplit(props, ['children']);",
		insertText: "#ripple.trackSplit(${1:props}, ['${2:children}'])",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-trackSplit',
	},
	{
		label: '#ripple.effect',
		kind: CompletionItemKind.Snippet,
		detail: 'Reactive effect (no import needed)',
		documentation:
			'Registers a reactive side effect. Equivalent to effect() but requires no import.\n\nUsage: #ripple.effect(() => {\n  console.log(@count);\n});',
		insertText: '#ripple.effect(() => {\n\t$0\n})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-effect',
	},
	{
		label: '#ripple.untrack',
		kind: CompletionItemKind.Snippet,
		detail: 'Read without dependency tracking (no import needed)',
		documentation:
			'Reads reactive values without creating dependencies. Equivalent to untrack() but requires no import.\n\nUsage: const snapshot = #ripple.untrack(() => @count);',
		insertText: '#ripple.untrack(() => ${1:@value})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-untrack',
	},
	{
		label: '#ripple.validate',
		kind: CompletionItemKind.Snippet,
		detail: 'Validation wrapper (no import needed)',
		documentation:
			"Wraps a value with validation logic.\n\nUsage: let email = #ripple.validate(#ripple.track(''));",
		insertText: '#ripple.validate(${1})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-validate',
	},
	{
		label: '#ripple.context',
		kind: CompletionItemKind.Snippet,
		detail: 'Create a Context (no import needed)',
		documentation:
			"Creates a reactive context. Equivalent to new Context() but requires no import.\n\nUsage: const ThemeCtx = #ripple.context('light');",
		insertText: '#ripple.context(${1:defaultValue})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-context',
	},
	{
		label: '#ripple.array',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleArray class reference (no import needed)',
		documentation:
			'Reference to the RippleArray class. Use for static methods or as a type annotation.\n\nUsage: const copy = #ripple.array.from(existing);',
		insertText: '#ripple.array',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-array',
	},
	{
		label: '#ripple.object',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleObject class reference (no import needed)',
		documentation:
			'Reference to the RippleObject class. Use for static methods or as a type annotation.\n\nUsage: const obj = #ripple.object({ a: 1 });',
		insertText: '#ripple.object',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-object',
	},
	{
		label: '#ripple.map',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleMap (no import needed)',
		documentation:
			'Creates a reactive Map. Equivalent to new RippleMap() but requires no import.\n\nUsage: const map = #ripple.map([[key, value]]);',
		insertText: '#ripple.map(${1})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-map',
	},
	{
		label: '#ripple.set',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleSet (no import needed)',
		documentation:
			'Creates a reactive Set. Equivalent to new RippleSet() but requires no import.\n\nUsage: const set = #ripple.set([1, 2, 3]);',
		insertText: '#ripple.set(${1})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-set',
	},
	{
		label: '#ripple.date',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleDate (no import needed)',
		documentation:
			'Creates a reactive Date. Equivalent to new RippleDate() but requires no import.\n\nUsage: const today = #ripple.date();',
		insertText: '#ripple.date(${1})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-date',
	},
	{
		label: '#ripple.url',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleURL (no import needed)',
		documentation:
			"Creates a reactive URL. Equivalent to new RippleURL() but requires no import.\n\nUsage: const url = #ripple.url('https://example.com');",
		insertText: "#ripple.url('${1:https://example.com}')",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-url',
	},
	{
		label: '#ripple.urlSearchParams',
		kind: CompletionItemKind.Snippet,
		detail: 'RippleURLSearchParams (no import needed)',
		documentation:
			'Creates a reactive URLSearchParams. Equivalent to new RippleURLSearchParams() but requires no import.\n\nUsage: const params = #ripple.urlSearchParams(${1});',
		insertText: '#ripple.urlSearchParams(${1})',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-urlSearchParams',
	},
	{
		label: '#ripple.mediaQuery',
		kind: CompletionItemKind.Snippet,
		detail: 'Reactive CSS media query (no import needed)',
		documentation:
			"Creates a reactive media query that tracks whether the query currently matches.\n\nUsage: const isMobile = #ripple.mediaQuery('(max-width: 768px)');",
		insertText: "#ripple.mediaQuery('${1:(max-width: 768px)}')",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-mediaQuery',
	},
	{
		label: '#ripple.style',
		kind: CompletionItemKind.Snippet,
		detail: 'Scoped CSS class reference (no import needed)',
		documentation:
			'Produces a scoped CSS class string for passing to child components.\nThe class must be defined as a standalone selector in <style>.\n\nUsage: <Child cls={#ripple.style.highlight} />',
		insertText: '#ripple.style.${1:className}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-style',
	},
	{
		label: '#ripple.server',
		kind: CompletionItemKind.Snippet,
		detail: 'Server-only code block (module level)',
		documentation:
			'Marks a block as server-only. Code inside is tree-shaken on the client.\nMust be at module top level.\n\nUsage:\n#ripple.server {\n  export async function loadData() { ... }\n}',
		insertText: '#ripple.server {\n\t$0\n}',
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-ripple-server',
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
		label: 'import trackSplit',
		kind: CompletionItemKind.Snippet,
		detail: 'Import trackSplit from ripple',
		insertText: "import { trackSplit } from 'ripple';",
		insertTextFormat: InsertTextFormat.Snippet,
		sortText: '0-import-trackSplit',
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
 * @param {string} line
 * @returns {RegExpMatchArray | null}
 */
function get_ripple_namespace_match(line) {
	return line.match(/#ripple(?:\.(\w*))?$/);
}

/**
 * @param {RegExpMatchArray} namespace_match
 * @param {{ line: number, character: number }} position
 * @returns {CompletionItem[]}
 */
function create_ripple_namespace_completion_items(namespace_match, position) {
	const start_character = position.character - namespace_match[0].length;

	return RIPPLE_NAMESPACE_SNIPPETS.map((snippet) => ({
		...snippet,
		filterText: snippet.label,
		textEdit: {
			range: {
				start: {
					line: position.line,
					character: start_character,
				},
				end: position,
			},
			newText: snippet.insertText ?? snippet.label,
		},
	}));
}

/**
 * @returns {LanguageServicePlugin}
 */
function createCompletionPlugin() {
	return {
		name: 'ripple-completion-enhancer',
		capabilities: {
			completionProvider: {
				// Trigger on Ripple-specific syntax:
				// '<' - JSX/HTML tags
				// '#' - RippleMap/RippleSet shortcuts
				// '.' - #ripple namespace member access
				triggerCharacters: ['<', '#', '.'],
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
					if (!document.uri.endsWith('.ripple')) {
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

					if (isInsideImport(fullText, cursorOffset)) {
						items.push(...RIPPLE_IMPORTS);
						return { items, isIncomplete: false };
					} else if (isInsideExport(fullText, cursorOffset)) {
						return { items, isIncomplete: false };
					}

					const ripple_namespace_match = get_ripple_namespace_match(line);

					if (ripple_namespace_match) {
						items.push(
							...create_ripple_namespace_completion_items(ripple_namespace_match, position),
						);
						return { items, isIncomplete: false };
					}

					// @ accessor hint when typing after @
					if (/@\w*$/.test(line)) {
						items.push({
							label: '@value',
							kind: CompletionItemKind.Variable,
							detail: 'Access tracked value',
							documentation: 'Use @ to read/write tracked values',
						});
					}

					// RippleMap/RippleSet completions when typing T...
					// Also detects if 'new' is already typed before it to avoid duplicating
					const trackedMatch = line.match(/(new\s+)?[T,M,#]([\w\.]*)$/);

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

					// Ripple keywords - extract the last word being typed
					const wordMatch = line.match(/(\w+)$/);
					const currentWord = wordMatch ? wordMatch[1] : '';

					// Debug: show what word we're matching
					log('Current word:', currentWord, 'length:', currentWord.length);

					// ALWAYS provide Ripple snippets and keywords
					// Even with 1 character, we return items so that when combined with TypeScript completions,
					// the merged result will include our items. VS Code's fuzzy matching will filter them.
					items.push(...RIPPLE_SNIPPETS);

					// Return isIncomplete=false and let VS Code handle filtering
					// Since we're providing all items every time, VS Code can cache and filter client-side
					// This works because our items have proper labels that match VS Code's fuzzy matching
					return { items, isIncomplete: currentWord.length < 2 };
				},
			};
		},
	};
}

module.exports = {
	createCompletionPlugin,
};
