import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createLanguage } from '@volar/language-core';
import { createLanguageService, createUriMap } from '@volar/language-service';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { beforeEach } from 'vitest';
import { getRippleLanguagePlugin, _reset_for_test } from '@tsrx/typescript-plugin/src/language.js';
import { createDocumentSymbolPlugin } from '../src/documentSymbolPlugin.js';
import { createCompletionPlugin } from '../src/completionPlugin.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root_dir = path.resolve(dirname, '../../..');
const fixture_dir = path.join(root_dir, 'packages', 'language-server', 'tests', 'fixtures');

beforeEach(() => {
	_reset_for_test();
});

/**
 * @param {string} source
 * @returns {import('@volar/language-core').IScriptSnapshot}
 */
function create_snapshot(source) {
	return ts.ScriptSnapshot.fromString(source);
}

/**
 * @param {string} source
 * @param {string} [fixture_name]
 */
export function create_symbol_harness(source, fixture_name = 'App.tsrx') {
	const uri = URI.file(path.join(fixture_dir, fixture_name));
	const scripts = createUriMap();
	const language = createLanguage([getRippleLanguagePlugin()], scripts, () => {});
	const source_snapshot = create_snapshot(source);
	language.scripts.set(uri, source_snapshot, 'ripple');

	const service = createLanguageService(
		language,
		[createDocumentSymbolPlugin()],
		{
			workspaceFolders: [URI.file(root_dir)],
			console,
		},
		{},
	);
	const document = TextDocument.create(uri.toString(), 'ripple', 0, source);

	return { document, service, uri };
}

/**
 * Build a Volar language service wired with the completion plugin, so tests can drive
 * completions end-to-end (including Volar's source<->generated mapping).
 * @param {string} source
 * @param {string} [fixture_name]
 */
export function create_completion_harness(source, fixture_name = 'App.tsrx') {
	const uri = URI.file(path.join(fixture_dir, fixture_name));
	const scripts = createUriMap();
	const language = createLanguage([getRippleLanguagePlugin()], scripts, () => {});
	const source_snapshot = create_snapshot(source);
	language.scripts.set(uri, source_snapshot, 'ripple');

	const service = createLanguageService(
		language,
		[createCompletionPlugin()],
		{
			workspaceFolders: [URI.file(root_dir)],
			console,
		},
		{},
	);
	const document = TextDocument.create(uri.toString(), 'ripple', 0, source);

	return { document, service, uri };
}

/**
 * Like {@link create_completion_harness}, but exposes a `set_document` handle so a test can rewrite
 * the file between requests. Needed to emulate a VS Code completion session (typing / erasing /
 * retyping) against the real language service — the single-snapshot harness can't.
 * @param {string} initial_source
 * @param {string} [fixture_name]
 */
export function create_stateful_completion_harness(initial_source, fixture_name = 'App.tsrx') {
	const uri = URI.file(path.join(fixture_dir, fixture_name));
	const scripts = createUriMap();
	const language = createLanguage([getRippleLanguagePlugin()], scripts, () => {});
	const set_document = (/** @type {string} */ source) => {
		language.scripts.set(uri, create_snapshot(source), 'ripple');
	};
	set_document(initial_source);

	const service = createLanguageService(
		language,
		[createCompletionPlugin()],
		{
			workspaceFolders: [URI.file(root_dir)],
			console,
		},
		{},
	);

	return { service, uri, set_document };
}

/**
 * @param {import('@volar/language-server').DocumentSymbol[] | undefined} symbols
 * @param {string} name
 */
export function find_symbol(symbols, name) {
	for (const symbol of symbols ?? []) {
		if (symbol.name === name) {
			return symbol;
		}
		const child = find_symbol(symbol.children, name);
		if (child) {
			return child;
		}
	}
}

/**
 * @param {TextDocument} document
 * @param {import('@volar/language-server').Range} range
 */
export function get_range_text(document, range) {
	return document.getText(range);
}

/**
 * @param {import('@volar/language-server').DocumentSymbol[] | undefined} symbols
 */
export function symbol_name_kinds(symbols) {
	return symbols?.map((symbol) => [symbol.name, symbol.kind]);
}

/**
 * @param {import('@volar/language-server').DocumentSymbol[] | undefined} symbols
 * @param {string} name
 */
export function child_names(symbols, name) {
	return find_symbol(symbols, name)?.children?.map((symbol) => symbol.name);
}
