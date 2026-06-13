/**
 * Vite plugin for compiling .tsrx files via @tsrx/ripple-new compiler.
 *
 * Defaults to enabling HMR when Vite is in serve mode (`vite dev`) and
 * disabling it in build mode. Pass `{ hmr: true | false }` to override
 * (e.g. `rippleNew({ hmr: false })` to skip HMR wrapping even in dev).
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
		transform(code, id) {
			if (!id.endsWith('.tsrx')) return null;
			const out = compile(code, id, { hmr: !!hmrEnabled });
			return { code: out.code, map: out.map };
		},
	};
}
