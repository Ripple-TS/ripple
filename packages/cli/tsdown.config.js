import { defineConfig } from 'tsdown';

export default defineConfig({
	inlineOnly: false,
	entry: 'src/index.js',
	outputOptions: {
		legalComments: 'inline',
		minify: true,
	},
	clean: true,
	format: ['esm'],
	fixedExtension: false,
	platform: 'node',
	target: 'node20',
	outDir: 'dist',
	noExternal: /.+/,
});
