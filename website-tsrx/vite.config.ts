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

async function loadPageModule() {
  const path = window.location.pathname;
  if (path === '/playground') {
    return import('/src/pages/playground.tsrx');
  }
  if (path === '/getting-started') {
    return import('/src/pages/getting-started.tsrx');
  }
  if (path === '/docs') {
    return import('/src/pages/docs.tsrx');
  }
  return import('/src/pages/index.tsrx');
}

(async () => {
  try {
    const target = document.getElementById('root');
    const routeDataNode = document.getElementById('__ripple_data');
    const routeData = routeDataNode ? JSON.parse(routeDataNode.textContent || '{}') : { params: {} };
    const module = await loadPageModule();
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
