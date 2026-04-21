import { describe, expect, it } from 'vitest';
import { tsrxSolid } from '../src/index.js';

/**
 * Minimal `this` stub for Vite plugin hooks that only need `this.resolve`
 * during the tests — we simulate a successful resolve so the plugin takes
 * the "rewrite to virtual id" path.
 *
 * @param {string} source
 * @returns {Promise<{ id: string } | null>}
 */
async function fake_plugin_resolve(source) {
	return { id: source };
}

/**
 * @param {import('vite').Plugin} plugin
 * @param {string} source
 */
function call_resolve_id(plugin, source) {
	const hook =
		typeof plugin.resolveId === 'function' ? plugin.resolveId : plugin.resolveId?.handler;
	if (!hook) throw new Error('plugin has no resolveId hook');
	return hook.call({ resolve: fake_plugin_resolve }, source, undefined, {});
}

describe('@tsrx/vite-plugin-solid routing', () => {
	describe('default include', () => {
		const plugin = tsrxSolid();

		it('rewrites `.tsrx` imports to a virtual `.tsx` id', async () => {
			const result = await call_resolve_id(plugin, '/abs/path/App.tsrx');
			expect(result).toEqual({ id: '/abs/path/App.tsrx.tsx' });
		});

		it('leaves unrelated extensions alone', async () => {
			expect(await call_resolve_id(plugin, '/abs/path/App.ts')).toBeNull();
			expect(await call_resolve_id(plugin, '/abs/path/App.tsx')).toBeNull();
			expect(await call_resolve_id(plugin, 'solid-js')).toBeNull();
		});
	});

	describe('custom include regex', () => {
		it('respects the user-supplied pattern for additional extensions', async () => {
			const plugin = tsrxSolid({ include: /\.(tsrx|foo)$/ });
			const tsrx = await call_resolve_id(plugin, '/abs/path/App.tsrx');
			const foo = await call_resolve_id(plugin, '/abs/path/Other.foo');
			expect(tsrx).toEqual({ id: '/abs/path/App.tsrx.tsx' });
			expect(foo).toEqual({ id: '/abs/path/Other.foo.tsx' });
		});

		it('narrows routing when the pattern is stricter than the default', async () => {
			// User opts to only process `.tsrx` files under `src/`.
			const plugin = tsrxSolid({ include: /\/src\/.*\.tsrx$/ });
			const matched = await call_resolve_id(plugin, '/proj/src/App.tsrx');
			const skipped = await call_resolve_id(plugin, '/proj/tests/App.tsrx');
			expect(matched).toEqual({ id: '/proj/src/App.tsrx.tsx' });
			expect(skipped).toBeNull();
		});
	});
});
