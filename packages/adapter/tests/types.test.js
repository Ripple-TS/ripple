import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const types_source = readFileSync(new URL('../types/index.d.ts', import.meta.url), 'utf8');

describe('@ripple-ts/adapter types', () => {
	it('exports ServeStaticOptions with cache-control fields', () => {
		expect(types_source).toMatch(
			/export type ServeStaticOptions = \{[\s\S]*?prefix\?: string;[\s\S]*?maxAge\?: number;[\s\S]*?immutable\?: boolean;[\s\S]*?\};/,
		);
	});

	it('exports ServeStaticDirectoryOptions with shared dir field', () => {
		expect(types_source).toMatch(
			/export type ServeStaticDirectoryOptions = ServeStaticOptions & \{[\s\S]*?dir\?: string;[\s\S]*?\};/,
		);
	});
});
