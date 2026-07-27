import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizeDeps, resolveConfig } from 'vite';
import { tsrxReact } from '../src/index.js';

const fixtures_dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fixture_root = join(fixtures_dir, 'scan');
const scan_error_root = join(fixtures_dir, 'scan-error');

/** Source that fails to parse, so `compile` throws. */
const MALFORMED_SOURCE = `export function Broken() @{
	<div>{ <<< }</div>
}`;

/**
 * The scan-error fixture is written at test time rather than committed. It
 * hinges on a `.tsrx` file that cannot compile, and such a file in the tree is
 * reported as a fatal error by the language server and refused by prettier —
 * neither of which a TS directive can suppress, since the file never reaches
 * TypeScript. Its valid siblings are generated alongside it so the fixture
 * stays in one piece rather than half on disk and half here.
 */
const SCAN_ERROR_FILES = {
	'index.html': `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/main.tsx"></script>
	</body>
</html>
`,
	'main.tsx': `import { Broken } from './Broken.tsrx';
import { Good } from './Good.tsrx';

console.log(Broken, Good);
`,
	'Broken.tsrx': MALFORMED_SOURCE,
	// The import here is what the scan has to keep finding despite its
	// malformed sibling.
	'Good.tsrx': `import { QueryClient } from '@tanstack/react-query';

const client = new QueryClient();

export function Good() @{
	const label = String(client.isFetching());

	<div>{label}</div>
}
`,
};

/**
 * @param {ReturnType<typeof tsrxReact>} plugin
 */
function get_scan_plugin(plugin) {
	return plugin.config().optimizeDeps.rolldownOptions.plugins[0];
}

/**
 * Materialize {@link SCAN_ERROR_FILES} under `tests/fixtures/scan-error`, which
 * has to sit inside the package so imports resolve against its `node_modules`.
 *
 * @returns {void}
 */
function write_scan_error_fixture() {
	mkdirSync(scan_error_root, { recursive: true });

	for (const [name, source] of Object.entries(SCAN_ERROR_FILES)) {
		writeFileSync(join(scan_error_root, name), source);
	}
}

/**
 * Run vite's dep optimizer over a fixture the way `vite dev` does at startup,
 * into a throwaway cache dir so runs stay independent.
 *
 * @param {string} root
 * @returns {Promise<string[]>} the pre-bundled dependency ids
 */
async function scan_fixture(root) {
	const cache_dir = mkdtempSync(join(tmpdir(), 'tsrx-react-scan-'));

	try {
		const config = await resolveConfig(
			{
				root,
				configFile: false,
				cacheDir: cache_dir,
				logLevel: 'silent',
				plugins: [tsrxReact()],
			},
			'serve',
		);

		const metadata = await optimizeDeps(config, true);

		return Object.keys(metadata.optimized);
	} finally {
		rmSync(cache_dir, { recursive: true, force: true });
	}
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

	it('returns an empty module instead of throwing on a malformed .tsrx file', () => {
		const scan_plugin = get_scan_plugin(tsrxReact());
		const source = `export function App() @{
	<div>{ <<< }</div>
}`;

		const result = scan_plugin.transform.handler(source, '/virtual/App.tsrx');

		expect(result).toEqual({ code: '', moduleType: 'tsx' });
	});

	it('discovers dependencies imported only from .tsrx files at scan time', async () => {
		const optimized = await scan_fixture(fixture_root);

		expect(optimized).toContain('@tanstack/react-query');
	}, 60_000);

	it('still pre-bundles the rest of the graph when a .tsrx file fails to compile', async () => {
		write_scan_error_fixture();

		try {
			const optimized = await scan_fixture(scan_error_root);

			expect(optimized).toContain('@tanstack/react-query');
		} finally {
			rmSync(scan_error_root, { recursive: true, force: true });
		}
	}, 60_000);
});
