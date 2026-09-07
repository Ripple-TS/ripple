import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Same shape as benchmarks/js-framework/octane-tsrx (terser flags mirror the
// inferno-next bench so production output is comparable across renderers).
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
	server: { port: 5201, strictPort: true },
});
