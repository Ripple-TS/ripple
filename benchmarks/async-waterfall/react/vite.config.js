import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

// Production React (NODE_ENV=production resolves React's prod bundle) — dev
// React carries validation overhead that would inflate the scheduling side.
export default defineConfig({
	plugins: [react(), reactCompiler()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext' },
	server: { port: 5217, strictPort: true },
});
