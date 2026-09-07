import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: { target: 'esnext' },
	server: { port: 5280, strictPort: true },
});
