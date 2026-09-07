import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

const isolationHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig({
	plugins: [infernoCompiler()],
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			compress: { passes: 2, toplevel: true },
			mangle: { toplevel: true },
		},
	},
	server: { port: 5325, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
