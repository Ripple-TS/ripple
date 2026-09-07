import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const isolationHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

// Solid 2's development renderer is not compatible with the pinned Vite
// plugin, so benchmark the production renderer used by the other Solid suites.
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: {
		conditions: ['solid', 'browser', 'module', 'import', 'default'],
	},
	build: { target: 'esnext', minify: false },
	server: { port: 5317, strictPort: true, headers: isolationHeaders },
	preview: { headers: isolationHeaders },
});
