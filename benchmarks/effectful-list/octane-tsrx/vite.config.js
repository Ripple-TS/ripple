import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Same shape as benchmarks/js-framework/octane-tsrx (esbuild-minified like
// every timed fixture, so production output is comparable across renderers).
export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
		// Both workspace packages export raw .ts source; pre-bundling would
		// snapshot stale output for every edit.
		exclude: ['octane', 'octane/compiler'],
	},
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5201, strictPort: true },
});
