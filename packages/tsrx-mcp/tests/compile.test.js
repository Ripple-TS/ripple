import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_CODES, TSRX_WHILE_STATEMENT_ERROR } from '@tsrx/core';
import {
	analyze_tsrx,
	compile_tsrx,
	detect_target,
	format_tsrx,
	inspect_project,
	validate_tsrx_file,
} from '../src/index.js';
import { analyze_tsrx_result } from '../src/analyze.js';

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
	it.each([
		{ target: 'react', compilerPackage: '@tsrx/react' },
		{ target: 'preact', compilerPackage: '@tsrx/preact' },
		{ target: 'ripple', compilerPackage: '@tsrx/ripple' },
		{ target: 'solid', compilerPackage: '@tsrx/solid' },
		{ target: 'vue', compilerPackage: '@tsrx/vue' },
	])('detects $target from a minimal package.json signal', async ({ target, compilerPackage }) => {
		const temp_dir = await mkdtemp(join(tmpdir(), `tsrx-mcp-detect-${target}-`));

		try {
			await writeFile(
				join(temp_dir, 'package.json'),
				JSON.stringify(
					{
						name: `tsrx-mcp-detect-${target}`,
						private: true,
						type: 'module',
						dependencies: {
							[compilerPackage]: 'workspace:*',
						},
					},
					null,
					2,
				),
				'utf8',
			);

			const result = detect_target(temp_dir);

			expect(result.detectedTarget).toBe(target);
			expect(result.confidence).toBe('high');
			expect(result.matches[0]).toMatchObject({
				target,
				compilerPackage,
				signals: [compilerPackage],
				score: 1,
			});
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it.each([
		{
			target: 'react',
			compilerPackage: '@tsrx/react',
			pluginPackage: '@tsrx/bun-plugin-react',
		},
		{
			target: 'preact',
			compilerPackage: '@tsrx/preact',
			pluginPackage: '@tsrx/bun-plugin-preact',
		},
		{
			target: 'ripple',
			compilerPackage: '@tsrx/ripple',
			pluginPackage: '@ripple-ts/vite-plugin',
		},
		{
			target: 'solid',
			compilerPackage: '@tsrx/solid',
			pluginPackage: '@tsrx/rspack-plugin-solid',
		},
		{
			target: 'vue',
			compilerPackage: '@tsrx/vue',
			pluginPackage: '@tsrx/rspack-plugin-vue',
		},
	])(
		'detects $target from a bundler plugin package.json signal',
		async ({ target, compilerPackage, pluginPackage }) => {
			const temp_dir = await mkdtemp(join(tmpdir(), `tsrx-mcp-plugin-package-${target}-`));

			try {
				await writeFile(
					join(temp_dir, 'package.json'),
					JSON.stringify(
						{
							name: `tsrx-mcp-plugin-package-${target}`,
							private: true,
							type: 'module',
							devDependencies: {
								[pluginPackage]: 'workspace:*',
							},
						},
						null,
						2,
					),
					'utf8',
				);

				const result = detect_target(temp_dir);

				expect(result.detectedTarget).toBe(target);
				expect(result.confidence).toBe('high');
				expect(result.matches[0]).toMatchObject({
					target,
					compilerPackage,
					signals: [pluginPackage],
					score: 1,
				});
			} finally {
				await rm(temp_dir, { recursive: true, force: true });
			}
		},
	);

	it.each([
		{
			target: 'solid',
			compilerPackage: '@tsrx/solid',
			pluginPackage: '@tsrx/rspack-plugin-solid',
		},
		{
			target: 'vue',
			compilerPackage: '@tsrx/vue',
			pluginPackage: '@tsrx/rspack-plugin-vue',
		},
	])(
		'detects $target from a Rspack plugin config signal',
		async ({ target, compilerPackage, pluginPackage }) => {
			const temp_dir = await mkdtemp(join(tmpdir(), `tsrx-mcp-rspack-config-${target}-`));

			try {
				await writeFile(
					join(temp_dir, 'package.json'),
					JSON.stringify(
						{
							name: `tsrx-mcp-rspack-config-${target}`,
							private: true,
							type: 'module',
						},
						null,
						2,
					),
					'utf8',
				);
				await writeFile(
					join(temp_dir, 'rspack.config.js'),
					`import plugin from '${pluginPackage}';\nexport default { plugins: [plugin()] };\n`,
					'utf8',
				);

				const result = detect_target(temp_dir);

				expect(result.detectedTarget).toBe(target);
				expect(result.confidence).toBe('high');
				expect(result.matches[0]).toMatchObject({
					target,
					compilerPackage,
					signals: [pluginPackage],
					score: 1,
				});
			} finally {
				await rm(temp_dir, { recursive: true, force: true });
			}
		},
	);

	it('appends a cwd hint to the detection message when cwd was not supplied', () => {
		// The hint must fire on every detect call without an explicit cwd —
		// including when the detection happens to succeed — because the most
		// dangerous case is a silent false-positive (e.g. monorepo root picks
		// the first target with the most signals, but the agent is editing
		// inside a different sub-project).
		const result = detect_target(undefined);
		expect(result.message).toMatch(/cwd was not supplied/);
	});

	it('does not append a cwd hint when cwd was supplied explicitly', () => {
		const result = detect_target(react_fixture);
		expect(result.message).not.toMatch(/cwd was not supplied/);
	});

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

	it('suggests bun run commands for bun projects', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-bun-'));

		try {
			await writeFile(
				join(temp_dir, 'package.json'),
				JSON.stringify(
					{
						name: 'bun-project',
						packageManager: 'bun@1.2.0',
						scripts: {
							format: 'prettier --write .',
							'format:check': 'prettier --check .',
							test: 'vitest',
							typecheck: 'tsc --noEmit',
						},
					},
					null,
					2,
				),
				'utf8',
			);

			const result = inspect_project({ cwd: temp_dir });

			expect(result.packageManager).toBe('bun');
			expect(result.commands).toMatchObject({
				format: 'bun run format',
				formatCheck: 'bun run format:check',
				test: 'bun run test',
				typecheck: 'bun run typecheck',
			});
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('compiles TSRX with an explicit target', async () => {
		const result = await compile_tsrx({
			code: `export const App = () => <div>Hello</div>;`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
			includeCode: true,
		});

		expect(result.ok).toBe(true);
		expect(result.target).toBe('react');
		expect(result.compilerPackage).toBe('@tsrx/react');
		expect(result.errors).toEqual([]);
		expect(result.code ?? '').toContain('const App');
	});

	it('infers the target when compiling from a project cwd', async () => {
		const result = await compile_tsrx({
			code: `const App = () => <button>Save</button>;`,
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
				code: `export const App = () => <div>Hello</div>;`,
				filename: 'App.tsrx',
				cwd,
			});

			expect(result.ok).toBe(true);
			expect(result.target).toBe(target);
			expect(result.compilerPackage).toBe(compilerPackage);
			expect(result.errors).toEqual([]);
		},
	);

	it('reports unclosed tags as compile errors', async () => {
		// Regression: this case must produce ok: false. Editor-style `loose`
		// compilation can silently accept it, so the MCP defaults to `collect`
		// without enabling loose markup recovery.
		const result = await compile_tsrx({
			code: `function A() { return <>
				<div>hi
			</>; }`,
			filename: 'Unclosed.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].message).toMatch(/Expected closing tag/);
		expect(result.errors[0].code).toBe(DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG);
	});

	it('normalizes compiler failures into structured diagnostics', async () => {
		const result = await compile_tsrx({
			code: `function App() { return <>
					<div>hi
			</>; }`,
			filename: 'App.tsrx',
			target: 'ripple',
			cwd: resolve(__dirname, 'fixtures/ripple-project'),
		});

		expect(result.ok).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					code: DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG,
					fileName: 'App.tsrx',
					message: expect.stringContaining('Expected closing tag'),
				}),
			]),
		);
	});

	it('adds target-neutral advice for common tag authoring mistakes', async () => {
		const result = await analyze_tsrx({
			code: `function App() { return <>
					<div>hi
			</>; }`,
			filename: 'App.tsrx',
			target: 'ripple',
			cwd: resolve(__dirname, 'fixtures/ripple-project'),
		});

		expect(result.ok).toBe(false);
		expect(result.advice).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'mismatched-closing-tag',
					severity: 'error',
					documentation: expect.arrayContaining(['tsrx://docs/components.md']),
				}),
			]),
		);
		expect(result.advice.map((advice) => advice.kind)).not.toContain('jsx-expression-value');
		expect(result.nextSteps).toContain('Run compile-tsrx again after revising the source.');
	});

	it('adds control-flow advice for unsupported TSRX loop diagnostics', async () => {
		const while_loop = analyze_tsrx_result({
			code: '',
			compileResult: {
				ok: false,
				target: 'ripple',
				compilerPackage: '@tsrx/ripple',
				filename: 'App.tsrx',
				cwd: resolve(__dirname, 'fixtures/ripple-project'),
				errors: [
					{
						message: TSRX_WHILE_STATEMENT_ERROR,
						code: null,
						type: null,
						fileName: 'App.tsrx',
						pos: null,
						end: null,
						raisedAt: null,
						loc: null,
					},
				],
			},
		});

		expect(while_loop.advice).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'unsupported-component-loop',
					severity: 'error',
					documentation: expect.arrayContaining(['tsrx://docs/control-flow.md']),
				}),
			]),
		);
	});

	it('allows JSX values inside returned TSRX fragments', async () => {
		const result = await analyze_tsrx({
			code: `function App() { return <>
				const title = <div />;
			</>; }`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(true);
		expect(result.errors).toEqual([]);
		expect(result.advice.map((advice) => advice.kind)).toContain('compile-clean');
	});

	it('uses compiler error codes for tag advice', async () => {
		const result = await analyze_tsrx({
			code: `function A() { return <>
				<div>hi
			</>; }`,
			filename: 'Unclosed.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.errors[0]?.code).toBe(DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG);
		expect(result.advice).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'mismatched-closing-tag',
					documentation: expect.arrayContaining(['tsrx://docs/components.md']),
				}),
			]),
		);
	});

	it('allows ordinary function components that return TSRX directly', async () => {
		const result = await analyze_tsrx({
			code: `function App() {
				return <div />;
			}`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(true);
		expect(result.errors).toEqual([]);
		expect(result.advice.map((advice) => advice.kind)).toContain('compile-clean');
	});

	it('does not flag a PascalCase utility function that returns no JSX', async () => {
		// Regression: the function-component-shape check used to greedily match
		// across function boundaries, so a PascalCase utility followed by any
		// later JSX in the same file should not affect the utility's analysis.
		const result = await analyze_tsrx({
			code: `function FormatDate(value) {
				return String(value);
			}
			export const App = () => <div>Hello</div>;`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.advice.map((advice) => advice.kind)).toContain('compile-clean');
	});

	it('allows return-JSX text in comments outside returned TSRX', async () => {
		// Comments that mention JSX returns should not trigger structured advice.
		const result = await analyze_tsrx({
			code: `// example from docs: return <div />
			export const App = () => <span>Hello</span>;`,
			filename: 'App.tsrx',
			target: 'react',
			cwd: react_fixture,
		});

		expect(result.advice.map((advice) => advice.kind)).not.toContain('jsx-expression-value');
	});

	it('does not flag jsx-expression-value when JSX is already wrapped in <>', async () => {
		// Regression: the jsx-expression-value heuristic matched any `const x =
		// <Letter` and any `return <Letter`, so the canonical wrapper `<>`
		// triggered the very advice that recommends wrapping in `<>`.
		const result = await analyze_tsrx({
			code: `function App() @{
				const title = <><span>Title</span></>;
				<div>{title}</div>
			}`,
			filename: 'App.tsrx',
			target: 'ripple',
			cwd: resolve(__dirname, 'fixtures/ripple-project'),
		});

		expect(result.advice.map((advice) => advice.kind)).not.toContain('jsx-expression-value');
	});

	it('does not flag jsx-expression-value when JSX is wrapped in a <> fragment', async () => {
		// The fragment shorthand is the documented default wrapper for
		// expression-position JSX, so it must never trigger the wrap-it advice.
		const result = await analyze_tsrx({
			code: `function App() @{
				const title = <><span>Title</span></>;
				<div>{title}</div>
			}`,
			filename: 'App.tsrx',
			target: 'ripple',
			cwd: resolve(__dirname, 'fixtures/ripple-project'),
		});

		expect(result.advice.map((advice) => advice.kind)).not.toContain('jsx-expression-value');
	});

	it('formats TSRX source with the official prettier plugin', async () => {
		const result = await format_tsrx({
			code: `export const App=()=> <button class="primary">Save</button>;`,
			filename: 'App.tsrx',
		});

		expect(result.ok).toBe(true);
		expect(result.changed).toBe(true);
		expect(result.formatted).toBe(
			`export const App = () => <button class=\"primary\">Save</button>;\n`,
		);
		expect(result.errors).toEqual([]);
		expect(result.message).toMatch(/cwd was not supplied/);
	});

	it('can check whether TSRX source is already formatted', async () => {
		const code = `export const App = () => <button>Save</button>;\n`;
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

	it('respects a project .prettierrc when formatting', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-prettierrc-'));
		const filePath = join(temp_dir, 'App.tsrx');

		try {
			await writeFile(
				join(temp_dir, '.prettierrc'),
				JSON.stringify({
					useTabs: false,
					tabWidth: 4,
					singleQuote: false,
					printWidth: 100,
				}),
				'utf8',
			);

			const result = await format_tsrx({
				code: `export const App=()=> <button class="primary">Save</button>;`,
				filename: filePath,
			});

			expect(result.ok).toBe(true);
			expect(result.configPath).toBe(join(temp_dir, '.prettierrc'));
			// 4-space indent (no tabs), as configured.
			expect(result.formatted).toBe(
				`export const App = () => <button class="primary">Save</button>;\n`,
			);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('resolves relative format filenames from the supplied cwd', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-prettierrc-cwd-'));

		try {
			await mkdir(join(temp_dir, 'src'));
			await writeFile(
				join(temp_dir, '.prettierrc'),
				JSON.stringify({
					useTabs: false,
					tabWidth: 4,
					singleQuote: false,
					printWidth: 100,
				}),
				'utf8',
			);

			const result = await format_tsrx({
				code: `export const App=()=> <button class="primary">Save</button>;`,
				filename: 'src/App.tsrx',
				cwd: temp_dir,
			});

			expect(result.ok).toBe(true);
			expect(result.cwd).toBe(resolve(temp_dir));
			expect(result.filename).toBe('src/App.tsrx');
			expect(result.message).toBe(null);
			expect(result.configPath).toBe(join(temp_dir, '.prettierrc'));
			expect(result.formatted).toBe(
				`export const App = () => <button class="primary">Save</button>;\n`,
			);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('lets explicit input options override project .prettierrc', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-prettierrc-override-'));
		const filePath = join(temp_dir, 'App.tsrx');

		try {
			await writeFile(
				join(temp_dir, '.prettierrc'),
				JSON.stringify({ useTabs: false, tabWidth: 4 }),
				'utf8',
			);

			const result = await format_tsrx({
				code: `export const App=()=> <button>Save</button>;`,
				filename: filePath,
				useTabs: true,
				tabWidth: 2,
			});

			expect(result.ok).toBe(true);
			expect(result.configPath).toBe(join(temp_dir, '.prettierrc'));
			expect(result.formatted).toBe(`export const App = () => <button>Save</button>;\n`);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('falls back to built-in defaults when no project config is found', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-noconfig-'));
		const filePath = join(temp_dir, 'App.tsrx');

		try {
			const result = await format_tsrx({
				code: `export const App=()=> <button>Save</button>;`,
				filename: filePath,
			});

			expect(result.ok).toBe(true);
			expect(result.configPath).toBe(null);
			// Built-in defaults: tabs, single quotes, width 100.
			expect(result.formatted).toBe(`export const App = () => <button>Save</button>;\n`);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('validates a TSRX file with formatting, compilation, and advice', async () => {
		const result = await validate_tsrx_file({
			filePath: 'src/Valid.tsrx',
			cwd: react_fixture,
		});

		expect(result.ok).toBe(true);
		expect(result.read.ok).toBe(true);
		expect(result.message).toBe(null);
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
			await writeFile(filePath, 'function Broken(){ return <><div>hi</>; }', 'utf8');
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
						kind: 'mismatched-closing-tag',
					}),
				]),
			);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('warns when validating without an explicit cwd', async () => {
		const result = await validate_tsrx_file({
			filePath: 'missing-file.tsrx',
		});

		expect(result.ok).toBe(false);
		expect(result.message).toMatch(/cwd was not supplied/);
		expect(result.read.ok).toBe(false);
	});
});
