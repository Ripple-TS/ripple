import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const isolationHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig({
	plugins: [vue()],
	mode: 'production',
	resolve: {
		alias: { vue: new URL('./src/vue-shim.js', import.meta.url).pathname },
	},
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5319, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
