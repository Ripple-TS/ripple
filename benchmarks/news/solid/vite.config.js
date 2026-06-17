import { defineConfig } from 'vite';
import tsrxSolid from '@tsrx/vite-plugin-solid';
import solidPlugin from 'vite-plugin-solid';

// `.tsrx` → (tsrxSolid) Solid-flavoured TSX → (vite-plugin-solid) Solid runtime.
// `ssr: true` makes BOTH transforms hydratable: the SSR pass (ssrLoadModule,
// `generate: 'ssr'`) emits hydration-keyed HTML, the client pass
// (`generate: 'dom', hydratable: true`) emits matching adopt code — so
// `@solidjs/web` `hydrate()` adopts the server DOM instead of rebuilding.
export default defineConfig({
	plugins: [tsrxSolid(), solidPlugin({ ssr: true })],
	build: { target: 'esnext', minify: false },
	server: { port: 5192, strictPort: true },
});
