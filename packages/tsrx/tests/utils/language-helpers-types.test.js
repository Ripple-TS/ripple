import { describe, expect, it } from 'vitest';
import { check_types } from '../shared/type-diagnostics.js';

/**
 * `@tsrx/runtime/language-helpers` owns the declarations consumed through
 * `@tsrx/core/runtime/language-helpers`, so they decide what the checker knows
 * about compiled code. These pin the element types the helpers preserve —
 * an `any` here silently disables checking wherever the helpers are emitted.
 */

const IMPORTS = `import {
	array_slice,
	exclude_prop_from_object,
	iterable_array_from,
} from './types/runtime/language-helpers.js';`;

/** @param {string} body */
function check(body) {
	return check_types(`${IMPORTS}\n${body}`);
}

describe('language helper types', () => {
	describe('array_slice', () => {
		it('preserves the element type of an array', () => {
			const { errors, types } = check(`
				const numbers = array_slice([1, 2, 3], 1);
				const first = numbers[0];

				const words = array_slice(['a', 'b'], 0);
				const upper = words[0].toUpperCase();
			`);

			expect(errors).toEqual([]);
			expect(types.numbers).toBe('number[]');
			expect(types.first).toBe('number');
			expect(types.words).toBe('string[]');
			expect(types.upper).toBe('string');
		});

		it('preserves the element type of an array-like', () => {
			const { errors, types } = check(`
				const list = { length: 2, 0: 'a', 1: 'b' } as ArrayLike<string>;
				const sliced = array_slice(list, 1);
			`);

			expect(errors).toEqual([]);
			expect(types.sliced).toBe('string[]');
		});

		it('still accepts an untyped arguments object', () => {
			const { errors } = check(`
				function f() {
					return array_slice(arguments, 0);
				}
			`);

			expect(errors).toEqual([]);
		});
	});

	describe('iterable_array_from', () => {
		it('preserves the element type across iterables and array-likes', () => {
			const { errors, types } = check(`
				const fromSet = iterable_array_from(new Set([1, 2]));
				const fromArray = iterable_array_from(['a'], 0);
			`);

			expect(errors).toEqual([]);
			expect(types.fromSet).toBe('number[]');
			expect(types.fromArray).toBe('string[]');
		});
	});

	describe('exclude_prop_from_object', () => {
		it('drops the excluded prop and keeps the rest readable', () => {
			const { errors, types } = check(`
				const props = { is: 'div', title: 'hello', count: 2 };
				const rest = exclude_prop_from_object(props, 'is');
				const title = rest.title;
			`);

			expect(errors).toEqual([]);
			expect(types.rest).toBe('Omit<{ is: string; title: string; count: number; }, "is">');
			expect(types.title).toBe('string');
		});

		it('reports a read of the prop that was excluded', () => {
			const { errors } = check(`
				const props = { is: 'div', title: 'hello' };
				const rest = exclude_prop_from_object(props, 'is');
				rest.is;
			`);

			expect(errors).toEqual([
				`Property 'is' does not exist on type 'Omit<{ is: string; title: string; }, "is">'.`,
			]);
		});

		it('accepts an interface- or class-typed props bag', () => {
			// Component props are interfaces, which have no implicit index
			// signature — constraining the parameter to one would reject every
			// real caller (`Index signature for type 'string' is missing`).
			const { errors, types } = check(`
				interface Props {
					is: string;
					title: string;
				}
				class ClassProps {
					is = 'div';
					title = 'hello';
				}

				const fromInterface = exclude_prop_from_object({ is: 'div', title: 'x' } as Props, 'is');
				const fromClass = exclude_prop_from_object(new ClassProps(), 'is');
			`);

			expect(errors).toEqual([]);
			expect(types.fromInterface).toBe('Omit<Props, "is">');
			expect(types.fromClass).toBe('Omit<ClassProps, "is">');
		});

		it('accepts a nullish props bag', () => {
			const { errors } = check(`
				exclude_prop_from_object(null, 'is');
				exclude_prop_from_object(undefined, 'is');
			`);

			expect(errors).toEqual([]);
		});

		it('stays spreadable into another props bag', () => {
			const { errors, types } = check(`
				const props = { is: 'div', title: 'hello' };
				const spread = { ...exclude_prop_from_object(props, 'is'), extra: true };
			`);

			expect(errors).toEqual([]);
			expect(types.spread).toBe('{ extra: boolean; title: string; }');
		});
	});
});
