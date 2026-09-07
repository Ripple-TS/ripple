import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production React build (NODE_ENV=production resolves React's prod bundle),
// esbuild-minified so it's comparable to the octane columns' production output.
export default defineConfig({
	plugins: [react()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5208, strictPort: true },
});
