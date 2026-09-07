import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

// Production React build (NODE_ENV=production resolves React's prod bundle),
// terser-minified so it's comparable to the octane columns' production output.
export default defineConfig({
	plugins: [react(), reactCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5203, strictPort: true },
});
