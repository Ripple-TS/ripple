import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [
		ripple({
			rootBoundary: false,
			excludeRippleExternalModules: true,
			textTypes: { tsconfig: 'tsconfig.json' },
		}),
	],
	optimizeDeps: { exclude: ['ripple'] },
	build: {
		target: 'esnext',
		minify: 'esbuild',
	},
	server: { port: 5306, strictPort: true },
});
