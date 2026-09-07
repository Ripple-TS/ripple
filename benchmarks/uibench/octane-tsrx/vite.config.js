import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

const isolationHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
		exclude: ['octane', 'octane/compiler'],
	},
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			compress: { passes: 5, reduce_vars: false, inline: 0, toplevel: true },
			mangle: { toplevel: true },
		},
	},
	server: { port: 5315, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
