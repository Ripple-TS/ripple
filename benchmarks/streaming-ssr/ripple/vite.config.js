import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { compile } from '@tsrx/ripple';
import { createTextTypeProject } from '@tsrx/ripple/typescript';

const root = path.dirname(fileURLToPath(import.meta.url));

// SSR-only fixture build (no client bundle, no dev server — this suite is
// Node-only). Minimal `.tsrx` → original-Ripple transform (crib of
// benchmarks/news/ripple minus the port): the SSR pass compiles
// `mode: 'server'` (HTML string output against ripple/internal/server).
// Text type facts come from the project's TypeScript program (the
// `textTypes` production-build option of the Ripple Vite plugin): the card
// fields are typed through the imported `CardData` interface, which only a
// checker can prove to be strings, so `{data.title}` lowers to escaped text
// instead of a marker-bracketed value expression.
function ripple() {
	let text_types;
	return {
		name: 'tsrx-ripple-bench',
		enforce: 'pre',
		transform(code, id, transformOptions) {
			if (!id.endsWith('.tsrx')) return null;
			const ssr = transformOptions?.ssr === true || this.environment?.config?.consumer === 'server';
			text_types ??= createTextTypeProject({ tsconfig: path.join(root, 'tsconfig.json') });
			const out = compile(code, id, {
				mode: ssr ? 'server' : 'client',
				textTypeFacts: text_types.getTextTypeFacts(id, code),
			});
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
});
