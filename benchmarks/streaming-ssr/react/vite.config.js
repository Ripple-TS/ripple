import { defineConfig } from 'vite';
import tsrxReact from '@tsrx/vite-plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

// SSR-only fixture build (no client bundle, no dev server — this suite is
// Node-only). `.tsrx` → (tsrxReact) React automatic-runtime JavaScript → React
// Compiler; the harness builds `src/entry-server.ts` with an outDir override
// under benchmarks/streaming-ssr/dist/.
export default defineConfig({
	plugins: [tsrxReact(), reactCompiler()],
	build: { target: 'esnext', minify: false },
});
