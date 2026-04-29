import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	analyze_tsrx,
	compile_tsrx,
	detect_target,
	format_tsrx,
	inspect_project,
	validate_tsrx_file,
} from '../src/index.js';

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

	it('inspects project target, tooling, scripts, and likely commands', () => {
		const result = inspect_project({ cwd: react_fixture });

		expect(result.packageName).toBe('tsrx-mcp-react-fixture');
		expect(result.target.detectedTarget).toBe('react');
		expect(result.tsrxPackages.map((dependency) => dependency.name)).toEqual(
			expect.arrayContaining([
				'@tsrx/react',
				'@tsrx/vite-plugin-react',
				'@tsrx/prettier-plugin',
				'@tsrx/typescript-plugin',
			]),
		);
		expect(result.tooling).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: '@tsrx/prettier-plugin',
					present: true,
				}),
				expect.objectContaining({
					name: '@tsrx/typescript-plugin',
					present: true,
				}),
			]),
		);
		expect(result.commands).toMatchObject({
			format: 'pnpm format',
			formatCheck: 'pnpm format:check',
			test: 'pnpm test',
			typecheck: 'pnpm typecheck',
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

	it('validates a TSRX file with formatting, compilation, and advice', async () => {
		const result = await validate_tsrx_file({
			filePath: 'src/Valid.tsrx',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(true);
		expect(result.read.ok).toBe(true);
		expect(result.format?.check).toBe(true);
		expect(result.compile?.ok).toBe(true);
		expect(result.compile?.target).toBe('react');
		expect(result.analysis?.advice).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'compile-clean',
				}),
			]),
		);
	});

	it('reports formatting and compiler advice for an invalid TSRX file', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-'));
		const filePath = join(temp_dir, 'Broken.tsrx');

		try {
			await writeFile(filePath, 'component Broken(){return <div />;}', 'utf8');
			const result = await validate_tsrx_file({
				filePath,
				cwd: react_fixture,
			});

			expect(result.ok).toBe(false);
			expect(result.read.ok).toBe(true);
			expect(result.format?.check).toBe(false);
			expect(result.compile?.ok).toBe(false);
			expect(result.analysis?.advice).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						kind: 'jsx-return-in-component',
					}),
				]),
			);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});
});
