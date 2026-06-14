/**
 * Vite plugin for compiling .tsrx files via @tsrx/ripple-new compiler.
 *
 * Per-module target is chosen from Vite's SSR signal: a module compiled for the
 * server environment uses `mode: 'server'` (SSR HTML output), everything else
 * uses `mode: 'client'` (template-clone DOM runtime). HMR defaults to on in
 * serve mode and is always off for SSR; pass `{ hmr: true | false }` to override
 * the client default.
 */
import { compile } from './compile.js';

export function rippleNew(options = {}) {
	let hmrEnabled = options.hmr;
	return {
		name: 'ripple-new',
		enforce: 'pre',
		configResolved(config) {
			if (hmrEnabled === undefined) hmrEnabled = config.command === 'serve';
		},
		transform(code, id, transformOptions) {
			if (!id.endsWith('.tsrx')) return null;
			// Mirror Ripple's mode decision: the legacy `options.ssr` flag OR the
			// environment consumer (Vite 6+ environment API) marks a server build.
			const ssr = transformOptions?.ssr === true || this.environment?.config?.consumer === 'server';
			const out = compile(code, id, {
				hmr: !ssr && !!hmrEnabled,
				mode: ssr ? 'server' : 'client',
			});
			return { code: out.code, map: out.map };
		},
	};
}
