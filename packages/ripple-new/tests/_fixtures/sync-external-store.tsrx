import { useSyncExternalStore, useCallback } from 'ripple-new';

// Smallest practical store: a mutable counter with a Set of listeners.
// Identical-by-reference subscribe / getSnapshot keep the useEffect deps
// stable across renders — re-mounting / re-subscribing only when a fresh
// store identity flows in.
export function makeStore(initial = 0) {
	let value = initial;
	const listeners = new Set();
	return {
		get: () => value,
		set: (next) => {
			value = next;
			for (const l of listeners) l();
		},
		subscribe: (notify) => {
			listeners.add(notify);
			return () => {
				listeners.delete(notify);
			};
		},
		listenerCount: () => listeners.size,
	};
}

// Reads the snapshot via useSyncExternalStore and renders it. Memoized
// `subscribe` / `getSnapshot` so re-renders don't churn the effect deps.
export function Reader(props) @{
	const subscribe = useCallback(props.store.subscribe, [props.store]);
	const getSnapshot = useCallback(props.store.get, [props.store]);
	const value = useSyncExternalStore(subscribe, getSnapshot);
	<p class="value">
		{value as string}
	</p>
}

// Same component bound to a different store identity — exercises the
// re-subscribe-on-store-swap path.
export function SwappableReader(props) @{
	const subscribe = useCallback(props.store.subscribe, [props.store]);
	const getSnapshot = useCallback(props.store.get, [props.store]);
	const value = useSyncExternalStore(subscribe, getSnapshot);
	<p class="value" data-key={props.store === props.alt ? 'alt' : 'main'}>
		{value as string}
	</p>
}
