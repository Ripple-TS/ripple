import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createLanguage, forEachEmbeddedCode } from '@volar/language-core';
import { createUriMap } from '@volar/language-service';
import { URI } from 'vscode-uri';
import { beforeEach, describe, expect, it } from 'vitest';
import { getRippleLanguagePlugin, _reset_for_test } from '@tsrx/typescript-plugin/src/language.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root_dir = path.resolve(dirname, '../../..');
const fixture_dir = path.join(root_dir, 'packages', 'language-server', 'tests', 'fixtures');

beforeEach(() => {
	_reset_for_test();
});

/**
 * Build a virtual code for a `.tsrx` source and return it alongside the language
 * plugin instance so tests can inspect embedded codes and drive the plugin's
 * `typescript.getExtraServiceScripts` hook directly.
 * @param {string} source
 */
function create_virtual_code(source) {
	const uri = URI.file(path.join(fixture_dir, 'App.tsrx'));
	const scripts = createUriMap();
	const plugin = getRippleLanguagePlugin();
	const language = createLanguage([plugin], scripts, () => {});
	language.scripts.set(uri, ts.ScriptSnapshot.fromString(source), 'ripple');
	const root = language.scripts.get(uri)?.generated?.root;
	return { plugin, root, fileName: uri.fsPath };
}

/**
 * @param {import('@volar/language-core').VirtualCode | undefined} root
 * @param {string} languageId
 */
function embedded_of(root, languageId) {
	const out = [];
	for (const code of forEachEmbeddedCode(/** @type {any} */ (root))) {
		if (code.languageId === languageId) out.push(code);
	}
	return out;
}

describe('embedded <script> virtual codes', () => {
	it('creates a TypeScript embedded document for <script type="text/typescript">', () => {
		const { root } = create_virtual_code(
			`function App() @{
	<head>
		<script type="text/typescript">const n: number = 1 < 2 ? 3 : 4;</script>
	</head>
}`,
		);
		const ts_codes = embedded_of(root, 'typescript');
		expect(ts_codes).toHaveLength(1);
		expect(ts_codes[0].id).toBe('script_0');
		expect(ts_codes[0].snapshot.getText(0, ts_codes[0].snapshot.getLength())).toBe(
			'const n: number = 1 < 2 ? 3 : 4;',
		);
	});

	it('treats a plain <script> body as TypeScript too (TS is a superset of JS)', () => {
		const { root } = create_virtual_code(
			`function App() @{
	<head>
		<script>console.log(1 < 2);</script>
	</head>
}`,
		);
		const ts_codes = embedded_of(root, 'typescript');
		expect(ts_codes).toHaveLength(1);
		expect(ts_codes[0].snapshot.getText(0, ts_codes[0].snapshot.getLength())).toBe(
			'console.log(1 < 2);',
		);
	});

	it('keeps <style> CSS and <script> TS embedded codes side by side', () => {
		const { root } = create_virtual_code(
			`function App() @{
	<head>
		<script type="text/typescript">const a: number = 1;</script>
	</head>
	<div>
		<style>
			.card { color: red; }
		</style>
	</div>
}`,
		);
		expect(embedded_of(root, 'css')).toHaveLength(1);
		expect(embedded_of(root, 'typescript')).toHaveLength(1);
	});

	it('registers each <script> body as a unique TS service script via getExtraServiceScripts', () => {
		const { plugin, root, fileName } = create_virtual_code(
			`function App() @{
	<head>
		<script type="text/typescript">const a: number = 1;</script>
		<script>const b = 2;</script>
	</head>
}`,
		);
		const scripts = plugin.typescript?.getExtraServiceScripts?.(
			fileName,
			/** @type {any} */ (root),
		);
		expect(scripts).toHaveLength(2);

		for (const script of scripts) {
			expect(script.extension).toBe('.ts');
			expect(script.scriptKind).toBe(ts.ScriptKind.TS);
		}

		// fileNames must be unique so each becomes a distinct TS program entry.
		expect(new Set(scripts.map((s) => s.fileName)).size).toBe(2);

		// The returned `code` must be the exact instance stored in the root's
		// embeddedCodes (volar matches it by identity).
		const embedded = embedded_of(root, 'typescript');
		expect(scripts.map((s) => s.code)).toEqual(embedded);
	});

	it('emits no script embedded codes for self-closing <script src=... />', () => {
		const { root } = create_virtual_code(
			`function App() @{
	<head>
		<script src="/a.js" />
	</head>
}`,
		);
		expect(embedded_of(root, 'typescript')).toHaveLength(0);
	});
});

describe('embedded <script> compile-failure fallback', () => {
	// `import { from 'x';` makes compilation throw fatally, so the embedded codes
	// below come from the regex fallback (extractScriptFromSource), not the compiler.
	it('keeps a typed script embedded document alive while the file has a fatal error', () => {
		const { root } = create_virtual_code(
			`import { from 'x';
function App() @{
	<head>
		<script type="text/typescript">const n: number = 1;</script>
	</head>
}`,
		);
		const ts_codes = embedded_of(root, 'typescript');
		expect(ts_codes).toHaveLength(1);
		expect(ts_codes[0].snapshot.getText(0, ts_codes[0].snapshot.getLength())).toBe(
			'const n: number = 1;',
		);
	});

	it('does not let a self-closing <script src /> swallow a later script body', () => {
		const { root } = create_virtual_code(
			`import { from 'x';
function App() @{
	<head>
		<script src="/a.js" />
		<script>const x = 1;</script>
	</head>
}`,
		);
		const ts_codes = embedded_of(root, 'typescript');
		expect(ts_codes).toHaveLength(1);
		expect(ts_codes[0].snapshot.getText(0, ts_codes[0].snapshot.getLength())).toBe('const x = 1;');
	});
});
