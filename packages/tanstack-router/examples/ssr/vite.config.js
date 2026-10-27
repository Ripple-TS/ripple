import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig(({ isSsrBuild }) => ({
	base: '/app/',
	optimizeDeps: {
		entries: ['client.js'],
		include: [
			'@ripple-ts/tanstack-router > @tanstack/router-core',
			'@ripple-ts/tanstack-router > @tanstack/history',
		],
	},
	plugins: [
		ripple(),
		{
			name: 'example-bundle-report',
			generateBundle(_options, bundle) {
				this.emitFile({
					type: 'asset',
					fileName: 'modules.json',
					source: JSON.stringify(
						Object.values(bundle)
							.filter((item) => item.type === 'chunk')
							.map((item) => ({ file: item.fileName, modules: Object.keys(item.modules) })),
						null,
						2,
					),
				});
			},
		},
	],
	ssr: {
		noExternal: [
			'@ripple-ts/tanstack-router',
			'ripple',
			'@tanstack/router-core',
			'@tanstack/history',
		],
	},
	build: {
		target: 'esnext',
		outDir: isSsrBuild ? 'dist/server' : 'dist/client',
		manifest: !isSsrBuild,
		rolldownOptions: {
			input: isSsrBuild ? 'server.js' : ['client.js', 'security-client.js'],
			preserveEntrySignatures: 'exports-only',
		},
	},
}));
