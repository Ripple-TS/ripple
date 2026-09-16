import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [
		ripple({
			ssr: false,
			excludeRippleExternalModules: true,
			textTypes: { tsconfig: 'tsconfig.json' },
		}),
	],
	optimizeDeps: { exclude: ['ripple'] },
	publicDir: '../shared/public',
	build: { target: 'esnext', minify: 'esbuild' },
	server: { port: 5298, strictPort: true },
});
