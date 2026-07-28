import { describe, expect, it } from 'vitest';
import { check_types } from '../shared/type-diagnostics.js';

/**
 * These assert the shape consumers get from `@tsrx/runtime/ref` through the
 * compatibility declarations at `@tsrx/core/runtime/ref`, whose
 * declarations are hand-written and easy to regress: every published ref helper
 * is reachable from authored JSX, so a widened parameter or an inferred `any`
 * shows up as worse editor completion long before it shows up as a bug.
 */

const IMPORTS = `import {
	mergeRefs,
	create_ref_prop,
	apply_ref_value,
	merge_ref_props,
	normalize_spread_props,
	normalize_spread_props_for_ref_attr,
} from './types/runtime/ref.js';`;

/** @param {string} body */
function check(body) {
	return check_types(`${IMPORTS}\n${body}`);
}

describe('ref runtime types', () => {
	describe('mergeRefs', () => {
		it('accepts non-null callback refs like native JSX ref types', () => {
			// The bivariance hack in `MergeableRefCallback` is what allows a ref
			// callback declared with a non-null parameter — the shape both the JSX
			// `ref` attribute and the `@ref` keyword produce.
			const { errors, types } = check(`
				function keywordRef(node: HTMLDivElement) {}
				function jsxRef(node: HTMLDivElement) {}

				const merged = mergeRefs(keywordRef, jsxRef);
				const cleanup = merged(document.createElement('div'));
			`);

			expect(errors).toEqual([]);
			expect(types.merged).toBe('(node: HTMLDivElement | null) => () => void');
			expect(types.cleanup).toBe('() => void');
		});

		it('infers the element from a React-style nullable callback ref', () => {
			const { errors, types } = check(`
				const callbackRef = (node: HTMLInputElement | null) => {};
				const merged = mergeRefs(callbackRef);
			`);

			expect(errors).toEqual([]);
			expect(types.merged).toBe('(node: HTMLInputElement | null) => () => void');
		});

		it('infers the element from an object ref, a Vue value ref, and a mix', () => {
			const { errors, types } = check(`
				const objectRef: { current: HTMLDivElement | null } = { current: null };
				const vueRef: { value: HTMLDivElement | null } = { value: null };
				const callbackRef = (node: HTMLDivElement | null) => {};

				const fromObject = mergeRefs(objectRef);
				const fromVue = mergeRefs(vueRef);
				const fromMix = mergeRefs(callbackRef, objectRef, vueRef);
			`);

			expect(errors).toEqual([]);
			expect(types.fromObject).toBe('(node: HTMLDivElement | null) => () => void');
			expect(types.fromVue).toBe('(node: HTMLDivElement | null) => () => void');
			expect(types.fromMix).toBe('(node: HTMLDivElement | null) => () => void');
		});

		it('keeps a callback ref that returns a cleanup', () => {
			const { errors, types } = check(`
				const callbackRef = (node: HTMLDivElement | null) => () => {};
				const merged = mergeRefs(callbackRef);
			`);

			expect(errors).toEqual([]);
			expect(types.merged).toBe('(node: HTMLDivElement | null) => () => void');
		});

		it('carries non-Element node types through', () => {
			// Ripple components can hold refs to values that are not DOM elements,
			// so inference must win over the `Element` default.
			const { errors, types } = check(`
				class Widget {}
				const callbackRef = (node: Widget | null) => {};

				const merged = mergeRefs(callbackRef);
				const cleanup = merged(new Widget());
			`);

			expect(errors).toEqual([]);
			expect(types.merged).toBe('(node: Widget | null) => () => void');
			expect(types.cleanup).toBe('() => void');
		});

		it('falls back to Element only when nothing can be inferred', () => {
			const { errors, types } = check(`
				const empty = mergeRefs();
				const nullish = mergeRefs(null, undefined);
			`);

			expect(errors).toEqual([]);
			expect(types.empty).toBe('(node: Element | null) => () => void');
			expect(types.nullish).toBe('(node: Element | null) => () => void');
		});

		it('is assignable to a React-style ref slot', () => {
			const { errors } = check(`
				type Ref<T> = ((node: T | null) => void) | { current: T | null } | null;

				const callbackRef = (node: HTMLDivElement | null) => {};
				const ref: Ref<HTMLDivElement> = mergeRefs(callbackRef);
			`);

			expect(errors).toEqual([]);
		});
	});

	describe('create_ref_prop / apply_ref_value', () => {
		it('infers the element from the getter and types the setter', () => {
			const { errors, types } = check(`
				let slot: HTMLDivElement | null = null;

				const refProp = create_ref_prop(
					() => slot,
					(value) => {
						slot = value;
					},
				);
				const cleanup = refProp(document.createElement('div'));
			`);

			expect(errors).toEqual([]);
			expect(types.refProp).toBe('RefProp<HTMLDivElement>');
			expect(types.cleanup).toBe('void | (() => void)');
		});

		it('rejects a setter that cannot take the cleared value', () => {
			// The ref prop passes `null` on unmount, so a setter that only accepts
			// the element is a real mistake rather than a strictness artifact.
			const { errors } = check(`
				let slot: HTMLDivElement | null = null;

				create_ref_prop(
					() => slot,
					(value: HTMLDivElement) => {
						slot = value;
					},
				);
			`);

			expect(errors.length).toBeGreaterThan(0);
		});

		it('resolves elements that carry a `value` property to the element', () => {
			// `RefValue<T>`'s Vue-ref branch is `{ value: T | null }`, and TS prefers
			// a structural union member over the bare `T` — so inferring through it
			// used to read the target off `HTMLInputElement['value']` and land on
			// `RefProp<string>`. `RefTarget` resolves DOM nodes first, as the runtime
			// does. Every element with a `value` property is affected: input, button,
			// select, textarea, option, li, progress, meter, output, data.
			const { errors, types } = check(`
				let input: HTMLInputElement | null = null;
				let progress: HTMLProgressElement | null = null;
				let either: HTMLInputElement | HTMLTextAreaElement | null = null;

				const inputRef = create_ref_prop(
					() => input,
					(value) => {
						input = value;
					},
				);
				const progressRef = create_ref_prop(
					() => progress,
					(value) => {
						progress = value;
					},
				);
				const eitherRef = create_ref_prop(
					() => either,
					(value) => {
						either = value;
					},
				);
			`);

			expect(errors).toEqual([]);
			expect(types.inputRef).toBe('RefProp<HTMLInputElement>');
			expect(types.progressRef).toBe('RefProp<HTMLProgressElement>');
			expect(types.eitherRef).toBe('RefProp<HTMLInputElement | HTMLTextAreaElement>');
		});

		it('keeps resolving explicit type arguments, which generated code passes', () => {
			// The type-only transform emits `create_ref_prop<HTMLInputElement>(…)`
			// with the element type read off the tag name, so the second overload
			// has to stay reachable.
			const { errors, types } = check(`
				let slot: HTMLInputElement | null = null;

				const refProp = create_ref_prop<HTMLInputElement>(
					() => slot,
					(value) => {
						slot = value;
					},
				);
				const cleanup = refProp(document.createElement('input'));
			`);

			expect(errors).toEqual([]);
			expect(types.refProp).toBe('RefProp<HTMLInputElement>');
			expect(types.cleanup).toBe('void | (() => void)');
		});

		it('resolves a ref object, a Vue value ref and a non-DOM holder', () => {
			const { errors, types } = check(`
				const objectRef: { current: HTMLInputElement | null } = { current: null };
				const vueRef: { value: HTMLDivElement | null } = { value: null };
				class Widget {}
				let widget: Widget | null = null;

				const fromObject = create_ref_prop(() => objectRef);
				const fromVue = create_ref_prop(() => vueRef);
				const fromWidget = create_ref_prop(
					() => widget,
					(value) => {
						widget = value;
					},
				);
			`);

			expect(errors).toEqual([]);
			expect(types.fromObject).toBe('RefProp<HTMLInputElement>');
			expect(types.fromVue).toBe('RefProp<HTMLDivElement>');
			expect(types.fromWidget).toBe('RefProp<Widget>');
		});

		it('applies every ref shape a `ref` attribute can hold', () => {
			const { errors, types } = check(`
				const objectRef: { current: HTMLDivElement | null } = { current: null };
				const node = document.createElement('div');

				const fromObject = apply_ref_value(objectRef, node);
				const fromCallback = apply_ref_value((element: HTMLDivElement) => {}, node);
				const fromList = apply_ref_value([objectRef], node);
				const fromNull = apply_ref_value(null, node);
			`);

			expect(errors).toEqual([]);
			expect(types.fromObject).toBe('void | (() => void)');
			expect(types.fromCallback).toBe('void | (() => void)');
			expect(types.fromList).toBe('void | (() => void)');
			expect(types.fromNull).toBe('void | (() => void)');
		});
	});

	describe('merge_ref_props', () => {
		it('returns a ref value, since a lone ref passes through unchanged', () => {
			// The runtime hands back `refs[0]` when only one survives, so the result
			// is whatever ref shape that was — not necessarily a callback.
			const { errors, types } = check(`
				const callbackRef = (node: HTMLDivElement | null) => {};
				const objectRef: { current: HTMLDivElement | null } = { current: null };

				const merged = merge_ref_props(callbackRef, objectRef);
			`);

			expect(errors).toEqual([]);
			expect(types.merged).toBe('RefValue<HTMLDivElement>');
		});

		it('is assignable to a ref slot', () => {
			const { errors } = check(`
				const callbackRef = (node: HTMLDivElement | null) => {};
				const ref: RefValueSlot = merge_ref_props(callbackRef);

				type RefValueSlot = ReturnType<typeof merge_ref_props<HTMLDivElement>>;
			`);

			expect(errors).toEqual([]);
		});
	});

	describe('normalize_spread_props', () => {
		it('accepts an interface-typed props bag, not just an index-signature one', () => {
			// A component's props are almost always an interface, which has no
			// implicit index signature; constraining to one would reject every
			// real caller.
			const { errors, types } = check(`
				interface Props {
					className: string;
					onClick(): void;
				}

				const props: Props = { className: 'a', onClick() {} };
				const normalized = normalize_spread_props(props);
				const forAttr = normalize_spread_props_for_ref_attr(props);
			`);

			expect(errors).toEqual([]);
			expect(types.normalized).toBe('Props | SpreadProps');
			expect(types.forAttr).toBe('Props | SpreadProps');
		});

		it('keeps a nullish props bag nullish and spreads cleanly', () => {
			const { errors, types } = check(`
				const empty = normalize_spread_props(null);
				const props = { className: 'a' };
				const spread = { ...normalize_spread_props(props) };
			`);

			expect(errors).toEqual([]);
			expect(types.empty).toBe('SpreadProps | null');
			expect(types.spread).toBe(
				'{ [x: string]: unknown; [x: number]: unknown; [x: symbol]: unknown; } | { className: string; }',
			);
		});

		it('takes ref values as the outer refs', () => {
			const { errors } = check(`
				const objectRef: { current: Element | null } = { current: null };
				normalize_spread_props({ className: 'a' }, objectRef, null);
			`);

			expect(errors).toEqual([]);
		});
	});
});
