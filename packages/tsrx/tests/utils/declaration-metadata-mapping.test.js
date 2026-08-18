/** @import * as AST from 'estree' */
/** @import { CompileError, JsxPlatform } from '../../types/index' */

import { SourceMap } from '@volar/source-map';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { createJsxTransform, createVolarMappingsResult, parseModule } from '../../src/index.js';

/** @type {JsxPlatform} */
const PLATFORM = {
	name: 'declaration-metadata-test',
	imports: {
		fragment: 'test-platform',
		suspense: 'test-platform',
		dynamic: 'test-platform/dynamic',
		errorBoundary: 'test-platform/error-boundary',
	},
	jsx: { rewriteClassAttr: false, classAttrName: 'class' },
	validation: { requireUseServerForAwait: false },
};

/** @param {string} source */
function compile_to_volar_mappings(source) {
	/** @type {CompileError[]} */
	const errors = [];
	/** @type {AST.CommentWithLocation[]} */
	const comments = [];
	const ast = parseModule(source, 'App.tsrx', {
		collect: true,
		loose: true,
		preserveParens: true,
		keywordTokens: true,
		errors,
		comments,
	});
	const transformed = createJsxTransform(PLATFORM)(ast, source, 'App.tsrx', {
		collect: true,
		loose: true,
		typeOnly: true,
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

/** @param {string} code */
function parse_virtual_tsx(code) {
	return ts.createSourceFile('virtual.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/**
 * Comments as TypeScript and declaration generators see them on a declaration.
 * @param {ts.SourceFile} file
 * @param {ts.Node} node
 */
function declaration_comments(file, node) {
	const docs = ts
		.getJSDocCommentsAndTags(node)
		.filter(ts.isJSDoc)
		.filter((doc) => !doc.tags?.some((tag) => tag.tagName.text === 'jsxImportSource'))
		.map((doc) => ({
			text: ts.getTextOfJSDocComment(doc.comment) ?? '',
			tags: (doc.tags ?? []).map((tag) => ({
				name: tag.tagName.text,
				text: ts.getTextOfJSDocComment(tag.comment) ?? '',
			})),
		}));
	const annotations = (ts.getLeadingCommentRanges(file.text, node.getFullStart()) ?? [])
		.filter((comment) => comment.kind === ts.SyntaxKind.SingleLineCommentTrivia)
		.map((comment) => file.text.slice(comment.pos + 2, comment.end).trim())
		.filter((comment) => comment.startsWith('@'));
	return { docs, annotations };
}

/**
 * Full exported statements and their property signatures, in authored order.
 * @param {ts.SourceFile} file
 */
function declaration_ranges(file) {
	/** @type {ts.Node[]} */
	const declarations = [];
	/** @param {ts.Node} node */
	const visit_members = (node) => {
		if (ts.isPropertySignature(node)) declarations.push(node);
		ts.forEachChild(node, visit_members);
	};
	for (const statement of file.statements) {
		if (
			ts.isExportAssignment(statement) ||
			ts.isExportDeclaration(statement) ||
			(ts.canHaveModifiers(statement) &&
				ts
					.getModifiers(statement)
					?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
		) {
			declarations.push(statement);
			ts.forEachChild(statement, visit_members);
		}
	}
	return declarations;
}

describe('virtual declaration metadata', () => {
	it('keeps declaration and member documentation attached to its TypeScript owner', () => {
		const source =
			'/** @ExportModel @Version(1) */\n' +
			'export interface NativeModel {\n' +
			'\t/** A stable identifier. */\n' +
			'\t// @Version(1)\n' +
			'\treadonly value?: string;\n' +
			'\t/** @Version(2) */\n' +
			'\tcount: number;\n' +
			'}\n' +
			'/** A separate model. */\n' +
			'// @ExportModel\n' +
			'export interface OtherModel {\n' +
			'\t/** The visible label. */\n' +
			'\tlabel: string;\n' +
			'}\n';
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		const authored = parse_virtual_tsx(source);
		const generated = parse_virtual_tsx(result.code);
		/** @param {ts.SourceFile} file */
		const describe_declarations = (file) =>
			declaration_ranges(file).map((node) => ({
				kind: node.kind,
				name:
					ts.isInterfaceDeclaration(node) || ts.isPropertySignature(node)
						? node.name.getText(file)
						: undefined,
				...declaration_comments(file, node),
			}));

		expect(describe_declarations(generated)).toEqual(describe_declarations(authored));
	});

	it.each(['export', 'export default'])(
		'keeps %s component documentation on the function when JSX is hoisted',
		(export_kind) => {
			const source =
				'/** Component documentation. */\n' +
				'// @ExportModel\n' +
				`${export_kind} function Scene() @{ <div /> }\n`;
			const result = compile_to_volar_mappings(source);
			expect(result.errors).toEqual([]);
			const generated = parse_virtual_tsx(result.code);
			const component = generated.statements.find(
				(statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === 'Scene',
			);
			expect(component).toBeDefined();
			if (!component) throw new Error('Expected the generated Scene function');
			expect(declaration_comments(generated, component)).toEqual({
				docs: [{ text: 'Component documentation.', tags: [] }],
				annotations: ['@ExportModel'],
			});
			const documented_statements = generated.statements.filter((statement) => {
				const comments = declaration_comments(generated, statement);
				return comments.docs.length > 0 || comments.annotations.length > 0;
			});
			expect(documented_statements).toHaveLength(1);
			expect(documented_statements[0]).toBe(component);
		},
	);

	it.each([
		['interface at offset zero', 'export interface Model { value: string\ncount: number }'],
		[
			'type alias with readonly and optional members',
			'export type Model = { readonly value?: string; count: number };',
		],
		['named function', 'export function read(value: string): string { return value; }'],
		['named variable', 'export const version = 1;'],
		['named variable without a terminator', 'export const version = 1'],
		['named re-export', "export { NativeModel as Model } from './native';"],
		['export-all without a terminator', "export * from './native'"],
		['default expression', 'export default 42;'],
		['default expression without a terminator', 'export default 42'],
		['anonymous default function', 'export default function () { return 42; }'],
		['block declaration followed by an empty statement', 'export default function read() {};'],
		['named default class', 'export default class Model {}'],
		[
			'adjacent declaration documentation',
			'/** Model docs. */export interface Model { value: string; }',
		],
		[
			'adjacent member documentation',
			'export interface Model { /** Field docs. */readonly value?: string; }',
		],
		[
			'mixed property separators',
			'export interface Model {\n\treadonly value?: string;\n\tcount: number\n\tenabled?: boolean,\n}',
		],
	])('maps complete authored declaration ranges for %s', (_name, source) => {
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		const authored = parse_virtual_tsx(source);
		const generated = parse_virtual_tsx(result.code);
		const source_declarations = declaration_ranges(authored);
		const generated_declarations = declaration_ranges(generated);
		expect(generated_declarations.map((node) => node.kind)).toEqual(
			source_declarations.map((node) => node.kind),
		);
		const map = new SourceMap(result.mappings);
		for (let index = 0; index < source_declarations.length; index++) {
			const source_node = source_declarations[index];
			const generated_node = generated_declarations[index];
			const mapped = map
				.toSourceRange(generated_node.getStart(generated), generated_node.getEnd(), true)
				.next().value;
			expect(mapped?.slice(0, 2), source_node.getText(authored)).toEqual([
				source_node.getStart(authored),
				source_node.getEnd(),
			]);
		}
	});

	it('does not change return or throw semantics when preserving inline JSDoc', () => {
		const source =
			'export function read() { return /** @type {number} */ 42; }\n' +
			"export function fail() { throw /** @type {Error} */ new Error('failure'); }\n";
		const result = compile_to_volar_mappings(source);
		expect(result.errors).toEqual([]);
		const generated = parse_virtual_tsx(result.code);
		const functions = generated.statements.filter(ts.isFunctionDeclaration);
		const read = functions.find((node) => node.name?.text === 'read');
		const fail = functions.find((node) => node.name?.text === 'fail');
		expect(read?.body?.statements).toHaveLength(1);
		expect(fail?.body?.statements).toHaveLength(1);
		const return_statement = read?.body?.statements[0];
		const throw_statement = fail?.body?.statements[0];
		if (!return_statement || !throw_statement) {
			throw new Error('Expected both generated function bodies to contain a statement');
		}
		expect(ts.isReturnStatement(return_statement)).toBe(true);
		expect(ts.isThrowStatement(throw_statement)).toBe(true);
		const returned = ts.isReturnStatement(return_statement)
			? return_statement.expression
			: undefined;
		const thrown = ts.isThrowStatement(throw_statement) ? throw_statement.expression : undefined;
		expect(returned && ts.isNumericLiteral(returned) ? returned.text : undefined).toBe('42');
		expect(
			thrown && ts.isNewExpression(thrown) ? thrown.expression.getText(generated) : undefined,
		).toBe('Error');
		expect(
			thrown && ts.isNewExpression(thrown) && thrown.arguments?.[0]
				? ts.isStringLiteral(thrown.arguments[0]) && thrown.arguments[0].text
				: undefined,
		).toBe('failure');
	});
});
