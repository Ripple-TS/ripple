import { describe, expect, it } from 'vitest';
import { track } from 'ripple';
import { lazy_array_set, lazy_array_update } from '../../src/runtime/internal/client/runtime.js';

const value_message = /Use \.value or &\[\] lazy destructuring/;
const reference_message = /Use the tracked value directly instead/;

describe('client tracked numeric access', () => {
	it('throws when tracked values are accessed through numeric properties', () => {
		let value: any;

		component Test() {
			value = track(0);
			<div />
		}

		render(Test);

		expect(() => value[0]).toThrow(value_message);
		expect(() => {
			value[0] = 1;
		}).toThrow(value_message);
		expect(() => value[1]).toThrow(reference_message);
	});

	it('throws when derived values are accessed through numeric properties', () => {
		let value: any;

		component Test() {
			value = track(() => 1);
			<div />
		}

		render(Test);

		expect(() => value[0]).toThrow(value_message);
		expect(() => {
			value[0] = 2;
		}).toThrow(value_message);
		expect(() => value[1]).toThrow(reference_message);
	});

	it('sets tracked lazy index 0 and rejects tracked lazy index 1', () => {
		let value: any;
		let next: any;

		component Test() {
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
});
