import { defineConfig } from 'vite';
import tsrxReact from '@tsrx/vite-plugin-react';

export default defineConfig({
	plugins: [tsrxReact()],
	build: {
		minify: false,
	},
});
