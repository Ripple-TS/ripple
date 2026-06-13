import { defineConfig } from 'vitest/config';
import { rippleNew } from '@tsrx/ripple-new/vite';

export default defineConfig({
	plugins: [rippleNew()],
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.tsrx', 'tests/**/*.test.ts'],
		globals: false,
		// Precompiles every fixture through @tsrx/react + esbuild before any
		// test loads — runs in pure Node so esbuild's TextEncoder requirements
		// are satisfied (jsdom's TextEncoder breaks esbuild's binary protocol).
		globalSetup: ['./tests/differential/_setup.ts'],
	},
});
