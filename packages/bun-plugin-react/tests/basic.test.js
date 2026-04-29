import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tsrxReact } from '../src/index.js';

/**
 * @typedef {{
 * 	onResolve: Array<{ options: { filter: RegExp, namespace?: string }, callback: Function }>,
 * 	onLoad: Array<{ options: { filter: RegExp, namespace?: string }, callback: Function }>,
 * }} Hooks
 */

const original_bun = Reflect.get(globalThis, 'Bun');

afterEach(() => {
	if (original_bun === undefined) {
		Reflect.deleteProperty(globalThis, 'Bun');
	} else {
		Object.defineProperty(globalThis, 'Bun', {
			value: original_bun,
			writable: true,
			configurable: true,
		});
	}
});

/**
 * @returns {{ options: unknown[] }}
 */
function install_transpiler_stub() {
	/** @type {unknown[]} */
	const options = [];

	class TranspilerStub {
		/**
		 * @param {unknown} transpiler_options
		 */
		constructor(transpiler_options) {
			options.push(transpiler_options);
		}

		/**
		 * @param {string} source
		 * @returns {string}
		 */
		transformSync(source) {
			return `// transformed\n${source}`;
		}
	}

	Object.defineProperty(globalThis, 'Bun', {
		value: { Transpiler: TranspilerStub },
		writable: true,
		configurable: true,
	});

	return { options };
}

/**
 * @param {import('../types/index.js').TsrxReactBunPluginOptions} [options]
 * @param {{ target?: string, root?: string }} [config]
 */
function setup_plugin(options, config = {}) {
	/** @type {Hooks} */
	const hooks = { onResolve: [], onLoad: [] };
	const plugin = tsrxReact(options);
	plugin.setup({
		config,
		onResolve(hook_options, callback) {
			hooks.onResolve.push({ options: hook_options, callback });
		},
		onLoad(hook_options, callback) {
			hooks.onLoad.push({ options: hook_options, callback });
		},
	});
	return hooks;
}

/**
 * @param {Hooks} hooks
 * @param {string} file_path
 * @returns {Promise<{ contents: string, loader: string } | undefined>}
 */
async function load_tsrx(hooks, file_path) {
	const hook = hooks.onLoad.find(({ options }) => options.namespace === 'file');
	if (!hook) throw new Error('missing .tsrx onLoad hook');
	return hook.callback({ path: file_path, namespace: 'file', importer: '', kind: 'entry-point' });
}

/**
 * @param {Hooks} hooks
 * @param {string} id
 */
function load_css(hooks, id) {
	const resolve_hook = hooks.onResolve.find(({ options }) => options.filter.test(id));
	if (!resolve_hook) throw new Error('missing CSS onResolve hook');
	const resolved = resolve_hook.callback({ path: id, importer: '' });
	const load_hook = hooks.onLoad.find(({ options }) => options.namespace === resolved.namespace);
	if (!load_hook) throw new Error('missing CSS onLoad hook');
	return load_hook.callback({ path: resolved.path, namespace: resolved.namespace });
}

describe('@tsrx/bun-plugin-react', () => {
	it('compiles .tsrx files, transforms TSX, and serves emitted CSS', async () => {
		const transpiler = install_transpiler_stub();
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-react-'));
		try {
			const file_path = path.join(dir, 'App.tsrx');
			await writeFile(
				file_path,
				`export component App() {
					<div>{'Hello world'}</div>

					<style>
						.div {
							color: red;
						}
					</style>
				}`,
			);

			const hooks = setup_plugin(undefined, { target: 'browser', root: dir });
			const transformed = await load_tsrx(hooks, file_path);
			const css_id = `${file_path}?tsrx-css&lang.css`;
			const css = load_css(hooks, css_id);

			expect(transformed).toBeDefined();
			expect(transformed?.loader).toBe('js');
			expect(transformed?.contents).toContain('// transformed');
			expect(transformed?.contents).toContain(css_id);
			expect(css.loader).toBe('css');
			expect(css.contents).toContain('.div.');
			expect(css.contents).toContain('color: red;');
			expect(transpiler.options).toEqual([
				expect.objectContaining({
					loader: 'tsx',
					target: 'browser',
					autoImportJSX: true,
					tsconfig: {
						compilerOptions: {
							jsx: 'react-jsx',
							jsxImportSource: 'react',
						},
					},
				}),
			]);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('uses a custom jsx import source', () => {
		const transpiler = install_transpiler_stub();
		setup_plugin({ jsxImportSource: 'react-custom' }, { target: 'browser' });

		expect(transpiler.options).toEqual([
			expect.objectContaining({
				tsconfig: {
					compilerOptions: {
						jsx: 'react-jsx',
						jsxImportSource: 'react-custom',
					},
				},
			}),
		]);
	});

	it('falls back to TSX output when Bun.Transpiler is unavailable', async () => {
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-react-'));
		try {
			const file_path = path.join(dir, 'App.tsrx');
			await writeFile(
				file_path,
				`export component App() {
					<div>{'Hello world'}</div>
				}`,
			);

			const hooks = setup_plugin(undefined, { target: 'browser', root: dir });
			const transformed = await load_tsrx(hooks, file_path);

			expect(transformed).toBeDefined();
			expect(transformed?.loader).toBe('tsx');
			expect(transformed?.contents).not.toContain('?tsrx-css&lang.css');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('honors exclude filters', async () => {
		const hooks = setup_plugin({ exclude: /ignored\.tsrx$/ }, { target: 'browser' });
		const transformed = await load_tsrx(hooks, '/project/ignored.tsrx');
		expect(transformed).toBeUndefined();
	});
});
