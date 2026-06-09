import type { Program } from 'estree';
import type { BaseCompileOptions, CompileFn, ParseOptions, VolarCompileFn } from '@tsrx/core/types';

export interface CompileOptions {
	suspenseSource?: string;
}

export const DEFAULT_SUSPENSE_SOURCE: string;

export function parse(source: string, filename?: string, options?: ParseOptions): Program;

export { Dynamic, type DynamicElementType, type DynamicProps } from './dynamic.js';
export { isRefProp } from './ref.js';

export const compile: CompileFn<CompileOptions & BaseCompileOptions>;

export const compile_to_volar_mappings: VolarCompileFn<ParseOptions & CompileOptions>;
