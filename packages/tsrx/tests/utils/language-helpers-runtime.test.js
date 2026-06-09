import { describe, expect, it } from 'vitest';
import { exclude_prop_from_object } from '../../src/runtime/language-helpers.js';

describe('language runtime helpers', () => {
	it('excludes a prop while preserving live getter reads', () => {
		let value = 'initial';
		let reads = 0;
		const symbol = Symbol('live');
		const props = {
			is: 'div',
			static: 'static',
			get live() {
				reads++;
				return value;
			},
			get [symbol]() {
				return `${value}-symbol`;
			},
		};

		Object.defineProperty(props, 'hidden', {
			enumerable: false,
			value: 'hidden',
		});

		const rest = exclude_prop_from_object(props, 'is');

		expect(reads).toBe(0);
		expect(Reflect.ownKeys(rest)).toEqual(['static', 'live', symbol]);
		expect(rest.is).toBeUndefined();
		expect(rest.hidden).toBeUndefined();

		expect(rest.live).toBe('initial');
		expect(reads).toBe(1);

		value = 'updated';
		expect(rest.live).toBe('updated');
		expect(rest[symbol]).toBe('updated-symbol');
	});

	it('forwards writes when the original prop is writable or setter-backed', () => {
		let accessor_value = 'initial';
		const props = {
			is: 'div',
			writable: 'before',
			readonly: 'fixed',
			get accessor() {
				return accessor_value;
			},
			set accessor(value) {
				accessor_value = value;
			},
		};

		Object.defineProperty(props, 'readonly', {
			enumerable: true,
			writable: false,
			value: 'fixed',
		});

		const rest = exclude_prop_from_object(props, 'is');

		rest.writable = 'after';
		expect(props.writable).toBe('after');
		expect(rest.writable).toBe('after');

		rest.accessor = 'updated';
		expect(accessor_value).toBe('updated');
		expect(rest.accessor).toBe('updated');

		expect(Object.getOwnPropertyDescriptor(rest, 'readonly')?.set).toBeUndefined();
		expect(() => {
			rest.readonly = 'changed';
		}).toThrow(TypeError);
		expect(rest.readonly).toBe('fixed');
	});

	it('returns an empty object for nullish props', () => {
		expect(exclude_prop_from_object(null, 'is')).toEqual({});
		expect(exclude_prop_from_object(undefined, 'is')).toEqual({});
	});
});
