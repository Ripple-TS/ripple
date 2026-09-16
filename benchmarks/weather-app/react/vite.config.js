import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactCompiler } from '../../react-compiler.mjs';

export default defineConfig({
	plugins: [react(), reactCompiler()],
	publicDir: '../shared/public',
	build: { minify: 'esbuild', target: 'esnext' },
	server: { port: 5293, strictPort: true },
});
