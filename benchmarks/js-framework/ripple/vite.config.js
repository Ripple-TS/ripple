import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [ripple({ excludeRippleExternalModules: true })],
	optimizeDeps: { exclude: ['ripple'] },
	// Unminified, matching the solid and vue-vapor fixtures.
	build: { target: 'esnext', minify: 'esbuild' },
	server: { port: 5178, strictPort: true },
});
