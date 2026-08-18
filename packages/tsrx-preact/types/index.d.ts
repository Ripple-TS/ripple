import type { Program } from 'estree';
import type { BaseCompileOptions, CompileFn, ParseOptions, VolarCompileFn } from '@tsrx/core/types';

export type { RuntimeImportMode } from '@tsrx/core/types';

/**
 * Per-call compile options for tsrx-preact. Exposed publicly so the Vite
 * plugin's typings can extend them.
 */
export interface CompileOptions {
	/**
	 * Module `Suspense` is imported from. Defaults to
	 * {@link DEFAULT_SUSPENSE_SOURCE} (`preact/compat`); projects on
	 * `@preact/compat` or a workspace alias override it here.
	 */
	suspenseSource?: string;
}

export const DEFAULT_SUSPENSE_SOURCE: string;

export function parse(source: string, filename?: string, options?: ParseOptions): Program;

export { Dynamic, type DynamicElementType, type DynamicProps } from './dynamic.js';
export { isRefProp } from './ref.js';

export const compile: CompileFn<CompileOptions & BaseCompileOptions>;

export const compile_to_volar_mappings: VolarCompileFn<
	ParseOptions & CompileOptions & BaseCompileOptions
>;
