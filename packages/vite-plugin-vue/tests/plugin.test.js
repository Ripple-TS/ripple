import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tsrxVue } from '../src/index.js';

/**
 * @param {import('vite').Plugin} plugin
 * @param {string} id
 */
function call_load(plugin, id) {
	const hook = typeof plugin.load === 'function' ? plugin.load : plugin.load?.handler;
	if (!hook) throw new Error('plugin has no load hook');
	return hook.call(/** @type {any} */ ({}), id);
}

/**
 * Pluck the main tsrx-vue plugin (the one with the load hook for `.tsrx.tsx`
 * virtual ids) out of the array returned by `tsrxVue()`.
 */
function get_main_plugin() {
	const plugins = tsrxVue();
	const main = plugins.find((p) => p.name === '@tsrx/vite-plugin-vue');
	if (!main) throw new Error('@tsrx/vite-plugin-vue plugin not found');
	return main;
}

describe('@tsrx/vite-plugin-vue source maps', () => {
	it('maps the compiled output back to the original tsrx source', async () => {
		const plugin = get_main_plugin();
		const dir = mkdtempSync(join(tmpdir(), 'tsrx-vue-'));
		const real_path = join(dir, 'App.tsrx');
		const source = `export function App() @{
			const message = 'Hello world';
			<div>{message}</div>
		}`;
		writeFileSync(real_path, source);

		const result = await call_load(plugin, real_path + '.tsx');

		expect(result).toBeTruthy();
		expect(/** @type {any} */ (result).map.sources).toEqual([real_path]);
		expect(/** @type {any} */ (result).map.sourcesContent).toEqual([source]);
	});
});
