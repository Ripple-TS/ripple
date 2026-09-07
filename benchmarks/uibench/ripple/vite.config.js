import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

const isolationHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig({
	plugins: [ripple({ excludeRippleExternalModules: true })],
	optimizeDeps: { exclude: ['ripple'] },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			compress: { passes: 2, toplevel: true },
			mangle: { toplevel: true },
		},
	},
	server: { port: 5322, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
