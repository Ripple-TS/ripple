import { defineConfig } from 'vite';
import tsrxReact from '@tsrx/vite-plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

// `.tsrx` → (tsrxReact) React automatic-runtime JavaScript → React Compiler.
// Unlike Solid there's no two-build: React's `renderToString` (server) and
// `hydrateRoot` (client) use the same compiled output, so both transforms
// serve the SSR pass (ssrLoadModule) and the client pass.
export default defineConfig({
	plugins: [tsrxReact(), reactCompiler()],
	build: { target: 'esnext', minify: false },
	server: { port: 5193, strictPort: true },
});
