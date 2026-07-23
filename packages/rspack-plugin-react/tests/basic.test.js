import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { experiments, rspack } from '@rspack/core';
import { describe, expect, it } from 'vitest';
import jsLoader from '../src/js-loader.js';
import cssLoader from '../src/css-loader.js';
import { TsrxReactRspackPlugin } from '../src/index.js';

/**
 * @param {string} resourcePath
 * @returns {{ context: object, promise: Promise<{ err: unknown, output: string | null, map: unknown }> }}
 */
function createLoaderContext(resourcePath) {
	/** @type {(value: { err: unknown, output: string | null, map: unknown }) => void} */
	let resolve;
	const promise = new Promise((r) => {
		resolve = r;
	});
	const context = {
		resourcePath,
		async() {
			return (
				/** @type {unknown} */ err,
				/** @type {string | null} */ output,
				/** @type {unknown} */ map,
			) => {
				resolve({ err, output, map });
			};
		},
	};
	return { context, promise };
}

describe('@tsrx/rspack-plugin-react js-loader', () => {
	it('prepends a virtual css import when a style block exists', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export function App() @{
			<>
			<div>{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
			</>
		}`;

		const { context, promise } = createLoaderContext(id);
		jsLoader.call(context, source);
		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).toContain(`${id}?tsrx-css&lang.css`);
		expect(map).toBeUndefined();
	});

	it('does not prepend a virtual css import when no style block exists', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export function App() @{
			<div>{'Hello world'}</div>
		}`;

		const { context, promise } = createLoaderContext(id);
		jsLoader.call(context, source);
		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).not.toContain('tsrx-css');
		expect(map).toBeTruthy();
	});
});

describe('@tsrx/rspack-plugin-react css-loader', () => {
	it('returns the compiled scoped css text', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export function App() @{
			<>
			<div className="div">{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
			</>
		}`;

		const { context, promise } = createLoaderContext(id);
		cssLoader.call(context, source);
		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output).toContain('.div.');
		expect(output).toContain('color: red;');
	});

	it('returns an empty string when no style block exists', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export function App() @{
			<div>{'Hello world'}</div>
		}`;

		const { context, promise } = createLoaderContext(id);
		cssLoader.call(context, source);
		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output).toBe('');
	});
});

describe('@tsrx/rspack-plugin-react plugin', () => {
	it('registers module rules for .tsrx and sibling css query', () => {
		const plugin = new TsrxReactRspackPlugin();
		const compiler = {
			options: {
				module: { rules: [] },
				resolve: { extensions: ['.js', '.ts'] },
				experiments: {},
			},
		};

		plugin.apply(/** @type {any} */ (compiler));

		expect(compiler.options.resolve.extensions).toContain('.tsrx');
		expect(compiler.options.experiments.css).toBe(true);
		expect(compiler.options.experiments.deferImport).toBe(true);
		expect(compiler.options.module.rules).toHaveLength(2);

		const [jsRule, cssRule] = compiler.options.module.rules;
		expect(jsRule.test.toString()).toContain('tsrx');
		expect(jsRule.use).toHaveLength(2);
		expect(jsRule.use[0].loader).toBe('builtin:swc-loader');

		expect(cssRule.resourceQuery.toString()).toContain('tsrx-css');
		expect(cssRule.type).toBe('css/auto');
	});

	it('respects a user-provided jsxImportSource', () => {
		const plugin = new TsrxReactRspackPlugin({ jsxImportSource: 'preact' });
		const compiler = {
			options: {
				module: { rules: [] },
				resolve: { extensions: [] },
				experiments: {},
			},
		};

		plugin.apply(/** @type {any} */ (compiler));

		const jsRule = compiler.options.module.rules[0];
		expect(jsRule.use[0].options.jsc.transform.react.importSource).toBe('preact');
	});

	it('does not override explicitly disabled experiment flags', () => {
		const plugin = new TsrxReactRspackPlugin();
		const compiler = {
			options: {
				module: { rules: [] },
				resolve: { extensions: [] },
				experiments: { css: false, deferImport: false },
			},
		};

		plugin.apply(/** @type {any} */ (compiler));

		expect(compiler.options.experiments.css).toBe(false);
		expect(compiler.options.experiments.deferImport).toBe(false);
	});

	it('keeps static and dynamic deferred imports lazy in a Rspack 2 bundle', async () => {
		const package_root = fileURLToPath(new URL('..', import.meta.url));
		const output_path = mkdtempSync(path.join(tmpdir(), 'tsrx-rspack-defer-'));
		const virtual_root = 'tests/virtual-defer';
		const runtime_global = /** @type {typeof globalThis & { __tsrx_defer_events__?: string[] }} */ (
			globalThis
		);
		const modules = {
			[`${virtual_root}/entry.tsrx`]: `
				import defer * as staticFeature from './static.js';

				export async function loadDynamic() {
					const dynamicFeature = await import.defer('./dynamic.js');
					return {
						before: [...globalThis.__tsrx_defer_events__],
						read: () => dynamicFeature.value,
					};
				}

				export function readStatic() {
					return staticFeature.value;
				}
			`,
			[`${virtual_root}/static.js`]: `
				globalThis.__tsrx_defer_events__.push('static evaluated');
				export const value = 'static';
			`,
			[`${virtual_root}/dynamic.js`]: `
				globalThis.__tsrx_defer_events__.push('dynamic evaluated');
				export const value = 'dynamic';
			`,
		};

		try {
			await new Promise((resolve, reject) => {
				rspack(
					{
						context: package_root,
						mode: 'development',
						target: 'node',
						entry: `./${virtual_root}/entry.tsrx`,
						devtool: false,
						optimization: { minimize: false },
						output: {
							path: output_path,
							filename: 'main.cjs',
							chunkFilename: '[name].cjs',
							library: { type: 'commonjs2' },
						},
						plugins: [new experiments.VirtualModulesPlugin(modules), new TsrxReactRspackPlugin()],
					},
					(error, stats) => {
						if (error) {
							reject(error);
						} else if (stats?.hasErrors()) {
							reject(new Error(stats.toString({ all: false, errors: true })));
						} else {
							resolve(undefined);
						}
					},
				);
			});

			runtime_global.__tsrx_defer_events__ = [];
			const require = createRequire(import.meta.url);
			const api =
				/** @type {{ loadDynamic(): Promise<{ before: string[], read(): string }>, readStatic(): string }} */ (
					require(path.join(output_path, 'main.cjs'))
				);

			expect(runtime_global.__tsrx_defer_events__).toEqual([]);
			const dynamic = await api.loadDynamic();
			expect(dynamic.before).toEqual([]);
			expect(runtime_global.__tsrx_defer_events__).toEqual([]);
			expect(dynamic.read()).toBe('dynamic');
			expect(runtime_global.__tsrx_defer_events__).toEqual(['dynamic evaluated']);
			expect(api.readStatic()).toBe('static');
			expect(runtime_global.__tsrx_defer_events__).toEqual([
				'dynamic evaluated',
				'static evaluated',
			]);
		} finally {
			Reflect.deleteProperty(runtime_global, '__tsrx_defer_events__');
			rmSync(output_path, { recursive: true, force: true });
		}
	});
});
