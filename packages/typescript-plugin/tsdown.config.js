const { defineConfig } = require('tsdown');

module.exports = defineConfig({
	inlineOnly: false,
	entry: ['src/index.js'],
	format: ['cjs'],
	platform: 'node',
	target: 'node20',
	outDir: 'dist',
	outputOptions: {
		legalComments: 'inline',
		minify: true,
	},
	external: ['ripple', 'typescript'],
	clean: true,
	noExternal: /.+/,
});
