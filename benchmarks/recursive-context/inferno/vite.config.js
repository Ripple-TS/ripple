import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

// Force NODE_ENV=production so Inferno resolves its production path.
export default defineConfig({
	plugins: [infernoCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5327, strictPort: true },
});
