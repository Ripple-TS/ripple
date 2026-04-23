import type { Program } from 'estree';
import type { ParseOptions, VolarMappingsResult } from '@tsrx/core/types';

export interface CompileOptions {
	suspenseSource?: string;
}

export const DEFAULT_SUSPENSE_SOURCE: string;

export function parse(source: string, filename?: string, options?: ParseOptions): Program;

export function compile(
	source: string,
	filename?: string,
	compile_options?: CompileOptions,
): {
	code: string;
	map: unknown;
	css: { code: string; hash: string } | null;
};

export function compile_to_volar_mappings(
	source: string,
	filename?: string,
	options?: ParseOptions & CompileOptions,
): VolarMappingsResult;
