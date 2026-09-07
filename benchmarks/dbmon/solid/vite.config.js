import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Force Solid 2.0-beta's production bundle (its dev bundle crashes) — see the
// recursive-context bench for the full rationale: dev:false + mode:production +
// resolve.conditions omitting 'development', hot:false to skip solid-refresh.
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: {
		conditions: ['solid', 'browser', 'module', 'import', 'default'],
	},
	build: { target: 'esnext', minify: false },
	server: { port: 5200, strictPort: true },
});
