import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Identical to octane-tsrx's config except the dev port — the octane compiler
// lowers React-style `.tsx` (JSX) through the same pipeline it uses for `.tsrx`.
export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
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
	server: { port: 5202, strictPort: true },
});
