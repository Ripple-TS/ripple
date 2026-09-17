import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { compile } from '@tsrx/ripple';
import { createTextTypeProject } from '@tsrx/ripple/typescript';

const root = path.dirname(fileURLToPath(import.meta.url));

// Minimal `.tsrx` → original Ripple transform (NOT the @ripple-ts/vite-plugin
// metaframework — the bench renders/hydrates directly). Per-module mode from
// Vite's SSR signal, mirroring octane/compiler/vite's octane plugin: the SSR
// pass (ssrLoadModule / `--ssr` build) compiles `mode: 'server'` (HTML string),
// the client pass compiles `mode: 'client'` (DOM runtime + hydration). Text
// type facts come from the project's TypeScript program, as the `textTypes`
// production-build option of the Ripple Vite plugin provides them.
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
	server: { port: 5194, strictPort: true },
});
