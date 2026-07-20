import path from 'path';
import fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup_fixture_workspaces, create_fixture_workspace } from './workspace-fixtures.js';
import * as ts from 'typescript';
import {
	getRippleLanguagePlugin,
	getRippleDirForFile,
	TSRXVirtualCode,
	_reset_for_test,
} from '../src/language.js';

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
 * @param {keyof import('./workspace-fixtures.js').WORKSPACE_CONFIGS} workspace_name
 * @param {(workspace: string, tsconfig_path: string) => void} [configure]
 * @param {string[]} [file_parts]
 */
async function compile_debug_fixture(workspace_name, configure, file_parts = ['src', 'App.tsrx']) {
	vi.stubEnv('RIPPLE_DEBUG', 'true');
	vi.resetModules();
	const error_spy = vi.spyOn(console, 'error').mockImplementation(() => {});
	const warning_spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const { getRippleLanguagePlugin: create_debug_plugin, _reset_for_test: reset_debug_plugin } =
		await import('../src/language.js');
	const workspace = create_fixture_workspace(workspace_name);
	const tsconfig_path = path.join(workspace, 'tsconfig.json');
	configure?.(workspace, tsconfig_path);
	reset_debug_plugin();
	const create_virtual_code_fn = create_debug_plugin().createVirtualCode;
	const virtual_code = create_virtual_code_fn?.(
		path.join(workspace, ...file_parts),
		'ripple',
		create_snapshot('export default <div>Hello</div>;'),
		/** @type {import('@volar/language-core').CodegenContext<string>} */ ({
			getAssociatedScript: () => undefined,
		}),
	);

	return { workspace, tsconfig_path, error_spy, warning_spy, create_virtual_code_fn, virtual_code };
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
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
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

	it('uses a declared module compiler when no built-in candidate package is installed', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('declared-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:declared');
	});

	it.each([
		['candidate src entry', 'ripple-only', ['node_modules', '@tsrx', 'ripple']],
		['octane nested entry', 'octane-only', ['node_modules', 'octane']],
		['declared package-root entry', 'declared-only', ['node_modules', 'consumer-tsrx-compiler']],
		['declared dist entry', 'declared-dist', ['node_modules', 'consumer-dist-compiler']],
	])('returns the compiler package root for %s', (_, workspace_name, compiler_parts) => {
		const workspace = create_fixture_workspace(
			/** @type {keyof import('./workspace-fixtures.js').WORKSPACE_CONFIGS} */ (workspace_name),
		);
		const file_name = path.join(workspace, 'src', 'App.tsrx');

		expect(fs.realpathSync(/** @type {string} */ (getRippleDirForFile(file_name)))).toBe(
			fs.realpathSync(path.join(workspace, ...compiler_parts)),
		);
	});

	it('does not escape node_modules when a compiler package has no package.json', () => {
		const workspace = create_fixture_workspace('ripple-only');
		const compiler_package_json = path.join(
			workspace,
			'node_modules',
			'@tsrx',
			'ripple',
			'package.json',
		);
		fs.unlinkSync(compiler_package_json);

		expect(getRippleDirForFile(path.join(workspace, 'src', 'App.tsrx'))).toBeUndefined();
	});

	it.each([
		['scoped package', 'declared-scoped', 'compiler:scoped'],
		['whitespace-padded scoped package', 'declared-scoped-whitespace', 'compiler:scoped'],
		['package subpath', 'declared-subpath', 'compiler:subpath'],
		['scoped package subpath', 'declared-scoped-subpath', 'compiler:scoped-subpath'],
		[
			'mixed-case scoped package subpath',
			'declared-mixed-case-subpath',
			'compiler:mixed-case-subpath',
		],
	])('accepts a declared compiler using a %s specifier', (_, workspace_name, marker) => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace(
			/** @type {keyof import('./workspace-fixtures.js').WORKSPACE_CONFIGS} */ (workspace_name),
		);
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain(marker);
	});

	it('accepts comments and trailing commas in a compiler-declaring tsconfig', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('jsonc-declared');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:declared');
	});

	it('caches a declared compiler resolution for repeated edits in the tsconfig directory', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('declared-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		create_virtual_code(plugin, file_name, 'export default <div>First</div>;');
		const exists_spy = vi.spyOn(fs, 'existsSync');

		const virtual_code = create_virtual_code(
			plugin,
			file_name,
			'export default <div>Second</div>;',
		);

		expect(virtual_code.generatedCode).toContain('compiler:declared');
		expect(exists_spy).not.toHaveBeenCalled();
	});

	it('prefers a declared compiler over installed built-in candidates', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('declared-beats-candidates');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:declared');
		expect(virtual_code.generatedCode).not.toContain('compiler:ripple');
	});

	it.each([
		[
			'warns for a malformed tsconfig without tsrx and falls back to an installed candidate',
			'malformed-tsconfig-without-tsrx',
			'warning_spy',
			'compiler:ripple',
		],
		[
			'reports a malformed nearest tsconfig containing tsrx text and does not fall back',
			'malformed-tsconfig',
			'error_spy',
			undefined,
		],
	])('%s', async (_, workspace_name, log_method, compiler_marker) => {
		const result = await compile_debug_fixture(
			/** @type {keyof import('./workspace-fixtures.js').WORKSPACE_CONFIGS} */ (workspace_name),
		);

		if (compiler_marker) {
			expect(result.virtual_code?.generatedCode).toContain(compiler_marker);
		} else {
			expect(result.virtual_code).toBeUndefined();
		}
		expect(result[log_method]).toHaveBeenCalledWith(
			'[Ripple Language]',
			expect.stringContaining('Unable to parse nearest tsconfig'),
			expect.stringContaining(result.tsconfig_path),
			expect.any(String),
		);
	});

	it.each([
		['a non-string compiler', 'invalid-compiler-type', 'number', '42'],
		['an empty compiler string', 'empty-compiler', 'string', '""'],
		['a whitespace-only compiler string', 'whitespace-only-compiler', 'string', '"   "'],
		['a non-object tsrx value', 'invalid-tsrx-type', 'string', '"string"'],
	])(
		'rejects %s and does not fall back to an installed candidate',
		async (_, workspace_name, type, value) => {
			const result = await compile_debug_fixture(
				/** @type {keyof import('./workspace-fixtures.js').WORKSPACE_CONFIGS} */ (workspace_name),
			);

			expect(result.virtual_code).toBeUndefined();
			expect(result.error_spy).toHaveBeenCalledWith(
				'[Ripple Language]',
				expect.stringContaining('Invalid TSRX'),
				expect.stringContaining(type),
				expect.stringContaining(value),
				expect.stringContaining(result.tsconfig_path),
			);
		},
	);

	it('rejects a relative declaration and does not fall back to an installed candidate', async () => {
		const result = await compile_debug_fixture('relative-declared', undefined, [
			'src',
			'nested',
			'components',
			'App.tsrx',
		]);

		expect(result.virtual_code).toBeUndefined();
		expect(result.error_spy).toHaveBeenCalledWith(
			'[Ripple Language]',
			expect.stringContaining('must be a bare package specifier'),
			expect.stringContaining('./compiler.cjs'),
			expect.stringContaining(result.tsconfig_path),
		);
	});

	it.each([
		'.',
		'..',
		'.\\evil',
		'..\\evil',
		'#internal',
		'@Consumer/tsrx-compiler',
		'@consumer/TSRX-compiler',
		'consumer-tsrx-compiler/.hidden',
	])('rejects the disallowed declaration %j before module resolution', async (specifier) => {
		const result = await compile_debug_fixture(
			'invalid-declared-specifier',
			(_workspace, tsconfig_path) => {
				fs.writeFileSync(
					tsconfig_path,
					JSON.stringify({ tsrx: { compiler: specifier }, compilerOptions: {} }, null, 2) + '\n',
				);
			},
		);

		expect(result.virtual_code).toBeUndefined();
		expect(result.error_spy).toHaveBeenCalledWith(
			'[Ripple Language]',
			expect.stringContaining('must be a bare package specifier'),
			expect.stringContaining(specifier),
			expect.stringContaining(result.tsconfig_path),
		);
	});

	it('does not execute a package imports target declared with a hash specifier', async () => {
		const result = await compile_debug_fixture('invalid-declared-specifier');

		expect(result.virtual_code).toBeUndefined();
		expect(fs.existsSync(path.join(result.workspace, 'escape-executed'))).toBe(false);
	});

	it('reports an unresolvable declaration and does not fall back to an installed candidate', async () => {
		const result = await compile_debug_fixture('unresolvable-declared');

		expect(typeof result.create_virtual_code_fn).toBe('function');
		expect(result.virtual_code).toBeUndefined();
		expect(result.error_spy).toHaveBeenCalledWith(
			'[Ripple Language]',
			expect.stringContaining('missing-tsrx-compiler'),
			expect.stringContaining(result.tsconfig_path),
		);
	});

	it('uses the nearest tsconfig declaration for a nested sub-project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('nearest-tsconfig');
		const root_file_name = path.join(workspace, 'src', 'App.tsrx');
		const nested_file_name = path.join(workspace, 'nested', 'src', 'App.tsrx');
		const root_virtual_code = create_virtual_code(
			plugin,
			root_file_name,
			'export default <div>Root</div>;',
		);
		const nested_virtual_code = create_virtual_code(
			plugin,
			nested_file_name,
			'export default <div>Nested</div>;',
		);

		expect(root_virtual_code.generatedCode).toContain('compiler:declared');
		expect(nested_virtual_code.generatedCode).toContain('compiler:nested');
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
