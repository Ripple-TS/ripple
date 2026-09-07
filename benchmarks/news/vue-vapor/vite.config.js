import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vue Vapor (3.6) fixture — two builds, two module graphs:
//
//  * CLIENT build: `vue` is aliased to ./src/vue-shim.js — vue 3.6's default
//    bundler entry does NOT include the vapor runtime, so the compiled
//    `<script setup vapor>` helpers (and entry-client's `createVaporSSRApp`)
//    only resolve against a vapor-inclusive build; the shim composes the
//    @vue/runtime-vapor + @vue/runtime-dom bundler entries (see its comment
//    for why not the prebuilt runtime-with-vapor browser dist).
//  * SSR build: NO alias — a vapor SFC compiles to the regular ssrRender
//    string codegen on the server (vapor has no server codegen in 3.6), so
//    the server bundle wants the real `vue` entry, and `vue/server-renderer`
//    must not be rewritten into the shim path.
export default defineConfig(({ isSsrBuild }) => ({
	plugins: [vue()],
	resolve: isSsrBuild
		? {}
		: { alias: { vue: new URL('./src/vue-shim.js', import.meta.url).pathname } },
	build: { target: 'esnext', minify: false },
	server: { port: 5222, strictPort: true },
}));
