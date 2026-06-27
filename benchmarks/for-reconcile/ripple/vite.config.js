import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

// Production build config — the bench measures the minified prod bundle
// (`vite build` + `vite preview`), not the dev server, so numbers reflect
// real-world output.
export default defineConfig({
	plugins: [ripple({ excludeRippleExternalModules: true })],
	optimizeDeps: { exclude: ['ripple'] },
	build: { target: 'esnext', minify: 'esbuild' },
	preview: { port: 5190, strictPort: true },
	server: { port: 5190, strictPort: true },
});
