import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { compile_to_volar_mappings } from '../src/index.js';

function editor(source) {
	const filename = path.resolve('packages/tsrx-ripple/__enum_editor__.tsx');
	const result = compile_to_volar_mappings(source, filename.replace(/\.tsx$/, '.tsrx'));
	expect(result.errors).toEqual([]);
	const options = {
		strict: true,
		jsx: ts.JsxEmit.Preserve,
		jsxImportSource: 'ripple',
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		target: ts.ScriptTarget.ESNext,
		skipLibCheck: true,
		types: [],
		baseUrl: process.cwd(),
		paths: {
			'ripple/jsx-runtime': ['packages/ripple/src/jsx-runtime.d.ts'],
			ripple: ['packages/ripple/types/index.d.ts'],
			'#public': ['packages/ripple/types/index.d.ts'],
		},
	};
	const service = ts.createLanguageService({
		getCompilationSettings: () => options,
		getScriptFileNames: () => [filename],
		getScriptVersion: () => '0',
		getScriptSnapshot: (name) => {
			const text = name === filename ? result.code : ts.sys.readFile(name);
			return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
		},
		getCurrentDirectory: () => process.cwd(),
		getDefaultLibFileName: ts.getDefaultLibFilePath,
		fileExists: (name) => name === filename || ts.sys.fileExists(name),
		readFile: (name) => (name === filename ? result.code : ts.sys.readFile(name)),
		readDirectory: ts.sys.readDirectory,
	});
	function mapped(source_offset) {
		const mapping = result.mappings.find(
			(entry) => entry.sourceOffsets[0] === source_offset && entry.data.navigation,
		);
		expect(mapping?.data).toMatchObject({
			verification: true,
			completion: true,
			semantic: true,
			navigation: true,
		});
		return mapping.generatedOffsets[0];
	}
	function original(generated_offset) {
		const mapping = result.mappings.find(
			(entry) => entry.generatedOffsets[0] === generated_offset && entry.data.navigation,
		);
		expect(mapping).toBeDefined();
		return mapping.sourceOffsets[0];
	}
	return { ...result, filename, service, mapped, original };
}

describe('@tsrx/ripple enum editor support', () => {
	const source = `export enum Stage { Ready = 'ready', Done = 'done' }
		export function Badge() @{
			enum Stage { Idle = 4, Active = Idle + 1 }
			const selected: Stage = Stage.Active;
			<p>{selected}{Stage.Active}</p>
		}
		export const ready: Stage = Stage.Ready;`;

	it('typechecks component-local enums and keeps definitions, hover, completion and rename scoped', () => {
		const { service, filename, mapped, original, code, sourceAst } = editor(source);
		try {
			expect(
				service
					.getSyntacticDiagnostics(filename)
					.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')),
			).toEqual([]);
			expect(
				service
					.getSemanticDiagnostics(filename)
					.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')),
			).toEqual([]);
			expect(code.match(/enum Stage/g)).toHaveLength(2);
			expect(sourceAst.body[0].declaration.type).toBe('TSEnumDeclaration');

			const member_offset = source.lastIndexOf('Stage.Active') + 'Stage.'.length;
			const generated_member = mapped(member_offset);
			const definitions = service.getDefinitionAtPosition(filename, generated_member);
			expect(definitions).toHaveLength(1);
			expect(original(definitions[0].textSpan.start)).toBe(source.indexOf('Active ='));
			const hover = service.getQuickInfoAtPosition(filename, generated_member);
			expect(ts.displayPartsToString(hover.displayParts)).toContain('Stage.Active = 5');
			const completions = service.getCompletionsAtPosition(filename, generated_member, {});
			expect(completions.entries.map((entry) => entry.name).sort()).toEqual(['Active', 'Idle']);

			const local_name =
				source.indexOf('enum Stage', source.indexOf('enum Stage') + 1) + 'enum '.length;
			const renames = service.findRenameLocations(filename, mapped(local_name), false, false);
			expect(renames.map((entry) => original(entry.textSpan.start)).sort((a, b) => a - b)).toEqual([
				local_name,
				source.indexOf(': Stage') + 2,
				source.indexOf('Stage.Active'),
				source.lastIndexOf('Stage.Active'),
			]);
		} finally {
			service.dispose();
		}
	});

	it('maps enum member and assignment diagnostics back to the authored source', () => {
		const invalid = source
			.replace('Stage.Active}</p>', 'Stage.Missing}</p>')
			.replace('const selected: Stage = Stage.Active;', 'const selected: Stage = "wrong";');
		const { service, filename, original } = editor(invalid);
		try {
			const diagnostics = service.getSemanticDiagnostics(filename);
			expect(diagnostics.map((diagnostic) => diagnostic.code).sort()).toEqual([2322, 2339]);
			expect(
				diagnostics.map((diagnostic) => original(diagnostic.start)).sort((a, b) => a - b),
			).toEqual([invalid.indexOf('selected:'), invalid.indexOf('Missing')]);
		} finally {
			service.dispose();
		}
	});
});
