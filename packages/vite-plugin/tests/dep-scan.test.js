import { describe, it, expect } from 'vitest';
import { ripple } from '@ripple-ts/vite-plugin';

/**
 * Resolve the dep-scan plugin the main ripple plugin registers under
 * `optimizeDeps.rolldownOptions`.
 *
 * `excludeRippleExternalModules` skips the node_modules scan for Ripple
 * packages, which is unrelated to dependency pre-bundling and only adds noise
 * here.
 *
 * @returns {Promise<{ optimizeDeps: any, scanPlugin: any }>}
 */
async function get_dep_scan() {
	const [plugin] = ripple({ excludeRippleExternalModules: true });
	const config = await /** @type {any} */ (plugin).config({}, { command: 'serve' });

	return {
		optimizeDeps: config.optimizeDeps,
		scanPlugin: config.optimizeDeps.rolldownOptions.plugins[0],
	};
}

describe('@ripple-ts/vite-plugin dep scan', () => {
	it('registers the .tsrx extension and the dep-scan plugin via the config hook', async () => {
		const { optimizeDeps, scanPlugin } = await get_dep_scan();

		expect(optimizeDeps.extensions).toEqual(['.tsrx']);
		expect(optimizeDeps.rolldownOptions.plugins).toHaveLength(1);
		expect(scanPlugin.name).toBe('vite-plugin-ripple:dep-scan');
		expect(scanPlugin.transform.filter.id.test('/app/src/App.tsrx')).toBe(true);
		expect(scanPlugin.transform.filter.id.test('/app/src/App.tsx')).toBe(false);
	});

	it('keeps the optimizeDeps exclude list the config hook already returned', async () => {
		const { optimizeDeps } = await get_dep_scan();

		expect(optimizeDeps.exclude).toEqual([]);
	});

	it('compiles .tsrx sources for the scanner as plain js', async () => {
		const { scanPlugin } = await get_dep_scan();
		const source = `import { thing } from 'some-dep';

export function App() @{
	<div>{thing}</div>
}`;

		const result = await scanPlugin.transform.handler(source, '/virtual/App.tsrx');

		// `compile` strips types and emits its runtime imports itself, so the
		// scan needs no TS-aware module type and no import prelude.
		expect(result.moduleType).toBe('js');
		expect(result.code).toContain(`from 'some-dep'`);
		expect(result.code).toContain(`from 'ripple/internal/client'`);
	});

	it('returns an empty module for a .tsrx file that fails to compile', async () => {
		const { scanPlugin } = await get_dep_scan();
		const source = `export function App() @{
	<div>{ <<< }</div>
}`;

		const result = await scanPlugin.transform.handler(source, '/virtual/App.tsrx');

		// Vite reacts to a scan failure by skipping pre-bundling for the whole
		// project, so one malformed file must not take the scan down with it.
		expect(result).toEqual({ code: '', moduleType: 'js' });
	});
});
