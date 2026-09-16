import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

export default defineConfig({
	plugins: [infernoCompiler()],
	publicDir: '../shared/public',
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5335, strictPort: true },
});
