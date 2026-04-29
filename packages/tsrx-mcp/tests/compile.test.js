import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile_tsrx, detect_target } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const react_fixture = resolve(__dirname, 'fixtures/react-project');

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
});
