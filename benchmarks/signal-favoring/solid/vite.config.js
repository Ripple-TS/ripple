import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Same prod-mode setup as the recursive-context bench: Solid 2.0-beta's dev
// runtime crashes on devComponent reading undefined.name, so we force the
// production bundle (dev:false plugin opt + non-'development' resolve
// conditions + NODE_ENV=production define).
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: { conditions: ['solid', 'browser', 'module', 'import', 'default'] },
	build: { target: 'esnext', minify: false },
	server: { port: 5191, strictPort: true },
});
