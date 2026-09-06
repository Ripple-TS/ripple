import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * @param {string} source
 * @param {boolean} automatic
 */
function create_service(source, automatic) {
	const root = process.cwd();
	const file_name = `${root}/packages/ripple/jsx-types-test.tsx`;
	const options = {
		strict: true,
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		jsx: ts.JsxEmit.Preserve,
		...(automatic ? { jsxImportSource: 'ripple' } : {}),
		skipLibCheck: true,
		types: [],
		paths: {
			'#public': [`${root}/packages/ripple/types/index.d.ts`],
			ripple: [`${root}/packages/ripple/types/index.d.ts`],
			'ripple/jsx-runtime': [`${root}/packages/ripple/src/jsx-runtime.d.ts`],
		},
	};
	const service = ts.createLanguageService({
		getCompilationSettings: () => options,
		getScriptFileNames: () => [file_name],
		getScriptVersion: () => '0',
		getScriptSnapshot: (name) => {
			const text = name === file_name ? source : ts.sys.readFile(name);
			return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
		},
		getCurrentDirectory: () => root,
		getDefaultLibFileName: ts.getDefaultLibFilePath,
		realpath: ts.sys.realpath,
		directoryExists: ts.sys.directoryExists,
		getDirectories: ts.sys.getDirectories,
		fileExists: (name) => name === file_name || ts.sys.fileExists(name),
		readFile: (name) => (name === file_name ? source : ts.sys.readFile(name)),
	});
	return { service, file_name };
}

describe('Ripple JSX types', () => {
	it.each([true, false])('qualifies HTML tag hovers (automatic runtime: %s)', (automatic) => {
		const source = `
			import 'ripple/jsx-runtime';
			const paragraph = <p />;
			const input = <input />;
		`;
		const { service, file_name } = create_service(source, automatic);
		try {
			expect(service.getSemanticDiagnostics(file_name)).toEqual([]);
			for (const [tag, attributes, element] of [
				['p', 'HTMLAttributes', 'HTMLParagraphElement'],
				['input', 'InputHTMLAttributes', 'HTMLInputElement'],
			]) {
				const info = service.getQuickInfoAtPosition(file_name, source.indexOf(`<${tag} `) + 1);
				expect(ts.displayPartsToString(info?.displayParts)).toBe(
					`(property) Ripple.JSX.IntrinsicElements.${tag}: Ripple.DetailedHTMLProps<Ripple.${attributes}<${element}>, ${element}>`,
				);
			}
		} finally {
			service.dispose();
		}
	});

	it('preserves JSX imports, global types, native events, and DOM refs', () => {
		const source = `
			import type { ClassValue, JSX as RuntimeJSX, Ripple } from 'ripple/jsx-runtime';
			import { createRefKey, type RefKey } from 'ripple';

			const ref_key: RefKey = createRefKey();
			const props: Ripple.DetailedHTMLProps<Ripple.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> = {
				value: 'hello',
				ref: (node) => { node.select(); },
				[ref_key]: (node) => { node.select(); },
				onInput(event) { const input: HTMLInputElement = event.currentTarget; input.select(); },
				onClick: { handleEvent(event) { event.currentTarget.select(); } },
			};
			const global_props: JSX.IntrinsicElements['input'] = props;
			const runtime_props: RuntimeJSX.IntrinsicElements['input'] = global_props;
			const classes: ClassValue = ['one', { two: true }];
			const input = <input {...runtime_props} class={classes} />;
			const svg = <svg><circle cx={10} ref={(node) => { const circle: SVGCircleElement = node; }} /></svg>;
			// @ts-expect-error Input values do not accept objects.
			const bad_value = <input value={{}} />;
			// @ts-expect-error Refs remain specific to the element.
			const bad_ref = <p ref={(node: HTMLInputElement) => { node.select(); }} />;
			// @ts-expect-error Event currentTarget remains specific to the element.
			const bad_event = <p onClick={(event) => { event.currentTarget.select(); }} />;
		`;
		const { service, file_name } = create_service(source, true);
		try {
			const diagnostics = service.getSemanticDiagnostics(file_name);
			expect(
				diagnostics.map((diagnostic) =>
					ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
				),
			).toEqual([]);
		} finally {
			service.dispose();
		}
	});
});
