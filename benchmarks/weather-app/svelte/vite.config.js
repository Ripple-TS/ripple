import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	publicDir: '../shared/public',
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5296, strictPort: true },
});
