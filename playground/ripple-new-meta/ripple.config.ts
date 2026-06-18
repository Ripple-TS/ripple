import { defineConfig, RenderRoute, ServerRoute } from '@ripple-ts/vite-plugin-new';
import { serve, runtime } from '@ripple-ts/adapter-node';

const layout = '/src/components/layout.tsrx';

export default defineConfig({
	adapter: { serve, runtime },
	router: {
		routes: [
			new RenderRoute({ path: '/', entry: '/src/pages/home.tsrx', layout }),
			new RenderRoute({ path: '/about', entry: '/src/pages/about.tsrx', layout }),
			new ServerRoute({
				path: '/api/ping',
				handler: (context) =>
					new Response(JSON.stringify({ ok: true, path: context.url.pathname }), {
						headers: { 'content-type': 'application/json' },
					}),
			}),
		],
	},
});
