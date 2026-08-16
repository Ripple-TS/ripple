import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanEnvironmentFixture, scanFixture } from '@tsrx/core/test-harness/dep-scan';
import { tsrxReact } from '../src/index.js';

const fixtures_dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

const MAIN = `import { App } from './App.tsrx';

console.log(App);
`;

/** Imports a dependency that nothing else in the fixture reaches. */
const APP = `import { QueryClient } from '@tanstack/react-query';

const client = new QueryClient();

export function App() @{
	const label = String(client.isFetching());

	<div>{label}</div>
}
`;

/** Fails to parse, so `compile` throws. */
const MALFORMED = `export function Broken() @{
	<div>{ <<< }</div>
}`;

/**
 * @param {ReturnType<typeof tsrxReact>} plugin
 * @param {string} [name]
 * @param {import('vite').EnvironmentOptions} [options]
 */
function get_environment_config(plugin, name = 'client', options = {}) {
	const config = plugin.configEnvironment(name, options);
	if (!config) {
		throw new Error(`Missing dependency scan config for environment ${name}`);
	}

	return config;
}

/**
 * @param {ReturnType<typeof tsrxReact>} plugin
 */
function get_scan_plugin(plugin) {
	return get_environment_config(plugin).optimizeDeps.rolldownOptions.plugins[0];
}

describe('@tsrx/vite-plugin-react dep scan', () => {
	it('registers the .tsrx extension and dep-scan plugin for the client environment', () => {
		const plugin = tsrxReact();
		const config = get_environment_config(plugin);

		expect(config.optimizeDeps.extensions).toEqual(['.tsrx']);

		const scan_plugins = config.optimizeDeps.rolldownOptions.plugins;
		expect(scan_plugins).toHaveLength(1);
		expect(scan_plugins[0].name).toBe('@tsrx/vite-plugin-react:dep-scan');
		expect(scan_plugins[0].transform.filter.id.test('/app/src/App.tsrx')).toBe(true);
		expect(scan_plugins[0].transform.filter.id.test('/app/src/App.tsx')).toBe(false);
	});

	it('registers the dep-scan config for server environments with discovery enabled', () => {
		const plugin = tsrxReact();
		const config = get_environment_config(plugin, 'ssr', {
			optimizeDeps: { noDiscovery: false },
		});

		expect(config.optimizeDeps.extensions).toEqual(['.tsrx']);
		expect(config.optimizeDeps.rolldownOptions.plugins).toHaveLength(1);
	});

	it('does not register the dep-scan config for server environments without discovery', () => {
		const plugin = tsrxReact();

		expect(plugin.configEnvironment('ssr', {})).toBeUndefined();
		expect(
			plugin.configEnvironment('ssr', { optimizeDeps: { noDiscovery: true } }),
		).toBeUndefined();
	});

	it('points the scan jsx transform at the configured import source', () => {
		expect(get_environment_config(tsrxReact()).optimizeDeps.rolldownOptions.transform).toEqual({
			jsx: { importSource: 'react' },
		});

		// Left at react's default, the scan would emit an unresolvable
		// `react/jsx-dev-runtime` import into a project that has no react and
		// fail outright.
		expect(
			get_environment_config(tsrxReact({ jsxImportSource: 'preact' })).optimizeDeps.rolldownOptions
				.transform,
		).toEqual({ jsx: { importSource: 'preact' } });
	});

	it('compiles .tsrx sources for the scanner with the tsx module type', async () => {
		const scan_plugin = get_scan_plugin(tsrxReact());

		const result = await scan_plugin.transform.handler(APP, '/virtual/App.tsrx');

		expect(result.moduleType).toBe('tsx');
		expect(result.code).toContain(`from '@tanstack/react-query'`);
		expect(result.code).toContain('import "react/jsx-runtime"');
	});

	it('honors jsxImportSource for the scanner jsx runtime import', async () => {
		const scan_plugin = get_scan_plugin(tsrxReact({ jsxImportSource: 'preact' }));

		const result = await scan_plugin.transform.handler(
			`export function App() @{
	<div>{'hi'}</div>
}`,
			'/virtual/App.tsrx',
		);

		expect(result.code).toContain('import "preact/jsx-runtime"');
	});

	it('forwards direct runtime imports during dependency scanning', async () => {
		const scan_plugin = get_scan_plugin(tsrxReact({ runtimeImports: 'direct' }));
		const result = await scan_plugin.transform.handler(
			`export function App(props) @{
				<input {...props} />
			}`,
			'/virtual/App.tsrx',
		);

		expect(result.code).toContain("from '@tsrx/react-runtime/ref'");
	});

	it('does not inject the css virtual module import into scan output', async () => {
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

		const result = await scan_plugin.transform.handler(source, '/virtual/App.tsrx');

		expect(result.code).not.toContain('tsrx-css');
	});

	it('returns an empty module instead of throwing on a malformed .tsrx file', async () => {
		const scan_plugin = get_scan_plugin(tsrxReact());

		const result = await scan_plugin.transform.handler(MALFORMED, '/virtual/App.tsrx');

		expect(result).toEqual({ code: '', moduleType: 'tsx' });
	});

	it('discovers dependencies imported only from .tsrx files at scan time', async () => {
		const optimized = await scanFixture({
			root: join(fixtures_dir, 'scan'),
			files: { 'main.tsx': MAIN, 'App.tsrx': APP },
			plugins: [tsrxReact()],
		});

		expect(optimized).toContain('@tanstack/react-query');
	}, 60_000);

	it('discovers .tsrx dependencies in the initial scan for a named SSR environment', async () => {
		const discovered = await scanEnvironmentFixture({
			root: join(fixtures_dir, 'scan-ssr'),
			files: { 'main.tsx': MAIN, 'App.tsrx': APP },
			plugins: [tsrxReact()],
			name: 'ssr',
			environment: {
				optimizeDeps: {
					entries: ['main.tsx'],
					noDiscovery: false,
				},
			},
		});

		expect(discovered).toContain('@tanstack/react-query');
	}, 60_000);

	it('still pre-bundles the rest of the graph when a .tsrx file fails to compile', async () => {
		const optimized = await scanFixture({
			root: join(fixtures_dir, 'scan-error'),
			files: {
				'main.tsx': `import { App } from './App.tsrx';
import { Broken } from './Broken.tsrx';

console.log(App, Broken);
`,
				'App.tsrx': APP,
				'Broken.tsrx': MALFORMED,
			},
			plugins: [tsrxReact()],
		});

		expect(optimized).toContain('@tanstack/react-query');
	}, 60_000);
});
