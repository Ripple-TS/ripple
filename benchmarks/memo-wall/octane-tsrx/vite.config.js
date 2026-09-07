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
		// Precise-call-coverage gates need stable function names. This is a separate,
		// untimed build; normal timing bundles keep the esbuild-minified output.
		minify: process.env.MEMO_WALL_WORK === '1' ? false : 'esbuild',
	},
	server: { port: 5206, strictPort: true },
});
