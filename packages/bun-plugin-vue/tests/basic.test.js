import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tsrxVue } from '../src/index.js';

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
 * @param {import('../types/index.js').TsrxVueBunPluginOptions} [options]
 * @param {{ target?: import('bun').Target, root?: string }} [config]
 */
function setup_plugin(options, config = {}) {
	/** @type {Hooks} */
	const hooks = { onResolve: [], onLoad: [] };
	const plugin = tsrxVue(options);
	const build = {
		config: {
			entrypoints: [],
			plugins: [],
			...config,
		},
		/**
		 * @param {{ filter: RegExp, namespace?: string }} hook_options
		 * @param {Function} callback
		 */
		onResolve(hook_options, callback) {
			hooks.onResolve.push({ options: hook_options, callback });
			return build;
		},
		/**
		 * @param {{ filter: RegExp, namespace?: string }} hook_options
		 * @param {Function} callback
		 */
		onLoad(hook_options, callback) {
			hooks.onLoad.push({ options: hook_options, callback });
			return build;
		},
	};
	plugin.setup(/** @type {import('bun').PluginBuilder} */ (/** @type {unknown} */ (build)));
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
 * @param {string} file_path
 * @returns {Promise<{ contents: string, loader: string } | undefined>}
 */
async function load_source(hooks, file_path) {
	const hook = hooks.onLoad.find(
		({ options }) => options.namespace === 'file' && options.filter.test(file_path),
	);
	if (!hook) throw new Error('missing source onLoad hook');
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

describe('@tsrx/bun-plugin-vue', () => {
	it('compiles .tsrx files, runs the Vue vapor transform, and serves emitted CSS', async () => {
		const transpiler = install_transpiler_stub();
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-vue-'));
		try {
			const file_path = path.join(dir, 'App.tsrx');
			await writeFile(
				file_path,
				`export function App() @{
					<>
						<div class="div">{'Hello world'}</div>

						<style>
							.div {
								color: red;
							}
						</style>
					</>
				}`,
			);

			const hooks = setup_plugin(undefined, { target: 'browser', root: dir });
			const transformed = await load_tsrx(hooks, file_path);
			const css_id = `${file_path}?tsrx-css&lang.css`;
			const css = load_css(hooks, css_id);

			expect(transformed).toBeDefined();
			expect(transformed?.loader).toBe('js');
			expect(transformed?.contents).toContain('// transformed');
			expect(transformed?.contents).toContain('defineVaporComponent');
			expect(transformed?.contents).toContain('template as _template');
			expect(transformed?.contents).toContain(css_id);
			expect(transformed?.contents).not.toContain('return <div>');
			expect(css.loader).toBe('css');
			expect(css.contents).toContain('.div.');
			expect(css.contents).toContain('color: red;');
			expect(transpiler.options).toEqual([
				expect.objectContaining({
					loader: 'ts',
					target: 'browser',
				}),
			]);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('passes custom vapor options through', async () => {
		install_transpiler_stub();
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-vue-'));
		try {
			const file_path = path.join(dir, 'App.tsrx');
			await writeFile(
				file_path,
				`export function App({ name }: { name: string }) @{
					<div>{name}</div>
				}`,
			);

			const hooks = setup_plugin(
				{
					vapor: {
						compiler: {
							runtimeModuleName: 'custom-runtime',
						},
					},
				},
				{ target: 'browser', root: dir },
			);
			const transformed = await load_tsrx(hooks, file_path);

			expect(transformed).toBeDefined();
			expect(transformed?.contents).toContain('custom-runtime');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('falls back to TypeScript output when Bun.Transpiler is unavailable', async () => {
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-vue-'));
		try {
			const file_path = path.join(dir, 'App.tsrx');
			await writeFile(
				file_path,
				`export function App() @{
					<div>{'Hello world'}</div>
				}`,
			);

			const hooks = setup_plugin(undefined, { target: 'browser', root: dir });
			const transformed = await load_tsrx(hooks, file_path);

			expect(transformed).toBeDefined();
			expect(transformed?.loader).toBe('ts');
			expect(transformed?.contents).toContain('defineVaporComponent');
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

	it('installs vaporInteropPlugin on createVaporApp calls', async () => {
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-vue-'));
		try {
			const file_path = path.join(dir, 'main.ts');
			await writeFile(
				file_path,
				`import { createVaporApp } from 'vue';
import App from './App.tsrx';

createVaporApp(App).mount('#root');`,
			);

			const hooks = setup_plugin(undefined, { target: 'browser', root: dir });
			const transformed = await load_source(hooks, file_path);

			expect(transformed).toBeDefined();
			expect(transformed?.loader).toBe('ts');
			expect(transformed?.contents).toContain(
				`import { createVaporApp as __tsrx_createVaporApp, vaporInteropPlugin } from 'vue';`,
			);
			expect(transformed?.contents).toContain(
				`const createVaporApp = (...args) => __tsrx_createVaporApp(...args).use(vaporInteropPlugin);`,
			);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('leaves manually installed interop alone', async () => {
		const dir = await mkdtemp(path.join(os.tmpdir(), 'tsrx-bun-plugin-vue-'));
		try {
			const file_path = path.join(dir, 'main.ts');
			await writeFile(
				file_path,
				`import { createVaporApp, vaporInteropPlugin } from 'vue';
import App from './App.tsrx';

createVaporApp(App).use(vaporInteropPlugin).mount('#root');`,
			);

			const hooks = setup_plugin(undefined, { target: 'browser', root: dir });
			const transformed = await load_source(hooks, file_path);

			expect(transformed).toBeUndefined();
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
