import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5262, strictPort: true },
});
