import { ripple } from '@ripple-ts/vite-plugin-new';
import { defineConfig } from 'vite';

// The ripple-new metaframework plugin owns the client hydration entry (the
// `virtual:ripple-new-hydrate` module it injects), so — unlike the Ripple site —
// there's no hand-written `mount_after_ssr()` plugin here. `appType: 'custom'`
// is set by the plugin's `config` hook.
export default defineConfig({
	define: {
		'import.meta.env.TEST': process.env.VITEST ? 'true' : 'false',
	},
	build: {
		minify: false,
	},
	plugins: [ripple()],
});
