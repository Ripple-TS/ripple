import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Solid 2.0-beta's dev bundle (@solidjs/web/dist/dev.js) crashes with
// "Cannot read properties of undefined (reading 'name')" in devComponent.
// Force the production bundle by:
//   1. dev:false on the plugin (skips JSX dev wrappers, transforms)
//   2. mode:'production' so Vite sets process.env.NODE_ENV correctly
//   3. resolve.conditions explicitly omits 'development', overriding Vite's
//      auto-injected condition in serve mode
// hot:false also disables solid-refresh (independent HMR-injection issue).
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: {
		conditions: ['solid', 'browser', 'module', 'import', 'default'],
	},
	build: { target: 'esnext', minify: false },
	server: { port: 5187, strictPort: true },
});
