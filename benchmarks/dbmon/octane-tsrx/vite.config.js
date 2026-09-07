import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

export default defineConfig({
	plugins: [octane()],
	optimizeDeps: { exclude: ['octane', 'octane/compiler'] },
	build: { target: 'esnext', minify: false },
	server: { port: 5196, strictPort: true },
});
