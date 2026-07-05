import { describe, it, expect } from 'vitest';
import { create_completion_harness } from './setup.js';

const find = (items, label) => (items ?? []).find((item) => item.label === label);

describe('completion plugin — @ template directives', () => {
	it('offers @-directive completions when typing `@` in a template', async () => {
		const source = 'export function App() @{\n\t<>\n\t\t@\n\t</>\n}';
		const { service, uri } = create_completion_harness(source);

		const result = await service.getCompletionItems(
			uri,
			{ line: 2, character: 3 },
			{ triggerKind: 2, triggerCharacter: '@' },
		);

		const if_item = find(result.items, '@if');
		expect(if_item).toBeDefined();
		expect(find(result.items, '@for-of')).toBeDefined();
		expect(find(result.items, '@switch-@case')).toBeDefined();

		// The directive list is complete, so it must be marked complete: VS Code then caches it
		// and filters client-side as more is typed. `isIncomplete: true` makes VS Code re-request
		// and re-filter by the language word — which excludes `@`, so the word for `@i` is just
		// `i` and never lines up with items whose textEdit starts at the `@`, dropping them.
		expect(result.isIncomplete).toBe(false);

		// Each item carries an `@`-prefixed filterText and a textEdit that replaces the typed
		// `@…`, so typing `@i` still matches `@if` (and inserting never doubles the `@`).
		expect(if_item.filterText).toMatch(/^@/);
		expect(if_item.textEdit).toBeDefined();
	});

	it('keeps offering matching @-directives once more is typed (`@i` for `@if`)', async () => {
		// The plugin must still fire and return the directive list after `@i` is typed — the `@i`
		// text position is completion-enabled — so VS Code can narrow the cached list to `@if`.
		const source = 'export function App() @{\n\t<>\n\t\t@i\n\t</>\n}';
		const { service, uri } = create_completion_harness(source);

		const result = await service.getCompletionItems(
			uri,
			{ line: 2, character: 4 },
			{ triggerKind: 1 },
		);

		expect(find(result.items, '@if')).toBeDefined();
		expect(result.isIncomplete).toBe(false);
	});

	it('keeps the textEdit for `@i` when interleaved with other directives (well-formed mapping)', async () => {
		// A `@` typed on its own line between a `@switch` and an `@if` inside a fragment. The
		// surrounding whitespace is re-indented in the generated output, so a whole-text-node
		// mapping is mismatched-length and Volar strips the item's textEdit/filterText (leaving
		// only insertText). VS Code then can't align the item and drops it as you type `@i`. The
		// item must keep a source-anchored textEdit + `@`-filterText so it survives filtering.
		const source = [
			'function Comp(props) @{',
			'\t<>',
			'\t\t@switch (value) {',
			"\t\t\t@case 'case1': {",
			'\t\t\t\t<></>',
			'\t\t\t}',
			'\t\t\t@default: {',
			'\t\t\t}',
			'\t\t}',
			'',
			'\t\t@i',
			'',
			'\t\t@if (condition) {',
			'\t\t\t<></>',
			'\t\t} @else {',
			'\t\t\t<></>',
			'\t\t}',
			'\t\t<Item></Item>',
			'\t</>',
			'}',
		].join('\n');
		const { service, uri } = create_completion_harness(source);

		const result = await service.getCompletionItems(
			uri,
			{ line: 10, character: 4 },
			{ triggerKind: 1 },
		);

		const if_item = find(result.items, '@if');
		expect(if_item).toBeDefined();
		// The textEdit must survive (not be stripped to a bare insertText) and its filterText
		// must stay `@`-prefixed, so `@i` matches `@if`.
		expect(if_item.textEdit).toBeDefined();
		expect(if_item.filterText).toMatch(/^@/);
	});
});

describe('completion plugin — function component snippet', () => {
	it('offers `function component` when typing a bare `func`', async () => {
		const source = 'func';
		const { service, uri } = create_completion_harness(source);

		const result = await service.getCompletionItems(
			uri,
			{ line: 0, character: 4 },
			{ triggerKind: 1 },
		);

		expect(find(result.items, 'function component')).toBeDefined();
	});

	it('offers `function component` when typing `export func` (export declaration)', async () => {
		// `export func…` sits inside an export statement, but `export function Name(props) @{ }` is a
		// valid component declaration — so the snippet must still be offered. Previously the export
		// branch returned an empty list, so typing `export func` showed nothing at all.
		const source = 'export func';
		const { service, uri } = create_completion_harness(source);

		const result = await service.getCompletionItems(
			uri,
			{ line: 0, character: 11 },
			{ triggerKind: 1 },
		);

		expect(find(result.items, 'function component')).toBeDefined();
	});
});
