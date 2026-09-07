import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5261, strictPort: true },
});
