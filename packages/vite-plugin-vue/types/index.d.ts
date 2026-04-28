import type { Plugin } from 'vite';

export interface TsrxVueOptions {
	/**
	 * Regular expression matched against file paths to decide which modules
	 * the plugin should compile as tsrx sources. Defaults to `/\.tsrx$/`.
	 */
	include?: RegExp;
}

export function tsrxVue(options?: TsrxVueOptions): Plugin;
export default tsrxVue;
