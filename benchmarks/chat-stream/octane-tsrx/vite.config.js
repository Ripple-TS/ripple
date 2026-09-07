import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
		exclude: ['octane', 'octane/compiler'],
	},
	build: {
		target: 'esnext',
		// Keep production function names available for the separate, untimed
		// precise-coverage gate; normal timing runs keep the esbuild-minified build.
		minify: process.env.CHAT_STREAM_WORK === '1' ? false : 'esbuild',
	},
	server: { port: 5250, strictPort: true },
});
