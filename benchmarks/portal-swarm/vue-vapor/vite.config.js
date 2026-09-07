import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vue Vapor (3.6) fixture — see the js-framework vue-vapor fixture for the
// full rationale: `vue` is aliased to ./src/vue-shim.js (the default bundler
// entry has no vapor runtime, and the prebuilt runtime-with-vapor browser prod
// dist crashes on mount in this beta), and mode:production + the NODE_ENV
// define make the dev server serve the production runtime the harness
// measures.
export default defineConfig({
	plugins: [vue()],
	mode: 'production',
	resolve: {
		alias: { vue: new URL('./src/vue-shim.js', import.meta.url).pathname },
	},
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5181, strictPort: true },
});
