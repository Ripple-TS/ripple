import { defineConfig } from 'tsdown';

export default defineConfig({
	inlineOnly: false,
	entry: 'src/index.ts',
	format: ['esm'],
	fixedExtension: false,
	dts: true,
	// Mark peer dependencies as external so they're not bundled
	external: ['eslint', '@typescript-eslint/parser', '@ripple-ts/eslint-parser', '@tsrx/core'],
	outputOptions: {
		legalComments: 'inline',
	},
	clean: true,
	noExternal: /.+/,
	platform: 'node',
	target: 'node22',
	outDir: 'dist',
});
