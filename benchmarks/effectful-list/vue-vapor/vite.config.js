import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vue Vapor (3.6) fixture. Two deliberate choices, same rationale as the solid
// fixture (measure the production runtime, not dev-mode guards):
//
//  1. `vue` is aliased to ./src/vue-shim.js — vue 3.6's default bundler entry
//     (vue.runtime.esm-bundler.js) does NOT include the vapor runtime, so the
//     compiled `<script setup vapor>` helpers (and main.js's `createVaporApp`)
//     only resolve against a vapor-inclusive build; the shim composes the
//     @vue/runtime-vapor + @vue/runtime-dom bundler entries (see its comment
//     for why not the prebuilt runtime-with-vapor browser dist).
//  2. mode:production + the NODE_ENV define so the bundler entries' dev guards
//     compile out and the dev server serves production-condition deps.
//
// The harness drives the dev server, so what matters is that Vue's production
// vapor runtime (per-binding renderEffects + keyed v-for reconciler) is what
// gets measured.
export default defineConfig({
	plugins: [vue()],
	mode: 'production',
	resolve: {
		alias: { vue: new URL('./src/vue-shim.js', import.meta.url).pathname },
	},
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5221, strictPort: true },
});
