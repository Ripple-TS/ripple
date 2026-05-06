import { describe, expect, it } from 'vitest';
import { create_ref_prop, mergeRefs } from '../../src/runtime/ref.js';

describe('ref runtime helpers', () => {
	it('clears mutable ref props on unmount without treating DOM-like values as ref objects', () => {
		const input_like = {
			nodeType: 1,
			nodeName: 'INPUT',
			value: 'keep',
		};
		let slot = undefined;
		const ref = create_ref_prop(
			() => slot,
			(value) => {
				slot = value;
			},
		);

		ref(input_like);
		expect(slot).toBe(input_like);

		ref(null);
		expect(slot).toBeNull();
		expect(input_like.value).toBe('keep');
	});

	it('returns cleanup for mutable ref props', () => {
		const node = {};
		let slot = undefined;
		const ref = create_ref_prop(
			() => slot,
			(value) => {
				slot = value;
			},
		);

		const cleanup = ref(node);
		expect(slot).toBe(node);
		expect(typeof cleanup).toBe('function');

		cleanup();
		expect(slot).toBeNull();
	});

	it('still assigns real current and value ref objects by own property', () => {
		const node = {};
		const current_ref = { current: null };
		const value_ref = { value: null };
		let current_slot = current_ref;
		let value_slot = value_ref;

		create_ref_prop(
			() => current_slot,
			(value) => {
				current_slot = value;
			},
		)(node);
		create_ref_prop(
			() => value_slot,
			(value) => {
				value_slot = value;
			},
		)(node);

		expect(current_ref.current).toBe(node);
		expect(value_ref.value).toBe(node);
		expect(current_slot).toBe(current_ref);
		expect(value_slot).toBe(value_ref);
	});

	it('assigns Vue-style ref objects marked with __v_isRef even when value is inherited', () => {
		const node = {};
		const vue_ref = Object.create({ value: null });
		vue_ref.__v_isRef = true;

		create_ref_prop(
			() => vue_ref,
			() => {
				throw new Error('setter should not run for Vue refs');
			},
		)(node);

		expect(vue_ref.value).toBe(node);
	});

	it('assigns value ref objects with inherited accessors', () => {
		const node = {};
		let stored = null;
		const value_ref = Object.create({
			get value() {
				return stored;
			},
			set value(value) {
				stored = value;
			},
		});

		create_ref_prop(
			() => value_ref,
			() => {
				throw new Error('setter should not run for inherited accessor value refs');
			},
		)(node);

		expect(stored).toBe(node);
	});

	it('does not mutate objects that only inherit current or value properties when merging refs', () => {
		const inherited_ref_shape = Object.create({ current: 'inherited', value: 'inherited' });
		const merged = mergeRefs(inherited_ref_shape);

		const cleanup = merged({});
		cleanup();

		expect(inherited_ref_shape.current).toBe('inherited');
		expect(inherited_ref_shape.value).toBe('inherited');
		expect(Object.prototype.hasOwnProperty.call(inherited_ref_shape, 'current')).toBe(false);
		expect(Object.prototype.hasOwnProperty.call(inherited_ref_shape, 'value')).toBe(false);
	});
});
