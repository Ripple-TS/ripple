import { describe, expect, it } from 'vitest';
import { createJsxTransform, createVolarMappingsResult, parseModule } from '../../src/index.js';

/**
 * Type-only lowering of the opt-in server-module dialect
 * (`platform.serverModule`). The dialect — a non-ambient
 * `module server { … }` block whose body may hold static imports, plus a
 * boundary `import { x } from 'server'` — can never typecheck verbatim
 * (TS1147 for the in-block import, TS2307 for the boundary import), so
 * platforms that own such a dialect ask the shared type-only transform to
 * lower it to plain checkable TS. Platforms WITHOUT the option must see
 * byte-identical passthrough.
 */

const SERVER_MODULE_PLATFORM = {
	name: 'server-module-test',
	imports: {
		fragment: 'test-platform',
		suspense: 'test-platform',
		dynamic: 'test-platform/dynamic',
		errorBoundary: 'test-platform/error-boundary',
	},
	jsx: {
		rewriteClassAttr: false,
		classAttrName: 'class',
	},
	validation: {
		requireUseServerForAwait: false,
	},
	serverModule: { blockName: 'server', importSpecifier: 'server' },
};

const PLAIN_PLATFORM = {
	...SERVER_MODULE_PLATFORM,
	name: 'plain-test',
	serverModule: undefined,
};

const PARSE_OPTIONS = {
	collect: true,
	loose: true,
	preserveParens: true,
	keywordTokens: true,
};

/**
 * Mirrors a platform's editor pipeline: parse → type-only transform → Volar
 * mappings (the same wiring tsrx-react's `compile_to_volar_mappings` and
 * downstream octane's `compileToVolarMappings` use).
 */
function compile_to_volar_mappings(
	source,
	{ platform = SERVER_MODULE_PLATFORM, typeOnly = true } = {},
) {
	const errors = [];
	const comments = [];
	const ast = parseModule(source, 'App.tsrx', { ...PARSE_OPTIONS, errors, comments });
	const transform = createJsxTransform(platform);
	const transformed = transform(ast, source, 'App.tsrx', {
		collect: true,
		loose: true,
		typeOnly,
		errors,
		comments,
	});
	const result = createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		errors,
	});
	return { ...result, errors };
}

const DIALECT_SOURCE =
	'module server {\n' +
	"\timport { commitOrder } from './server-domain.ts';\n" +
	'\n' +
	'\texport type Receipt = { id: string };\n' +
	'\n' +
	'\texport async function placeOrder(request: unknown) {\n' +
	'\t\treturn commitOrder(request);\n' +
	'\t}\n' +
	'}\n' +
	'\n' +
	"import { placeOrder, type Receipt } from 'server';\n" +
	'\n' +
	'export function App() @{\n' +
	"\tconst pending = placeOrder('r1');\n" +
	'\t<button>{String(pending)}</button>\n' +
	'}\n';

