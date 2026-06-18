import { defineConfig } from 'vite';
import tsrxReact from '@tsrx/vite-plugin-react';

// `.tsrx` → (tsrxReact) React TSX → Vite/esbuild's automatic JSX runtime. Unlike
// Solid there's no two-build: React's `renderToString` (server) and `hydrateRoot`
// (client) use the same JSX output, so the single transform serves both the SSR
// pass (ssrLoadModule) and the client pass.
export default defineConfig({
	plugins: [tsrxReact()],
	build: { target: 'esnext', minify: false },
	server: { port: 5193, strictPort: true },
});
