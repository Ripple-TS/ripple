import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

// Force NODE_ENV=production so React's dev/prod branch resolves to the
// production path (skips invariant checks, dev warnings, etc.).
export default defineConfig({
	plugins: [react(), reactCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5198, strictPort: true },
});
