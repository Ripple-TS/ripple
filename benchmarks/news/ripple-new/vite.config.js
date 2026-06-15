import { defineConfig } from 'vite';
import { rippleNew } from '@tsrx/ripple-new/vite';

export default defineConfig({
	plugins: [rippleNew()],
	// `ripple-new` ships raw TS, so Vite must transform it for the SSR bundle.
	ssr: { noExternal: [/^ripple-new($|\/)/] },
	optimizeDeps: { exclude: ['ripple-new', '@tsrx/ripple-new'] },
	build: { target: 'esnext', minify: false },
	server: { port: 5191, strictPort: true },
});
