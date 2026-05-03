import type { ExtendedEventOptions } from '@tsrx/core/types';
export type { AddEventOptions, AddEventObject, ExtendedEventOptions } from '@tsrx/core/types';

export type Component<T = Record<string, any>> = (props: T) => void;

declare const TSRX_ELEMENT: unique symbol;

export type TSRXElement = {
	readonly render: Function;
	readonly [TSRX_ELEMENT]: true;
};

/** Type for implicit children fragments rendered with `{children}`. */
export type Children = TSRXElement | Component | string | number | boolean | null | undefined;

export function tsrx_element(render: Function): TSRXElement;

export function mount(
	component: Component,
	options: { target: HTMLElement; props?: Record<string, any> },
): () => void;

export function hydrate(
	component: Component,
	options: { target: HTMLElement; props?: Record<string, any> },
): () => void;

export function tick(): Promise<void>;

export function untrack<T>(fn: () => T): T;

export function flushSync<T>(fn?: () => T): T;

export function effect(fn: (() => void) | (() => () => void)): void;

export interface RippleArrayStatics {
	from: {
		<T>(array_like: ArrayLike<T>): RippleArray<T>;
		<T, U>(
			array_like: ArrayLike<T>,
			mapfn: (value: T, index: number) => U,
			this_arg?: any,
		): RippleArray<U>;
		<T>(iterable: Iterable<T>): RippleArray<T>;
		<T, U>(
			iterable: Iterable<T>,
			mapfn: (value: T, index: number) => U,
			this_arg?: any,
		): RippleArray<U>;
	};

	of: {
		<T>(...items: T[]): RippleArray<T>;
	};

	fromAsync: {
		<T>(
			iterable_or_array_like: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
		): Promise<RippleArray<Awaited<T>>>;
		<T, U>(
			iterable_or_array_like: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
			mapfn: (value: Awaited<T>, index: number) => U | PromiseLike<U>,
			this_arg?: any,
		): Promise<RippleArray<Awaited<U>>>;
	};
}
export interface RippleArrayCallable extends RippleArrayStatics {
	<T>(...elements: T[]): RippleArray<T>;
}
export interface RippleArrayConstructor extends RippleArrayStatics {
	new <T>(...elements: T[]): RippleArray<T>;
}
export interface RippleArray<T> extends Array<T> {}
export const RippleArray: RippleArrayConstructor;

export interface ContextCallable {
	<T = undefined>(initial_value?: T): Context<T>;
}
export interface ContextConstructor {
	new <T = undefined>(initial_value?: T): Context<T>;
}
declare const CONTEXT_BRAND: unique symbol;
export interface Context<T = undefined> {
	get(): T;
	set(value: T): void;
	[CONTEXT_BRAND]: void;
}
export declare const Context: ContextConstructor;

export interface RippleSetCallable {
	<T>(values?: readonly T[] | null): RippleSet<T>;
}
export interface RippleSetConstructor {
	new <T>(values?: readonly T[] | null): RippleSet<T>;
}
declare const RIPPLE_SET_BRAND: unique symbol;
export interface RippleSet<T> extends Set<T> {
	isDisjointFrom<U>(other: ReadonlySetLike<U> | RippleSet<U>): boolean;
	isSubsetOf<U>(other: ReadonlySetLike<U> | RippleSet<U>): boolean;
	isSupersetOf<U>(other: ReadonlySetLike<U> | RippleSet<U>): boolean;
	difference<U>(other: ReadonlySetLike<U> | RippleSet<U>): RippleSet<T>;
	intersection<U>(other: ReadonlySetLike<U> | RippleSet<U>): RippleSet<T & U>;
	symmetricDifference<U>(other: ReadonlySetLike<U> | RippleSet<U>): RippleSet<T | U>;
	union<U>(other: ReadonlySetLike<U> | RippleSet<U>): RippleSet<T | U>;
	toJSON(): T[];
	[RIPPLE_SET_BRAND]: void;
}
export const RippleSet: RippleSetConstructor;

export interface RippleMapCallable {
	<K, V>(entries?: readonly (readonly [K, V])[] | null): RippleMap<K, V>;
}
export interface RippleMapConstructor {
	new <K, V>(entries?: readonly (readonly [K, V])[] | null): RippleMap<K, V>;
}
declare const RIPPLE_MAP_BRAND: unique symbol;
export interface RippleMap<K, V> extends Map<K, V> {
	toJSON(): [K, V][];
	[RIPPLE_MAP_BRAND]: void;
}
export const RippleMap: RippleMapConstructor;

// Compiler-injected runtime symbols (for Ripple component development)
declare global {
	/**
	 * Runtime block context injected by the Ripple compiler.
	 * This is automatically available in component scopes and passed to runtime functions.
	 */
	var __block: any;

	/**
	 * Ripple runtime namespace - injected by the compiler
	 * These functions are available in compiled Ripple components for TypeScript analysis
	 */
	var _$_: {
		tracked<T>(value: T, block?: any): T;
		computed<T>(fn: () => T, block?: any): T;
		scope(): any;
		get_tracked(node: any): any;
		get_derived(node: any): any;
		set(node: any, value: any): any;
		document: Document;
		// Add other runtime functions as needed for TypeScript analysis
	};
}

