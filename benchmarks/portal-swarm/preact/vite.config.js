import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [preact()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5268, strictPort: true },
});
