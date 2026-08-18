/** @import { MergeableRef, RefProp, RefValue, SpreadProps } from '../types/ref' */

import {
	has_own_property,
	get_descriptor,
	has_prototype_accessor,
	is_array,
} from '@tsrx/runtime/language-helpers';

const REF_VALUE = Symbol();

/**
 * Merge multiple refs (function refs and ref objects) into a single
 * callback ref. Used by React, Preact, and Vue targets when an element has
 * more than one `ref` attribute.
 * This is a public method and also used by the compiler to unite any refs with
 * any of the supported syntaxes.  It does not process spreads, that is delegated to
 * `normalize_spread_props`.
 *
 * @template [T=Element]
 * @param {...MergeableRef<T>} refs
 * @returns {(node: T | null) => (() => void)}
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
			} else if (is_ref_object(ref, 'current')) {
				ref.current = node;
				cleanups.push(() => {
					ref.current = null;
				});
			} else if (is_ref_object(ref, 'value')) {
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

export { is_ref_prop as isRefProp };

/**
 * A ref value that is a function is a callback ref — the bare-element branch of
 * `RefValue` is never callable.
 *
 * @template T
 * @param {RefValue<T>} value
 * @returns {value is (node: T | null) => void | (() => void)}
 */
function is_ref_callback(value) {
	return typeof value === 'function';
}

/**
 * @param {unknown} value
 * @returns {value is RefProp<Element>}
 */
function is_ref_prop(value) {
	return typeof value === 'function' && REF_VALUE in value;
}

/**
 * @template [T=Element]
 * @param {RefValue<T>} ref_value
 * @param {T | null} node
 * @param {(value: T | null) => void} [set_ref_value]
 * @returns {void | (() => void)}
 */
export function apply_ref_value(ref_value, node, set_ref_value) {
	if (is_array(ref_value)) {
		/** @type {Array<() => void>} */
		const cleanups = [];
		for (const item of ref_value) {
			const cleanup = apply_ref_value(item, node);
			if (typeof cleanup === 'function') {
				cleanups.push(cleanup);
			} else if (is_ref_callback(item) && node !== null) {
				cleanups.push(() => item(null));
			}
		}
		if (cleanups.length > 0) {
			return () => {
				for (const cleanup of cleanups) cleanup();
			};
		}
		return;
	}

	if (is_ref_callback(ref_value)) {
		return ref_value(node);
	}

	if (ref_value && typeof ref_value === 'object') {
		if (is_ref_object(ref_value, 'current')) {
			ref_value.current = node;
			return () => {
				ref_value.current = null;
			};
		}

		if (is_ref_object(ref_value, 'value')) {
			ref_value.value = node;
			return () => {
				ref_value.value = null;
			};
		}
	}

	if (set_ref_value !== undefined) {
		set_ref_value(node);
	}
}

/**
 * @template [T=Element]
 * @param {() => RefValue<T>} get_ref_value
 * @param {(value: T | null) => void} [set_ref_value]
 * @returns {RefProp<T>}
 */
export function create_ref_prop(get_ref_value, set_ref_value) {
	/**
	 * @param {T | null} node
	 * @returns {void | (() => void)}
	 */
	function ref_prop_callback(node) {
		const ref_value = get_ref_value();
		const cleanup = apply_ref_value(ref_value, node, set_ref_value);
		if (typeof cleanup === 'function' || node === null) {
			return cleanup;
		}
		return () => {
			apply_ref_value(ref_value, null, set_ref_value);
		};
	}

	Object.defineProperty(ref_prop_callback, REF_VALUE, {
		value: 'ref_value',
		enumerable: false,
	});

	return ref_prop_callback;
}

/**
 * @template [T=Element]
 * @param {...RefValue<T>} refs
 * @returns {RefValue<T>} the single surviving ref, or a callback applying all
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
	 * @param {T | null} node
	 * @returns {void | (() => void)}
	 */
	function merged_ref_prop(node) {
		/** @type {Array<() => void>} */
		const cleanups = [];

		for (const ref of filtered) {
			const cleanup = apply_ref_value(ref, node);
			if (typeof cleanup === 'function') {
				cleanups.push(cleanup);
			} else if (is_ref_callback(ref) && node !== null) {
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
 * @param {object | null | undefined} props a props bag; `object` rather than an
 *   index signature so an interface-typed bag is accepted
 * @param {...RefValue<Element>} outer_refs
 * @returns {SpreadProps | null | undefined}
 */
export function normalize_spread_props(props, ...outer_refs) {
	if (props == null) {
		return props;
	}

	const source = /** @type {SpreadProps} */ (props);
	/** @type {Array<RefValue<Element>>} */
	const refs = [];
	/** @type {SpreadProps} */
	const next = {};
	let changed = false;
	let existing_ref;

	for (const key of Reflect.ownKeys(source)) {
		const descriptor = get_descriptor(source, key);
		if (!descriptor?.enumerable) {
			continue;
		}

		const value = source[key];

		if (key === 'ref') {
			if (is_ref_prop(value)) {
				refs.push(value);
				changed = true;
			} else {
				existing_ref = /** @type {RefValue<Element>} */ (value);
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
		return source;
	}

	const merged_ref = merge_ref_props(existing_ref, ...refs, ...outer_refs);
	if (merged_ref !== undefined) {
		next.ref = merged_ref;
	}

	return next;
}

/**
 * Normalize spread props for targets that read refs through an explicit
 * `ref={normalized.ref}` attribute. The returned `ref` stays readable for that
 * attribute but is non-enumerable so `{...normalized}` does not also pass it as
 * a DOM prop.
 *
 * @param {object | null | undefined} props
 * @param {...RefValue<Element>} outer_refs
 * @returns {SpreadProps | null | undefined}
 */
export function normalize_spread_props_for_ref_attr(props, ...outer_refs) {
	const next = normalize_spread_props(props, ...outer_refs);
	if (next == null || !has_own_property.call(next, 'ref')) {
		return next;
	}

	const ref = next.ref;
	const without_ref = { ...next };
	delete without_ref.ref;
	Object.defineProperty(without_ref, 'ref', {
		value: ref,
		enumerable: false,
		configurable: true,
		writable: true,
	});
	return without_ref;
}

/**
 * @template {'current' | 'value'} K
 * @param {object} value
 * @param {K} key
 * @returns {value is Record<K, unknown>}
 */
function is_ref_object(value, key) {
	if (is_dom_node(value)) {
		return false;
	}
	if (key === 'value' && '__v_isRef' in value) {
		return true;
	}
	if (has_own_property.call(value, key)) {
		return true;
	}
	return key === 'value' && has_prototype_accessor(value, 'value');
}

/**
 * @param {object} value
 * @returns {boolean}
 */
function is_dom_node(value) {
	return (
		(typeof Node !== 'undefined' && value instanceof Node) ||
		('nodeType' in value &&
			typeof (/** @type {{ nodeType?: unknown }} */ (value).nodeType) === 'number' &&
			'nodeName' in value &&
			typeof (/** @type {{ nodeName?: unknown }} */ (value).nodeName) === 'string')
	);
}
