import { track, untrack } from 'ripple';
import {
	createNonReactiveMutableStore,
	createNonReactiveReadonlyStore,
	replaceEqualDeep,
	functionalUpdate,
} from '@tanstack/router-core';
import { isServer } from '@tanstack/router-core/isServer';

/** @template T @param {T} initial @returns {import('@tanstack/router-core').RouterWritableStore<T>} */
function createMutableStore(initial) {
	/** @type {import('ripple').Tracked<T>} */
	var value = typeof initial === 'function' ? track() : track(initial);
	if (typeof initial === 'function') value.value = initial;
	return {
		get: () => value.value,
		set: (next) => {
			value.value = functionalUpdate(
				next,
				untrack(() => value.value),
			);
		},
	};
}

/** @template T @param {() => T} read @returns {import('@tanstack/router-core').RouterReadableStore<T>} */
function createReadonlyStore(read) {
	// Read through the native cells in the caller's reactive scope. The cache is
	// owned by the router, so disposing a provider cannot retire it permanently.
	var value = untrack(read);
	return { get: () => (value = replaceEqualDeep(value, read())) };
}

/** @type {import('@tanstack/router-core').GetStoreConfig} */
export function getStoreFactory(options) {
	if (isServer ?? options.isServer) {
		return {
			createMutableStore: createNonReactiveMutableStore,
			createReadonlyStore: createNonReactiveReadonlyStore,
			batch: (fn) => fn(),
		};
	}
	return { createMutableStore, createReadonlyStore, batch: untrack };
}
