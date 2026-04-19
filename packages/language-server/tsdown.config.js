import { defineConfig } from 'tsdown';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
	inlineOnly: false,
	entry: ['src/server.js', 'bin/language-server.js'],
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
	external: ['@tsrx/react', '@tsrx/ripple', '@tsrx/core', 'typescript', 'vscode-uri'],
	clean: true,
	noExternal: /.+/,
	hooks: {
		'build:done': () => {
			fs.writeFileSync(path.join(__dirname, 'dist', 'package.json'), '{"type":"commonjs"}\n');
		},
	},
});
