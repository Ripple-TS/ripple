import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte()],
	mode: 'production',
	build: { target: 'esnext', minify: false },
	server: { port: 5275, strictPort: true },
});
