import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [ripple({ rootBoundary: false, excludeRippleExternalModules: true })],
	optimizeDeps: { exclude: ['ripple'] },
	build: { target: 'esnext' },
	server: { port: 5219, strictPort: true },
});
