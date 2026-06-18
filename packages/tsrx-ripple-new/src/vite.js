/**
 * Vite plugin for compiling .tsrx files via @tsrx/ripple-new compiler.
 *
 * Per-module target is chosen from Vite's SSR signal: a module compiled for the
 * server environment uses `mode: 'server'` (SSR HTML output), everything else
 * uses `mode: 'client'` (template-clone DOM runtime). This auto-detection is
 * what a standard Vite SSR setup relies on — the SAME `.tsrx` is compiled to
 * client code for the browser bundle and to server code when loaded through
 * `ssrLoadModule` / an SSR build (see playground/ripple-new-ssr).
 *
 * Options:
 *   - `ssr`: force the target for EVERY module — `true` always compiles server
 *     mode, `false` always client. Leave it unset (the default) to use the
 *     per-module auto-detection above. Useful for a dedicated server build.
 *   - `hmr`: defaults to on in serve mode and is always off for SSR; pass
 *     `true`/`false` to override the client default.
 */
import { compile } from './compile.js';

export function rippleNew(options = {}) {
	let hmrEnabled = options.hmr;
	// An explicit override of the per-module SSR auto-detection (true → always
	// server, false → always client). `undefined` keeps auto-detection.
	const forceSsr = options.ssr;
	return {
		name: 'ripple-new',
		enforce: 'pre',
		configResolved(config) {
			if (hmrEnabled === undefined) hmrEnabled = config.command === 'serve';
		},
		transform(code, id, transformOptions) {
			if (!id.endsWith('.tsrx')) return null;
			// Mirror Ripple's mode decision: an explicit `options.ssr` override wins;
			// otherwise Vite's transform-level SSR flag OR the environment consumer
			// (Vite 6+ environment API) marks a server build.
			const ssr =
				forceSsr !== undefined
					? forceSsr
					: transformOptions?.ssr === true || this.environment?.config?.consumer === 'server';
			const out = compile(code, id, {
				hmr: !ssr && !!hmrEnabled,
				mode: ssr ? 'server' : 'client',
			});
			return { code: out.code, map: out.map };
		},
	};
}
