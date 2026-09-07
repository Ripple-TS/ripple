import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Mirrors the js-framework bench's terser flags so build output is comparable
// byte-for-byte across renderers: aggressive multi-pass compress with
// reduce_vars off (preserves V8 hidden-class shape).
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
		// untimed build; normal timing bundles retain the production terser path.
		minify: process.env.MEMO_WALL_WORK === '1' ? false : 'terser',
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
	server: { port: 5206, strictPort: true },
});
