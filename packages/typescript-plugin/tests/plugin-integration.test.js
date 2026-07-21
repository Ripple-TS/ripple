import path from 'path';
import fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup_fixture_workspaces, create_fixture_workspace } from './workspace-fixtures.js';
import * as ts from 'typescript';
import {
	getRippleLanguagePlugin,
	getRippleDirForFile,
	get_tsrx_compiler_name_for_file,
	TSRXVirtualCode,
	_reset_for_test,
} from '../src/language.js';
import { resolve_consumer_compiler_for_file } from '../src/consumer-compiler.js';

/** @import {WORKSPACE_CONFIGS} from './workspace-fixtures.js' */
/** @typedef {keyof typeof WORKSPACE_CONFIGS} WorkspaceName */
/** @typedef {(workspace: string, config_path: string) => void} FixtureConfigurator */

/**
 * @typedef {object} DebugFixtureOptions
 * @property {WorkspaceName} [workspace_name]
 * @property {Record<string, unknown>} [files]
 * @property {unknown} [tsrx]
 * @property {string} [compiler]
 * @property {string[]} [file_parts]
 * @property {string} [marker]
 * @property {'error_spy' | 'warning_spy'} [log_method]
 * @property {(result: Awaited<ReturnType<typeof compile_debug_fixture>>) => unknown[]} [log_parts]
 * @property {boolean} [no_error]
 * @property {boolean} [escape_proof]
 * @property {boolean} [create_proof]
 */

/** @typedef {[name: string, options: DebugFixtureOptions]} DebugFixtureCase */

/**
 * @param {string} source
 * @returns {import('typescript').IScriptSnapshot}
 */
function create_snapshot(source) {
	return ts.ScriptSnapshot.fromString(source);
}

/**
 * @param {Parameters<typeof getRippleLanguagePlugin>[0]} [options]
 * @returns {ReturnType<typeof getRippleLanguagePlugin>}
 */
