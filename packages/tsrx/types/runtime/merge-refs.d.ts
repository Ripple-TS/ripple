export type MergeableRefCallback<T> = (node: T | null) => void | (() => void);
export type MergeableRefObject<T> = { current: T | null };
export type MergeableVueRef<T> = { value: T | null };

export type MergeableRef<T> =
	| MergeableRefCallback<T>
	| MergeableRefObject<T>
	| MergeableVueRef<T>
	| null
	| undefined;

export function mergeRefs<T = any>(...refs: Array<MergeableRef<T>>): (node: T | null) => () => void;
