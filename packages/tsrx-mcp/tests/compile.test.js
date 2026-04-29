import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze_tsrx, compile_tsrx, detect_target, format_tsrx } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target_fixtures = [
	{
		target: 'react',
		compilerPackage: '@tsrx/react',
		cwd: resolve(__dirname, 'fixtures/react-project'),
	},
	{
		target: 'preact',
		compilerPackage: '@tsrx/preact',
		cwd: resolve(__dirname, 'fixtures/preact-project'),
	},
	{
		target: 'solid',
		compilerPackage: '@tsrx/solid',
		cwd: resolve(__dirname, 'fixtures/solid-project'),
	},
	{ target: 'vue', compilerPackage: '@tsrx/vue', cwd: resolve(__dirname, 'fixtures/vue-project') },
	{
		target: 'ripple',
		compilerPackage: '@tsrx/ripple',
		cwd: resolve(__dirname, 'fixtures/ripple-project'),
	},
];
const react_fixture = target_fixtures[0].cwd;

describe('@tsrx/mcp compile helpers', () => {
	it('detects a React TSRX target from a project package.json', () => {
		const result = detect_target(react_fixture);

		expect(result.detectedTarget).toBe('react');
		expect(result.confidence).toBe('high');
		expect(result.matches[0]).toMatchObject({
			target: 'react',
			compilerPackage: '@tsrx/react',
		});
	});

	it('compiles TSRX with an explicit target', async () => {
		const result = await compile_tsrx({
			code: `export component App() {
				<div>"Hello"</div>
			}`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
			includeCode: true,
		});

		expect(result.ok).toBe(true);
		expect(result.target).toBe('react');
		expect(result.compilerPackage).toBe('@tsrx/react');
		expect(result.errors).toEqual([]);
		expect(result.code ?? '').toContain('function App()');
	});

	it('infers the target when compiling from a project cwd', async () => {
		const result = await compile_tsrx({
			code: `component App() {
				<button>"Save"</button>
			}`,
			filename: 'App.tsrx',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(true);
		expect(result.target).toBe('react');
		expect(result.compilerPackage).toBe('@tsrx/react');
	});

	it.each(target_fixtures)(
		'detects and compiles a valid component for the $target target',
		async ({ target, compilerPackage, cwd }) => {
			const detection = detect_target(cwd);
			expect(detection.detectedTarget).toBe(target);
			expect(detection.confidence).toBe('high');

			const result = await compile_tsrx({
				code: `export component App() {
					<div>"Hello"</div>
				}`,
				filename: 'App.tsrx',
				cwd,
			});

			expect(result.ok).toBe(true);
			expect(result.target).toBe(target);
			expect(result.compilerPackage).toBe(compilerPackage);
			expect(result.errors).toEqual([]);
		},
	);

	it('normalizes compiler failures into structured diagnostics', async () => {
		const result = await compile_tsrx({
			code: `component App() {
				return <div />;
			}`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0] ?? null).toMatchObject({
			fileName: 'App.tsrx',
			message: expect.stringContaining('JSX elements cannot be used as expressions'),
		});
	});

	it('adds target-neutral advice for common TSRX authoring mistakes', async () => {
		const result = await analyze_tsrx({
			code: `component App() {
				return <div />;
			}`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(false);
		expect(result.advice).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'jsx-return-in-component',
					severity: 'error',
					documentation: expect.arrayContaining(['tsrx://docs/components.md']),
				}),
			]),
		);
		expect(result.nextSteps).toContain('Run compile-tsrx again after revising the source.');
	});

	it('formats TSRX source with the official prettier plugin', async () => {
		const result = await format_tsrx({
			code: `export component App(){<button class="primary">"Save"</button>}`,
			filename: 'App.tsrx',
		});

		expect(result.ok).toBe(true);
		expect(result.changed).toBe(true);
		expect(result.formatted).toBe(
			`export component App() {\n\t<button class=\"primary\">\"Save\"</button>\n}\n`,
		);
		expect(result.errors).toEqual([]);
	});

	it('can check whether TSRX source is already formatted', async () => {
		const code = `export component App() {\n\t<button>\"Save\"</button>\n}\n`;
		const result = await format_tsrx({
			code,
			filename: 'App.tsrx',
			check: true,
		});

		expect(result.ok).toBe(true);
		expect(result.formatted).toBe(code);
		expect(result.changed).toBe(false);
		expect(result.check).toBe(true);
	});
});
