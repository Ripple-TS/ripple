import { defineConfig } from 'vite';
import tsrxVue from '@tsrx/vite-plugin-vue';

export default defineConfig({
	plugins: [tsrxVue()],
});
