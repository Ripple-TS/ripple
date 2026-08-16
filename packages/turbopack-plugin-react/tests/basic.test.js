import { describe, expect, it } from 'vitest';
import tsrx_react_turbopack_css_loader from '../src/css-loader.js';
import tsrx_react_turbopack_loader from '../src/loader.js';
import {
	create_tsrx_react_turbopack_css_rule,
	create_tsrx_react_turbopack_rule,
	tsrxReactTurbopack,
} from '../src/index.js';

/**
 * @param {string} resourcePath
 * @param {{ runtimeImports?: 'compiler' | 'direct' }} [options]
 * @returns {{ context: object, promise: Promise<{ err: unknown, output: string | null, map: unknown }> }}
 */
function create_loader_context(resourcePath, options = {}) {
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

describe('@tsrx/turbopack-plugin-react loader', () => {
	it('compiles tsrx source to TSX with a source map', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx');

		tsrx_react_turbopack_loader.call(
			context,
			`export function App() @{
				<div>{'Hello world'}</div>
			}`,
		);

		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).toContain('export function App()');
		expect(output).toContain("{'Hello world'}");
		expect(map).toBeTruthy();
	});

	it('preserves deferred imports in the loader output', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx');

		tsrx_react_turbopack_loader.call(
			context,
			`import defer * as feature from './feature.js';
			const lazy = import.defer('./lazy.js');

			export function App() @{
				<div>{feature.value}</div>
			}`,
		);

		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output).toContain("import defer * as feature from './feature.js';");
		expect(output).toContain("import.defer('./lazy.js')");
	});

	it('preserves top-level directives at the start of the output', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx');

		tsrx_react_turbopack_loader.call(
			context,
			`'use client';

			export function App() @{
				<div>{'Hello world'}</div>
			}`,
		);

		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output.startsWith("'use client';")).toBe(true);
	});

	it('injects a sibling CSS import for component-local style blocks', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx');

		tsrx_react_turbopack_loader.call(
			context,
			`export function App() @{
				<>
				<div>{'Hello world'}</div>

				<style>
					div {
						color: red;
					}
				</style>
				</>
			}`,
		);

		const { err, output, map } = await promise;

		expect(err).toBeNull();
		expect(output).toContain('import "/virtual/App.tsrx?tsrx-css&lang.css";');
		expect(output).toContain('export function App()');
		expect(map).toBeUndefined();
	});

	it('keeps top-level directives ahead of injected CSS imports', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx');

		tsrx_react_turbopack_loader.call(
			context,
			`'use client';

			export function App() @{
				<>
				<div>{'Hello world'}</div>

				<style>
					div {
						color: red;
					}
				</style>
				</>
			}`,
		);

		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output.startsWith("'use client';")).toBe(true);
		expect(output.indexOf("'use client';")).toBeLessThan(
			output.indexOf('import "/virtual/App.tsrx?tsrx-css&lang.css";'),
		);
	});

	it('forwards direct runtime imports to the compiler', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx', {
			runtimeImports: 'direct',
		});

		tsrx_react_turbopack_loader.call(
			context,
			`export function App(props) @{
				<input {...props} />
			}`,
		);

		const { err, output } = await promise;
		expect(err).toBeNull();
		expect(output).toContain("from '@tsrx/react-runtime/ref'");
	});
});

describe('@tsrx/turbopack-plugin-react css loader', () => {
	it('extracts component-local css for the sibling query import', async () => {
		const { context, promise } = create_loader_context('/virtual/App.tsrx');

		tsrx_react_turbopack_css_loader.call(
			context,
			`export function App() @{
				<>
				<div class="card">{'Hello world'}</div>

				<style>
					.card {
						color: red;
					}
				</style>
				</>
			}`,
		);

		const { err, output } = await promise;

		expect(err).toBeNull();
		expect(output).toContain('.card.');
		expect(output).toContain('color: red;');
	});
});

describe('@tsrx/turbopack-plugin-react config helper', () => {
	it('creates the default tsrx turbopack rule', () => {
		const rule = create_tsrx_react_turbopack_rule();

		expect(rule.condition).toEqual({
			all: [{ not: 'foreign' }, { not: { query: '?tsrx-css&lang.css' } }],
		});
		expect(rule.as).toBe('*.tsx');
		expect(rule.loaders).toHaveLength(1);
		expect(rule.loaders[0]).toContain('packages/turbopack-plugin-react/src/loader.js');
	});

	it('creates the sibling css rule for style query imports', () => {
		const rule = create_tsrx_react_turbopack_css_rule();

		expect(rule.condition).toEqual({
			all: [{ not: 'foreign' }, { query: '?tsrx-css&lang.css' }],
		});
		expect(rule.type).toBe('css');
		expect(rule.loaders).toHaveLength(1);
		expect(rule.loaders[0]).toContain('packages/turbopack-plugin-react/src/css-loader.js');
	});

	it('merges turbopack config without dropping existing settings', () => {
		const config = tsrxReactTurbopack({
			reactStrictMode: true,
			turbopack: {
				debugIds: true,
				resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
				rules: {
					'*.svg': {
						loaders: ['@svgr/webpack'],
						as: '*.js',
					},
				},
			},
		});

		expect(config.reactStrictMode).toBe(true);
		expect(config.turbopack.debugIds).toBe(true);
		expect(config.turbopack.rules['*.svg']).toEqual({
			loaders: ['@svgr/webpack'],
			as: '*.js',
		});
		expect(config.turbopack.resolveExtensions[0]).toBe('.tsrx');
		expect(Array.isArray(config.turbopack.rules['*.tsrx'])).toBe(true);
		expect(config.turbopack.rules['*.tsrx'][0]).toMatchObject({
			condition: {
				all: [{ not: 'foreign' }, { not: { query: '?tsrx-css&lang.css' } }],
			},
			as: '*.tsx',
		});
		expect(config.turbopack.rules['*.tsrx'][1]).toMatchObject({
			condition: {
				all: [{ not: 'foreign' }, { query: '?tsrx-css&lang.css' }],
			},
			type: 'css',
		});
	});

	it('passes runtime import options to both loaders', () => {
		const config = tsrxReactTurbopack({}, { runtimeImports: 'direct' });
		const rules = config.turbopack.rules['*.tsrx'];

		expect(rules[0].loaders[0].options).toEqual({ runtimeImports: 'direct' });
		expect(rules[1].loaders[0].options).toEqual({ runtimeImports: 'direct' });
	});

	it('prepends the tsrx rule when a user already configured one', () => {
		const config = tsrxReactTurbopack({
			turbopack: {
				rules: {
					'*.tsrx': {
						loaders: ['custom-loader'],
						as: '*.js',
					},
				},
			},
		});

		expect(Array.isArray(config.turbopack.rules['*.tsrx'])).toBe(true);
		expect(config.turbopack.rules['*.tsrx'][0]).toMatchObject({
			condition: {
				all: [{ not: 'foreign' }, { not: { query: '?tsrx-css&lang.css' } }],
			},
			as: '*.tsx',
		});
		expect(config.turbopack.rules['*.tsrx'][1]).toMatchObject({
			condition: {
				all: [{ not: 'foreign' }, { query: '?tsrx-css&lang.css' }],
			},
			type: 'css',
		});
		expect(config.turbopack.rules['*.tsrx'][2]).toEqual({
			loaders: ['custom-loader'],
			as: '*.js',
		});
	});
});
