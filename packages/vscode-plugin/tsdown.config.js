import { defineConfig } from 'tsdown';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllExternalPackages } from '../../scripts/collect-external-deps.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Root packages to treat as external (their full dependency trees will be copied)
const ROOT_EXTERNAL_PACKAGES = [
	'typescript',
	'@tsrx/react',
	'@tsrx/ripple',
	'@tsrx/core',
	'volar-service-css',
	'vscode-uri',
	'@tsrx/typescript-plugin',
	// this definitely has to be external as we monkey patch it at runtime
	'volar-service-typescript',
];
const REGEX_EXTERNAL_PACKAGES = [
	// also definitely need it for monkey patching
	/^volar-service-typescript(?:\/.*)?$/,
];
// Always external (bundled by VS Code or handled separately)
const ALWAYS_EXTERNAL = ['vscode', '@tsrx/typescript-plugin'];
const OUT_DIR = 'dist';

// Compute all external packages by collecting dependency trees
const computed = getAllExternalPackages(ROOT_EXTERNAL_PACKAGES);
const allExternalPackages = [...ALWAYS_EXTERNAL, ...computed, ...REGEX_EXTERNAL_PACKAGES];

console.log(`ℹ️  Found ${computed.length} packages to mark as external`);

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
	inlineOnly: false,
	entry: ['src/extension.js', 'src/server.js'],
	outDir: OUT_DIR,
	sourcemap: isDev,
	outputOptions: {
		legalComments: 'inline',
		minify: false,
	},
	clean: true,
	format: ['cjs'],
	outExtensions: () => ({ js: '.js' }),
	platform: 'node',
	target: 'node22',
	external: [...allExternalPackages],
	noExternal: /.+/,
	hooks: {
		'build:done': () => {
			// Write a CJS package.json so Node.js treats dist/*.js as CommonJS
			fs.writeFileSync(path.join(dirname, OUT_DIR, 'package.json'), '{"type":"commonjs"}\n');

			const scriptPath = path.join(dirname, '../../scripts/copy-external-deps.js');
			const distPath = path.join(dirname, OUT_DIR);

			execSync(`node "${scriptPath}" "${distPath}" ${ROOT_EXTERNAL_PACKAGES.join(' ')}`, {
				stdio: 'inherit',
			});

			// Remove unnecessary files from typescript-plugin (only dist/ and package.json needed)
			const tsPluginPath = path.join(
				dirname,
				OUT_DIR,
				'node_modules',
				'@tsrx',
				'typescript-plugin',
			);
			for (const entry of fs.readdirSync(tsPluginPath)) {
				if (entry !== 'dist' && entry !== 'package.json') {
					execSync(`rm -rf "${path.join(tsPluginPath, entry)}"`, { stdio: 'inherit' });
				}
			}
		},
	},
});
