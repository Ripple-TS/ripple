import { defineConfig } from 'vite';
import { rippleNew } from '@tsrx/ripple-new/vite';

export default defineConfig({
	plugins: [rippleNew()],

	server: {
		// 5173 is taken by playground/ripple — pick a sibling port so both
		// playgrounds can run in parallel for cross-renderer comparison.
		port: 5174,
		host: true,
		strictPort: false,
	},

	build: {
		// Mirror playground/ripple — keep template-clone output legible.
		minify: false,
		target: 'esnext',
	},

	optimizeDeps: {
		// Both packages are workspace:* and point `main` at raw TS sources
		// (see packages/ripple-new/package.json). Pre-bundling would snapshot
		// stale output and require `vite --force` on every workspace edit.
		exclude: ['ripple-new', '@tsrx/ripple-new'],
	},
});
