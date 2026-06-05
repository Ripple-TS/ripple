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
	| MergeableRefCallback<T>
	| MergeableRefObject<T>
	| MergeableVueRef<T>
	| null
	| undefined;

export function mergeRefs<T = any>(...refs: Array<MergeableRef<T>>): (node: T | null) => () => void;
export function isRefProp(value: unknown): boolean;
export function create_ref_prop<T = Element>(
	get_ref_value: () => RefValue<T>,
	set_ref_value?: (value: any) => void,
): RefProp<T>;
export function apply_ref_value<T>(
	ref_value: unknown,
	node: T | null,
	set_ref_value?: (value: T) => void,
): void | (() => void);
export function merge_ref_props<T = any>(
	...refs: unknown[]
): undefined | ((node: T | null) => void | (() => void));
export function normalize_spread_props<T extends Record<PropertyKey, any> | null | undefined>(
	props: T,
	...outer_refs: unknown[]
): T | Record<PropertyKey, any>;
export function normalize_spread_props_for_ref_attr<
	T extends Record<PropertyKey, any> | null | undefined,
>(props: T, ...outer_refs: unknown[]): T | Record<PropertyKey, any>;
