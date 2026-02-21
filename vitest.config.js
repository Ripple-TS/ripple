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
					include: ['packages/ripple/tests/client/**/*.test.ripple'],
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
					include: ['packages/ripple/tests/server/**/*.test.ripple'],
					environment: 'node',
					setupFiles: ['packages/ripple/tests/setup-server.js'],
					globals: true,
				},
				plugins: [ripple({ excludeRippleExternalModules: true })],
				resolve: process.env.VITEST ? { conditions: ['default'] } : undefined,
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
					include: ['packages/compat-react/tests/**/*.test.ripple'],
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
		],
	},
});
