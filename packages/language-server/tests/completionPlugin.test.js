import { CompletionItemKind, InsertTextFormat } from '@volar/language-server';
import { describe, expect, it } from 'vitest';
import { create_completion_harness } from './setup.js';

const TRIGGERED_BY_AT = { triggerKind: 2, triggerCharacter: '@' };
const INVOKED = { triggerKind: 1 };

const EXPECTED_AT_ITEMS = [
	{ label: '@{}', insertText: '@{\n\t$0\n}', sortText: '0-@-00', preselect: true },
	{ label: '@if', insertText: '@if (${1:condition}) {\n\t$0\n}', sortText: '0-@-01' },
	{
		label: '@for',
		insertText: '@for (const ${1:item} of ${2:items}) {\n\t$0\n}',
		sortText: '0-@-02',
	},
	{
		label: '@switch',
		insertText:
			'@switch (${1:value}) {\n\t@case ${2:match}: {\n\t\t$3\n\t}\n\t@default: {\n\t\t$0\n\t}\n}',
		sortText: '0-@-03',
	},
	{
		label: '@try',
		insertText: '@try {\n\t$1\n} @pending {\n\t$2\n} @catch (${3:e}) {\n\t$0\n}',
		sortText: '0-@-04',
	},
	{ label: '@else', insertText: '@else {\n\t$0\n}', sortText: '0-@-10' },
	{ label: '@else if', insertText: '@else if (${1:condition}) {\n\t$0\n}', sortText: '0-@-11' },
	{ label: '@empty', insertText: '@empty {\n\t$0\n}', sortText: '0-@-12' },
	{ label: '@case', insertText: '@case ${1:match}: {\n\t$0\n}', sortText: '0-@-13' },
	{ label: '@default', insertText: '@default: {\n\t$0\n}', sortText: '0-@-14' },
	{ label: '@pending', insertText: '@pending {\n\t$0\n}', sortText: '0-@-15' },
	{ label: '@catch', insertText: '@catch (${1:e}) {\n\t$0\n}', sortText: '0-@-16' },
];

const EXPECTED_AT_ORDER = [
	'@{}',
	'@if',
	'@for',
	'@switch',
	'@try',
	'@else',
	'@else if',
	'@empty',
	'@case',
	'@default',
	'@pending',
	'@catch',
];

// old @-reactivity and control-flow snippets we deleted; pinned so they can't creep back
const REMOVED_SNIPPET_LABELS = [
	'@value',
	'for-of',
	'for-index',
	'for-key',
	'for-empty',
	'for-index-key',
	'if-else',
	'switch-case',
	'try-pending',
];

// Parses clean: the typed `@` is plain JSX text inside the template.
const JSX_TEXT_AT_FIXTURE = `export default function App() {
	return (
		<div>
			@
		</div>
	);
}
`;

// Parses clean: partial keyword `@i` is plain JSX text inside the template.
const JSX_TEXT_PARTIAL_FIXTURE = `export default function App() {
	return (
		<div>
			@i
		</div>
	);
}
`;

// Fails to parse: a lone `@` outside a template is a compile error — this covers
// the "file won't compile" path where completions still need to work
const STATEMENT_AT_FIXTURE = `export default function App() @{
	let x = 1;
	@
	<div>{x}</div>
}
`;

/**
 * @param {import('@volar/language-server').CompletionList} result
 * @param {import('@volar/language-server').Position} at_start - position of the typed '@'
 * @param {import('@volar/language-server').Position} cursor - position completion was requested at
 */
function expect_at_directive_items(result, at_start, cursor) {
	const by_label = new Map(result.items.map((item) => [item.label, item]));

	for (const expected of EXPECTED_AT_ITEMS) {
		const item = by_label.get(expected.label);
		expect(item, `expected completion item '${expected.label}'`).toBeDefined();
		expect(item?.insertText).toBe(expected.insertText);
		expect(item?.kind).toBe(CompletionItemKind.Snippet);
		expect(item?.insertTextFormat).toBe(InsertTextFormat.Snippet);
		expect(item?.sortText).toBe(expected.sortText);
		expect(item?.preselect ?? false).toBe(expected.preselect ?? false);
		// filterText keeps the '@' so the editor keeps matching this item as you type
		expect(item?.filterText?.startsWith('@')).toBe(true);
		// the edit replaces the typed '@' so accepting '@if' does not produce '@@if'
		expect(item?.textEdit).toEqual({
			range: { start: at_start, end: cursor },
			newText: expected.insertText,
		});
	}

	// sortText puts '@{}' first, then @if/@for/@switch/@try, then clause keywords
	const sorted_labels = EXPECTED_AT_ITEMS.map((expected) => expected.label).sort((a, b) => {
		const a_sort = /** @type {string} */ (by_label.get(a)?.sortText);
		const b_sort = /** @type {string} */ (by_label.get(b)?.sortText);
		return a_sort < b_sort ? -1 : a_sort > b_sort ? 1 : 0;
	});
	expect(sorted_labels).toEqual(EXPECTED_AT_ORDER);
}

