import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const types_source = readFileSync(new URL('../types/index.d.ts', import.meta.url), 'utf8');

describe('@ripple-ts/adapter-node types', () => {
	it('uses shared ServeStaticDirectoryOptions alias from @ripple-ts/adapter', () => {
		expect(types_source).toContain(
			'ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions',
		);
		expect(types_source).toContain('static?: BaseServeStaticDirectoryOptions | false;');
		expect(types_source).toContain('export type ServeStaticOptions = BaseServeStaticOptions;');
	});

	it('does not inline static dir type shape locally', () => {
		expect(types_source).not.toMatch(/BaseServeStaticOptions\s*&\s*\{\s*dir\?: string;\s*\}/);
	});
});
