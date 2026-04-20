import type { Plugin } from 'vite';

export interface TsrxSolidOptions {
	/**
	 * Glob-style pattern of files to treat as `.tsrx` modules. Defaults to
	 * matching any file whose path ends in `.tsrx`.
	 */
	include?: RegExp;
}

export function tsrxSolid(options?: TsrxSolidOptions): Plugin;
export default tsrxSolid;
