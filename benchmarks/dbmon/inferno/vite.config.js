import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

// Force Inferno's production runtime and native JSX transform.
export default defineConfig({
	plugins: [infernoCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5326, strictPort: true },
});
