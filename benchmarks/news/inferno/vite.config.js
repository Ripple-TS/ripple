import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

export default defineConfig({
	plugins: [infernoCompiler()],
	ssr: { noExternal: [/^inferno(?:$|-)/] },
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5336, strictPort: true },
});
