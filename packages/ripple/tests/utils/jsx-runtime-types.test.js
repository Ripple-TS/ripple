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
	it.each([true, false])('checks CSS property values (automatic runtime: %s)', (automatic) => {
		const source = `
			import type { CSSProperties, Ripple } from 'ripple/jsx-runtime';

			const styles = {
				width: '24rem', height: '50%', margin: 0, padding: '1em',
				maxWidth: 'calc(100% - 2rem)', minWidth: 'var(--min-width)',
				opacity: 0.5, lineHeight: 1.5, zIndex: 2, flexGrow: 1,
				fontSizeAdjust: 0.5, shapeImageThreshold: 0.5, mathDepth: 2, scale: 1.5,
				'font-size': '1rem', 'line-height': 1.5, 'border-width': 0,
				WebkitLineClamp: 2, '-webkit-line-clamp': 2,
				transitionDuration: '200ms',
				'--space': '1rem', '--scale': 2,
			} satisfies CSSProperties;
			const namespaced: Ripple.CSSProperties = styles;
			const html = <div style={namespaced} />;
			const svg = <svg style={styles}><circle style={{ strokeWidth: 2, 'fill-opacity': 0.5 }} /></svg>;
			const zero = <div style={{ width: 0 }} />;
			const css_text = <div style="width: 400px; opacity: 0.5" />;
			const absent = <div style={null} />;
			const omitted = <svg style={undefined} />;
			const conditional = <div style={{ width: Math.random() ? '400px' : undefined, '--scale': undefined }} />;

			// @ts-expect-error Lengths require explicit units unless the value is zero.
			const bad_width = <div style={{ width: 400 }} />;
			// @ts-expect-error Kebab-case lengths use the same rules.
			const bad_font_size = <div style={{ 'font-size': 16 }} />;
			// @ts-expect-error SVG style objects also require units for these lengths.
			const bad_svg = <svg style={{ width: 400 }} />;
			// @ts-expect-error Vendor-prefixed lengths require units too.
			const bad_vendor_length = <div style={{ WebkitBorderRadius: 4 }} />;
			// @ts-expect-error Durations require time units, even for zero.
			const bad_duration = <div style={{ transitionDuration: 0 }} />;
			// @ts-expect-error Unknown property names do not bypass CSS checking.
			const bad_property = <div style={{ widht: '400px' }} />;
			// @ts-expect-error Custom properties accept strings and numbers, not objects.
			const bad_custom = <div style={{ '--theme': {} }} />;
			// @ts-expect-error CSS fallback arrays are not supported by the runtime.
			const bad_array = <div style={{ display: ['flex', 'block'] }} />;
		`;
		const { service, file_name } = create_service(source, automatic);
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
