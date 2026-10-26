import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

const root = fileURLToPath(new URL('./fixtures/consumer/', import.meta.url));

export default async function buildFixtures() {
	for (const target of ['server', 'client']) {
		const server = target === 'server';
		await build({
			root,
			configFile: false,
			logLevel: 'error',
			plugins: [ripple({ excludeRippleExternalModules: true, ...(server ? { ssr: true } : {}) })],
			ssr: { noExternal: true },
			build: {
				ssr: server,
				outDir: `dist/${target}`,
				emptyOutDir: true,
				minify: false,
				rolldownOptions: { output: { entryFileNames: 'index.js' } },
				lib: { entry: `${target}.js`, formats: ['es'], fileName: () => 'index.js' },
			},
		});
	}
}
