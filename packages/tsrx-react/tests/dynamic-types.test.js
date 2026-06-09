import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { compile_to_volar_mappings } from '../src/index.js';

const root = process.cwd();
const virtual_file = path.join(root, 'packages/tsrx-react/__virtual_dynamic_type_test.tsx');
const virtual_react_file = path.join(root, '__virtual_types/react.d.ts');
const virtual_react_jsx_runtime_file = path.join(root, '__virtual_types/react-jsx-runtime.d.ts');
const virtual_react_types = `
declare global {
	interface HTMLDivElement {}
}

declare module 'react' {
	export type ReactElement = { readonly __reactElement: unique symbol };
	export type JSXElementConstructor<P> = (props: P) => ReactElement | null;

	export namespace JSX {
		interface Element {}
		interface IntrinsicElements {
			div: React.HTMLAttributes<HTMLDivElement>;
		}
	}

	export namespace React {
		export interface HTMLAttributes<T> {
			className?: string | undefined;
			id?: string | undefined;
			children?: unknown;
		}
	}

	export import HTMLAttributes = React.HTMLAttributes;
}
`;
const virtual_react_jsx_runtime_types = `
declare module 'react/jsx-runtime' {
	export const jsx: any;
	export const jsxs: any;
	export const Fragment: any;
}
`;

/**
 * @param {string} source
 */
function get_type_info(source) {
	const { code } = compile_to_volar_mappings(source, path.join(root, 'App.tsrx'), { loose: true });
	const files = new Map([
		[virtual_file, code],
		[virtual_react_file, virtual_react_types],
		[virtual_react_jsx_runtime_file, virtual_react_jsx_runtime_types],
	]);
	const options = {
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		target: ts.ScriptTarget.ESNext,
		jsx: ts.JsxEmit.ReactJSX,
		strict: true,
		skipLibCheck: false,
		types: [],
		lib: ['lib.esnext.d.ts'],
		baseUrl: root,
		paths: {
			react: ['__virtual_types/react.d.ts'],
			'react/jsx-runtime': ['__virtual_types/react-jsx-runtime.d.ts'],
			'@tsrx/react/dynamic': ['packages/tsrx-react/types/dynamic.d.ts'],
		},
		noEmit: true,
	};
	const host = {
		getCompilationSettings: () => options,
		getScriptFileNames: () => [virtual_file],
		getScriptVersion: () => '0',
		getScriptSnapshot(name) {
			const text = files.get(path.resolve(name)) ?? ts.sys.readFile(name);
			return text == null ? undefined : ts.ScriptSnapshot.fromString(text);
		},
		getCurrentDirectory: () => root,
		getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
		fileExists(name) {
			return files.has(path.resolve(name)) || ts.sys.fileExists(name);
		},
		readFile(name) {
			return files.get(path.resolve(name)) ?? ts.sys.readFile(name);
		},
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
				service.getQuickInfoAtPosition(virtual_file, index + offset)?.displayParts ?? [],
			);
		},
		diagnostics: service
			.getSemanticDiagnostics(virtual_file)
			.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
	};
}

describe('@tsrx/react Dynamic types', () => {
	it('preserves intrinsic QuickInfo and checks component props', () => {
		const { diagnostics, quick_info } = get_type_info(`
			import { Dynamic } from '@tsrx/react/dynamic';

			type ButtonProps = { type: 'button' | 'submit'; label?: string };
			function Button(_props: ButtonProps) {
				return null;
			}

			function Test() @{
				<Dynamic is="div" className="hello" id="test" data-testid="dynamic-element">
					{'Content'}
				</Dynamic>
				<Dynamic is={Button} type="button" label="Save" />
				<Dynamic is={Button} type="reset" />
			}
		`);

		expect(quick_info('className="hello"')).toBe(
			'(property) React.HTMLAttributes<HTMLDivElement>.className?: string | undefined',
		);
		expect(quick_info('id="test"')).toBe(
			'(property) React.HTMLAttributes<HTMLDivElement>.id?: string | undefined',
		);
		expect(quick_info('label="Save"')).toBe('(property) label?: string | undefined');
		expect(quick_info('type="button"')).toBe('(property) type: "button" | "submit"');
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics.some((diagnostic) => diagnostic.includes('"reset"'))).toBe(true);
		expect(diagnostics.some((diagnostic) => diagnostic.includes('"button" | "submit"'))).toBe(true);
	});
});
