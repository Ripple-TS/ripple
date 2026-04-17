import type { Program } from 'estree';

export function parse(source: string, filename?: string): Program;

export function compile(
	source: string,
	filename?: string,
): {
	code: string;
	map: unknown;
	css: { code: string; hash: string } | null;
};
