import { defineConfig } from '@ripple-ts/vite-plugin';
import { serve, runtime } from '@ripple-ts/adapter-node';

import { routes } from './src/routes.ts';
// import { loggingMiddleware } from './src/middlewares.ts'

export default defineConfig({
	build: {
		minify: false,
		outDir: 'dist',
		target: 'es2022',
	},
	adapter: { serve, runtime },
	router: { routes },
	// middlewares: [loggingMiddleware],
	platform: {
		env: {},
	},
});
