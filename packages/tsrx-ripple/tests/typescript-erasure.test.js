import { acorn } from '@tsrx/core';
import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

const catches = [
	'catch (error: unknown) { return error instanceof Error; }',
	'catch (error: any) { return error.message; }',
	'catch ({ message }: any) { return message; }',
	'catch (error: any) { error = "caught"; return <p>{error}</p>; }',
	'catch ({ message }: any) { message = "caught"; return <p>{message}</p>; }',
	'catch { return false; }',
];

describe('TypeScript erasure', () => {
	for (const mode of ['client', 'server']) {
		it.each(catches)(`erases catch binding annotations in ${mode}: %s`, (handler) => {
			const { code, errors } = compile(
				`export function inspect() { try { throw Error('x'); } ${handler} }`,
				'Inspect.tsrx',
				{ mode },
			);
			expect(errors).toEqual([]);
			expect(() =>
				acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }),
			).not.toThrow();
		});

		it.each(['const', 'let', 'var'])(`erases ambient %s declarations in ${mode}`, (kind) => {
			const { code, errors } = compile(
				`declare ${kind} FLAG: boolean;
				export function Demo() @{ <p>{FLAG}</p> }`,
				'Demo.tsrx',
				{ mode, hydration: true },
			);
			expect(errors).toEqual([]);
			expect(code).not.toContain('declare');
			expect(code).toContain('FLAG');
			expect(() =>
				acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }),
			).not.toThrow();
		});
	}

	it('preserves ambient declarations and catch annotations for type checking', () => {
		const { code, errors } = compile_to_volar_mappings(
			`declare const FLAG: boolean;
			export function inspect() { try { return FLAG; } catch (error: unknown) { return error; } }`,
			'Inspect.tsrx',
		);
		expect(errors).toEqual([]);
		expect(code).toContain('declare const FLAG: boolean');
		expect(code).toContain('error: unknown');
	});
});
