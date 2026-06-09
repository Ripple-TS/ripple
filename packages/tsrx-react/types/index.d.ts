import type { Program } from 'estree';
import type { CompileFn, ParseOptions, VolarCompileFn } from '@tsrx/core/types';

export function parse(source: string, filename?: string, options?: ParseOptions): Program;

export { Dynamic, type DynamicProps } from './dynamic.js';
export { isRefProp } from './ref.js';

export const compile: CompileFn;

export const compile_to_volar_mappings: VolarCompileFn;
