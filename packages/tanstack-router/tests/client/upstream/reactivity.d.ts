import type { Children, Component, Derived, JSX, Tracked } from 'ripple';
export type { Children, Component, CSSProperties, JSX } from 'ripple';
export type ParentProps<P = {}> = P & { children?: Children };
export type ReactNode = Children;
export type ComponentProps<T> = T extends keyof JSX.IntrinsicElements
	? JSX.IntrinsicElements[T]
	: T extends Component<infer P>
		? P
		: never;
export type ComponentPropsWithoutRef<T> = Omit<ComponentProps<T>, 'ref'>;
export type ComponentPropsWithRef<T> = ComponentProps<T>;
export type Setter<T> = (value: T | ((previous: T) => T)) => T;
export type SyntheticEvent<T = Element> = Event & { currentTarget: T };
export type MouseEvent<T = Element> = globalThis.MouseEvent & { currentTarget: T };
export type TouchEvent<T = Element> = globalThis.TouchEvent & { currentTarget: T };
export type FocusEvent<T = Element> = globalThis.FocusEvent & { currentTarget: T };
export type FC<P = {}> = Component<P>;
export function createSignal<T = undefined>(value?: T): [() => T, Setter<T>];
export function createMemo<T>(read: () => T): () => T;
export const createEffect: typeof import('ripple').effect;
export const createRenderEffect: typeof import('ripple').effect;
export function onMount(callback: () => void): void;
export function onCleanup(callback: () => void): void;
export const batch: typeof import('ripple').flushSync;
export function createResource<T>(fetcher: () => Promise<T>): [() => T];
export function createResource<S, T>(
	source: () => S,
	fetcher: (source: S) => Promise<T>,
): [() => T];
export function useState<T>(
	value: T | (() => T),
): [Tracked<T>, (value: T | ((previous: T) => T)) => void];
export function useRef<T>(value: T): { current: T };
export function useMemo<T>(read: () => T): Derived<T>;
export function useCallback<T>(callback: T): T;
export function useEffect(callback: () => void | (() => void), dependencies?: () => unknown): void;
export const useLayoutEffect: typeof useEffect;
export const startTransition: typeof import('ripple').flushSync;
export { act } from '../../react-harness.js';