export function createRefKey(): symbol;

export const UNINITIALIZED: unique symbol;
export const DERIVED_UPDATED: unique symbol;
export const SUSPENSE_PENDING: unique symbol;
export const SUSPENSE_REJECTED: unique symbol;

// Base Tracked interface - all tracked values have a '#v' property containing the actual value
interface TrackedBase<V> {
	'#v': V;
	value: V;
}
// Augment Tracked to be callable when V is a Component
// This allows <@Something /> to work in JSX when Something is Tracked<Component>
interface TrackedCallable<V> {
	(props: V extends Component<infer P> ? P : never): V extends Component ? void : never;
}
// Supports indexed access: track(0)[0] → value, track(0)[1] → Tracked<V>
// And destructuring `const [one, two] = track(0);`
export type Tracked<V> = [V, Tracked<V>] & TrackedBase<V> & TrackedCallable<V>;

// Helper type to infer component type from a function that returns a component
// If T is a function returning a Component, extract the Component type itself, not the return type (void)
export type InferComponent<T> = T extends () => infer R ? (R extends Component<any> ? R : T) : T;

export type Props<K extends PropertyKey = any, V = unknown> = Record<K, V>;
export type PropsWithExtras<T extends object> = Props & T & Record<string, unknown>;
export type PropsWithChildren<T extends object = {}> = Expand<
	Omit<T, 'children'> & { children: Children }
>;
export type PropsWithChildrenOptional<T extends object = {}> = Expand<
	Omit<T, 'children'> & { children?: Children }
>;
export type PropsNoChildren<T extends object = {}> = Expand<T>;

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export function get<V>(tracked: Tracked<V>): V;

export function set<V>(tracked: Tracked<V>, value: V): void;

// Overload for tracked values - returns the original tracked value type
export function track<V>(value: Tracked<V>): Tracked<V>;
// Overload for function values - infers the return type of the function
export function track<V>(
	value: () => V,
	get?: (v: InferComponent<V>) => InferComponent<V>,
	set?: (next: InferComponent<V>, prev: InferComponent<V>) => InferComponent<V>,
): Tracked<InferComponent<V>>;
// Overload for non-function values
export function track<V>(value?: V, get?: (v: V) => V, set?: (next: V, prev: V) => V): Tracked<V>;

export function trackAsync<V>(
	value: () => PromiseLike<V> | { promise: PromiseLike<V>; abortController: AbortController },
): Tracked<V>;

export function trackPending<V>(value: Tracked<V> | (() => any)): boolean;

export function peek<V>(tracked: Tracked<V>): V;

export type OnEventListenerRemover = () => void;

export function on<Type extends keyof WindowEventMap>(
	window: Window,
	type: Type,
	handler: (this: Window, event: WindowEventMap[Type]) => any,
	options?: ExtendedEventOptions | undefined,
): OnEventListenerRemover;

export function on<Type extends keyof DocumentEventMap>(
	document: Document,
	type: Type,
	handler: (this: Document, event: DocumentEventMap[Type]) => any,
	options?: ExtendedEventOptions | undefined,
): OnEventListenerRemover;

export function on<Element extends HTMLElement, Type extends keyof HTMLElementEventMap>(
	element: Element,
	type: Type,
	handler: (this: Element, event: HTMLElementEventMap[Type]) => any,
	options?: ExtendedEventOptions | undefined,
): OnEventListenerRemover;

export function on<Element extends MediaQueryList, Type extends keyof MediaQueryListEventMap>(
	element: Element,
	type: Type,
	handler: (this: Element, event: MediaQueryListEventMap[Type]) => any,
	options?: ExtendedEventOptions | undefined,
): OnEventListenerRemover;

export function on(
	element: EventTarget,
	type: string,
	handler: EventListener,
	options?: ExtendedEventOptions | undefined,
): OnEventListenerRemover;

export type RippleObjectShallow<T> = {
	[K in keyof T]: T[K] | Tracked<T[K]>;
};

export type RippleObjectDeep<T> = T extends
	| string
	| number
	| boolean
	| null
	| undefined
	| symbol
	| bigint
	? T | Tracked<T>
	: T extends RippleArray<infer U>
		? RippleArray<U> | Tracked<RippleArray<U>>
		: T extends RippleSet<infer U>
			? RippleSet<U> | Tracked<RippleSet<U>>
			: T extends RippleMap<infer K, infer V>
				? RippleMap<K, V> | Tracked<RippleMap<K, V>>
				: T extends Array<infer U>
					? Array<RippleObjectDeep<U>> | Tracked<Array<RippleObjectDeep<U>>>
					: T extends Set<infer U>
						? Set<RippleObjectDeep<U>> | Tracked<Set<RippleObjectDeep<U>>>
						: T extends Map<infer K, infer V>
							?
									| Map<RippleObjectDeep<K>, RippleObjectDeep<V>>
									| Tracked<Map<RippleObjectDeep<K>, RippleObjectDeep<V>>>
							: T extends object
								? { [K in keyof T]: RippleObjectDeep<T[K]> | Tracked<RippleObjectDeep<T[K]>> }
								: T | Tracked<T>;

