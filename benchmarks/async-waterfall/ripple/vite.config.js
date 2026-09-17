import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [
		ripple({
			rootBoundary: false,
			ssr: false,
			excludeRippleExternalModules: true,
			textTypes: { tsconfig: 'tsconfig.json' },
		}),
	],
	optimizeDeps: { exclude: ['ripple'] },
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5219, strictPort: true },
});
