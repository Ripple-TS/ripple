import { defineConfig } from '@ripple-ts/vite-plugin';
import { serve } from '@ripple-ts/adapter-node';

import { routes } from './src/routes.ts';
// import { loggingMiddleware } from './src/middlewares.ts'

export default defineConfig({
	build: {
		minify: false,
	},
	adapter: { serve },
	router: { routes },
	// middlewares: [loggingMiddleware],
	platform: {
		env: {},
	},
});
