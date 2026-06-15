import { defineConfig } from 'vite';
import { rippleNew } from '@tsrx/ripple-new/vite';

export default defineConfig({
	plugins: [rippleNew()],

	// The SSR target is chosen PER MODULE by the rippleNew() plugin from Vite's
	// SSR signal — entry-server.ts is loaded via vite.ssrLoadModule() (server.js),
	// so its .tsrx imports compile in `mode: 'server'`, while the browser bundle
	// (entry-client.ts) compiles in `mode: 'client'`. No `rippleNew({ ssr: true })`
	// override is needed here.
	ssr: {
		// `ripple-new` is a workspace:* package whose `main` points at raw TS
		// sources, so Vite must TRANSFORM it for the server bundle rather than
		// externalize it (Node can't import raw .ts).
		noExternal: [/^ripple-new($|\/)/],
	},

	optimizeDeps: {
		// Same reason: pre-bundling would snapshot stale output and require
		// `vite --force` on every workspace edit.
		exclude: ['ripple-new', '@tsrx/ripple-new'],
	},

	build: {
		// Keep the template-clone / HTML-string output legible.
		minify: false,
		target: 'esnext',
	},
});
