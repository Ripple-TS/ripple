import { describe, expect, it } from 'vitest';
import jsLoader from '../src/js-loader.js';
import cssLoader from '../src/css-loader.js';
import { TsrxPreactRspackPlugin } from '../src/index.js';

/**
 * @param {string} resourcePath
 * @param {{ suspenseSource?: string }} [options]
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

describe('@tsrx/rspack-plugin-preact js-loader', () => {
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
		expect(map).toBeUndefined();
	});

	it('does not prepend a virtual css import when no style block exists', async () => {
		const id = '/virtual/App.tsrx';
		const source = `export component App() {
			<div>{'Hello world'}</div>
		}`;

		const { context, promise } = createLoaderContext(id);
		jsLoader.call(context, source);
		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).not.toContain('tsrx-css');
		expect(map).toBeTruthy();
	});

	it('forwards suspenseSource to the compiler', async () => {
		const id = '/virtual/App.tsrx';
		const source = `'use server';

		export component App() {
			try {
				<AsyncThing />
			} pending {
				<div>{'Loading'}</div>
			}
		}

		component AsyncThing() {
			'use server';
			await Promise.resolve();
			<div>{'Done'}</div>
		}`;

		const { context, promise } = createLoaderContext(id, { suspenseSource: 'preact-suspense' });
		jsLoader.call(context, source);
		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output).toContain("from 'preact-suspense'");
	});
});

describe('@tsrx/rspack-plugin-preact css-loader', () => {
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

describe('@tsrx/rspack-plugin-preact plugin', () => {
	it('registers module rules for .tsrx and sibling css query', () => {
		const plugin = new TsrxPreactRspackPlugin();
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
		expect(jsRule.use).toHaveLength(2);
		expect(jsRule.use[0].loader).toBe('builtin:swc-loader');

		expect(cssRule.resourceQuery.toString()).toContain('tsrx-css');
		expect(cssRule.type).toBe('css/auto');
	});

	it('respects a user-provided jsxImportSource', () => {
		const plugin = new TsrxPreactRspackPlugin({ jsxImportSource: 'preact/compat' });
		const compiler = {
			options: {
				module: { rules: [] },
				resolve: { extensions: [] },
				experiments: {},
			},
		};

		plugin.apply(/** @type {any} */ (compiler));

		const jsRule = compiler.options.module.rules[0];
		expect(jsRule.use[0].options.jsc.transform.react.importSource).toBe('preact/compat');
	});

	it('does not override an explicitly disabled experiments.css flag', () => {
		const plugin = new TsrxPreactRspackPlugin();
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
