import { defineConfig } from 'vite';
import { infernoCompiler } from '../../inferno-vite.mjs';

// Resolve Inferno's production build so development validation does not inflate
// the scheduling side of the comparison.
export default defineConfig({
	plugins: [infernoCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext' },
	server: { port: 5333, strictPort: true },
});
