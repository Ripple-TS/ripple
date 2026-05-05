import ts from 'typescript';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * @param {string} source
 * @returns {string[]}
 */
function get_diagnostics(source) {
	const file_name = path.resolve('packages/tsrx/ref-types-test.ts');
	const options = {
		strict: true,
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
		skipLibCheck: true,
	};
	const host = ts.createCompilerHost(options);
	const read_file = host.readFile.bind(host);
	const file_exists = host.fileExists.bind(host);
	host.readFile = (name) => (name === file_name ? source : read_file(name));
	host.fileExists = (name) => name === file_name || file_exists(name);

	const program = ts.createProgram([file_name], options, host);
	return ts
		.getPreEmitDiagnostics(program)
		.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

describe('ref runtime types', () => {
	it('accepts non-null callback refs in mergeRefs like native JSX ref types', () => {
		const diagnostics = get_diagnostics(`
			import { mergeRefs } from './types/runtime/ref.js';

			function keywordRef(node: HTMLDivElement) {}
			function jsxRef(node: HTMLDivElement) {}

			const merged = mergeRefs(keywordRef, jsxRef);
			merged(document.createElement('div'));
		`);

		expect(diagnostics).toEqual([]);
	});
});
