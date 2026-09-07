import { defineConfig } from 'vite';
import tsrxSolid from '@tsrx/vite-plugin-solid';
import solidPlugin from 'vite-plugin-solid';

// SSR-only fixture build (no client bundle, no dev server — this suite is
// Node-only). `.tsrx` → (tsrxSolid) Solid-flavoured TSX → (vite-plugin-solid)
// Solid runtime. `ssr: true` selects the hydratable `generate: 'ssr'` output
// for the SSR bundle — the same hydration-keyed HTML a real Solid streaming
// deployment ships (crib of benchmarks/news/solid minus the port).
export default defineConfig({
	plugins: [tsrxSolid(), solidPlugin({ ssr: true })],
	build: { target: 'esnext', minify: false },
});
