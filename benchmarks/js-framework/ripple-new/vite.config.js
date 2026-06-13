import { defineConfig } from 'vite';
import { rippleNew } from '@tsrx/ripple-new/vite';

// Mirrors the inferno-next bench's terser flags so build output is comparable
// byte-for-byte across renderers: aggressive multi-pass compress with
// reduce_vars off (preserves V8 hidden-class shape — see the
// feedback_inferno_next_perf memory).
export default defineConfig({
	plugins: [rippleNew()],
	optimizeDeps: {
		// Both workspace packages export raw .ts source; pre-bundling would
		// snapshot stale output for every edit.
		exclude: ['ripple-new', '@tsrx/ripple-new'],
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
	server: { port: 5176, strictPort: true },
});
