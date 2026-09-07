import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5260, strictPort: true },
});
