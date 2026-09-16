import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	publicDir: '../shared/public',
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5297, strictPort: true },
});
