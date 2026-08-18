import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFixture } from '@tsrx/core/test-harness/dep-scan';
import { tsrxPreact } from '../src/index.js';

const fixtures_dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

const MAIN = `import { App } from './App.tsrx';

console.log(App);
`;

/** Imports a dependency that nothing else in the fixture reaches. */
const APP = `import { createElement } from 'preact';

export function App() @{
	const label = String(typeof createElement);

	<div>{label}</div>
}
`;

/**
 * @param {ReturnType<typeof tsrxPreact>} plugin
 */
function get_scan_plugin(plugin) {
	return plugin.config().optimizeDeps.rolldownOptions.plugins[0];
}

describe('@tsrx/vite-plugin-preact dep scan', () => {
	it('registers the .tsrx extension and the dep-scan plugin via the config hook', () => {
		const config = tsrxPreact().config();

		expect(config.optimizeDeps.extensions).toEqual(['.tsrx']);

		const scan_plugins = config.optimizeDeps.rolldownOptions.plugins;
		expect(scan_plugins).toHaveLength(1);
		expect(scan_plugins[0].name).toBe('@tsrx/vite-plugin-preact:dep-scan');
		expect(scan_plugins[0].transform.filter.id.test('/app/src/App.tsrx')).toBe(true);
		expect(scan_plugins[0].transform.filter.id.test('/app/src/App.tsx')).toBe(false);
	});

	it('points the scan jsx transform at the configured import source', () => {
		// Left at rolldown's react default, the scan emits an unresolvable
		// `react/jsx-dev-runtime` import and fails outright — a preact project
		// has no react to resolve it against.
		expect(tsrxPreact().config().optimizeDeps.rolldownOptions.transform).toEqual({
			jsx: { importSource: 'preact' },
		});
		expect(
			tsrxPreact({ jsxImportSource: 'react' }).config().optimizeDeps.rolldownOptions.transform,
		).toEqual({ jsx: { importSource: 'react' } });
	});

	it('compiles .tsrx sources for the scanner with the tsx module type', async () => {
		const scan_plugin = get_scan_plugin(tsrxPreact());

		const result = await scan_plugin.transform.handler(APP, '/virtual/App.tsrx');

		expect(result.moduleType).toBe('tsx');
		expect(result.code).toContain(`from 'preact'`);
		expect(result.code).toContain('import "preact/jsx-runtime"');
	});

	it('honors jsxImportSource for the scanner jsx runtime import', async () => {
		const scan_plugin = get_scan_plugin(tsrxPreact({ jsxImportSource: 'react' }));

		const result = await scan_plugin.transform.handler(
			`export function App() @{
	<div>{'hi'}</div>
}`,
			'/virtual/App.tsrx',
		);

		expect(result.code).toContain('import "react/jsx-runtime"');
	});

	it('forwards direct runtime imports during dependency scanning', async () => {
		const scan_plugin = get_scan_plugin(tsrxPreact({ runtimeImports: 'direct' }));

		const result = await scan_plugin.transform.handler(
			`export function App(props) @{
				<input {...props} />
			}`,
			'/virtual/App.tsrx',
		);

		expect(result.code).toContain("from '@tsrx/preact-runtime/ref'");
	});

	it('does not inject the css virtual module import into scan output', async () => {
		const scan_plugin = get_scan_plugin(tsrxPreact());
		const source = `export function App() @{
	<>
	<div className="div">{'Hello world'}</div>

	<style>
		.div {
			color: red;
		}
	</style>
	</>
}`;

		const result = await scan_plugin.transform.handler(source, '/virtual/App.tsrx');

		expect(result.code).not.toContain('tsrx-css');
	});

	it('discovers dependencies imported only from .tsrx files at scan time', async () => {
		const optimized = await scanFixture({
			root: join(fixtures_dir, 'scan'),
			files: { 'main.tsx': MAIN, 'App.tsrx': APP },
			plugins: [tsrxPreact()],
		});

		expect(optimized).toContain('preact');
	}, 60_000);
});
