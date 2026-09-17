import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * @param {string} source
 */
function create_service(source) {
	const root = process.cwd();
	const file_name = `${root}/packages/ripple/tracked-types-test.tsx`;
	const options = {
		strict: true,
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		jsx: ts.JsxEmit.Preserve,
		jsxImportSource: 'ripple',
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

describe('Ripple tracked types', () => {
	it('shows public names in value property hovers', () => {
		const source = `
			import { track, trackReadOnly } from 'ripple';
			const count = track(0);
			const derived = track(() => count.value * 2);
			const writable = track(() => count.value, undefined, true);
			count.value;
			derived.value;
			writable.value;
		`;
		const { service, file_name } = create_service(source);
		try {
			expect(service.getSemanticDiagnostics(file_name)).toEqual([]);
			for (const [name, type] of [
				['count', 'Tracked'],
				['derived', 'Derived'],
				['writable', 'WritableDerived'],
			]) {
				const info = service.getQuickInfoAtPosition(
					file_name,
					source.lastIndexOf(`${name}.value`) + name.length + 1,
				);
				expect(ts.displayPartsToString(info?.displayParts)).toBe(
					`(property) ${type}<number>.value: number`,
				);
			}
		} finally {
			service.dispose();
		}
	});

	it('preserves writes, read-only views, and tracked component props', () => {
		const source = `
			import { track, type Component, type Derived, type Tracked, trackReadOnly } from 'ripple';
			const count = track(0);
			count.value = 1;
			const tracked: Tracked<number> = track(count);
			const derived: Derived<number> = tracked;
			const view = trackReadOnly(count);
			// @ts-expect-error Read-only views reject writes.
			view.value = 2;
			const computed = track(() => count.value * 2);
			// @ts-expect-error Computed values reject writes.
			computed.value = 2;
			const writable = track(() => count.value, undefined, true);
			writable.value = 2;
			const with_setter = track(() => count.value, undefined, (next) => next);
			with_setter.value = 3;
			// @ts-expect-error Tracked values preserve their value type.
			count.value = 'wrong';
			// @ts-expect-error Non-component tracked values are not callable.
			count({});
			declare const TrackedComponent: Tracked<Component<{ name: string }>>;
			declare const DerivedComponent: Derived<Component<{ name: string }>>;
			const valid = <TrackedComponent name="Ripple" />;
			const valid_derived = <DerivedComponent name="Ripple" />;
			// @ts-expect-error Tracked components preserve required props.
			const missing = <TrackedComponent />;
			// @ts-expect-error Derived components preserve prop types.
			const invalid = <DerivedComponent name={123} />;
		`;
		const { service, file_name } = create_service(source);
		try {
			expect(
				service
					.getSemanticDiagnostics(file_name)
					.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
			).toEqual([]);
		} finally {
			service.dispose();
		}
	});
});
