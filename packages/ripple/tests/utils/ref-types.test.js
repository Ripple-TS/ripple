import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * @param {string} source
 * @returns {string[]}
 */
function get_diagnostics(source) {
	const root = process.cwd();
	const file_name = `${root}/packages/ripple/ref-types-test.ts`;
	const options = {
		strict: true,
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
		skipLibCheck: true,
		baseUrl: root,
		types: [],
		paths: {
			'@tsrx/core/runtime/ref': ['packages/tsrx/types/runtime/ref.d.ts'],
			'@tsrx/core/types': ['packages/tsrx/types/index.d.ts'],
			'@tsrx/core/types/helpers': ['packages/tsrx/types/helpers.d.ts'],
			'#public': ['packages/ripple/types/index.d.ts'],
			ripple: ['packages/ripple/types/index.d.ts'],
			'ripple/jsx-runtime': ['packages/ripple/src/jsx-runtime.d.ts'],
		},
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

describe('Ripple ref types', () => {
	it('exposes RefValue from the public runtime and JSX runtime type surfaces', () => {
		const diagnostics = get_diagnostics(`
			import type { RefValue } from 'ripple';
			import type { RefValue as JSXRefValue } from 'ripple/jsx-runtime';

			const callback_ref: RefValue<HTMLInputElement> = (node) => {
				node.focus();
				return () => {};
			};
			const object_ref: RefValue<HTMLInputElement> = { current: null };
			const vue_ref: RefValue<HTMLInputElement> = { value: null };
			const element_ref: RefValue<HTMLInputElement> = document.createElement('input');
			const ref_array: RefValue<HTMLInputElement> = [
				callback_ref,
				object_ref,
				vue_ref,
				element_ref,
				null,
				undefined,
			];
			const jsx_ref: JSXRefValue<HTMLDivElement> = (node) => {
				node.dataset.ready = 'true';
			};

			void ref_array;
			void jsx_ref;
		`);

		expect(diagnostics).toEqual([]);
	});
});
