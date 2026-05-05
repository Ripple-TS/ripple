/**
 * Merge multiple refs (function refs and ref objects) into a single
 * callback ref. Used by React, Preact, and Vue targets when an element has
 * more than one `ref` attribute.
 * This is a public method and also used by the compiler to unite any refs with
 * any of the supported syntaxes.  It does not process spreads, that is delegated to
 * `normalize_spread_props`.
 *
 * @param {...((node: any) => void | (() => void)) | { current: any } | { value: any } | null | undefined} refs
 * @returns {(node: any) => (() => void)}
 */
export function mergeRefs(...refs) {
	return (node) => {
		/** @type {Array<() => void>} */
		const cleanups = [];
		for (const ref of refs) {
			if (ref == null) continue;
			if (typeof ref === 'function') {
				const result = ref(node);
				if (typeof result === 'function') {
					cleanups.push(result);
				} else {
					cleanups.push(() => ref(null));
				}
			} else if ('current' in ref) {
				ref.current = node;
				cleanups.push(() => {
					ref.current = null;
				});
			} else if ('value' in ref) {
				ref.value = node;
				cleanups.push(() => {
					ref.value = null;
				});
			}
		}
		return () => {
			for (const cleanup of cleanups) cleanup();
		};
	};
}

const REF_VALUE = Symbol();

export { is_ref_prop as isRefProp };

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function is_ref_prop(value) {
	return typeof value === 'function' && REF_VALUE in value;
}

/**
 * @param {any} ref_value
 * @param {any} node
 * @param {(value: any) => void} [set_ref_value]
 * @returns {void | (() => void)}
 */
export function apply_ref_value(ref_value, node, set_ref_value) {
	if (typeof ref_value === 'function') {
		return ref_value(node);
	}

	if (ref_value && typeof ref_value === 'object') {
		if ('current' in ref_value) {
			ref_value.current = node;
			return () => {
				ref_value.current = null;
			};
		}

		if ('value' in ref_value) {
			ref_value.value = node;
			return () => {
				ref_value.value = null;
			};
		}
	}

	if (node !== null && set_ref_value !== undefined) {
		set_ref_value(node);
	}
}

/**
 * @param {() => any} get_ref_value
 * @param {(value: any) => void} [set_ref_value]
 * @returns {(node: any) => void | (() => void)}
 */
export function create_ref_prop(get_ref_value, set_ref_value) {
	/**
	 * @param {any} node
	 * @returns {void | (() => void)}
	 */
	function ref_prop_callback(node) {
		return apply_ref_value(get_ref_value(), node, set_ref_value);
	}

	Object.defineProperty(ref_prop_callback, REF_VALUE, {
		value: 'ref_value',
		enumerable: false,
	});

	return ref_prop_callback;
}

/**
 * @param {...any} refs
 * @returns {any}
 */
export function merge_ref_props(...refs) {
	const filtered = refs.filter((ref) => ref != null);

	if (filtered.length === 0) {
		return undefined;
	}

	if (filtered.length === 1) {
		return filtered[0];
	}

	/**
	 * @param {any} node
	 * @returns {void | (() => void)}
	 */
	function merged_ref_prop(node) {
		/** @type {Array<() => void>} */
		const cleanups = [];

		for (const ref of filtered) {
			const cleanup = apply_ref_value(ref, node);
			if (typeof cleanup === 'function') {
				cleanups.push(cleanup);
			} else if (typeof ref === 'function' && node !== null) {
				cleanups.push(() => ref(null));
			}
		}

		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}
		};
	}

	return merged_ref_prop;
}

/**
 * @param {Record<string | symbol, any> | null | undefined} props
 * @param {...any} outer_refs
 * @returns {Record<string | symbol, any> | null | undefined}
 */
export function normalize_spread_props(props, ...outer_refs) {
	if (props == null) {
		return props;
	}

	/** @type {any[]} */
	const refs = [];
	/** @type {Record<string | symbol, any>} */
	let next = {};
	let changed = false;
	let existing_ref;

	for (const key of Reflect.ownKeys(props)) {
		const descriptor = Object.getOwnPropertyDescriptor(props, key);
		if (!descriptor?.enumerable) {
			continue;
		}

		const value = /** @type {any} */ (props)[key];

		if (key === 'ref') {
			if (is_ref_prop(value)) {
				refs.push(value);
				changed = true;
			} else {
				existing_ref = value;
			}
			continue;
		}

		if (is_ref_prop(value)) {
			refs.push(value);
			changed = true;
			continue;
		}

		next[key] = value;
	}

	if (!changed && outer_refs.length === 0) {
		return props;
	}

	const merged_ref = merge_ref_props(existing_ref, ...refs, ...outer_refs);
	if (merged_ref !== undefined) {
		next.ref = merged_ref;
	}

	return next;
}
