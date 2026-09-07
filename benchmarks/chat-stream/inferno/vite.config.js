import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

export default defineConfig({
	plugins: [infernoCompiler()],
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5323, strictPort: true },
});
