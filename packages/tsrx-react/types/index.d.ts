import type { Program } from 'estree';
import type { VolarMappingsResult } from '@tsrx/core/types';

export function parse(source: string, filename?: string): Program;

export function compile(
	source: string,
	filename?: string,
): {
	code: string;
	map: unknown;
	css: { code: string; hash: string } | null;
};

export function compile_to_volar_mappings(source: string, filename?: string): VolarMappingsResult;
