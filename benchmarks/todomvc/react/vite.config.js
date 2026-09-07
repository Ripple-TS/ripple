import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

export default defineConfig({
	plugins: [react(), reactCompiler()],
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5241, strictPort: true },
});
