import { describe, expect, it } from 'vitest';
import { compile } from '@tsrx/vue';
import jsLoader from '../src/js-loader.js';
import vaporLoader from '../src/vapor-loader.js';
import cssLoader from '../src/css-loader.js';
import { TsrxVueRspackPlugin } from '../src/index.js';

/**
 * @param {string} resourcePath
 * @param {{ vapor?: { interop?: boolean, macros?: boolean | object, compiler?: { runtimeModuleName?: string } } }} [options]
 * @returns {{ context: object, promise: Promise<{ err: unknown, output: string | null, map: unknown }> }}
 */
function createLoaderContext(resourcePath, options = {}) {
	/** @type {(value: { err: unknown, output: string | null, map: unknown }) => void} */
	let resolve;
	const promise = new Promise((r) => {
		resolve = r;
	});
	const context = {
		resourcePath,
		getOptions() {
			return options;
		},
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

describe('@tsrx/rspack-plugin-vue js-loader', () => {
	it('prepends a virtual css import when a style block exists', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export component App() {
			<div>{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
		}`;

		const { context, promise } = createLoaderContext(id);
		jsLoader.call(context, source);
		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).toContain(`${id}?tsrx-css&lang.css`);
		expect(output).toContain('defineVaporComponent');
		expect(map).toBeUndefined();
	});

	it('returns compiled TSX and a sourcemap when no style block exists', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export component App({ name }: { name: string }) {
			<div>{name}</div>
		}`;

		const { context, promise } = createLoaderContext(id);
		jsLoader.call(context, source);
		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).toContain('defineVaporComponent');
		expect(output).toContain('{ name }: { name: string }');
		expect(map).toBeTruthy();
	});
});

describe('@tsrx/rspack-plugin-vue vapor-loader', () => {
	it('transforms compiled TSX into Vue Vapor runtime code', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export component App({ name }: { name: string }) {
			<div>{name}</div>
		}`;
		const compiled = compile(source, id);

		const { context, promise } = createLoaderContext(id);
		vaporLoader.call(context, compiled.code, compiled.map);
		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).toContain('template as _template');
		expect(output).toContain('defineVaporComponent');
		expect(output).not.toContain('return <div>');
		expect(map).toBeTruthy();
	});
});

describe('@tsrx/rspack-plugin-vue css-loader', () => {
	it('returns the compiled scoped css text', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export component App() {
			<div>{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
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
		const source = `export component App() {
			<div>{'Hello world'}</div>
		}`;

		const { context, promise } = createLoaderContext(id);
		cssLoader.call(context, source);
		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output).toBe('');
	});
});

describe('@tsrx/rspack-plugin-vue plugin', () => {
	it('registers module rules for .tsrx and sibling css query', () => {
		const plugin = new TsrxVueRspackPlugin();
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
		expect(compiler.options.module.rules).toHaveLength(2);

		const [jsRule, cssRule] = compiler.options.module.rules;
		expect(jsRule.test.toString()).toContain('tsrx');
		expect(jsRule.use).toHaveLength(3);
		expect(jsRule.use[0].loader).toBe('builtin:swc-loader');
		expect(jsRule.use[1].loader).toContain('vapor-loader');
		expect(jsRule.use[2].loader).toContain('js-loader');
		expect(jsRule.use[0].options.jsc.parser).toMatchObject({
			syntax: 'typescript',
			tsx: false,
		});

		expect(cssRule.resourceQuery.toString()).toContain('tsrx-css');
		expect(cssRule.type).toBe('css/auto');
	});

	it('passes custom vapor options to the loader', () => {
		const plugin = new TsrxVueRspackPlugin({
			vapor: {
				compiler: {
					runtimeModuleName: 'custom-runtime',
				},
			},
		});
		const compiler = {
			options: {
				module: { rules: [] },
				resolve: { extensions: [] },
				experiments: {},
			},
		};

		plugin.apply(/** @type {any} */ (compiler));

		const jsRule = compiler.options.module.rules[0];
		expect(jsRule.use[1].options.vapor.compiler.runtimeModuleName).toBe('custom-runtime');
	});

	it('does not override an explicitly disabled experiments.css flag', () => {
		const plugin = new TsrxVueRspackPlugin();
		const compiler = {
			options: {
				module: { rules: [] },
				resolve: { extensions: [] },
				experiments: { css: false },
			},
		};

		plugin.apply(/** @type {any} */ (compiler));

		expect(compiler.options.experiments.css).toBe(false);
	});
});
