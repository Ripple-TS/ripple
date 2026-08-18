import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFixture } from '@tsrx/core/test-harness/dep-scan';
import { tsrxSolid } from '../src/index.js';

const fixtures_dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

const MAIN = `import { App } from './App.tsrx';

console.log(App);
`;

/** Imports a dependency that nothing else in the fixture reaches. */
const APP = `import { createSignal } from 'solid-js';

export function App() @{
	const [count] = createSignal(0);

	<div>{String(count())}</div>
}
`;

/**
 * @param {import('../types/index.js').TsrxSolidOptions} [options]
 */
function get_scan_plugin(options) {
	const config = /** @type {any} */ (tsrxSolid(options)).config();

	return config.optimizeDeps.rolldownOptions.plugins[0];
}

describe('@tsrx/vite-plugin-solid dep scan', () => {
	it('registers the dep-scan plugin via the config hook', () => {
		const config = /** @type {any} */ (tsrxSolid()).config();
		const scan_plugins = config.optimizeDeps.rolldownOptions.plugins;

		expect(scan_plugins).toHaveLength(1);
		expect(scan_plugins[0].name).toBe('@tsrx/vite-plugin-solid:dep-scan');
	});

	it('leaves jsx untransformed during the scan', () => {
		// Rolldown's jsx transform defaults to react's automatic runtime, which
		// would put an unresolvable `react/jsx-dev-runtime` import into a Solid
		// project and fail the scan outright.
		const config = /** @type {any} */ (tsrxSolid()).config();

		expect(config.optimizeDeps.rolldownOptions.transform).toEqual({ jsx: 'preserve' });
	});

	describe('virtual id handling', () => {
		/** @type {string} */
		let dir;

		beforeEach(() => {
			dir = mkdtempSync(join(tmpdir(), 'tsrx-solid-scan-'));
			writeFileSync(join(dir, 'App.tsrx'), APP);
		});

		afterEach(() => {
			rmSync(dir, { recursive: true, force: true });
		});

		it('compiles the virtual .tsrx.tsx id the scanner resolves', async () => {
			const result = await get_scan_plugin().load(join(dir, 'App.tsrx.tsx'));

			expect(result.moduleType).toBe('tsx');
			expect(result.code).toContain(`from 'solid-js'`);
		});

		it('forwards direct runtime imports during dependency scanning', async () => {
			writeFileSync(
				join(dir, 'App.tsrx'),
				`export function App(props) @{
					<input {...props} />
				}`,
			);

			const result = await get_scan_plugin({ runtimeImports: 'direct' }).load(
				join(dir, 'App.tsrx.tsx'),
			);

			expect(result.code).toContain("from '@tsrx/solid-runtime/ref'");
		});

		it('ignores ids that are not the virtual tsrx form', async () => {
			expect(await get_scan_plugin().load(join(dir, 'main.tsx'))).toBeNull();
		});
	});

	it('discovers dependencies imported only from .tsrx files at scan time', async () => {
		const optimized = await scanFixture({
			root: join(fixtures_dir, 'scan'),
			files: { 'main.tsx': MAIN, 'App.tsrx': APP },
			plugins: [tsrxSolid()],
		});

		expect(optimized).toContain('solid-js');
	}, 60_000);
});
