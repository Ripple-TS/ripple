import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Solid 2's development runtime currently crashes in this workspace, so the
// existing Solid benchmark fixtures all exercise its production runtime even
// when the interaction harness drives Vite's development server.
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: {
		conditions: ['solid', 'browser', 'module', 'import', 'default'],
	},
	publicDir: '../shared/public',
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5295, strictPort: true },
});