export interface RippleObjectCallable {
	<T extends Object>(obj: T): RippleObject<T>;
}
export interface RippleObjectConstructor {
	new <T extends Object>(obj: T): RippleObject<T>;
}
export type RippleObject<T> = { [K in keyof T]: T[K] };
export const RippleObject: RippleObjectConstructor;

export interface RippleDateCallable {
	(): RippleDate;
	(value: number | string): RippleDate;
	(
		year: number,
		monthIndex: number,
		date?: number,
		hours?: number,
		minutes?: number,
		seconds?: number,
		ms?: number,
	): RippleDate;
}
export interface RippleDateConstructor {
	new (): RippleDate;
	new (value: number | string): RippleDate;
	new (
		year: number,
		monthIndex: number,
		date?: number,
		hours?: number,
		minutes?: number,
		seconds?: number,
		ms?: number,
	): RippleDate;
}
declare const RIPPLE_DATE_BRAND: unique symbol;
export interface RippleDate extends Date {
	[RIPPLE_DATE_BRAND]: void;
}
export const RippleDate: RippleDateConstructor;

export interface RippleURLSearchParamsCallable {
	(
		init?:
			| string
			| readonly (readonly [string, string])[]
			| Record<string, string>
			| URLSearchParams
			| RippleURLSearchParams,
	): RippleURLSearchParams;
}
export interface RippleURLSearchParamsConstructor {
	new (
		init?:
			| string
			| readonly (readonly [string, string])[]
			| Record<string, string>
			| URLSearchParams
			| RippleURLSearchParams,
	): RippleURLSearchParams;
}
declare const REPLACE: unique symbol;
declare const RIPPLE_URL_SEARCH_PARAMS_BRAND: unique symbol;
export interface RippleURLSearchParams extends URLSearchParams {
	[REPLACE](params: URLSearchParams): void;
	[RIPPLE_URL_SEARCH_PARAMS_BRAND]: void;
}
export const RippleURLSearchParams: RippleURLSearchParamsConstructor;

export interface RippleURLCallable {
	(url: string | URL, base?: string | URL | RippleURL): RippleURL;
}
export interface RippleURLConstructor {
	new (url: string | URL, base?: string | URL | RippleURL): RippleURL;
}
declare const RIPPLE_URL_BRAND: unique symbol;
export interface RippleURL extends URL {
	get searchParams(): RippleURLSearchParams;
	[RIPPLE_URL_BRAND]: void;
}
export const RippleURL: RippleURLConstructor;

export function createSubscriber(start: () => void | (() => void)): () => void;

declare const REACTIVE_VALUE_BRAND: unique symbol;
export interface ReactiveValue<V> extends Tracked<V> {
	new (fn: () => Tracked<V>, start: () => void | (() => void)): Tracked<V>;
	[REACTIVE_VALUE_BRAND]: void;
}

export interface MediaQueryCallable {
	(query: string, fallback?: boolean | undefined): Tracked<boolean>;
}
export interface MediaQueryConstructor {
	new (query: string, fallback?: boolean | undefined): Tracked<boolean>;
}
declare const MEDIA_QUERY_BRAND: unique symbol;
export interface MediaQuery extends Tracked<boolean> {
	[MEDIA_QUERY_BRAND]: void;
}
export const MediaQuery: MediaQueryConstructor;

export function Portal<V = HTMLElement>({
	target,
	children,
}: {
	target: V;
	children?: Children;
}): void;

export type GetFunction<V> = () => V;
export type SetFunction<V> = (v: V) => void;

export function bindValue<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLInputElement | HTMLSelectElement) => void;
export function bindValue<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLInputElement | HTMLSelectElement) => void;

export function bindChecked<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLInputElement) => void;
export function bindChecked<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLInputElement) => void;

export function bindClientWidth<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindClientWidth<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindClientHeight<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindClientHeight<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindContentRect<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindContentRect<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindContentBoxSize<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindContentBoxSize<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindBorderBoxSize<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindBorderBoxSize<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindDevicePixelContentBoxSize<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindDevicePixelContentBoxSize<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindInnerHTML<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindInnerHTML<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindInnerText<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindInnerText<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindTextContent<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindTextContent<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindNode<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindNode<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindGroup<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLInputElement) => void;
export function bindGroup<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLInputElement) => void;

export function bindOffsetHeight<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindOffsetHeight<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindOffsetWidth<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLElement) => void;
export function bindOffsetWidth<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLElement) => void;

export function bindIndeterminate<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLInputElement) => void;
export function bindIndeterminate<V>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<NonNullable<V>>,
): (node: HTMLInputElement) => void;

export function bindFiles<V extends FileList>(
	tracked: Tracked<V> | GetFunction<V>,
	setter?: SetFunction<V>,
): (node: HTMLInputElement) => void;
export function bindFiles<V extends FileList>(
	tracked: Tracked<V | null | undefined> | GetFunction<V | null | undefined>,
	setter?: SetFunction<V>,
): (node: HTMLInputElement) => void;
