import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup_fixture_workspaces, create_fixture_workspace } from './workspace-fixtures.js';
import * as ts from 'typescript';
import { getRippleLanguagePlugin, TSRXVirtualCode, _reset_for_test } from '../src/language.js';

/**
 * @param {string} source
 * @returns {import('typescript').IScriptSnapshot}
 */
function create_snapshot(source) {
	return ts.ScriptSnapshot.fromString(source);
}

/**
 * @returns {ReturnType<typeof getRippleLanguagePlugin>}
 */
function create_plugin() {
	return getRippleLanguagePlugin();
}

/**
 * @param {ReturnType<typeof getRippleLanguagePlugin>} plugin
 * @param {string} file_name
 * @param {string} source
 * @returns {TSRXVirtualCode}
 */
function create_virtual_code(plugin, file_name, source) {
	const create_virtual_code_fn = plugin.createVirtualCode;
	if (typeof create_virtual_code_fn !== 'function') {
		throw new Error('Language plugin does not expose createVirtualCode');
	}

	/** @type {import('@volar/language-core').CodegenContext<string>} */
	const ctx = { getAssociatedScript: () => undefined };

	return /** @type {TSRXVirtualCode} */ (
		create_virtual_code_fn(file_name, 'ripple', create_snapshot(source), ctx)
	);
}

/**
 * @param {number} sourceStart
 * @param {number} sourceLength
 * @param {number} generatedStart
 * @param {number} generatedLength
 * @returns {import('@tsrx/core/types').CodeMapping}
 */
function token_mapping(sourceStart, sourceLength, generatedStart, generatedLength) {
	return {
		sourceOffsets: [sourceStart],
		lengths: [sourceLength],
		generatedOffsets: [generatedStart],
		generatedLengths: [generatedLength],
		data: { customData: {} },
	};
}

describe('typescript-plugin language plugin integration', () => {
	beforeEach(() => {
		_reset_for_test();
	});

	afterEach(() => {
		cleanup_fixture_workspaces();
	});

	it('recognizes only .tsrx through the language plugin', () => {
		const plugin = create_plugin();

		expect(plugin.getLanguageId('/tmp/App.tsrx')).toBe('ripple');
		expect(plugin.getLanguageId('/tmp/App.ripple')).toBeUndefined();
		expect(plugin.getLanguageId('/tmp/App.rsrx')).toBeUndefined();
		expect(plugin.getLanguageId('/tmp/App.ts')).toBeUndefined();
	});

	it('creates virtual code with the ripple compiler in a ripple project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('both');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, '<div>Hello Ripple</div>');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:ripple');
		expect(virtual_code.generatedCode).toContain(file_name);
	});

	it('creates virtual code with the react compiler in a react project when both compilers exist', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('both-react');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(
			plugin,
			file_name,
			'export default function App() { return <div>Hello TSRX</div>; }',
		);

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:react');
	});

	it('creates virtual code with the react compiler in a react-only project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('react-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:react');
	});

	// Octane exercises BOTH octane-specific paths at once: the package-internal
	// compiler entry (src/compiler/volar.js instead of the @tsrx/* layout) and
	// the camelCase `compileToVolarMappings` module-shape normalization.
	it('creates virtual code with the octane compiler in an octane project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('octane-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:octane');
		expect(virtual_code.generatedCode).toContain(file_name);
	});

	it('prefers the octane compiler when other compilers also exist in an octane project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('both-octane');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:octane');
	});

	it('creates virtual code with the vue compiler in a vue-only project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('vue-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(
			plugin,
			file_name,
			'function App() { return <> <div>Hello</div> </>; }',
		);

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:vue');
	});

	it('creates virtual code with the vue compiler in a vue project when both compilers exist', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('both-vue');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(
			plugin,
			file_name,
			'function App() { return <> <div>Hello Vue</div> </>; }',
		);

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:vue');
	});

	it('creates virtual code with the ripple compiler in a ripple-only project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('ripple-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, '<div>Hello</div>');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:ripple');
	});

	it('spans overlapping token mappings for a source range with no exact mapping', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('ripple-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, '<div/>');

		// A diagnostic on a whole statement like `const test = 5;` points at the
		// `const` keyword (offset 10) through the trailing `;` (offset 25). The
		// compiler only emits granular token mappings and drops keywords and
		// punctuation, so only `test` ([16,20)) and `5` ([23,24)) are mapped — no
		// single mapping covers the statement, and neither endpoint is mapped.
		virtual_code.mappings = [
			token_mapping(16, 4, 100, 4), // test
			token_mapping(23, 1, 107, 1), // 5
		];

		// The exact-range lookup the diagnostic plugin tries first cannot resolve
		// the statement (no `10-25` mapping)...
		expect(virtual_code.findMappingBySourceRange(10, 25)).toBeNull();

		// ...but the overlap fallback anchors on the first/last tokens inside the
		// range, spanning `test` through `5` in generated space even though the
		// `const` keyword and `;` at the endpoints are unmapped.
		expect(virtual_code.findGeneratedRangeBySourceRange(10, 25)).toEqual([100, 108]);

		// A single mapped token still resolves via the exact lookup.
		expect(virtual_code.findMappingBySourceRange(16, 20)).not.toBeNull();

		// A range that overlaps no token at all stays unresolved (the caller then
		// falls back to the source map).
		expect(virtual_code.findGeneratedRangeBySourceRange(0, 5)).toBeNull();
	});

	it('returns undefined for non-tsrx files before compiler resolution', () => {
		const plugin = create_plugin();
		const create_virtual_code_fn = /** @type {any} */ (plugin.createVirtualCode);
		if (typeof create_virtual_code_fn !== 'function') {
			throw new Error('Language plugin does not expose createVirtualCode');
		}

		expect(
			create_virtual_code_fn(
				path.join(create_fixture_workspace('both'), 'src', 'App.ripple'),
				'ripple',
				create_snapshot('<div>Hello</div>'),
			),
		).toBeUndefined();
	});
});
