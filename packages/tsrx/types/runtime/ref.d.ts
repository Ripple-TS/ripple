export type MergeableRefCallback<T> = {
	bivarianceHack(node: T | null): void | (() => void);
}['bivarianceHack'];
export type MergeableRefObject<T> = { current: T | null };
export type MergeableVueRef<T> = { value: T | null };
export type RefProp<T = unknown> = (node: T | null) => void | (() => void);
export type RefValue<T = Element> =
	| ((node: T) => void | (() => void))
	| readonly RefValue<T>[]
	| { current: T | null }
	| { value: T | null }
	| T
	| null
	| undefined;

export type MergeableRef<T> =
	MergeableRefCallback<T> | MergeableRefObject<T> | MergeableVueRef<T> | null | undefined;

/**
 * A props bag as it reaches a spread: keys the caller has not narrowed.
 *
 * Accepting bag is spelled `object` at the parameter position — an index
 * signature would reject an interface- or class-typed props bag — while this
 * is what the helpers hand back when they rebuild one.
 */
export type SpreadProps = Record<PropertyKey, unknown>;

/**
 * The node a ref value points at, derived from the ref's own type in the order
 * the runtime resolves it (see `apply_ref_value` and `is_ref_object`): a list
 * resolves through its entries, a callback through its parameter, and a DOM
 * node is never treated as a ref object.
 *
 * Inferring through `RefValue<T>` instead would read the target off the wrong
 * union member: TypeScript prefers a structural member over a naked type
 * parameter, so `HTMLInputElement` would match the `{ value: T | null }`
 * (Vue ref) branch and resolve `T` to `string`.
 */
export type RefTarget<V> = [V] extends [never]
	? never
	: V extends null | undefined
		? never
		: V extends (node: infer N) => unknown
			? N
			: V extends readonly (infer E)[]
				? RefTarget<E>
				: V extends Node
					? V
					: V extends { current: infer C }
						? NonNullable<C>
						: V extends { value: infer C }
							? NonNullable<C>
							: V;

export function mergeRefs<T = Element>(
	...refs: Array<MergeableRef<T>>
): (node: T | null) => () => void;
export function isRefProp(value: unknown): boolean;
// The inference overload comes first so an inferred call resolves the target
// through `RefTarget`; the `T` overload below still serves explicit type
// arguments, which is what every compiler-generated call passes.
export function create_ref_prop<V>(
	get_ref_value: () => V,
	set_ref_value?: (value: RefTarget<V> | null) => void,
): RefProp<RefTarget<V>>;
export function create_ref_prop<T = Element>(
	get_ref_value: () => RefValue<T>,
	set_ref_value?: (value: T | null) => void,
): RefProp<T>;
export function apply_ref_value<V>(
	ref_value: V,
	node: RefTarget<V> | null,
	set_ref_value?: (value: RefTarget<V> | null) => void,
): void | (() => void);
export function apply_ref_value<T = Element>(
	ref_value: RefValue<T>,
	node: T | null,
	set_ref_value?: (value: T | null) => void,
): void | (() => void);
export function merge_ref_props<T = Element>(...refs: Array<RefValue<T>>): RefValue<T>;
export function normalize_spread_props<T extends object | null | undefined>(
	props: T,
	...outer_refs: Array<RefValue<Element>>
): T | SpreadProps;
export function normalize_spread_props_for_ref_attr<T extends object | null | undefined>(
	props: T,
	...outer_refs: Array<RefValue<Element>>
): T | SpreadProps;
