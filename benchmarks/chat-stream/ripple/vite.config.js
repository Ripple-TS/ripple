import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [ripple({ rootBoundary: false, ssr: false, excludeRippleExternalModules: true })],
	optimizeDeps: { exclude: ['ripple'] },
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5253, strictPort: true },
});
