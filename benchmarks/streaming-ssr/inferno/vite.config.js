import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

export default defineConfig({
	plugins: [infernoCompiler()],
	ssr: { noExternal: [/^inferno(?:$|-)/] },
	build: { target: 'esnext', minify: false },
});
