import type { Plugin } from 'vite';

export interface TsrxSolidOptions {
	/**
	 * Regular expression matched against file paths to decide which modules
	 * the plugin should compile as tsrx sources. Defaults to `/\.tsrx$/`,
	 * i.e. any file whose path ends in `.tsrx`. Override when you want to
	 * compile additional extensions (e.g. `/\.(tsrx|foo)$/`) or narrow the
	 * set of `.tsrx` files that should go through this plugin.
	 */
	include?: RegExp;
}

export function tsrxSolid(options?: TsrxSolidOptions): Plugin;
export default tsrxSolid;
