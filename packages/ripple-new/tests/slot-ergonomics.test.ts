import { describe, it, expect } from 'vitest';
import {
	useState,
	useReducer,
	useEffect,
	useLayoutEffect,
	useInsertionEffect,
	useMemo,
	useCallback,
	useRef,
	useId,
	useImperativeHandle,
	useEffectEvent,
	useTransition,
	useDeferredValue,
	useSyncExternalStore,
} from '../src/index.js';

// The `slot: symbol` argument on every hook is COMPILER-INJECTED.
// @tsrx/ripple-new appends a `Symbol.for(stableId)` to every hook call so
// each call site has a stable identity within its scope and across HMR.
// Public TypeScript signature is now `slot?: symbol` so authors writing
// `useState(0)` in their editor don't see a confusing "Expected 2 args"
// diagnostic. At runtime the hook throws if the slot is missing — almost
// always because the source was loaded outside the Vite plugin. The
// escape hatch is documented: `useState(0, Symbol.for('my-id'))`.

describe('slot ergonomics — public signature hides the compiler-injected slot', () => {
	it('useState without a slot throws a clear, actionable error', () => {
		expect(() => useState(0)).toThrow(/useState was called without a slot symbol/);
		expect(() => useState(0)).toThrow(/@tsrx\/ripple-new\/vite/);
		expect(() => useState(0)).toThrow(/Symbol\.for/);
	});

	it.each([
		['useReducer', () => useReducer((s: number, a: number) => s + a, 0)],
		['useEffect', () => useEffect(() => {}, [])],
		['useLayoutEffect', () => useLayoutEffect(() => {}, [])],
		['useInsertionEffect', () => useInsertionEffect(() => {}, [])],
		['useMemo', () => useMemo(() => 0, [])],
		['useCallback', () => useCallback(() => 0, [])],
		['useRef', () => useRef(0)],
		['useId', () => useId()],
		['useEffectEvent', () => useEffectEvent(() => 0)],
		['useTransition', () => useTransition()],
		['useImperativeHandle', () => useImperativeHandle({ current: null }, () => ({}), [])],
		['useDeferredValue', () => useDeferredValue(0)],
		[
			'useSyncExternalStore',
			() =>
				useSyncExternalStore(
					() => () => {},
					() => 0,
				),
		],
	])('%s without a slot throws naming the hook', (name, call) => {
		expect(call).toThrow(new RegExp(`${name} was called without a slot symbol`));
	});
});
