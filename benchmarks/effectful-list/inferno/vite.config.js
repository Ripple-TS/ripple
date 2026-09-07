import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

// Production Inferno build,
// esbuild-minified so it's comparable to the octane columns' production output.
export default defineConfig({
	plugins: [infernoCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5330, strictPort: true },
});
