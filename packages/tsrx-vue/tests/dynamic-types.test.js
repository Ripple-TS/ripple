import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { compile_to_volar_mappings } from '../src/index.js';

/**
 * @param {string} source
 */
function get_type_info(source) {
	const root = process.cwd();
	const { code } = compile_to_volar_mappings(
		source,
		path.join(root, 'playground/vue/src/App.tsrx'),
		{ loose: true },
	);
	const file = path.join(root, 'playground/vue/src/__virtual_dynamic_type_test.tsx');
	const files = new Map([[file, code]]);
	const options = {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		jsx: ts.JsxEmit.Preserve,
		jsxImportSource: 'vue-jsx-vapor',
		strict: true,
		skipLibCheck: true,
		allowSyntheticDefaultImports: true,
		esModuleInterop: true,
		noEmit: true,
		lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
		types: [],
	};
	const host = {
		getCompilationSettings: () => options,
		getScriptFileNames: () => [file],
		getScriptVersion: () => '0',
		getScriptSnapshot(name) {
			const text = files.get(path.resolve(name)) ?? ts.sys.readFile(name);
			return text == null ? undefined : ts.ScriptSnapshot.fromString(text);
		},
		getCurrentDirectory: () => path.join(root, 'playground/vue'),
		getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
		fileExists: ts.sys.fileExists,
		readFile: ts.sys.readFile,
		readDirectory: ts.sys.readDirectory,
		directoryExists: ts.sys.directoryExists,
		getDirectories: ts.sys.getDirectories,
		realpath: ts.sys.realpath,
	};
	const service = ts.createLanguageService(host);

	return {
		code,
		/**
		 * @param {string} text
		 * @param {number} [offset]
		 */
		quick_info(text, offset = 1) {
			const index = code.indexOf(text);
			expect(index).not.toBe(-1);
			return ts.displayPartsToString(
				service.getQuickInfoAtPosition(file, index + offset)?.displayParts ?? [],
			);
		},
		diagnostics: service
			.getSemanticDiagnostics(file)
			.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
	};
}

describe('@tsrx/vue Dynamic types', () => {
	it('uses Vue Vapor JSX types and checks dynamic component props', () => {
		const { diagnostics, quick_info } = get_type_info(`
			import { Dynamic } from '@tsrx/vue/dynamic';

			function Test() @{
				<Dynamic is="div" class="hello" id="test" data-testid="dynamic-element">
					{'Content'}
				</Dynamic>
				<Dynamic is={Hey} count={1} />
				<Dynamic is={Hey} />
			}

			function Hey({ count }: { count: number }) @{
				<div>{count}</div>
			}
		`);

		expect(quick_info('class="hello"')).toBe('(property) class: string');
		expect(quick_info('count={1}')).toBe('(property) count: number');
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]).toContain('count');
		expect(diagnostics[0]).not.toContain('cannot be used as a JSX component');
		expect(diagnostics[0]).not.toContain('VNode');
	});
});
