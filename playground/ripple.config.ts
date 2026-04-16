import { reactCompat } from '@ripple-ts/compat-react';

import { defineConfig } from '@ripple-ts/vite-plugin';

export default defineConfig({
	compat: {
		react: reactCompat(),
	},
});
