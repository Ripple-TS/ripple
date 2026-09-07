import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

// Production Inferno build using its native JSX transform.
export default defineConfig({
	plugins: [infernoCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5320, strictPort: true },
});
