import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

const isolationHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig({
	plugins: [react(), reactCompiler()],
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			compress: { passes: 2, toplevel: true },
			mangle: { toplevel: true },
		},
	},
	server: { port: 5316, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
