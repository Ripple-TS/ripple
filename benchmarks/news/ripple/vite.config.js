import { defineConfig } from 'vite';
import { compile } from '@tsrx/ripple';

// Minimal `.tsrx` → original Ripple transform (NOT the @ripple-ts/vite-plugin
// metaframework — the bench renders/hydrates directly). Per-module mode from
// Vite's SSR signal, for SSR mode: the SSR
// pass (ssrLoadModule / `--ssr` build) compiles `mode: 'server'` (HTML string),
// the client pass compiles `mode: 'client'` (DOM runtime + hydration).
function ripple() {
	return {
		name: 'tsrx-ripple-bench',
		enforce: 'pre',
		transform(code, id, transformOptions) {
			if (!id.endsWith('.tsrx')) return null;
			const ssr = transformOptions?.ssr === true || this.environment?.config?.consumer === 'server';
			const out = compile(code, id, { mode: ssr ? 'server' : 'client' });
			return { code: out.code, map: out.map };
		},
	};
}

export default defineConfig({
	plugins: [ripple()],
	// `ripple` ships raw source, so Vite must transform it for the SSR bundle.
	ssr: { noExternal: [/^ripple($|\/)/] },
	optimizeDeps: { exclude: ['ripple', '@tsrx/ripple'] },
	build: { target: 'esnext', minify: 'esbuild' },
	server: { port: 5194, strictPort: true },
});
