import { defineConfig } from 'tsdown';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
	inlineOnly: false,
	entry: ['src/index.js', 'src/tsc.js'],
	format: ['cjs'],
	outExtensions: () => ({ js: '.js' }),
	platform: 'node',
	target: 'node22',
	outDir: 'dist',
	sourcemap: isDev,
	outputOptions: {
		legalComments: 'inline',
		minify: true,
	},
	external: ['@tsrx/react', '@tsrx/ripple', '@tsrx/core', 'typescript'],
	clean: true,
	noExternal: /.+/,
	hooks: {
		'build:done': () => {
			fs.writeFileSync(path.join(dirname, 'dist', 'package.json'), '{"type":"commonjs"}\n');
		},
	},
});