describe('server-module type-only lowering', () => {
	it('hoists block imports and lowers the block to a namespace keeping the authored name and id location', () => {
		const result = compile_to_volar_mappings(DIALECT_SOURCE);
		expect(result.errors).toEqual([]);
		// The dialect never reaches the virtual TSX...
		expect(result.code).not.toContain('module server');
		expect(result.code).not.toContain("from 'server'");
		// ...the block import is hoisted to module top level, ahead of the
		// namespace the block lowered into.
		const hoisted_at = result.code.indexOf("import { commitOrder } from './server-domain.ts';");
		const namespace_at = result.code.indexOf('namespace server');
		expect(hoisted_at).toBeGreaterThanOrEqual(0);
		expect(namespace_at).toBeGreaterThan(hoisted_at);
		// The namespace id keeps the AUTHORED block-name span, so the block's
		// `server` identifier still resolves for hover / rename.
		const block_name_offset = DIALECT_SOURCE.indexOf('server');
		const mapped_source_offsets = new Set(result.mappings.flatMap((m) => m.sourceOffsets));
		expect(mapped_source_offsets.has(block_name_offset)).toBe(true);
		// Authored identifiers inside the block and at the boundary import keep
		// their mappings too.
		expect(mapped_source_offsets.has(DIALECT_SOURCE.indexOf('commitOrder'))).toBe(true);
		expect(mapped_source_offsets.has(DIALECT_SOURCE.indexOf('placeOrder'))).toBe(true);
	});

	it("lowers `import { x } from 'server'` to import-equals aliases and type-only specifiers to type aliases", () => {
		const result = compile_to_volar_mappings(DIALECT_SOURCE);
		expect(result.errors).toEqual([]);
		// import-equals keeps every meaning of the export — a destructure would
		// strip the type meaning of a class or enum exported from the block.
		expect(result.code).toContain('import placeOrder = server.placeOrder');
		expect(result.code).toContain('type Receipt = server.Receipt;');
		expect(result.code).not.toContain('const { placeOrder }');
	});

	it('aliases hoisted block imports whose local names the client half also uses', () => {
		const source =
			"import { commitOrder } from './client-domain.ts';\n" +
			'\n' +
			'module server {\n' +
			"\timport { commitOrder, type Money } from './server-domain.ts';\n" +
			'\n' +
			'\texport async function placeOrder(amount: Money) {\n' +
			'\t\treturn commitOrder(amount);\n' +
			'\t}\n' +
			'}\n' +
			'\n' +
			"import { placeOrder } from 'server';\n" +
			'\n' +
			'export const start = () => [commitOrder, placeOrder];\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		expect(result.code).not.toContain('module server');
		// The client import hoists untouched; the colliding block import hoists
		// under a mangled namespace and is re-bound inside the namespace with
		// BOTH meanings preserved: an import-equals alias and a type alias.
		expect(result.code).toContain("import { commitOrder } from './client-domain.ts';");
		expect(result.code).toContain("import * as __tsrx_server_import$0 from './server-domain.ts';");
		expect(result.code).toContain('import commitOrder = __tsrx_server_import$0.commitOrder');
		expect(result.code).toContain('type Money = __tsrx_server_import$0.Money;');
		// The verbatim block import must NOT be hoisted (it would be a TS2300
		// duplicate of the client import).
		expect(result.code).not.toContain(
			"import { commitOrder, type Money } from './server-domain.ts';",
		);
	});

	it('rebinds a colliding namespace import as an import-equals alias keeping both meanings', () => {
		const source =
			"import { api } from './client-api.ts';\n" +
			'module server {\n' +
			"\timport * as api from './server-api.ts';\n" +
			'\texport type Names = api.Names;\n' +
			'\texport const list = () => api.names;\n' +
			'}\n' +
			"import { list } from 'server';\n" +
			'export const start = () => [api, list];\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		// A `const api = …` alias would keep only the value meaning; the
		// import-equals alias keeps `api.Names` checkable in type position too.
		expect(result.code).toContain('import api = __tsrx_server_import$0');
		expect(result.code).not.toContain('const api');
	});

	it('rebinds colliding type-only default and namespace imports through a value hoist', () => {
		const source =
			"import { Config, api } from './client.ts';\n" +
			'module server {\n' +
			"\timport type Config from './server-config.ts';\n" +
			"\timport type * as api from './server-api.ts';\n" +
			'\texport type Snapshot = { config: Config; names: api.Names };\n' +
			'}\n' +
			"import { type Snapshot } from 'server';\n" +
			'export const start = (): Snapshot | null => null;\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		// The mangled hoists must be VALUE imports (an import-equals alias of a
		// type-only import is TS1380), and the type-only default must rebind as
		// a type alias — a `const` alias would be type-only-used-as-value
		// (TS1361) at the editor.
		expect(result.code).not.toContain('import type * as');
		expect(result.code).toContain("import * as __tsrx_server_import$0 from './server-config.ts';");
		expect(result.code).toContain("import * as __tsrx_server_import$1 from './server-api.ts';");
		expect(result.code).toContain('type Config = __tsrx_server_import$0.default;');
		expect(result.code).toContain('import api = __tsrx_server_import$1');
		expect(result.code).not.toContain('const Config');
	});

	it('keeps import attributes on the mangled hoist of a colliding import', () => {
		const source =
			"import config from './client-config.json' with { type: 'json' };\n" +
			'module server {\n' +
			"\timport config from './server-config.json' with { type: 'json' };\n" +
			'\texport const read = () => config;\n' +
			'}\n' +
			"import { read } from 'server';\n" +
			'export const start = () => [config, read];\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		// Dropping the `with { … }` clause would break resolution for
		// attribute-sensitive modules such as JSON imports. The default rebinds
		// off a mangled DEFAULT specifier — a JSON module's namespace has no
		// `default` member under bundler resolution — and no unreferenced
		// namespace specifier is hoisted (`noUnusedLocals` would flag it).
		expect(result.code).toContain(
			"import __tsrx_server_import$0_default from './server-config.json' with { type: 'json' };",
		);
		expect(result.code).toContain('const config = __tsrx_server_import$0_default;');
		expect(result.code).not.toContain('import * as __tsrx_server_import$0 ');
	});

	it('destructures string-named imports — type-only included — in both lowering paths', () => {
		// The inline `{ type 'c d' as T }` form is a parse error upstream; the
		// statement-level `import type { … }` form is how a string-named
		// specifier reaches the lowering as type-only.
		const source =
			"import { db, T } from './client.ts';\n" +
			'module server {\n' +
			"\timport { 'a b' as db } from './server.ts';\n" +
			"\timport type { 'c d' as T } from './server-types.ts';\n" +
			'\texport const use = (): T => db;\n' +
			'}\n' +
			"import { 'weird name' as use } from 'server';\n" +
			"import type { 'o k' as OK } from 'server';\n" +
			'export const start = (): OK | null => [db, T, use] && null;\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		// A string can appear in neither an entity name nor a qualified type
		// reference — `type T = ns.'c d'` would not even parse, breaking the
		// whole virtual file. The destructure is the one parseable fallback,
		// binding only a value.
		expect(result.code).toContain("const { 'a b': db } = __tsrx_server_import$0;");
		expect(result.code).toContain("const { 'c d': T } = __tsrx_server_import$1;");
		expect(result.code).toContain("const { 'weird name': use } = server;");
		expect(result.code).toContain("const { 'o k': OK } = server;");
		expect(result.code).not.toContain(".'");
	});

	it('renames imported-as bindings through the import-equals alias', () => {
		const source =
			'module server {\n' +
			'\texport function placeOrder(request: unknown) {\n' +
			'\t\treturn request;\n' +
			'\t}\n' +
			'}\n' +
			"import { placeOrder as sendOrder } from 'server';\n" +
			'export const start = () => sendOrder(1);\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		expect(result.code).toContain('import sendOrder = server.placeOrder');
	});

	describe('degenerate inputs pass through verbatim', () => {
		it("keeps a boundary import without any server block (the editor's TS2307 mirrors the build error)", () => {
			const source = "import { f } from 'server';\nexport const start = () => f();\n";
			const result = compile_to_volar_mappings(source);
			expect(result.code).toContain("from 'server'");
		});

		it('keeps default/namespace boundary imports (a hard compile error in the dialect)', () => {
			const source =
				'module server {\n\texport const x = 1;\n}\n' +
				"import serverDefault from 'server';\n" +
				'export const start = () => serverDefault;\n';
			const result = compile_to_volar_mappings(source);
			// The block still lowers, but the unsupported import stays for TS to flag.
			expect(result.code).toContain('namespace server');
			expect(result.code).toContain("import serverDefault from 'server';");
		});

		it('drops a specifier-less boundary import (the runtime compiler accepts and elides it)', () => {
			const source = 'module server {\n\texport const x = 1;\n}\n' + "import 'server';\n";
			const result = compile_to_volar_mappings(source);
			expect(result.code).toContain('namespace server');
			expect(result.code).not.toContain("import 'server'");
		});

		it('lowers only the first server block; a duplicate stays verbatim for TS to flag', () => {
			const source =
				'module server {\n\texport const x = 1;\n}\n' +
				'module server {\n\texport const y = 2;\n}\n';
			const result = compile_to_volar_mappings(source);
			expect(result.code).toContain('namespace server');
			expect(result.code).toContain('module server');
		});

		it('never lowers in runtime (non-typeOnly) output even with the option set', () => {
			const source = 'module server {\n\texport const x = 1;\n}\n';
			const result = compile_to_volar_mappings(source, { typeOnly: false });
			expect(result.code).toContain('module server');
			expect(result.code).not.toContain('namespace server');
		});

		it('is byte-identical passthrough for platforms without the option', () => {
			const with_dialect = compile_to_volar_mappings(DIALECT_SOURCE, { platform: PLAIN_PLATFORM });
			expect(with_dialect.code).toContain('module server');
			expect(with_dialect.code).toContain("from 'server'");
			// A file with no dialect at all compiles identically under both
			// platforms — the option only gates the pre-pass.
			const plain_source = 'export function App() @{\n\t<button>{String(1)}</button>\n}\n';
			const a = compile_to_volar_mappings(plain_source, { platform: PLAIN_PLATFORM });
			const b = compile_to_volar_mappings(plain_source);
			expect(b.code).toBe(a.code);
			expect(JSON.stringify(b.mappings)).toBe(JSON.stringify(a.mappings));
		});
	});

	describe("the authored `'server'` specifier span", () => {
		const literal_start = DIALECT_SOURCE.indexOf("from 'server'") + 'from '.length;
		const inner_start = literal_start + 1; // skip the opening quote
		const inner_length = 'server'.length;

		it('maps hover/navigation to the namespace WITHOUT semantic tokens, keeping string coloring', () => {
			const result = compile_to_volar_mappings(DIALECT_SOURCE);
			const span_mappings = result.mappings.filter(
				(m) => m.sourceOffsets[0] === inner_start && m.lengths[0] === inner_length,
			);
			// The boundary import produced a value destructure AND a type alias;
			// each namespace reference carries the specifier span.
			expect(span_mappings.length).toBeGreaterThanOrEqual(2);
			for (const mapping of span_mappings) {
				// Hover stays enabled: Volar's `isHoverEnabled` is `!!data.semantic`,
				// and the object form keeps it truthy...
				expect(mapping.data.semantic).toBeTruthy();
				// ...while semantic TOKENS are disabled, so the editor never
				// repaints part of the string literal as a namespace token.
				expect(typeof mapping.data.semantic).toBe('object');
				expect(mapping.data.semantic.shouldHighlight()).toBe(false);
				// Go-to-def / references on the specifier resolve to the block.
				expect(mapping.data.navigation).toBe(true);
				expect(mapping.data.verification).toBe(true);
				// Identifier completions inside a string literal are never valid.
				expect(mapping.data.completion).toBe(false);
			}
			// The quotes stay outside every mapping (pure string coloring), and no
			// OTHER mapping repaints any part of the literal: everything that
			// overlaps the literal span has semantic tokens disabled.
			const literal_end = literal_start + "'server'".length;
			for (const mapping of result.mappings) {
				const start = mapping.sourceOffsets[0];
				const end = start + mapping.lengths[0];
				if (end <= literal_start || start >= literal_end) continue;
				expect(start).toBe(inner_start);
				expect(end).toBe(inner_start + inner_length);
				expect(mapping.data.semantic.shouldHighlight()).toBe(false);
			}
		});

		it('maps the full specifier span when blockName and importSpecifier differ in length', () => {
			// The generated identifier is always the block name; the mapped
			// SOURCE span must still be the authored specifier's inner text —
			// longer or shorter — and never run past the literal's quotes.
			for (const specifier of ['server:module', 'srv']) {
				const platform = {
					...SERVER_MODULE_PLATFORM,
					serverModule: { blockName: 'server', importSpecifier: specifier },
				};
				const source =
					'module server {\n\texport const x = 1;\n}\n' +
					`import { x } from '${specifier}';\n` +
					'export const start = () => x;\n';
				const result = compile_to_volar_mappings(source, { platform });
				expect(result.errors).toEqual([]);
				const literal_start = source.indexOf(`'${specifier}'`);
				const inner_start = literal_start + 1;
				const span_mappings = result.mappings.filter((m) => m.sourceOffsets[0] === inner_start);
				expect(span_mappings.length).toBeGreaterThanOrEqual(1);
				for (const mapping of span_mappings) {
					expect(mapping.lengths[0]).toBe(specifier.length);
					expect(mapping.generatedLengths[0]).toBe('server'.length);
				}
				// Nothing may cross the quotes into surrounding source.
				const literal_end = literal_start + specifier.length + 2;
				for (const mapping of result.mappings) {
					const start = mapping.sourceOffsets[0];
					const end = start + mapping.lengths[0];
					if (end <= literal_start || start >= literal_end) continue;
					expect(start).toBeGreaterThanOrEqual(inner_start);
					expect(end).toBeLessThanOrEqual(inner_start + specifier.length);
				}
			}
		});

		it('keeps default full-feature mapping data on ordinary identifier mappings', () => {
			const result = compile_to_volar_mappings(DIALECT_SOURCE);
			const place_order_offset = DIALECT_SOURCE.indexOf('placeOrder, type Receipt');
			const identifier_mapping = result.mappings.find(
				(m) => m.sourceOffsets[0] === place_order_offset && m.lengths[0] === 'placeOrder'.length,
			);
			expect(identifier_mapping).toBeDefined();
			expect(identifier_mapping.data.semantic).toBe(true);
			expect(identifier_mapping.data.navigation).toBe(true);
			expect(identifier_mapping.data.completion).toBe(true);
		});
	});

	describe('input AST immutability', () => {
		// Structural snapshot excluding `metadata` (the sanctioned mutable side
		// channel) — same oracle as the shared source-mappings harness: the
		// lowering is copy-on-write, so the parse consumed by the transform must
		// remain byte-equal to a pristine parse.
		const structural = (value) => {
			if (Array.isArray(value)) return value.map(structural);
			if (value && typeof value === 'object') {
				const out = {};
				for (const key of Object.keys(value).sort()) {
					if (key === 'metadata') continue;
					const child = value[key];
					if (typeof child === 'function') continue;
					out[key] = structural(child);
				}
				return out;
			}
			return value;
		};

		for (const [label, source] of [
			['the full dialect', DIALECT_SOURCE],
			[
				'a colliding block import',
				"import { db } from './client.ts';\n" +
					'module server {\n' +
					"\timport { db, type T } from './server.ts';\n" +
					"\timport type * as util from './server-util.ts';\n" +
					"\timport settings from './settings.json' with { type: 'json' };\n" +
					'\texport const use = (): [T, util.X] => [db, settings];\n' +
					'}\n' +
					"import { use } from 'server';\n" +
					'export const start = () => [db, use, util, settings];\n',
			],
		]) {
			it(`does not mutate the parsed program: ${label}`, () => {
				const pristine = parseModule(source, 'App.tsrx', {
					...PARSE_OPTIONS,
					errors: [],
					comments: [],
				});
				const result = compile_to_volar_mappings(source);
				expect(structural(result.sourceAst)).toEqual(structural(pristine));
				// Compiling the SAME program twice from one parse must be stable:
				// the first run may not leave state behind that changes the second.
				const errors = [];
				const comments = [];
				const shared_ast = parseModule(source, 'App.tsrx', {
					...PARSE_OPTIONS,
					errors,
					comments,
				});
				const transform = createJsxTransform(SERVER_MODULE_PLATFORM);
				const options = { collect: true, loose: true, typeOnly: true, errors, comments };
				const first = transform(shared_ast, source, 'App.tsrx', options);
				const second = transform(shared_ast, source, 'App.tsrx', options);
				expect(second.code).toBe(first.code);
			});
		}
	});
});