function create_plugin(options) {
	return getRippleLanguagePlugin(options);
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

/** @param {WorkspaceName} workspace_name @param {FixtureConfigurator} [configure] @param {string[]} [file_parts] */
function prepare_fixture(workspace_name, configure, file_parts = ['src', 'App.tsrx']) {
	const workspace = create_fixture_workspace(workspace_name);
	const config_path = path.join(workspace, 'tsconfig.json');
	configure?.(workspace, config_path);
	return { workspace, config_path, file_name: path.join(workspace, ...file_parts) };
}

/** @param {WorkspaceName} workspace_name @param {FixtureConfigurator} [configure] @param {string[]} [file_parts] */
async function compile_debug_fixture(workspace_name, configure, file_parts = ['src', 'App.tsrx']) {
	vi.stubEnv('RIPPLE_DEBUG', 'true');
	vi.resetModules();
	const error_spy = vi.spyOn(console, 'error').mockImplementation(() => {});
	const warning_spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const { getRippleLanguagePlugin: create_debug_plugin, _reset_for_test: reset_debug_plugin } =
		await import('../src/language.js');
	const { workspace, config_path, file_name } = prepare_fixture(
		workspace_name,
		configure,
		file_parts,
	);
	reset_debug_plugin();
	const plugin = create_debug_plugin();
	const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');
	// prettier-ignore
	return { workspace, tsconfig_path: config_path, error_spy, warning_spy, create_virtual_code_fn: plugin.createVirtualCode, virtual_code };
}

/** @param {string} file_name @param {unknown} config */
function write_config(file_name, config) {
	fs.mkdirSync(path.dirname(file_name), { recursive: true });
	fs.writeFileSync(file_name, JSON.stringify(config, null, 2) + '\n');
}

/**
 * @param {string} config_path
 * @param {unknown} config
 * @returns {import('../src/tsconfig-resolution.js').TsconfigHost}
 */
function create_config_host(config_path, config) {
	const normalized_config_path = path.resolve(config_path);
	return {
		...ts.sys,
		/** @param {string} file_name */
		readFile(file_name) {
			return path.resolve(file_name) === normalized_config_path
				? JSON.stringify(config)
				: ts.sys.readFile(file_name);
		},
	};
}

/** @param {string} workspace @param {Record<string, unknown>} files */
function write_inheritance_files(workspace, files) {
	for (const [relative_path, config] of Object.entries(files)) {
		const file_name = path.join(workspace, relative_path);
		fs.mkdirSync(path.dirname(file_name), { recursive: true });
		fs.writeFileSync(
			file_name,
			typeof config === 'string' ? config : JSON.stringify(config, null, 2) + '\n',
		);
	}
}

/** @param {unknown} compiler */
function compiler_declaration(compiler) {
	return { tsrx: { compiler } };
}

/** @param {string | string[]} extends_value @param {unknown} [tsrx] */
function project_config(extends_value, tsrx) {
	return {
		extends: extends_value,
		...(tsrx === undefined ? {} : { tsrx }),
		compilerOptions: {},
	};
}

/** @param {WorkspaceName} workspace_name @param {FixtureConfigurator} [configure] @param {string[]} [file_parts] @param {Parameters<typeof create_plugin>[0] | ((config_path: string) => Parameters<typeof create_plugin>[0])} [options] */
function compile_fixture(workspace_name, configure, file_parts = ['src', 'App.tsrx'], options) {
	// prettier-ignore
	const { workspace, config_path, file_name } = prepare_fixture(workspace_name, configure, file_parts);
	const virtual_code = create_virtual_code(
		create_plugin(typeof options === 'function' ? options(config_path) : options),
		file_name,
		'export default <div>Hello</div>;',
	);
	return { workspace, config_path, file_name, virtual_code };
}

const COMPILER_A = 'inherited-compiler-a';
const COMPILER_B = 'inherited-compiler-b';

/** @param {{ base?: unknown, child?: unknown, middle?: boolean, branches?: unknown[], jsonc?: boolean, package_base?: unknown }} scenario */
function inheritance_files(scenario) {
	if (scenario.jsonc) {
		return {
			'base.json': `{\n\t// inherited compiler\n\t"tsrx": { "compiler": "${COMPILER_A}", },\n}\n`,
			'tsconfig.json': '{\n\t// root config\n\t"extends": "./base.json",\n}\n',
		};
	}
	if (scenario.package_base !== undefined) {
		return {
			'node_modules/@consumer/tsconfig/package.json': {
				name: '@consumer/tsconfig',
				version: '1.0.0',
			},
			'node_modules/@consumer/tsconfig/base.json': compiler_declaration(scenario.package_base),
			'tsconfig.json': project_config('@consumer/tsconfig/base.json'),
		};
	}
	if (scenario.branches) {
		const [first, second] = scenario.branches;
		return {
			'a.json': compiler_declaration(first),
			'b.json': second === undefined ? {} : compiler_declaration(second),
			'tsconfig.json': project_config(['./a.json', './b.json']),
		};
	}
	const root_base = scenario.middle ? './middle.json' : './base.json';
	return {
		'base.json': compiler_declaration(scenario.base),
		...(scenario.middle ? { 'middle.json': { extends: './base.json' } } : {}),
		'tsconfig.json': project_config(root_base, scenario.child),
	};
}

/** @param {{ root?: string, base?: string, child?: unknown }} scenario */
function malformed_files(scenario) {
	if (scenario.root) return { 'tsconfig.json': scenario.root };
	return {
		'base.json': scenario.base,
		'tsconfig.json': project_config('./base.json', scenario.child),
	};
}

/** @param {Awaited<ReturnType<typeof compile_debug_fixture>>} result @param {'error_spy' | 'warning_spy'} method @param {...unknown} parts */
function expect_log(result, method, ...parts) {
	// prettier-ignore
	expect(result[method]).toHaveBeenCalledWith('[Ripple Language]', ...parts.map((part) => typeof part === 'string' ? expect.stringContaining(part) : part));
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

	/** @type {Array<[string, WorkspaceName, string, FixtureConfigurator | undefined, string | undefined]>} */
	const declared_compiler_cases = [
		[
			'uses a declared module compiler when no built-in candidate package is installed',
			'declared-only',
			'declared',
			undefined,
			undefined,
		],
		[
			'accepts a declared compiler using a scoped package specifier',
			'declared-scoped',
			'scoped',
			undefined,
			undefined,
		],
		[
			'accepts a declared compiler using a whitespace-padded scoped package specifier',
			'declared-scoped-whitespace',
			'scoped',
			undefined,
			undefined,
		],
		[
			'accepts a declared compiler using a package subpath specifier',
			'declared-subpath',
			'subpath',
			undefined,
			undefined,
		],
		[
			'accepts a declared compiler using a scoped package subpath specifier',
			'declared-scoped-subpath',
			'scoped-subpath',
			undefined,
			undefined,
		],
		[
			'accepts a declared compiler using a mixed-case scoped package subpath specifier',
			'declared-mixed-case-subpath',
			'mixed-case-subpath',
			undefined,
			undefined,
		],
		[
			'prefers a declared compiler over installed built-in candidates',
			'declared-beats-candidates',
			'declared',
			undefined,
			'ripple',
		],
		[
			'accepts comments and trailing commas in a compiler-declaring tsconfig',
			'inherited-declaration',
			'inherited-a',
			(workspace) =>
				fs.writeFileSync(
					path.join(workspace, 'tsconfig.json'),
					`{\n\t// Consumer compiler.\n\t"tsrx": { "compiler": "${COMPILER_A}", },\n}\n`,
				),
			undefined,
		],
	];
	// prettier-ignore
	it.each(declared_compiler_cases)('%s', (_, workspace_name, marker, configure, rejected = 'never-selected') => {
		const { virtual_code } = compile_fixture(workspace_name, configure);

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain(`compiler:${marker}`);
		expect(virtual_code.generatedCode).not.toContain(`compiler:${rejected}`);
	});

	/** @type {Array<[string, WorkspaceName, string[]]>} */
	const compiler_root_cases = [
		['candidate src entry', 'ripple-only', ['node_modules', '@tsrx', 'ripple']],
		['octane nested entry', 'octane-only', ['node_modules', 'octane']],
		['declared package-root entry', 'declared-only', ['node_modules', 'consumer-tsrx-compiler']],
		['declared dist entry', 'declared-dist', ['node_modules', 'consumer-dist-compiler']],
	];
	it.each(compiler_root_cases)(
		'returns the compiler package root for %s',
		(_, workspace_name, compiler_parts) => {
			const workspace = create_fixture_workspace(workspace_name);
			const file_name = path.join(workspace, 'src', 'App.tsrx');

			expect(fs.realpathSync(/** @type {string} */ (getRippleDirForFile(file_name)))).toBe(
				fs.realpathSync(path.join(workspace, ...compiler_parts)),
			);
		},
	);

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

	/** @type {DebugFixtureCase[]} */
	// prettier-ignore
	const malformed_cases = [
		['warns for a malformed tsconfig without tsrx and falls back to an installed candidate', { files: malformed_files({ root: '{ "compilerOptions": {\n' }), marker: 'compiler:ripple', log_method: 'warning_spy', log_parts: (result) => ['Unable to parse tsconfig layer', result.tsconfig_path, expect.any(String)] }],
		['reports a malformed nearest tsconfig containing tsrx text and does not fall back', { files: malformed_files({ root: `{ "tsrx": { "compiler": "${COMPILER_A}" },\n` }), log_method: 'error_spy', log_parts: (result) => ['Unable to parse tsconfig layer', result.tsconfig_path, expect.any(String)] }],
		['warns and falls back when a malformed base and the chain have no tsrx intent', { files: malformed_files({ base: '{ "compilerOptions": {\n' }), marker: 'compiler:ripple', log_method: 'warning_spy', log_parts: (result) => ['Unable to parse tsconfig layer', path.join(result.workspace, 'base.json'), expect.any(String)] }],
		['hard-stops when a malformed base contains textual tsrx intent', { files: malformed_files({ base: `{ "tsrx": { "compiler": "${COMPILER_A}" },\n` }), log_method: 'error_spy', log_parts: (result) => ['Unable to parse tsconfig layer', path.join(result.workspace, 'base.json'), expect.any(String)] }],
		['hard-stops when a parsed child shows tsrx intent beside a malformed silent base', { files: malformed_files({ base: '{ "compilerOptions": {\n', child: { compiler: COMPILER_A } }), log_method: 'error_spy', log_parts: (result) => ['Unable to parse tsconfig layer', path.join(result.workspace, 'base.json'), expect.any(String)] }],
];
	/** @type {DebugFixtureCase[]} */
	// prettier-ignore
	const invalid_value_cases = [
		['rejects a non-string compiler and does not fall back to an installed candidate', { tsrx: { compiler: 42 }, log_method: 'error_spy', log_parts: (result) => ['Invalid TSRX', 'number', '42', result.tsconfig_path] }],
		['rejects an empty compiler string and does not fall back to an installed candidate', { tsrx: { compiler: '' }, log_method: 'error_spy', log_parts: (result) => ['Invalid TSRX', 'string', '""', result.tsconfig_path] }],
		['rejects a whitespace-only compiler string and does not fall back to an installed candidate', { tsrx: { compiler: '   ' }, log_method: 'error_spy', log_parts: (result) => ['Invalid TSRX', 'string', '"   "', result.tsconfig_path] }],
		['rejects a non-object tsrx value and does not fall back to an installed candidate', { tsrx: 'string', log_method: 'error_spy', log_parts: (result) => ['Invalid TSRX', 'string', '"string"', result.tsconfig_path] }],
];
	const disallowed_specifiers = [
		'.',
		'..',
		'.\\evil',
		'..\\evil',
		'#internal',
		'@Consumer/tsrx-compiler',
		'@consumer/TSRX-compiler',
		'consumer-tsrx-compiler/.hidden',
	];
	// The generated labels preserve each allowlist proof in runner output.
	/** @type {DebugFixtureCase[]} */
	// prettier-ignore
	const specifier_cases = [
		['rejects a relative declaration and does not fall back to an installed candidate', { compiler: './compiler.cjs', workspace_name: 'inherited-declaration', file_parts: ['src', 'nested', 'components', 'App.tsrx'], log_method: 'error_spy', log_parts: (result) => ['must be a bare package specifier', './compiler.cjs', result.tsconfig_path] }],
		...disallowed_specifiers.map((compiler) => /** @type {DebugFixtureCase} */ ([`rejects the disallowed declaration ${JSON.stringify(compiler)} before module resolution`, { compiler, workspace_name: 'invalid-declared-specifier', log_method: 'error_spy', log_parts: (result) => ['must be a bare package specifier', compiler, result.tsconfig_path] }])),
	];
	// These are the three inheritance positions required by the matrix.
	/** @type {DebugFixtureCase[]} */
	// prettier-ignore
	const inherited_value_cases = [
		['applies effective-value semantics for an invalid base declaration without an override', { files: inheritance_files({ base: 42 }), log_method: 'error_spy', log_parts: () => ['Invalid TSRX', expect.anything(), expect.anything(), expect.anything()] }],
		['applies effective-value semantics for an invalid child declaration over a valid base', { files: inheritance_files({ base: COMPILER_A, child: { compiler: 42 } }), log_method: 'error_spy', log_parts: () => ['Invalid TSRX', expect.anything(), expect.anything(), expect.anything()] }],
		['applies effective-value semantics for an valid child declaration over an invalid base', { files: inheritance_files({ base: 42, child: { compiler: COMPILER_B } }), marker: 'compiler:inherited-b', no_error: true }],
];

	/** @type {DebugFixtureCase[]} */
	const debug_fixture_cases = [
		...malformed_cases,
		...invalid_value_cases,
		...specifier_cases,
		[
			'does not execute a package imports target declared with a hash specifier',
			{ workspace_name: 'invalid-declared-specifier', escape_proof: true },
		],
		[
			'reports an unresolvable declaration and does not fall back to an installed candidate',
			{
				compiler: 'missing-tsrx-compiler',
				log_method: 'error_spy',
				log_parts: (result) => ['missing-tsrx-compiler', result.tsconfig_path],
				create_proof: true,
			},
		],
		...inherited_value_cases,
	];

	it.each(debug_fixture_cases)('%s', async (_, options) => {
		const result = await compile_debug_fixture(
			options.workspace_name ?? 'inherited-declaration',
			(workspace, config_path) => {
				if (options.files) write_inheritance_files(workspace, options.files);
				if ('tsrx' in options) write_config(config_path, { tsrx: options.tsrx });
				if (options.compiler) write_config(config_path, compiler_declaration(options.compiler));
			},
			options.file_parts,
		);
		expect(result.virtual_code?.generatedCode).toEqual(
			options.marker ? expect.stringContaining(options.marker) : undefined,
		);
		if (options.log_method && options.log_parts) {
			expect_log(result, options.log_method, ...options.log_parts(result));
		}
		if (options.no_error) expect(result.error_spy).not.toHaveBeenCalled();
		if (options.escape_proof)
			expect(fs.existsSync(path.join(result.workspace, 'escape-executed'))).toBe(false);
		if (options.create_proof) expect(typeof result.create_virtual_code_fn).toBe('function');
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

	it.each([
		['uses a provided project config instead of walking to a nearer nested config', true, 'a', 'b'],
		['keeps nearest-config selection when no project config is provided', false, 'b', 'a'],
	])('%s', (_, use_project_config, expected, rejected) => {
		const { virtual_code } = compile_fixture(
			'inherited-declaration',
			(workspace, config_path) => {
				write_config(config_path, compiler_declaration(COMPILER_A));
				write_config(
					path.join(workspace, 'nested', 'tsconfig.json'),
					compiler_declaration(COMPILER_B),
				);
			},
			['nested', 'src', 'App.tsrx'],
			(config_path) =>
				use_project_config ? { ts, configFileName: config_path, configHost: ts.sys } : undefined,
		);

		expect(virtual_code.generatedCode).toContain(`compiler:inherited-${expected}`);
		expect(virtual_code.generatedCode).not.toContain(`compiler:inherited-${rejected}`);
	});

	it('isolates resolved config layers between hosts with different project snapshots', () => {
		const { config_path, file_name } = prepare_fixture('inherited-declaration');
		const plugin_a = create_plugin({
			ts,
			configFileName: config_path,
			configHost: create_config_host(config_path, compiler_declaration(COMPILER_A)),
		});
		const plugin_b = create_plugin({
			ts,
			configFileName: config_path,
			configHost: create_config_host(config_path, compiler_declaration(COMPILER_B)),
		});

		expect(
			create_virtual_code(plugin_a, file_name, 'export default <div>A</div>;').generatedCode,
		).toContain('compiler:inherited-a');
		expect(
			create_virtual_code(plugin_b, file_name, 'export default <div>B</div>;').generatedCode,
		).toContain('compiler:inherited-b');
	});

	it('uses the provided project config for compiler selection and compiler lookups', () => {
		let context;
		const { workspace, file_name, virtual_code } = compile_fixture(
			'both',
			(workspace, config_path) => {
				write_config(config_path, compiler_declaration('@tsrx/ripple'));
				write_config(
					path.join(workspace, 'nested', 'tsconfig.json'),
					compiler_declaration('@tsrx/react'),
				);
			},
			['nested', 'src', 'App.tsrx'],
			(config_path) => (context = { ts, configFileName: config_path, configHost: ts.sys }),
		);

		expect(virtual_code.generatedCode).toContain('compiler:ripple');
		expect(get_tsrx_compiler_name_for_file(file_name, context)).toBe('@tsrx/ripple');
		expect(fs.realpathSync(/** @type {string} */ (getRippleDirForFile(file_name, context)))).toBe(
			fs.realpathSync(path.join(workspace, 'node_modules', '@tsrx', 'ripple')),
		);
	});

	// prettier-ignore
	it.each([
		['base declaration when the child omits tsrx', { base: COMPILER_A }, 'a'],
		['base declaration when the child has an empty tsrx object', { base: COMPILER_A, child: {} }, 'a'],
		['child declaration over its base', { base: COMPILER_A, child: { compiler: COMPILER_B } }, 'b'],
		['transitive base declaration', { base: COMPILER_A, middle: true }, 'a'],
		['later declaration in an extends array', { branches: [COMPILER_A, COMPILER_B] }, 'b'],
		['earlier declaration when a later extends entry is silent', { branches: [COMPILER_A, undefined] }, 'a'],
		['JSONC root and extended configs', { jsonc: true }, 'a'],
		['package-based extends declaration', { package_base: COMPILER_A }, 'a'],
	])('uses the %s', (_, scenario, marker) => {
		const { virtual_code } = compile_fixture('inherited-declaration', (workspace) => {
			write_inheritance_files(workspace, inheritance_files(scenario));
		});

		expect(virtual_code.generatedCode).toContain(`compiler:inherited-${marker}`);
	});

	it('does not inherit from a root config that the nested project does not extend', () => {
		const { virtual_code } = compile_fixture(
			'inherited-declaration',
			(workspace, config_path) => {
				write_config(config_path, compiler_declaration(COMPILER_A));
				write_config(path.join(workspace, 'nested', 'tsconfig.json'), { compilerOptions: {} });
			},
			['nested', 'src', 'App.tsrx'],
		);

		expect(virtual_code.generatedCode).toContain('compiler:ripple');
		expect(virtual_code.generatedCode).not.toContain('compiler:inherited-a');
	});

	it('resolves an inherited compiler from the config that declares it', () => {
		const { virtual_code } = compile_fixture('inherited-declaration', (workspace, config_path) => {
			write_config(
				path.join(workspace, 'configs', 'base.json'),
				compiler_declaration('declaring-config-compiler'),
			);
			write_config(config_path, project_config('./configs/base.json'));
		});

		expect(virtual_code.generatedCode).toContain('compiler:declaring-config');
	});

	it('refreshes inherited config layers when a dependency changes', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('inherited-declaration');
		const base_path = path.join(workspace, 'base.json');
		write_config(base_path, { tsrx: { compiler: 'inherited-compiler-a' } });
		write_config(path.join(workspace, 'tsconfig.json'), {
			extends: './base.json',
			compilerOptions: {},
		});
		const file_name = path.join(workspace, 'src', 'App.tsrx');

		expect(
			create_virtual_code(plugin, file_name, 'export default <div>First</div>;').generatedCode,
		).toContain('compiler:inherited-a');
		write_config(base_path, { tsrx: { compiler: 'inherited-compiler-b' } });
		const changed_time = new Date(Date.now() + 10_000);
		fs.utimesSync(base_path, changed_time, changed_time);
		expect(
			create_virtual_code(plugin, file_name, 'export default <div>Second</div>;').generatedCode,
		).toContain('compiler:inherited-b');
	});

	it('hard-stops on an unresolved base and refreshes when the tracked base is created', () => {
		const workspace = create_fixture_workspace('inherited-declaration');
		const config_path = path.join(workspace, 'tsconfig.json');
		const missing_base_path = path.join(workspace, 'configs', 'base.json');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		/** @type {Set<string>} */
		const dependencies = new Set();
		write_config(config_path, { extends: './configs/base' });
		const options = { ts, configFileName: config_path, configHost: ts.sys, dependencies };

		expect(resolve_consumer_compiler_for_file(file_name, options)).toBeNull();
		expect(dependencies).toContain(missing_base_path);

		write_config(missing_base_path, compiler_declaration(COMPILER_A));
		expect(resolve_consumer_compiler_for_file(file_name, options)).toContain(
			path.join('node_modules', COMPILER_A),
		);
	});

	it('uses a child compiler declaration despite its unresolved lower-precedence base', () => {
		const { virtual_code } = compile_fixture('inherited-declaration', (_workspace, config_path) => {
			write_config(config_path, {
				extends: './missing-base',
				...compiler_declaration(COMPILER_A),
			});
		});

		expect(virtual_code.generatedCode).toContain('compiler:inherited-a');
	});

	it('retries a declared compiler package that is installed after an earlier lookup failed', () => {
		const workspace = create_fixture_workspace('inherited-declaration');
		const config_path = path.join(workspace, 'tsconfig.json');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const package_name = 'installed-later-compiler';
		const package_dir = path.join(workspace, 'node_modules', package_name);
		const compiler_entry = path.join(package_dir, 'index.cjs');
		write_config(config_path, compiler_declaration(package_name));
		const options = { ts, configFileName: config_path, configHost: ts.sys };

		expect(resolve_consumer_compiler_for_file(file_name, options)).toBeNull();

		write_config(path.join(package_dir, 'package.json'), {
			name: package_name,
			main: './index.cjs',
		});
		fs.writeFileSync(compiler_entry, 'module.exports = {};\n');
		const resolved_entry = resolve_consumer_compiler_for_file(file_name, options);
		expect(fs.realpathSync(/** @type {string} */ (resolved_entry))).toBe(
			fs.realpathSync(compiler_entry),
		);
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
