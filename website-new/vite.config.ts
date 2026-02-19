import { ripple } from '@ripple-ts/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		'import.meta.env.TEST': process.env.VITEST ? 'true' : 'false',
	},
	build: {
		minify: false,
	},
	appType: 'custom',
	plugins: [ripple()],
});
