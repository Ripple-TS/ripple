import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFixture } from '@tsrx/core/test-harness/dep-scan';
import { tsrxVue } from '../src/index.js';

const fixtures_dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

const MAIN = `import { App } from './App.tsrx';

console.log(App);
`;

/** Imports a dependency that nothing else in the fixture reaches. */
const APP = `import { shallowRef } from 'vue';

export function App() @{
	const count = shallowRef(0);

	<div>{String(count.value)}</div>
}
`;

/**
 * `tsrxVue` returns a plugin array; the tsrx plugin itself owns the config
 * hook that registers the dep-scan plugin.
 */
/** @param {import('../types/index.js').TsrxVueOptions} [options] */
function get_config(options) {
	const plugin = tsrxVue(options).find(
		(p) => /** @type {any} */ (p).name === '@tsrx/vite-plugin-vue',
	);

	return /** @type {any} */ (plugin).config();
}

describe('@tsrx/vite-plugin-vue dep scan', () => {
	it('registers the dep-scan plugin via the config hook', () => {
		const scan_plugins = get_config().optimizeDeps.rolldownOptions.plugins;

		expect(scan_plugins).toHaveLength(1);
		expect(scan_plugins[0].name).toBe('@tsrx/vite-plugin-vue:dep-scan');
	});

	it('leaves jsx untransformed during the scan', () => {
		// Rolldown's jsx transform defaults to react's automatic runtime, which
		// would put an unresolvable `react/jsx-dev-runtime` import into a Vue
		// project and fail the scan outright.
		expect(get_config().optimizeDeps.rolldownOptions.transform).toEqual({ jsx: 'preserve' });
	});

	describe('virtual id handling', () => {
		/** @type {string} */
		let dir;

		beforeEach(() => {
			dir = mkdtempSync(join(tmpdir(), 'tsrx-vue-scan-'));
			writeFileSync(join(dir, 'App.tsrx'), APP);
		});

		afterEach(() => {
			rmSync(dir, { recursive: true, force: true });
		});

		it('compiles the virtual .tsrx.tsx id the scanner resolves', async () => {
			const scan_plugin = get_config().optimizeDeps.rolldownOptions.plugins[0];

			const result = await scan_plugin.load(join(dir, 'App.tsrx.tsx'));

			expect(result.moduleType).toBe('tsx');
			expect(result.code).toContain(`from 'vue'`);
		});

		it('forwards direct runtime imports during dependency scanning', async () => {
			writeFileSync(
				join(dir, 'App.tsrx'),
				`export function App(props) @{
					<input {...props} />
				}`,
			);

			const scan_plugin = get_config({ runtimeImports: 'direct' }).optimizeDeps.rolldownOptions
				.plugins[0];
			const result = await scan_plugin.load(join(dir, 'App.tsrx.tsx'));

			expect(result.code).toContain("from '@tsrx/vue-runtime/ref'");
		});

		it('ignores ids that are not the virtual tsrx form', async () => {
			const scan_plugin = get_config().optimizeDeps.rolldownOptions.plugins[0];

			expect(await scan_plugin.load(join(dir, 'main.tsx'))).toBeNull();
		});
	});

	it('discovers dependencies imported only from .tsrx files at scan time', async () => {
		const optimized = await scanFixture({
			root: join(fixtures_dir, 'scan'),
			files: { 'main.tsx': MAIN, 'App.tsrx': APP },
			plugins: [tsrxVue()],
		});

		expect(optimized).toContain('vue');
	}, 60_000);
});
