import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Builds with Vite's default esbuild minifier, like every timed fixture, so
// output is comparable across renderers.
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
	server: { port: 5210, strictPort: true },
});
