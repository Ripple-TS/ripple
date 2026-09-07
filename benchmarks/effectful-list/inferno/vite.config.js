import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

// Production Inferno build,
// terser-minified so it's comparable to the octane columns' production output.
export default defineConfig({
	plugins: [infernoCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5330, strictPort: true },
});
