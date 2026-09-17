import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte()],
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5305, strictPort: true },
});
