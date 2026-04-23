import { ripple } from '@ripple-ts/vite-plugin';
import { defineConfig } from 'vite';

function mount_after_ssr() {
	const source_id = 'virtual:ripple-hydrate';
	const resolved_id = '\0website-tsrx-mount-after-ssr';

	return {
		name: 'website-tsrx-mount-after-ssr',
		enforce: 'pre',
		resolveId(id) {
			if (id === source_id) {
				return resolved_id;
			}
		},
		load(id) {
			if (id !== resolved_id) {
				return null;
			}

			return `
import 'virtual:ripple-compat';
import { hydrate } from 'ripple';

const route_modules = import.meta.glob('/src/pages/*.tsrx');

(async () => {
  try {
    const target = document.getElementById('root');
    const routeDataNode = document.getElementById('__ripple_data');
    const routeData = routeDataNode ? JSON.parse(routeDataNode.textContent || '{}') : { params: {} };

    if (!routeData.entry) {
      console.error('[tsrx] Unable to mount route: missing route entry.');
      return;
    }

		const load_module = route_modules[routeData.entry];

		if (!load_module) {
			console.error('[tsrx] Unable to mount route: unknown route entry.', routeData.entry);
			return;
		}

		const module = await load_module();
    const Component =
      module.default ||
      Object.entries(module).find(([key, value]) => typeof value === 'function' && /^[A-Z]/.test(key))?.[1];

    if (!Component || !target) {
      console.error('[tsrx] Unable to mount route: missing component export or #root target.');
      return;
    }

    hydrate(Component, {
      target,
      props: { params: routeData.params || {} }
    });
  } catch (error) {
    console.error('[tsrx] Failed to bootstrap client mount.', error);
  }
})();`;
		},
	};
}

export default defineConfig({
	define: {
		'import.meta.env.TEST': process.env.VITEST ? 'true' : 'false',
	},
	build: {
		minify: false,
	},
	appType: 'custom',
	plugins: [mount_after_ssr(), ripple()],
});
