import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
	build: { target: 'esnext', minify: false },
	server: { port: 5270, strictPort: true },
});
