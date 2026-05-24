import { describe, expect, it } from 'vitest';
import { derived, tracked } from '../../src/runtime/internal/client/runtime.js';

const value_message = /Use \.value or &\[\] lazy destructuring/;
const reference_message = /Use the tracked value directly instead/;

describe('client tracked numeric access', () => {
	it('throws when tracked values are accessed through numeric properties', () => {
		const value = tracked(0);

		expect(() => value[0]).toThrow(value_message);
		expect(() => {
			value[0] = 1;
		}).toThrow(value_message);
		expect(() => value[1]).toThrow(reference_message);
	});

	it('throws when derived values are accessed through numeric properties', () => {
		const value = derived(() => 1);

		expect(() => value[0]).toThrow(value_message);
		expect(() => {
			value[0] = 2;
		}).toThrow(value_message);
		expect(() => value[1]).toThrow(reference_message);
	});
});
