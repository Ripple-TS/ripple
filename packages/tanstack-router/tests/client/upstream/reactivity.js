// Test-only lifecycle translations. These use Ripple ownership and scheduling;
// the Solid reference runner has its own isolated Solid dependency graph.
import { effect, flushSync, track, trackAsync, untrack } from 'ripple';
export function createSignal(value) {
	const state = track(value, undefined, true);
	return [
		() => state.value,
		(next) => {
			flushSync(() => {
				state.value = typeof next === 'function' ? next(state.value) : next;
			});
			return state.value;
		},
	];
}
export function createMemo(fn) {
	const state = track(fn);
	return () => state.value;
}
export const createEffect = effect;
export const createRenderEffect = effect;
export const onMount = (fn) =>
	effect(() => {
		untrack(fn);
	});
export const onCleanup = (fn) => effect(() => fn);
export const batch = flushSync;
export function createResource(source, fetcher) {
	const result = trackAsync(fetcher ? () => fetcher(source()) : source);
	return [() => result.value];
}
// React's values are translated to explicit .value reads at their call sites.
export function useState(value) {
	const state = track(typeof value === 'function' ? value() : value, undefined, true);
	return [
		state,
		(next) => {
			flushSync(() => {
				state.value = typeof next === 'function' ? next(state.value) : next;
			});
		},
	];
}
export const useRef = (value) => ({ current: value });
export const useMemo = (fn) => track(fn);
export const useCallback = (fn) => fn;
export function useEffect(fn, deps) {
	effect(() => {
		deps?.();
		return untrack(fn);
	});
}
export const useLayoutEffect = useEffect;
export const startTransition = flushSync;
export { act } from '../../react-harness.js';
