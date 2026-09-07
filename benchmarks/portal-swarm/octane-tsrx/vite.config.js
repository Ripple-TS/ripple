import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Mirrors the js-framework bench's terser flags so build output is comparable
// across renderers: aggressive multi-pass compress with reduce_vars off
// (preserves V8 hidden-class shape — see the js-framework octane-tsrx config).
export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
		// Both workspace packages export raw .ts source; pre-bundling would
		// snapshot stale output for every edit.
		exclude: ['octane', 'octane/compiler'],
	},
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			compress: {
				passes: 5,
				reduce_vars: false,
				inline: 0,
				booleans: false,
				comparisons: false,
				toplevel: true,
			},
			mangle: { toplevel: true },
		},
	},
	server: { port: 5210, strictPort: true },
});
