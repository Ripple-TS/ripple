import { configDefaults, defineConfig } from 'vitest/config';
import { ripple } from '@ripple-ts/vite-plugin';
import { fileURLToPath } from 'node:url';

const vue_runtime_path = fileURLToPath(
	new URL('./packages/vite-plugin-vue/tests/vue-runtime-shim.js', import.meta.url),
);
const vue_jsx_vapor_runtime_path = fileURLToPath(
	new URL('./packages/vite-plugin-vue/tests/vue-jsx-vapor-shim.js', import.meta.url),
);
const vue_jsx_vapor_jsx_runtime_path = fileURLToPath(
	new URL('./packages/vite-plugin-vue/tests/vue-jsx-vapor-jsx-runtime-shim.js', import.meta.url),
);

const vue_runtime_alias_plugin = {
	name: 'tsrx-vue-runtime-aliases',
	enforce: 'pre',
	/** @param {string} source */
	resolveId(source) {
		if (source === 'vue') return vue_runtime_path;
		if (source === 'vue-jsx-vapor/jsx-runtime') return vue_jsx_vapor_jsx_runtime_path;
		if (source === 'vue-jsx-vapor') return vue_jsx_vapor_runtime_path;
		return null;
	},
};

export default defineConfig({
	plugins: [ripple({ excludeRippleExternalModules: true })],
	test: {
		...configDefaults,
		projects: [
			{
				test: {
					name: 'ripple-client',
					include: ['packages/ripple/tests/client/**/*.test.tsrx'],
					environment: 'jsdom',
					setupFiles: ['packages/ripple/tests/setup-client.js'],
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
				resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
			},
			{
				test: {
					name: 'ripple-server',
					include: ['packages/ripple/tests/server/**/*.test.tsrx'],
					environment: 'node',
					setupFiles: ['packages/ripple/tests/setup-server.js'],
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
				resolve: process.env.VITEST ? { conditions: ['default'] } : undefined,
			},
			{
				test: {
					name: 'tsrx-react',
					include: ['packages/tsrx-react/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'tsrx-preact',
					include: ['packages/tsrx-preact/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'vite-plugin-preact',
					include: ['packages/vite-plugin-preact/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'bun-plugin-preact',
					include: ['packages/bun-plugin-preact/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'tsrx-solid',
					include: ['packages/tsrx-solid/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'tsrx-vue',
					include: ['packages/tsrx-vue/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'tsrx-vue-runtime',
					include: ['packages/vite-plugin-vue/tests/**/*.test.tsrx'],
					environment: 'jsdom',
					setupFiles: ['packages/vite-plugin-vue/tests/setup.js'],
					globals: true,
				},
				plugins: [
					vue_runtime_alias_plugin,
					(await import('./packages/vite-plugin-vue/src/index.js')).tsrxVue(),
					(await import('./packages/vite-plugin-vue/src/vapor.js')).tsrxVueVapor(),
				],
				resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
				ssr: {
					noExternal: ['vue', 'vue-jsx-vapor', '@tsrx/vue'],
				},
			},
			{
				test: {
					name: 'vite-plugin-react',
					include: ['packages/vite-plugin-react/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'rspack-plugin-react',
					include: ['packages/rspack-plugin-react/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'rspack-plugin-preact',
					include: ['packages/rspack-plugin-preact/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'turbopack-plugin-react',
					include: ['packages/turbopack-plugin-react/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'tsrx-react-runtime',
					include: ['packages/vite-plugin-react/tests/**/*.test.tsrx'],
					environment: 'jsdom',
					setupFiles: ['packages/vite-plugin-react/tests/setup.js'],
					globals: true,
				},
				plugins: [(await import('./packages/vite-plugin-react/src/index.js')).tsrxReact()],
			},
			{
				test: {
					name: 'vite-plugin-solid',
					include: ['packages/vite-plugin-solid/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'tsrx-solid-runtime',
					include: ['packages/vite-plugin-solid/tests/**/*.test.tsrx'],
					environment: 'jsdom',
					setupFiles: ['packages/vite-plugin-solid/tests/setup.js'],
					globals: true,
				},
				plugins: [
					(await import('./packages/vite-plugin-solid/src/index.js')).tsrxSolid(),
					(await import('vite-plugin-solid')).default(),
				],
			},
			{
				test: {
					name: 'prettier-plugin',
					include: ['packages/prettier-plugin/src/*.test.js'],
					environment: 'jsdom',
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
			},
			{
				test: {
					name: 'eslint-plugin',
					include: ['packages/eslint-plugin/tests/**/*.test.ts'],
					environment: 'jsdom',
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
			},
			{
				test: {
					name: 'eslint-parser',
					include: ['packages/eslint-parser/tests/**/*.test.ts'],
					environment: 'jsdom',
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
			},
			{
				test: {
					name: 'cli',
					include: ['packages/cli/tests/**/*.test.js'],
					environment: 'jsdom',
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
			},
			{
				test: {
					name: 'vite-plugin',
					include: ['packages/vite-plugin/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'adapter',
					include: ['packages/adapter/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'adapter-node',
					include: ['packages/adapter-node/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'adapter-bun',
					include: ['packages/adapter-bun/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'adapter-vercel',
					include: ['packages/adapter-vercel/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'utils',
					include: ['packages/ripple/tests/utils/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
			{
				test: {
					name: 'compat-react',
					include: ['packages/compat-react/tests/**/*.test.tsrx'],
					environment: 'jsdom',
					setupFiles: ['packages/compat-react/tests/setup.js'],
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
				resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
			},
			{
				test: {
					name: 'ripple-hydration',
					include: ['packages/ripple/tests/hydration/**/*.test.js'],
					environment: 'jsdom',
					setupFiles: ['packages/ripple/tests/setup-hydration.js'],
					globalSetup: ['packages/ripple/tests/hydration/build-components.js'],
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
				// Use browser conditions for client code, but server-compiled
				// components may import from 'ripple' which needs server runtime
				// This is a limitation - reactive server components need different setup
				resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
			},
			{
				test: {
					name: 'typescript-plugin',
					include: ['packages/typescript-plugin/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
			},
		],
	},
});
