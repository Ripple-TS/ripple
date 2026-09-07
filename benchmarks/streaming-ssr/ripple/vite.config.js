import { defineConfig } from 'vite';
import { compile } from '@tsrx/ripple';

// SSR-only fixture build (no client bundle, no dev server — this suite is
// Node-only). Minimal `.tsrx` → original-Ripple transform (crib of
// benchmarks/news/ripple minus the port): the SSR pass compiles
// `mode: 'server'` (HTML string output against ripple/internal/server).
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
	build: { target: 'esnext', minify: false },
});
