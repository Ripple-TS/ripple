import { defineConfig } from 'vite';
import { rippleNew } from '@tsrx/ripple-new/vite';

export default defineConfig({
	plugins: [rippleNew()],
	optimizeDeps: { exclude: ['ripple-new', '@tsrx/ripple-new'] },
	build: { target: 'esnext', minify: false },
	server: { port: 5190, strictPort: true },
});
