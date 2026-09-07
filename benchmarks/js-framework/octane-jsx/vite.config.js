import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Identical to octane-tsrx's config except the dev port — the octane compiler
// lowers React-style `.tsx` (JSX) through the SAME full pipeline it uses for
// `.tsrx`, so the JSX twin needs no extra plugin or flag. Builds with the same
// esbuild minifier as every timed fixture, so output is comparable across renderers.
export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
		exclude: ['octane', 'octane/compiler'],
	},
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5177, strictPort: true },
});
