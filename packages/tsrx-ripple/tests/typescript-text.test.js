import { afterEach as after_each, describe, expect, it } from 'vitest';
import {
	mkdtempSync as mkdtemp_sync,
	rmSync as rm_sync,
	writeFileSync as write_file_sync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compile } from '@tsrx/ripple';
import { createTextTypeProject as create_text_type_project } from '../src/typescript.js';

const cleanups = [];
after_each(() => {
	for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function fixture(source, types = '', options = {}) {
	const root = mkdtemp_sync(path.join(os.tmpdir(), 'ripple-text-'));
	cleanups.push(() => rm_sync(root, { recursive: true, force: true }));
	const filename = path.join(root, 'App.tsrx');
	const tsconfig = path.join(root, 'tsconfig.json');
	write_file_sync(
		tsconfig,
		JSON.stringify({
			compilerOptions: {
				strict: true,
				target: 'ESNext',
				module: 'ESNext',
				moduleResolution: 'Bundler',
				...options,
			},
		}),
	);
	write_file_sync(filename, source);
	write_file_sync(path.join(root, 'types.ts'), types);
	const project = create_text_type_project({ tsconfig });
	cleanups.push(() => project.dispose());
	return { root, filename, project, tsconfig };
}

function expressions(source, facts) {
	return {
		strings: facts.stringChildRanges.map(([start, end]) => source.slice(start, end)),
		primitives: facts.primitiveTextChildRanges.map(([start, end]) => source.slice(start, end)),
	};
}

describe('TypeScript text project', () => {
	it('proves imported aliases, member reads, destructuring, calls, and primitive unions', () => {
		const source = `import type { Props } from './types';
			import { count } from './types';
			export function App(props: Props) @{
				const { label } = props;
				<><p>{props.label}</p><p>{label}</p><p>{props.value}</p><p>{count()}</p></>
			}`;
		const { project, filename } = fixture(
			source,
			`export type Text = string;
			export interface Props { label: Text; value: number | bigint | string; }
			export function count(): number { return 1; }`,
		);
		const facts = project.getTextTypeFacts(filename, source);
		expect(expressions(source, facts)).toEqual({
			strings: ['props.label', 'label'],
			primitives: ['props.value', 'count()'],
		});
		for (const mode of ['client', 'server']) {
			const { code } = compile(source, filename, { mode, textTypeFacts: facts });
			expect(code).not.toMatch(/_\$_\.render_expression\((?:props\.|label|count\()/);
			expect(code).not.toContain('_$_.expression_children(');
		}
		expect(compile(source, filename, { mode: 'server' }).code).toContain(
			'_$_.render_expression(props.label',
		);
		project.assertUnchanged();
	});

	it.each([
		['(props.label)', 'props.label', 'strings'],
		['((props.label))', 'props.label', 'strings'],
		['((props.value))', 'props.value', 'primitives'],
		['((props.big))', 'props.big', 'primitives'],
		['(props.effect(), props.value)', 'props.effect(), props.value', 'primitives'],
		['((props.effect(), props.value))', 'props.effect(), props.value', 'primitives'],
		['( /* before */ props.label /* after */ )', 'props.label', 'strings'],
	])('compiles checker proofs for parenthesized child %s', (child, expected, kind) => {
		const source = `import type { Props } from './types';
			export function App(props: Props) @{ <p>{${child}}</p> }`;
		const { project, filename } = fixture(
			source,
			`export interface Props {
			label: string; value: number; big: bigint; effect(): void;
		}`,
		);
		const facts = JSON.parse(JSON.stringify(project.getTextTypeFacts(filename)));
		expect(expressions(source, facts)).toEqual({
			strings: kind === 'strings' ? [expected] : [],
			primitives: kind === 'primitives' ? [expected] : [],
		});
		for (const mode of ['client', 'server']) {
			for (const options of [{}, { collect: true }, { collect: true, preserveParens: true }]) {
				const { code } = compile(source, filename, { ...options, mode, textTypeFacts: facts });
				expect(code).not.toContain('_$_.render_expression(');
				expect(code).not.toContain('_$_.expression_children(');
				if (child.includes('props.effect()')) {
					expect(code).toContain('props.effect()');
					// A proof for only the last operand is not a proof for the child.
					const start = source.lastIndexOf('props.value');
					expect(() =>
						compile(source, filename, {
							...options,
							mode,
							textTypeFacts: {
								...facts,
								primitiveTextChildRanges: [[start, start + 'props.value'.length]],
							},
						}),
					).toThrow('Invalid textTypeFacts');
				}
			}
		}
	});

	it('rejects uncertain domains and missing indexed values', () => {
		const names = [
			'any',
			'unknown',
			'never',
			'boxed',
			'mixed',
			'nullable',
			'optional',
			'flag',
			'object',
		];
		const source = `import type { Props } from './types';
			export function App(props: Props) @{ <>
			${names.map((name) => `<p>{props.${name}}</p>`).join('')}
			<p>{props.list[0]}</p><p>{props.dict['key']}</p></> }`;
		const { project, filename } = fixture(
			source,
			`export interface Props {
			any: any; unknown: unknown; never: never; boxed: String; mixed: string | object;
			nullable: number | null; optional?: string; flag: boolean; object: Date;
			list: string[]; dict: Record<string, number>;
		}`,
		);
		expect(expressions(source, project.getTextTypeFacts(filename))).toEqual({
			strings: [],
			primitives: [],
		});
	});

	it('uses narrowing inside a template branch', () => {
		const source = `import type { Props } from './types';
			export function App(props: Props) @{ <>
			@if (typeof props.value === 'string') { <p>{props.value}</p> }
			<p>{props.value}</p></> }`;
		const { project, filename } = fixture(
			source,
			'export interface Props { value: string | object }',
		);
		expect(expressions(source, project.getTextTypeFacts(filename))).toEqual({
			strings: ['props.value'],
			primitives: [],
		});
	});

	it('resolves types exported from another TSRX module', () => {
		const source = `import type { Props } from './other.tsrx';
			export function App(props: Props) @{ <p>{props.value}</p> }`;
		const { project, root, filename } = fixture(source);
		write_file_sync(
			path.join(root, 'other.tsrx'),
			'export interface Props { value: number } export function Other() { return <b />; }',
		);
		expect(expressions(source, project.getTextTypeFacts(filename))).toEqual({
			strings: [],
			primitives: ['props.value'],
		});
	});

	it('invalidates unchanged components when imported types change', () => {
		const source = `import type { Props } from './types';
			export function App(props: Props) @{ <p>{props.value}</p> }`;
		const { project, root, filename } = fixture(source, 'export interface Props { value: number }');
		const before = project.getTextTypeFacts(filename);
		expect(before.primitiveTextChildRanges).toHaveLength(1);
		write_file_sync(path.join(root, 'types.ts'), 'export interface Props { value: object }');
		expect(() => project.assertUnchanged()).toThrow('changed during build');
		project.invalidate();
		const after = project.getTextTypeFacts(filename);
		expect(after.primitiveTextChildRanges).toHaveLength(0);
		expect(after.projectVersion).not.toBe(before.projectVersion);
		project.assertUnchanged();
	});

	it('requires strictNullChecks and reloads configuration on invalidation', () => {
		const { project, tsconfig } = fixture('export function App() { return <p />; }');
		write_file_sync(tsconfig, JSON.stringify({ compilerOptions: { strict: false } }));
		expect(() => project.invalidate()).toThrow('strictNullChecks');
	});

	it('refuses transformed or stale source and disposed projects', () => {
		const source = 'export function App() { return <p />; }';
		const { project, filename } = fixture(source);
		expect(() => project.getTextTypeFacts(filename, source + ' ')).toThrow(
			'differs from project snapshot',
		);
		project.dispose();
		expect(() => project.getTextTypeFacts(filename)).toThrow('disposed');
	});

	it('ignores type proofs when a global constructor is visibly replaced', () => {
		const source = `Number = (() => <b />) as any;
			export function App() @{ <p>{Number(1)}</p> }`;
		const { project, filename } = fixture(source);
		const facts = project.getTextTypeFacts(filename);
		expect(facts.primitiveTextChildRanges).toHaveLength(1);
		expect(compile(source, filename, { mode: 'server', textTypeFacts: facts }).code).toContain(
			'_$_.render_expression(Number(1))',
		);
	});

	it('validates serialized facts against the source, filename, and authored child positions', () => {
		const source = `import type { Props } from './types';
			export function App(props: Props) @{ <p title={props.label}>{props.label}</p> }`;
		const { project, filename } = fixture(source, 'export interface Props { label: string }');
		const facts = JSON.parse(JSON.stringify(project.getTextTypeFacts(filename)));
		expect(() => compile(source, filename, { textTypeFacts: facts })).not.toThrow();
		for (const mode of ['client', 'server']) {
			for (const bad of [
				null,
				{ ...facts, version: 2 },
				{ ...facts, filename: 'wrong.tsrx' },
				{ ...facts, sourceVersion: 'stale' },
				{ ...facts, projectVersion: '' },
				{
					...facts,
					stringChildRanges: [[source.indexOf('props.label'), source.indexOf('props.label') + 11]],
				},
				{ ...facts, primitiveTextChildRanges: [[0, source.length + 1]] },
				{ ...facts, stringChildRanges: [[-1, 2]] },
				{ ...facts, stringChildRanges: null },
			])
				expect(() => compile(source, filename, { mode, textTypeFacts: bad })).toThrow(
					'Invalid textTypeFacts',
				);
			expect(() => compile(source + ' ', filename, { mode, textTypeFacts: facts })).toThrow(
				'Invalid textTypeFacts',
			);
		}
	});
});
