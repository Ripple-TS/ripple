import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5265, strictPort: true },
});
