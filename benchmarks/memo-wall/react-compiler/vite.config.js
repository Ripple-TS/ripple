import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { reactCompiler } from '../../react-compiler.mjs';

// The same source as the vanilla React target, transformed with the official
// production React Compiler preset. Keeping this as a separate app makes the
// comparison differ only by compiler configuration.
export default defineConfig({
	plugins: [react(), reactCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: { dedupe: ['react', 'react-dom'] },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5226, strictPort: true },
});
