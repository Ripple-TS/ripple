import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5278, strictPort: true },
});
