import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: { target: 'esnext', minify: 'esbuild' },
	server: { port: 5281, strictPort: true },
});
