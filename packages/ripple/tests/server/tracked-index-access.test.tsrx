import { describe, expect, it } from 'vitest';
import { track } from '../../src/runtime/internal/server/index.js';

const value_message = /Use \.value or &\[\] lazy destructuring/;
const reference_message = /Use the tracked value directly instead/;

describe('server tracked numeric access', () => {
	it('throws when tracked values are accessed through numeric properties', () => {
		const value = track(0, 'tracked');

		expect(() => value[0]).toThrow(value_message);
		expect(() => {
			value[0] = 1;
		}).toThrow(value_message);
		expect(() => value[1]).toThrow(reference_message);
	});

	it('throws when derived values are accessed through numeric properties', () => {
		const value = track(() => 1, 'derived');

		expect(() => value[0]).toThrow(value_message);
		expect(() => {
			value[0] = 2;
		}).toThrow(value_message);
		expect(() => value[1]).toThrow(reference_message);
	});
});
