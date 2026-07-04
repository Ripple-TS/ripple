import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createLanguage } from '@volar/language-core';
import { createLanguageService, createUriMap } from '@volar/language-service';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { beforeEach } from 'vitest';
import {
	getRippleLanguagePlugin,
	resolveConfig,
	_reset_for_test,
} from '@tsrx/typescript-plugin/src/language.js';
import { createCompileErrorDiagnosticPlugin } from '../src/compileErrorDiagnosticPlugin.js';
import { createCompletionPlugin } from '../src/completionPlugin.js';
import { createDocumentSymbolPlugin } from '../src/documentSymbolPlugin.js';
import { createTypeScriptServices } from '../src/typescriptService.js';

// `@volar/typescript` isn't a direct dependency; resolve it through the pinned
// `@volar/language-server`, like src/typescriptService.js does
const require = createRequire(import.meta.url);
/** @type {typeof import('@volar/typescript')} */
const volar_typescript = require(
	require.resolve('@volar/typescript', {
		paths: [path.dirname(fs.realpathSync(require.resolve('@volar/language-server')))],
	}),
);

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
 * Harness for asserting completionPlugin items via `service.getCompletionItems`.
 *
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
 * Harness for asserting source-mapped compile-error ranges via `service.getDiagnostics`.
 *
 * @param {string} source
 * @param {string} [fixture_name]
 */
export function create_diagnostic_harness(source, fixture_name = 'App.tsrx') {
	const uri = URI.file(path.join(fixture_dir, fixture_name));
	const scripts = createUriMap();
	const language = createLanguage([getRippleLanguagePlugin()], scripts, () => {});
	const source_snapshot = create_snapshot(source);
	language.scripts.set(uri, source_snapshot, 'ripple');

	const service = createLanguageService(
		language,
		[createCompileErrorDiagnosticPlugin()],
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
 * @param {string} file_name
 * @returns {string}
 */
function file_language_id(file_name) {
	if (file_name.endsWith('.tsrx')) return 'ripple';
	if (file_name.endsWith('.tsx')) return 'typescriptreact';
	if (file_name.endsWith('.jsx')) return 'javascriptreact';
	if (/\.(c|m)?js$/.test(file_name)) return 'javascript';
	if (file_name.endsWith('.json')) return 'json';
	return 'typescript';
}

/**
 * Completion harness with real TypeScript wired in, mirroring src/server.js's
 * project setup, so JSX element/attribute completions can be asserted.
 *
 * @param {string} source
 * @param {string} [fixture_name]
 */
export function create_ts_completion_harness(source, fixture_name = 'App.tsrx') {
	const uri = URI.file(path.join(fixture_dir, fixture_name));
	const scripts = createUriMap();

	/** @param {URI} script_uri */
	const as_file_name = (script_uri) => script_uri.fsPath.replace(/\\/g, '/');
	/** @param {string} file_name */
	const as_uri = (file_name) => URI.file(file_name);
	const fixture_file_name = as_file_name(uri);

	/** @type {Map<string, import('@volar/language-core').IScriptSnapshot | undefined>} */
	const fs_snapshots = new Map();

	const language_plugins = [
		getRippleLanguagePlugin(),
		{
			/** @param {URI} script_uri */
			getLanguageId: (script_uri) => file_language_id(script_uri.path),
		},
	];

	/** @type {import('@volar/language-core').Language<URI>} */
	const language = createLanguage(language_plugins, scripts, (script_uri, include_fs_files) => {
		if (!include_fs_files) {
			return;
		}
		const file_name = as_file_name(script_uri);
		if (file_name === fixture_file_name) {
			// the fixture lives in memory, never on disk
			return;
		}
		if (!fs_snapshots.has(file_name)) {
			fs_snapshots.set(
				file_name,
				ts.sys.fileExists(file_name)
					? ts.ScriptSnapshot.fromString(ts.sys.readFile(file_name) ?? '')
					: undefined,
			);
		}
		const snapshot = fs_snapshots.get(file_name);
		if (snapshot) {
			language.scripts.set(script_uri, snapshot, file_language_id(file_name));
		}
	});
	language.scripts.set(uri, create_snapshot(source), 'ripple');

	// jsx settings mirror a Ripple project tsconfig (templates/basic/tsconfig.json)
	const compiler_options = resolveConfig({
		options: {
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			jsx: ts.JsxEmit.Preserve,
			jsxImportSource: 'ripple',
			types: [],
			allowNonTsExtensions: true,
			baseUrl: root_dir,
			paths: {
				ripple: ['packages/ripple/types/index.d.ts'],
				'ripple/jsx-runtime': ['packages/ripple/src/jsx-runtime.d.ts'],
			},
		},
	}).options;

	const project_host = {
		getCurrentDirectory: () => root_dir,
		getCompilationSettings: () => compiler_options,
		getScriptFileNames: () => [fixture_file_name],
		getProjectVersion: () => '1',
	};

	const { languageServiceHost, getExtraServiceScript } = volar_typescript.createLanguageServiceHost(
		ts,
		ts.sys,
		language,
		as_uri,
		project_host,
	);

	const service = createLanguageService(
		language,
		[createCompletionPlugin(), ...createTypeScriptServices(ts)],
		{
			workspaceFolders: [URI.file(root_dir)],
			console,
		},
		{
			typescript: {
				configFileName: undefined,
				sys: ts.sys,
				languageServiceHost,
				getExtraServiceScript,
				uriConverter: {
					asUri: as_uri,
					asFileName: as_file_name,
				},
			},
		},
	);
	const document = TextDocument.create(uri.toString(), 'ripple', 0, source);

	return { document, service, uri };
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
