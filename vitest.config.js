import { configDefaults, defineConfig } from 'vitest/config';
import { ripple } from '@ripple-ts/vite-plugin';

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
					name: 'tsrx-ripple',
					include: ['packages/tsrx-ripple/tests/**/*.test.js'],
					environment: 'node',
					globals: true,
				},
				plugins: [],
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
					name: 'ripple-hydration',
					include: ['packages/ripple/tests/hydration/**/*.test.js'],
					environment: 'jsdom',
					setupFiles: ['packages/ripple/tests/setup-hydration.js'],
					globalSetup: ['packages/ripple/tests/hydration/build-components.js'],
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
				resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
			},
		],
	},
});
