import { describe, expect, it } from 'vitest';
import { check_types } from '../shared/type-diagnostics.js';

const IMPORT = `import {
	type IterationValue,
	map_iterable,
} from '../tsrx-runtime/types/iterable.js';`;

describe('iterable helper types', () => {
	it('accepts iterators and the compiler-emitted empty fallback arguments', () => {
		const { errors, types } = check_types(`${IMPORT}
			declare const iterator: Iterator<number>;
			const fromIterator = map_iterable(
				iterator,
				(value) => value * 2,
			);
			const iteratorValue = null as unknown as IterationValue<typeof iterator>;
			const withEmpty = map_iterable(
				new Set<string>(),
				(value) => value.toUpperCase(),
				null,
				() => 'empty',
			);
		`);

		expect(errors).toEqual([]);
		expect(types.fromIterator).toBe('number[]');
		expect(types.iteratorValue).toBe('number');
		expect(types.withEmpty).toBe('string[]');
	});
});
