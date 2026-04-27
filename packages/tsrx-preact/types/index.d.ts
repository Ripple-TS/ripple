import type { Program } from 'estree';
import type { CompileError, ParseOptions, VolarMappingsResult } from '@tsrx/core/types';

export interface CompileOptions {
	suspenseSource?: string;
}

export const DEFAULT_SUSPENSE_SOURCE: string;

export function parse(source: string, filename?: string, options?: ParseOptions): Program;

export function compile(
	source: string,
	filename?: string,
	compile_options?: CompileOptions & { loose?: boolean },
): {
	code: string;
	map: unknown;
	css: { code: string; hash: string } | null;
	errors: CompileError[];
};

export function compile_to_volar_mappings(
	source: string,
	filename?: string,
	options?: ParseOptions & CompileOptions,
): VolarMappingsResult;
