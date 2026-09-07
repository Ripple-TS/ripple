import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Force Solid 2.0-beta's production bundle (its dev bundle crashes) — same
// rationale as the dbmon / recursive-context Solid fixtures: dev:false +
// mode:production + resolve.conditions omitting 'development', hot:false to skip
// solid-refresh. The reorder harness drives the dev server, so what matters is
// that Solid's production runtime (fine-grained keyed <For> reconciler) is what
// gets measured.
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: {
		conditions: ['solid', 'browser', 'module', 'import', 'default'],
	},
	build: { target: 'esnext', minify: false },
	server: { port: 5179, strictPort: true },
});
