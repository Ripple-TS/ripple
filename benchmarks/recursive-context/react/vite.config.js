import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Force NODE_ENV=production so React's dev/prod branch resolves to the
// production path (skips invariant checks, dev warnings, etc.). Matches
// Solid's dev:false for parity.
export default defineConfig({
	plugins: [react()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5186, strictPort: true },
});
