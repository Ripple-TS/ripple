import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

export default defineConfig({
	// The compiler's parallel-`use()` pipeline (memoized creations, batched
	// unwrap, fetch-tree warming) is ON by default — the feature this suite
	// measures. The fixture stays idiomatic nested use(); the compiler does
	// the hoisting.
	plugins: [octane()],
	optimizeDeps: {
		exclude: ['octane', 'octane/compiler'],
	},
	build: { target: 'esnext' },
	server: { port: 5216, strictPort: true },
});
