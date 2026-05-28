/** @import {RipplePlugin} from '@ripple-ts/vite-plugin' */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ripple } from '@ripple-ts/vite-plugin';

/**
 * Pull the core ripple plugin out of the plugin array. The narrowed
 * `name: 'vite-plugin-ripple'` on {@link import('../types/index.js').RipplePlugin}
 * lets `find` produce a typed result with no cast.
 *
 * @returns {RipplePlugin}
 */
function get_ripple_plugin() {
	const [plugin] = ripple({ excludeRippleExternalModules: true });
	return plugin;
}

/**
 * @param {RipplePlugin} plugin
 * @param {string} root
 */
async function init_plugin(plugin, root) {
	const hook =
		typeof plugin.configResolved === 'function'
			? plugin.configResolved
			: plugin.configResolved?.handler;
	if (!hook) return;
	// Bind a stub `this` so we don't trip Vite's hook `this:` constraint.
	await hook.call(/** @type {any} */ ({}), /** @type {any} */ ({ root, command: 'serve' }));
}

/**
 * @param {RipplePlugin} plugin
 * @param {string} source
 * @param {string} id
 */
async function call_transform(plugin, source, id) {
	const transform = plugin.transform;
	if (!transform) throw new Error('plugin has no transform hook');
	const handler = typeof transform === 'function' ? transform : transform.handler;
	const ctx = /** @type {any} */ ({
		environment: { config: { consumer: 'client' } },
	});
	return handler.call(ctx, source, id, undefined);
}

describe('vite-plugin-ripple source maps', () => {
	it('returns a map that points back to the original .tsrx source', async () => {
		const plugin = get_ripple_plugin();
		const root = '/virtual-root';
		await init_plugin(plugin, root);

		const id = `${root}/App.tsrx`;
		const source = `export function App() { return <>
			let message = 'Hello world';
			<div>{message}</div>
		</>; }`;

		const result = await call_transform(plugin, source, id);

		expect(result).toBeTruthy();
		const map = /** @type {any} */ (result).map;
		// `@tsrx/ripple`'s esrap call uses `path.basename` for `sourceMapSource`,
		// so `sources` is the bare filename rather than the full id.
		expect(map.sources).toEqual([path.basename(id)]);
		expect(map.sourcesContent).toEqual([source]);
	});

	it('keeps the map valid when a <style> block triggers a virtual css import', async () => {
		const plugin = get_ripple_plugin();
		const root = '/virtual-root';
		await init_plugin(plugin, root);

		const id = `${root}/Styled.tsrx`;
		const source = `export function Styled() { return <>
			<div>{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
		</>; }`;

		const result = await call_transform(plugin, source, id);

		expect(result).toBeTruthy();
		const code = /** @type {any} */ (result).code;
		const map = /** @type {any} */ (result).map;
		// CSS import is appended (not prepended), so existing mappings stay
		// aligned and `sourcesContent` still carries the original source.
		expect(code).toContain('?ripple&type=style&lang.css');
		expect(map.sourcesContent).toEqual([source]);
	});
});
