import { defineConfig } from 'tsdown';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const ROOT_EXTERNAL_PACKAGES = [
	'@tsrx/react',
	'@tsrx/ripple',
	'@tsrx/core',
	'typescript',
	'vscode-uri',
	// need this for monkey patching
	'volar-service-typescript',
	/* also definitely need it for monkey patching */
	/^volar-service-typescript(?:\/.*)?$/,
	/* dynamic require()s of internal files — can't be bundled */
	'volar-service-css',
	/^volar-service-css(?:\/.*)?$/,
];

export default defineConfig({
	inlineOnly: false,
	entry: ['src/server.js', 'src/language-server.js'],
	format: ['cjs'],
	outExtensions: () => ({ js: '.js' }),
	platform: 'node',
	target: 'node20',
	outDir: 'dist',
	sourcemap: isDev,
	outputOptions: {
		legalComments: 'inline',
		minify: false,
	},
	external: [...ROOT_EXTERNAL_PACKAGES],
	clean: true,
	noExternal: /.+/,
	hooks: {
		'build:done': () => {
			fs.writeFileSync(path.join(dirname, 'dist', 'package.json'), '{"type":"commonjs"}\n');
		},
	},
});
