import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Force Solid 2.0-beta's production bundle — same rationale as the other Solid
// bench fixtures (dev bundle crashes; hot:false skips solid-refresh).
export default defineConfig({
	plugins: [solid({ dev: false, hot: false })],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	resolve: {
		conditions: ['solid', 'browser', 'module', 'import', 'default'],
	},
	build: { target: 'esnext' },
	server: { port: 5218, strictPort: true },
});
