import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Same setup as the js-framework vue-vapor fixture: the vapor runtime only
// resolves against a vapor-inclusive build (see ./src/vue-shim.js), and
// mode:production compiles out the dev guards so the dev server serves the
// production vapor runtime.
export default defineConfig({
	plugins: [vue()],
	mode: 'production',
	resolve: {
		alias: { vue: new URL('./src/vue-shim.js', import.meta.url).pathname },
	},
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5254, strictPort: true },
});