/**
 * @param {import('@volar/language-server').CompletionList} result
 */
function expect_no_legacy_items(result) {
	const labels = result.items.map((item) => item.label);
	for (const legacy of REMOVED_SNIPPET_LABELS) {
		expect(labels).not.toContain(legacy);
	}
}

describe('completion plugin', () => {
	it('offers the 12 @ template directives after typing "@" amid JSX text', async () => {
		const { service, uri } = create_completion_harness(JSX_TEXT_AT_FIXTURE);
		const cursor = { line: 3, character: 4 };
		const result = await service.getCompletionItems(uri, cursor, TRIGGERED_BY_AT);

		expect_at_directive_items(result, { line: 3, character: 3 }, cursor);
		expect_no_legacy_items(result);
	});

	it('offers @ template directives on Invoked completion after a partial "@i" amid JSX text', async () => {
		const { service, uri } = create_completion_harness(JSX_TEXT_PARTIAL_FIXTURE);
		const cursor = { line: 3, character: 5 };
		const result = await service.getCompletionItems(uri, cursor, INVOKED);

		// the textEdit range must cover the whole typed '@i' prefix
		expect_at_directive_items(result, { line: 3, character: 3 }, cursor);
		expect_no_legacy_items(result);
	});

	it('offers @ template directives in statement position while the file fails to parse', async () => {
		const { service, uri } = create_completion_harness(STATEMENT_AT_FIXTURE);
		const cursor = { line: 2, character: 2 };

		const triggered = await service.getCompletionItems(uri, cursor, TRIGGERED_BY_AT);
		expect_at_directive_items(triggered, { line: 2, character: 1 }, cursor);
		expect_no_legacy_items(triggered);

		const invoked = await service.getCompletionItems(uri, cursor, INVOKED);
		expect_at_directive_items(invoked, { line: 2, character: 1 }, cursor);
		expect_no_legacy_items(invoked);
	});

	it('keeps non-template Ripple snippets available', async () => {
		const { service, uri } = create_completion_harness(JSX_TEXT_AT_FIXTURE);
		const result = await service.getCompletionItems(uri, { line: 3, character: 4 }, INVOKED);
		const labels = result.items.map((item) => item.label);

		expect(labels).toContain('function component');
		expect(labels).toContain('effect');
		expect(labels).toContain('track');
	});

	it('uses plain placeholders instead of legacy @-accessor reads in snippet bodies', async () => {
		const source = `export default function App() {
	const tra = 1;
	return <div>{tra}</div>;
}
`;
		const { service, uri } = create_completion_harness(source);
		// cursor after 'tra' inside {...}, where the general Ripple snippets show up
		const result = await service.getCompletionItems(
			uri,
			{ line: 2, character: '\treturn <div>{tra'.length },
			INVOKED,
		);
		const by_label = new Map(result.items.map((item) => [item.label, item]));

		expect(by_label.get('track-derived')?.insertText).toBe(
			'let ${1:name} = track(() => ${2:dependency});',
		);
		expect(by_label.get('effect')?.insertText).toBe(
			'effect(() => {\n\t${1:console.log(value);}\n});',
		);
		expect(by_label.get('untrack')?.insertText).toBe('untrack(() => ${1:value})');

		// no snippet body should use the old '@' accessor syntax; the @if/@case/...
		// directive items are allowed to have '@' in their labels, so skip those
		for (const item of result.items) {
			if (String(item.label).startsWith('@')) {
				continue;
			}
			expect(
				item.insertText ?? '',
				`snippet '${item.label}' must not use legacy @-accessor syntax`,
			).not.toMatch(/@\w/);
		}
	});

	it('keeps import-context completions unchanged', async () => {
		const source = `import { track } from 'ripple';

export default function App() {
	return <div>hi</div>;
}
`;
		const { service, uri } = create_completion_harness(source);
		// cursor at the end of 'track' inside the import statement
		const result = await service.getCompletionItems(uri, { line: 0, character: 14 }, INVOKED);
		const labels = result.items.map((item) => item.label);

		expect(labels).toContain('import track');
		expect(labels).not.toContain('@if');
		expect(labels).not.toContain('function component');
	});
});
