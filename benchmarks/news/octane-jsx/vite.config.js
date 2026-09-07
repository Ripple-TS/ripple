import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

// Identical to octane-tsrx's config except the dev port — the octane compiler
// lowers React-style `.tsx` (JSX) through the same pipeline it uses for `.tsrx`.
export default defineConfig({
	plugins: [octane()],
	// `octane` ships raw TS, so Vite must transform it for the SSR bundle.
	ssr: { noExternal: [/^octane($|\/)/] },
	optimizeDeps: { exclude: ['octane', 'octane/compiler'] },
	build: { target: 'esnext', minify: false },
	server: { port: 5195, strictPort: true },
});
