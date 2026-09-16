import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
	publicDir: '../shared/public',
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5294, strictPort: true },
});
