import type { UserOptions } from '@stylexjs/unplugin';
import type { Plugin } from 'vite';

export type StylexOptions = Omit<Partial<UserOptions>, 'sxPropName'> & {
	/** Packages shipping uncompiled StyleX that should bypass dependency optimization. */
	externalPackages?: string[];
	/** Additional Babel plugins and presets passed to the StyleX transform. */
	babelConfig?: {
		plugins?: unknown[];
		presets?: unknown[];
	};
};

/** Use alongside ripple() to compile StyleX in .tsrx and JavaScript/TypeScript modules. */
export function stylex(options?: StylexOptions): Plugin;
