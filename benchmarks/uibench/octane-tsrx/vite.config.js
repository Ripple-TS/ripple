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
		minify: 'esbuild',
	},
	server: { port: 5315, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
