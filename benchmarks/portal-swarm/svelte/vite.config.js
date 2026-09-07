import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte()],
	mode: 'production',
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5279, strictPort: true },
});
