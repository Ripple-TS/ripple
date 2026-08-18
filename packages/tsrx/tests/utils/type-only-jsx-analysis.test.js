/** @import * as AST from 'estree' */
/** @import { CompileError, JsxPlatform } from '../../types/index' */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
	analyzeTsrx,
	createJsxTransform,
	createVolarMappingsResult,
	parseModule,
} from '../../src/index.js';

/** @type {JsxPlatform} */
const PLATFORM = {
	name: 'type-only-jsx-analysis-test',
	imports: {
		fragment: 'test-platform',
		suspense: 'test-platform',
		dynamic: 'test-platform/dynamic',
		errorBoundary: 'test-platform/error-boundary',
		refProp: 'test-platform/ref',
	},
	jsx: {
		rewriteClassAttr: false,
		classAttrName: 'class',
		multiRefStrategy: 'array',
	},
	validation: { requireUseServerForAwait: false },
};

/**
 * Mirrors a target package's public compiler pipeline.
 * @param {string} source
 * @param {boolean} [type_only]
 */
function compile_source(source, type_only = true) {
	/** @type {CompileError[]} */
	const errors = [];
	/** @type {AST.CommentWithLocation[]} */
	const comments = [];
	const filename = 'App.tsrx';
	const ast = parseModule(source, filename, {
		collect: true,
		loose: true,
		preserveParens: true,
		keywordTokens: true,
		errors,
		comments,
	});
	analyzeTsrx(ast, filename, {
		collect: true,
		loose: true,
		typeOnly: type_only,
		errors,
		comments,
	});
	const transformed = createJsxTransform(PLATFORM)(ast, source, filename, {
		collect: true,
		loose: true,
		typeOnly: type_only,
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
	return { ...transformed, ...result, errors };
}

const SPLIT_STYLE_SOURCE =
	'export function Split(props: { active: boolean }) {\n' +
	'\treturn <>\n' +
	"\t\t<section class={['mailbox', { active: props.active }]}>{'hi'}</section>\n" +
	'\t\t<style>\n' +
	'\t\t\t.mailbox { color: rgb(10, 20, 30); }\n' +
	'\t\t</style>\n' +
	'\t\t<>\n' +
	'\t\t\t<style>\n' +
	'\t\t\t\t.active { background-color: rgb(40, 50, 60); }\n' +
	'\t\t\t</style>\n' +
	'\t\t</>\n' +
	'\t</>;\n' +
	'}\n';

const SPLIT_STYLE_DEFINITION_SOURCE =
	'export function Split() {\n' +
	'\treturn <>\n' +
	'\t\t<section class="mailbox">one</section>\n' +
	'\t\t<aside class="active">two</aside>\n' +
	'\t\t<style>.mailbox { color: red; }</style>\n' +
	'\t\t<style>.active { color: blue; }</style>\n' +
	'\t</>;\n' +
	'}\n';

const REF_SPREAD_PROPS_TYPE =
	'type Props = {\n' +
	'\tnodeRef: (node: SVGTextElement | null) => void;\n' +
	'\trest: { x?: number };\n' +
	'\tmore: { y?: number };\n' +
	'\trows: number[];\n' +
	'\tshow: boolean;\n' +
	'};\n\n';

/** @type {Array<[string, string]>} */
const REF_SPREAD_POSITIONS = [
	['return statement', 'return <text ref={props.nodeRef} {...props.rest} />;'],
	[
		'nested in a returned element',
		'return <svg><text ref={props.nodeRef} {...props.rest} /></svg>;',
	],
	[
		'declarator init',
		'const label = <text ref={props.nodeRef} {...props.rest} />;\n\treturn <svg>{label}</svg>;',
	],
	[
		'ternary arm of a return',
		'return props.show ? <text ref={props.nodeRef} {...props.rest} /> : null;',
	],
	[
		'ternary arm inside a JSX hole',
		'return <svg>{props.show ? <text ref={props.nodeRef} {...props.rest} /> : null}</svg>;',
	],
	[
		'logical operand inside a JSX hole',
		'return <svg>{props.show && <text ref={props.nodeRef} {...props.rest} />}</svg>;',
	],
	[
		'callback body',
		'return <svg>{props.rows.map((row: number) => <text key={row} ref={props.nodeRef} {...props.rest} />)}</svg>;',
	],
	['JSX expression value', 'return <svg>{<text ref={props.nodeRef} {...props.rest} />}</svg>;'],
	['array literal element', 'return <svg>{[<text ref={props.nodeRef} {...props.rest} />]}</svg>;'],
	[
		'element with two spreads',
		'return <svg>{props.show ? <text ref={props.nodeRef} {...props.rest} {...props.more} /> : null}</svg>;',
	],
];

/** @type {Array<[string, string]>} */
const NATIVE_TEMPLATE_POSITIONS = [
	[
		'native @if directive',
		'<svg>@if (props.show) { <text ref={props.nodeRef} {...props.rest} /> }</svg>',
	],
	[
		'plain-JS callback inside a native template',
		'<svg>{props.rows.map((row: number) => <text key={row} ref={props.nodeRef} {...props.rest} />)}</svg>',
	],
];

/** @returns {Array<[string, string]>} */
function ref_spread_modules() {
	return [
		...REF_SPREAD_POSITIONS.map(
			([name, body]) =>
				/** @type {[string, string]} */ ([
					name,
					`${REF_SPREAD_PROPS_TYPE}export function Chart(props: Props) {\n\t${body}\n}\n`,
				]),
		),
		[
			'concise arrow body',
			REF_SPREAD_PROPS_TYPE +
				'export const Chart = (props: Props) => <text ref={props.nodeRef} {...props.rest} />;\n',
		],
		...NATIVE_TEMPLATE_POSITIONS.map(
			([name, body]) =>
				/** @type {[string, string]} */ ([
					name,
					`${REF_SPREAD_PROPS_TYPE}export function Chart(props: Props) @{\n\t${body}\n}\n`,
				]),
		),
	];
}

describe('type-only JSX analysis', () => {
	it('keeps multiple scoped style blocks analyzable without changing runtime validation', () => {
		const result = compile_source(SPLIT_STYLE_SOURCE);
		expect(result.errors).toEqual([]);
		expect(result.cssMappings).toHaveLength(2);
		expect(result.code).toContain('Split');
		expect(result.code).not.toContain('rgb(10, 20, 30)');
		expect(result.code).not.toContain('rgb(40, 50, 60)');

		expect(() => compile_source(SPLIT_STYLE_SOURCE, false)).toThrow(
			'TSRX fragments can only have one style tag',
		);
	});

	it('maps classes to the split style block that defines them', () => {
		const result = compile_source(SPLIT_STYLE_DEFINITION_SOURCE);
		const css_mapping_ids = result.cssMappings.map(
			(mapping) => mapping.data.customData?.embeddedId,
		);
		const active_offset =
			SPLIT_STYLE_DEFINITION_SOURCE.indexOf('class="active"') + 'class="'.length;
		const active_mapping = result.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === active_offset && mapping.data.customData?.definition,
		);
		const active_definition = active_mapping?.data.customData?.definition;

		expect(css_mapping_ids).toHaveLength(2);
		expect(
			typeof active_definition === 'object' ? active_definition.location?.embeddedId : undefined,
		).toBe(css_mapping_ids[1]);
	});

	it('declares generated host ref/spread bindings in every element position', () => {
		const root = mkdtempSync(join(tmpdir(), 'tsrx-ref-spread-'));
		try {
			const files = ref_spread_modules().map(([name, source], index) => {
				const compiled = compile_source(source);
				expect(compiled.errors).toEqual([]);
				const file = join(root, `Chart${index}.tsx`);
				writeFileSync(file, compiled.code);
				return { name, file };
			});

			const program = ts.createProgram({
				rootNames: files.map(({ file }) => file),
				options: {
					jsx: ts.JsxEmit.Preserve,
					module: ts.ModuleKind.ESNext,
					moduleResolution: ts.ModuleResolutionKind.Bundler,
					noEmit: true,
					skipLibCheck: true,
					strict: true,
					target: ts.ScriptTarget.ESNext,
				},
			});
			const undefined_names = ts
				.getPreEmitDiagnostics(program)
				.filter((diagnostic) => diagnostic.code === 2304)
				.map((diagnostic) => {
					const position = files.find(({ file }) => file === diagnostic.file?.fileName);
					return `${position?.name ?? diagnostic.file?.fileName}: ${ts.flattenDiagnosticMessageText(
						diagnostic.messageText,
						' ',
					)}`;
				});
			expect(undefined_names).toEqual([]);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('lowers each host ref/spread exactly once', () => {
		for (const [name, source] of ref_spread_modules()) {
			const compiled = compile_source(source);
			const generated = ts.createSourceFile(
				'Chart.tsx',
				compiled.code,
				ts.ScriptTarget.ESNext,
				true,
				ts.ScriptKind.TSX,
			);
			/** @type {ts.ArrayLiteralExpression[]} */
			const ref_arrays = [];
			/** @type {ts.CallExpression[]} */
			const normalize_calls = [];
			/** @param {ts.Node} node */
			const visit = (node) => {
				if (
					ts.isJsxAttribute(node) &&
					ts.isIdentifier(node.name) &&
					node.name.text === 'ref' &&
					node.initializer &&
					ts.isJsxExpression(node.initializer) &&
					node.initializer.expression &&
					ts.isArrayLiteralExpression(node.initializer.expression)
				) {
					ref_arrays.push(node.initializer.expression);
				}
				if (
					ts.isCallExpression(node) &&
					ts.isIdentifier(node.expression) &&
					node.expression.text === '__normalize_spread_props_for_ref_attr'
				) {
					normalize_calls.push(node);
				}
				ts.forEachChild(node, visit);
			};
			visit(generated);

			expect(ref_arrays, name).toHaveLength(1);
			expect(
				ref_arrays[0].elements.filter((element) => ts.isArrayLiteralExpression(element)),
				name,
			).toEqual([]);
			const authored_spreads = source.match(/{\.\.\./g)?.length ?? 0;
			expect(normalize_calls, name).toHaveLength(authored_spreads);
		}
	});
});
