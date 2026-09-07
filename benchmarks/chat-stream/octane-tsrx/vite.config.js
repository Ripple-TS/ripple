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
		// precise-coverage gate; normal timing runs retain their terser build.
		minify: process.env.CHAT_STREAM_WORK === '1' ? false : 'terser',
		terserOptions: {
			compress: { passes: 5, reduce_vars: false, inline: 0, toplevel: true },
			mangle: { toplevel: true },
		},
	},
	server: { port: 5250, strictPort: true },
});
