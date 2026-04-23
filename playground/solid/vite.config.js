import { defineConfig } from 'vite';
import tsrxSolid from '@tsrx/vite-plugin-solid';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
	plugins: [tsrxSolid(), solidPlugin()],
});
