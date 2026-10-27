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
	for (const framework of ['solid', 'ripple']) {
		const root = fileURLToPath(new URL(`./fixtures/${framework}-reference/`, import.meta.url));
		const plugins =
			framework === 'solid'
				? (await import('./fixtures/solid-reference/build.js')).plugins()
				: [ripple({ excludeRippleExternalModules: true })];
		await build({
			root,
			configFile: false,
			logLevel: 'error',
			plugins,
			build: {
				outDir: 'dist',
				emptyOutDir: true,
				minify: false,
				lib: {
					entry: framework === 'solid' ? 'app.tsx' : 'app.tsrx',
					formats: ['es'],
					fileName: () => 'index.js',
				},
			},
		});
	}
}
