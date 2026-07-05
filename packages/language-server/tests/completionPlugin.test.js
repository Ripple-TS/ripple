import { describe, it, expect } from 'vitest';
import { create_completion_harness, create_stateful_completion_harness } from './setup.js';

const find = (items, label) => (items ?? []).find((item) => item.label === label);

/** Case-insensitive subsequence match — a stand-in for VS Code's completion fuzzy filter. */
const fuzzy = (query, target) => {
	query = query.toLowerCase();
	target = target.toLowerCase();
	let i = 0;
	for (const ch of target) {
		if (i < query.length && query[i] === ch) i++;
	}
	return i === query.length;
};

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
		// Incomplete so VS Code re-requests as the user types (see below).
		expect(result.isIncomplete).toBe(true);
	});

	it('marks the general snippet list incomplete so it survives an erase/retype', async () => {
		// These snippets aren't behind a trigger character (unlike `@`), so if the list is marked
		// complete VS Code caches it and never re-requests. After erasing and retyping, it keeps
		// filtering the stale cache and the snippets never reappear until the editor reloads. Marking
		// the list incomplete forces a fresh request on every keystroke, which is what keeps
		// `function component` showing up on a second attempt.
		for (const [source, character] of /** @type {Array<[string, number]>} */ ([
			['f', 1],
			['func', 4],
		])) {
			const { service, uri } = create_completion_harness(source);

			const result = await service.getCompletionItems(
				uri,
				{ line: 0, character },
				{ triggerKind: 1 },
			);

			expect(find(result.items, 'function component')).toBeDefined();
			expect(result.isIncomplete).toBe(true);
		}
	});
});

describe('completion plugin — erase/retype on a blank line', () => {
	// A component followed by a blank line where the user starts a second declaration. The word is
	// appended to the final (blank) line.
	const PREFIX = ['export function App(props) @{', '\t<div>{"hi"}</div>', '}', '', ''].join('\n');
	const end_pos = (doc) => {
		const lines = doc.split('\n');
		return { line: lines.length - 1, character: lines[lines.length - 1].length };
	};

	it('does not return an empty *complete* list on a blank line below a component', async () => {
		// The compiler emits mappings only for the tokens it generates, so a blank line has no
		// completion-enabled mapping of its own. Without a document-wide fallback, Volar returns
		// `{ items: [], isIncomplete: false }` here — an empty list marked COMPLETE. VS Code caches
		// that and stops re-requesting, so completions never reappear as the user types on this line
		// (the "works once, then never again" bug). The fallback must keep this position live.
		const { service, uri } = create_stateful_completion_harness(PREFIX);

		const result = await service.getCompletionItems(uri, end_pos(PREFIX), { triggerKind: 1 });

		// The poison is specifically empty-AND-complete; assert we never emit that shape.
		expect(result.items.length === 0 && result.isIncomplete === false).toBe(false);
		expect(find(result.items, 'function component')).toBeDefined();
	});

	it('keeps offering `function component` after typing, erasing to empty, and retyping', async () => {
		// Emulate a VS Code completion session end-to-end: cache an `isIncomplete: false` list and
		// filter it client-side; re-request only when the list was incomplete or the word was
		// abandoned. Drive it through type → erase-to-blank → retype. Before the fallback fix, the
		// erase-to-blank step cached an empty complete list and the retype never recovered.
		const { service, uri, set_document } = create_stateful_completion_harness(PREFIX);

		/** @type {{ items: any[], complete: boolean } | null} */
		let session = null;
		const type = async (word) => {
			const doc = PREFIX + word;
			set_document(doc);
			// A fresh trigger when there is no active session or the word was erased away.
			const hard = session === null || word === '';
			if (session === null || !session.complete || hard) {
				const list = await service.getCompletionItems(uri, end_pos(doc), {
					triggerKind: hard ? 1 : 3,
				});
				session = { items: list.items ?? [], complete: !list.isIncomplete };
			}
			const visible =
				word === ''
					? session.items
					: session.items.filter((item) => fuzzy(word, item.filterText ?? item.label));
			return visible.some((item) => item.label === 'function component');
		};

		expect(await type('f')).toBe(true);
		expect(await type('fu')).toBe(true);
		expect(await type('func')).toBe(true);
		// Erase back down to a blank line…
		expect(await type('fu')).toBe(true);
		expect(await type('f')).toBe(true);
		await type('');
		// …then retype. This is where the regression showed up: the snippet must come back.
		expect(await type('f')).toBe(true);
		expect(await type('fu')).toBe(true);
		expect(await type('func')).toBe(true);
	});
});
