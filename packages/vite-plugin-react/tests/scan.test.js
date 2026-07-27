import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizeDeps, resolveConfig } from 'vite';
import { tsrxReact } from '../src/index.js';

const fixture_root = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'scan');

/**
 * @param {ReturnType<typeof tsrxReact>} plugin
 */
function get_scan_plugin(plugin) {
	return plugin.config().optimizeDeps.rolldownOptions.plugins[0];
}

describe('@tsrx/vite-plugin-react dep scan', () => {
	it('registers the .tsrx extension and the dep-scan plugin via the config hook', () => {
		const plugin = tsrxReact();
		const config = plugin.config();

		expect(config.optimizeDeps.extensions).toEqual(['.tsrx']);

		const scan_plugins = config.optimizeDeps.rolldownOptions.plugins;
		expect(scan_plugins).toHaveLength(1);
		expect(scan_plugins[0].name).toBe('@tsrx/vite-plugin-react:dep-scan');
		expect(scan_plugins[0].transform.filter.id.test('/app/src/App.tsrx')).toBe(true);
		expect(scan_plugins[0].transform.filter.id.test('/app/src/App.tsx')).toBe(false);
	});

	it('compiles .tsrx sources for the scanner with the tsx module type', () => {
		const scan_plugin = get_scan_plugin(tsrxReact());
		const source = `import { QueryClient } from '@tanstack/react-query';
const client = new QueryClient();
export function App() @{
	<div>{String(client.isFetching())}</div>
}`;

		const result = scan_plugin.transform.handler(source, '/virtual/App.tsrx');

		expect(result.moduleType).toBe('tsx');
		expect(result.code).toContain(`from '@tanstack/react-query'`);
		expect(result.code).toContain('import "react/jsx-runtime"');
	});

	it('honors jsxImportSource for the scanner jsx runtime import', () => {
		const scan_plugin = get_scan_plugin(tsrxReact({ jsxImportSource: 'preact' }));

		const result = scan_plugin.transform.handler(
			`export function App() @{
	<div>{'hi'}</div>
}`,
			'/virtual/App.tsrx',
		);

		expect(result.code).toContain('import "preact/jsx-runtime"');
	});

	it('does not inject the css virtual module import into scan output', () => {
		const scan_plugin = get_scan_plugin(tsrxReact());
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

		const result = scan_plugin.transform.handler(source, '/virtual/App.tsrx');

		expect(result.code).not.toContain('tsrx-css');
	});

	it('discovers dependencies imported only from .tsrx files at scan time', async () => {
		const cache_dir = mkdtempSync(join(tmpdir(), 'tsrx-react-scan-'));

		try {
			const config = await resolveConfig(
				{
					root: fixture_root,
					configFile: false,
					cacheDir: cache_dir,
					logLevel: 'silent',
					plugins: [tsrxReact()],
				},
				'serve',
			);

			const metadata = await optimizeDeps(config, true);

			expect(Object.keys(metadata.optimized)).toContain('@tanstack/react-query');
		} finally {
			rmSync(cache_dir, { recursive: true, force: true });
		}
	}, 60_000);
});
