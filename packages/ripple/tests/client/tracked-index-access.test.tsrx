import { describe, expect, it } from 'vitest';
import { track } from 'ripple';
import {
	lazy_array_get,
	lazy_array_set,
	lazy_array_update,
} from '../../src/runtime/internal/client/runtime.js';

const value_message = /Use \.value or &\[\] lazy destructuring/;
const reference_message = /Use the tracked value directly instead/;
const value_index = Number(0);
const reference_index = Number(1);

describe('client tracked numeric access', () => {
	it('throws when tracked values are accessed through numeric properties', () => {
		let value: any;

		function Test() @{
			value = track(0);
			<div />
		}

		render(Test);

		expect(() => value[value_index]).toThrow(value_message);
		expect(() => {
			value[value_index] = 1;
		}).toThrow(value_message);
		expect(() => value[reference_index]).toThrow(reference_message);
	});

	it('throws when derived values are accessed through numeric properties', () => {
		let value: any;

		function Test() @{
			value = track(() => 1);
			<div />
		}

		render(Test);

		expect(() => value[value_index]).toThrow(value_message);
		expect(() => {
			value[value_index] = 2;
		}).toThrow(value_message);
		expect(() => value[reference_index]).toThrow(reference_message);
	});

	it('sets tracked lazy index 0 and rejects tracked lazy index 1', () => {
		let value: any;
		let next: any;

		function Test() @{
			value = track(0);
			next = track(1);
			<div />
		}

		render(Test);

		lazy_array_set(value, 2, 0);
		expect(value.value).toBe(2);
		expect(() => {
			lazy_array_set(value, next, 1);
		}).toThrow(reference_message);
		expect(() => {
			lazy_array_update(value, 1);
		}).toThrow(reference_message);
	});

	it('returns undefined for tracked lazy indexes past the tuple length', () => {
		let value: any;
		let derived: any;

		function Test() @{
			value = track(0);
			derived = track(() => value.value + 1);
			<div />
		}

		render(Test);

		expect(lazy_array_get(value, 0)).toBe(0);
		expect(lazy_array_get(value, 1)).toBe(value);
		expect(lazy_array_get(value, 2)).toBeUndefined();
		expect(lazy_array_get(derived, 0)).toBe(1);
		expect(lazy_array_get(derived, 1)).toBe(derived);
		expect(lazy_array_get(derived, 2)).toBeUndefined();
	});

	it('ignores tracked lazy writes past the tuple length', () => {
		let value: any;
		let derived: any;

		function Test() @{
			value = track(0);
			derived = track(() => value.value + 1);
			<div />
		}

		render(Test);

		lazy_array_set(value, 10, 2);
		lazy_array_update(value, 2);
		lazy_array_set(derived, 20, 2);
		lazy_array_update(derived, 2);

		expect(lazy_array_get(value, 2)).toBeUndefined();
		expect(lazy_array_get(derived, 2)).toBeUndefined();
		expect(Object.hasOwn(value, 2)).toBe(false);
		expect(Object.hasOwn(derived, 2)).toBe(false);
	});
});
