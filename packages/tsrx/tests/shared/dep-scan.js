import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { optimizeDeps, resolveConfig } from 'vite';

const DEFAULT_INDEX_HTML = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/main.tsx"></script>
	</body>
</html>
`;

/**
 * Run vite's dependency optimizer over a generated fixture the way `vite dev`
 * does at startup, and report what it pre-bundled.
 *
 * The fixture is written on the fly and removed afterwards rather than
 * committed. Scan fixtures tend to include sources that are deliberately
 * broken, and a malformed `.tsrx` file in the tree is reported as a fatal error
 * by the language server and refused by prettier. `root` still has to sit
 * inside the package under test so bare imports resolve against its
 * `node_modules`.
 *
 * An `index.html` entry is generated pointing at `/main.tsx` unless `files`
 * supplies its own.
 *
 * @param {{
 *   root: string,
 *   files: Record<string, string>,
 *   plugins: import('vite').PluginOption[],
 * }} options
 * @returns {Promise<string[]>} the pre-bundled dependency ids
 */
export async function scanFixture({ root, files, plugins }) {
	const cache_dir = mkdtempSync(join(tmpdir(), 'tsrx-dep-scan-'));

	mkdirSync(root, { recursive: true });

	const sources = 'index.html' in files ? files : { 'index.html': DEFAULT_INDEX_HTML, ...files };
	for (const [name, source] of Object.entries(sources)) {
		writeFileSync(join(root, name), source);
	}

	try {
		const config = await resolveConfig(
			{
				root,
				configFile: false,
				cacheDir: cache_dir,
				logLevel: 'silent',
				plugins,
			},
			'serve',
		);

		const metadata = await optimizeDeps(config, true);

		return Object.keys(metadata.optimized);
	} finally {
		rmSync(cache_dir, { recursive: true, force: true });
		rmSync(root, { recursive: true, force: true });
	}
}
