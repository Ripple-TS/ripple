import { describe, it, expect } from 'vitest';
import { create_stateful_completion_harness } from './setup.js';

// Documents the ROOT CAUSE of the "completions stop appearing after you erase and retype" bug.
//
// The compiler only maps the tokens it generates, so a blank line (e.g. where you start a new
// declaration below a component) is covered by no completion mapping and the server returns an
// empty list there. VS Code stops re-querying a provider once it returns an empty list
// (https://github.com/microsoft/vscode/issues/13735, marked out-of-scope), so after the cursor
// visits such a line, completions never reappear as you type until the editor reloads.
//
// The actual workaround is a VS Code *client* concern and lives in the extension's completion
// middleware (packages/vscode-plugin/src/completionFallback.js) — it must NOT live in this shared
// server, or every other editor (IntelliJ, Neovim, Zed, Sublime) would get the keep-alive item too.
// This test just pins the trigger: if a future change makes the blank line non-empty (e.g. proper
// whitespace mappings), it will fail, prompting a re-evaluation of the client-side workaround.
const PREFIX = ['export function App(props) @{', '\t<div>{"hi"}</div>', '}', '', ''].join('\n');

/** @param {string} doc */
const end_pos = (doc) => {
	const lines = doc.split('\n');
	return { line: lines.length - 1, character: lines[lines.length - 1].length };
};

describe('completion at a blank line (vscode#13735 trigger)', () => {
	it('erasing a word back to a blank line returns an empty completion list', async () => {
		const { service, uri, set_document } = create_stateful_completion_harness(PREFIX);

		set_document(PREFIX + 'f');
		const typed = await service.getCompletionItems(uri, end_pos(PREFIX + 'f'), { triggerKind: 1 });

		set_document(PREFIX);
		const blank = await service.getCompletionItems(uri, end_pos(PREFIX), { triggerKind: 1 });

		expect(typed.items.length).toBeGreaterThan(0); // `f` is a mapped token → real completions
		expect(blank.items.length).toBe(0); // blank line has no completion mapping → empty list (the trigger)
	});
});
