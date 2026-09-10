import { define_property, get_descriptor, object_keys } from '@tsrx/core/runtime/language-helpers';

/**
 * Props objects and the helpers that read them like plain objects.
 *
 * On the client a component call site with a reactive prop passes an instance
 * of a compiled props class (see `internal/client/props.js`): its props are
 * getters on the class prototype, so the own-property operations (`Object.keys`,
 * object spread, `Object.entries`, ...) see nothing on it. Every helper here
 * accepts both a compiled instance and a plain object and answers the same way
 * for both, which is what code outside the compiler (a `.ts` helper, a library,
 * a test) should use. The compiler lowers the `Object` calls and object spreads
 * of `.tsrx` code to these helpers itself; the server passes plain objects.
 */

/** Every prop name of a compiled props class, in source order (on the prototype). */
export const KEYS = Symbol('keys');

/** Base of every compiled props class. */
export function Props() {}

Props.prototype.toJSON = function () {
	return props_snapshot(this);
};

/**
 * The prop names of a compiled props instance (a shared array: do not mutate).
 * @param {any} props
 * @returns {string[]}
 */
export function keys_of(props) {
	return props[KEYS];
}

/**
 * @param {any} value
 * @returns {boolean}
 */
export function is_props(value) {
	return value instanceof Props;
}

/**
 * The own keys of a plain object, or every prop of a compiled instance (a
 * shared array: do not mutate).
 * @param {Record<string | symbol, any>} obj
 * @returns {string[]}
 */
export function own_keys(obj) {
	return obj instanceof Props ? keys_of(obj) : object_keys(obj);
}

/**
 * `Object.keys` that includes the props of a compiled instance.
 * @param {Record<string | symbol, any>} obj
 * @returns {string[]}
 */
export function props_keys(obj) {
	return obj instanceof Props ? keys_of(obj).slice() : object_keys(obj);
}

/**
 * `Object.values` that includes the props of a compiled instance.
 * @param {Record<string | symbol, any>} obj
 * @returns {any[]}
 */
export function props_values(obj) {
	if (!(obj instanceof Props)) {
		return Object.values(obj);
	}
	var keys = keys_of(obj);
	var values = [];
	for (var i = 0; i < keys.length; i++) {
		values.push(obj[keys[i]]);
	}
	return values;
}

/**
 * `Object.entries` that includes the props of a compiled instance.
 * @param {Record<string | symbol, any>} obj
 * @returns {[string, any][]}
 */
export function props_entries(obj) {
	if (!(obj instanceof Props)) {
		return Object.entries(obj);
	}
	var keys = keys_of(obj);
	/** @type {[string, any][]} */
	var entries = [];
	for (var i = 0; i < keys.length; i++) {
		entries.push([keys[i], obj[keys[i]]]);
	}
	return entries;
}

/**
 * Whether `key` is a prop: an own property of a plain object, or a prop of a
 * compiled instance.
 * @param {Record<string | symbol, any>} obj
 * @param {PropertyKey} key
 * @returns {boolean}
 */
export function props_has(obj, key) {
	if (obj instanceof Props) {
		return typeof key === 'string' && keys_of(obj).includes(key);
	}
	return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * The object an object spread copies from: a plain object as is, a compiled
 * instance as a plain snapshot of every prop, read now.
 * @param {any} obj
 * @returns {any}
 */
export function props_snapshot(obj) {
	if (!(obj instanceof Props)) {
		return obj;
	}
	/** @type {Record<string, any>} */
	var source = obj;
	var keys = keys_of(source);
	/** @type {Record<string, any>} */
	var out = {};
	for (var i = 0; i < keys.length; i++) {
		out[keys[i]] = source[keys[i]];
	}
	return out;
}

/**
 * A descriptor that reads `key` from `source` on access and writes through
 * when `source` accepts writes to it.
 * @param {Record<PropertyKey, any>} source
 * @param {PropertyKey} key
 * @param {boolean} writable
 * @returns {PropertyDescriptor}
 */
export function forwarding_descriptor(source, key, writable = false) {
	/** @type {PropertyDescriptor} */
	var descriptor = {
		get() {
			return source[key];
		},
		enumerable: true,
		configurable: true,
	};
	if (writable) {
		descriptor.set = (value) => {
			source[key] = value;
		};
	}
	return descriptor;
}

/**
 * The rest of `props` after `exclude`, as `const { a, ...rest } = props` gives
 * it: a new plain object whose remaining props read from the source on access,
 * so a reactive prop stays live. It has own accessors, so it enumerates
 * normally.
 * @param {Record<PropertyKey, any> | null | undefined} props
 * @param {readonly PropertyKey[]} exclude
 * @returns {Record<PropertyKey, any>}
 */
export function props_omit(props, exclude) {
	/** @type {Record<PropertyKey, any>} */
	var next = {};
	if (props == null) {
		return next;
	}

	if (props instanceof Props) {
		var keys = keys_of(props);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (!exclude.includes(key)) {
				define_property(next, key, forwarding_descriptor(props, key, true));
			}
		}
		return next;
	}

	for (var own of Reflect.ownKeys(props)) {
		if (exclude.includes(own)) continue;
		var descriptor = get_descriptor(props, own);
		if (!descriptor?.enumerable) continue;
		define_property(
			next,
			own,
			forwarding_descriptor(
				props,
				own,
				descriptor.writable === true || typeof descriptor.set === 'function',
			),
		);
	}
	return next;
}

/**
 * `{ ...a, ...b }` over props objects: a new plain object with every prop of
 * every source read now, later sources overriding earlier ones. One source
 * gives a plain snapshot of it.
 * @param {...(Record<string | symbol, any> | null | undefined)} sources
 * @returns {Record<string, any>}
 */
export function props_spread(...sources) {
	/** @type {Record<string, any>} */
	var out = {};
	var assigned = false;
	for (var i = 0; i < sources.length; i++) {
		var source = sources[i];
		if (source == null) continue;
		if (source instanceof Props) {
			var keys = keys_of(source);
			for (var k = 0; k < keys.length; k++) {
				out[keys[k]] = /** @type {Record<string, any>} */ (source)[keys[k]];
			}
		} else {
			Object.assign(out, source);
			assigned = true;
		}
	}
	// `Object.assign` sets rather than defines, so a source key named
	// `__proto__` would have changed the prototype: a final spread copies the
	// own properties onto a fresh object exactly as `{ ...source }` would.
	return assigned ? { ...out } : out;
}

/**
 * The `Props` namespace exported from 'ripple': `Object`-shaped helpers that
 * read a props object, compiled or plain, on the client and the server.
 */
export const PropsHelpers = {
	keys: props_keys,
	values: props_values,
	entries: props_entries,
	has: props_has,
	spread: props_spread,
	rest: /** @type {(props: any, ...keys: PropertyKey[]) => any} */ (
		(props, ...keys) => props_omit(props, keys)
	),
};
