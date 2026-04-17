import { defineConfig } from 'tsdown';

export default defineConfig({
	inlineOnly: false,
	entry: ['src/index.js'],
	format: ['cjs'],
	fixedExtension: false,
	platform: 'node',
	target: 'node20',
	outDir: 'dist',
	outputOptions: {
		legalComments: 'inline',
		minify: true,
	},
	external: ['@tsrx/ripple', '@tsrx/core', 'typescript'],
	clean: true,
	noExternal: /.+/,
});
