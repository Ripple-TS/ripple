import {
	define_property,
	get_descriptor,
	get_own_property_symbols,
	object_keys,
	property_is_enumerable,
} from '@tsrx/core/runtime/language-helpers';

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
/** The symbol-keyed props of an instance (a `createRefKey()` ref travelling through a spread). */
export const SYMBOLS = Symbol('symbols');

/** @type {symbol[]} */
const NO_SYMBOLS = [];

/** Base of every compiled props class. */
export function Props() {}

define_property(Props.prototype, SYMBOLS, {
	get() {
		return NO_SYMBOLS;
	},
});

// Not enumerable: `for...in` over an instance must yield only its props.
define_property(Props.prototype, 'toJSON', {
	/** @this {any} */
	value: function () {
		return props_snapshot(this);
	},
	writable: true,
	configurable: true,
});

/**
 * The prop names of a compiled props instance (a shared array: do not mutate).
 * @param {any} props
 * @returns {string[]}
 */
export function keys_of(props) {
	return props[KEYS];
}

/**
 * The class of a props object whose props are its own properties: the
 * closure literal a call site keeps when its expressions cannot live at module
 * level (they read `this` or `arguments`), and the forwarding views built at
 * runtime. `KEYS` is the object's own keys, so every helper sees the same
 * contract as on a compiled instance.
 */
export function LiteralProps() {}
LiteralProps.prototype = Object.create(Props.prototype);
LiteralProps.prototype.constructor = LiteralProps;
define_property(LiteralProps.prototype, KEYS, {
	/** @this {any} */
	get() {
		return object_keys(this);
	},
});
define_property(LiteralProps.prototype, SYMBOLS, {
	/** @this {any} */
	get() {
		return get_own_property_symbols(this);
	},
});

/**
 * Makes a fresh object with own props a `Props` instance.
 * @template {Record<PropertyKey, any>} T
 * @param {T} obj
 * @returns {T}
 */
export function props_literal(obj) {
	Object.setPrototypeOf(obj, LiteralProps.prototype);
	return obj;
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
 * The enumerable own symbols of a plain object: what an object spread copies.
 * @param {object} obj
 * @returns {symbol[]}
 */
function enumerable_symbols(obj) {
	var symbols = get_own_property_symbols(obj);
	if (symbols.length === 0) return symbols;
	/** @type {symbol[]} */
	var out = [];
	for (var i = 0; i < symbols.length; i++) {
		if (property_is_enumerable.call(obj, symbols[i])) {
			out.push(symbols[i]);
		}
	}
	return out;
}

/**
 * The symbol keys of a props object: the enumerable own symbols of a plain
 * object, or the symbol-keyed props of a compiled instance (a `createRefKey()`
 * ref that travelled through a spread).
 * @param {Record<string | symbol, any>} obj
 * @returns {symbol[]}
 */
export function props_symbol_keys(obj) {
	return obj instanceof Props ? obj[SYMBOLS].slice() : enumerable_symbols(obj);
}

/**
 * Every key of a props object, string keys first and then symbol keys, as
 * `Reflect.ownKeys` orders the enumerable own keys of a plain object.
 * @param {Record<string | symbol, any>} obj
 * @returns {(string | symbol)[]}
 */
export function props_all_keys(obj) {
	/** @type {(string | symbol)[]} */
	var keys = obj instanceof Props ? keys_of(obj).slice() : object_keys(obj);
	/** @type {symbol[]} */
	var symbols = obj instanceof Props ? obj[SYMBOLS] : enumerable_symbols(obj);
	for (var i = 0; i < symbols.length; i++) {
		keys.push(symbols[i]);
	}
	return keys;
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
	// A literal-backed instance keeps its props as own properties (symbols
	// included), so an object spread reads it directly.
	if (!(obj instanceof Props) || obj instanceof LiteralProps) {
		return obj;
	}
	/** @type {Record<string | symbol, any>} */
	var source = obj;
	var keys = keys_of(source);
	/** @type {Record<string | symbol, any>} */
	var out = {};
	for (var i = 0; i < keys.length; i++) {
		out[keys[i]] = source[keys[i]];
	}
	/** @type {symbol[]} */
	var symbols = source[SYMBOLS];
	for (i = 0; i < symbols.length; i++) {
		out[symbols[i]] = source[symbols[i]];
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
 * it: a new `Props` instance whose remaining props read from the source on
 * access, so a reactive prop stays live. Its props are own accessors.
 * @param {Record<PropertyKey, any> | null | undefined} props
 * @param {readonly PropertyKey[]} exclude
 * @returns {Record<PropertyKey, any>}
 */
export function props_omit(props, exclude) {
	/** @type {Record<PropertyKey, any>} */
	var next = props_literal({});
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

	// Own enumerable string keys, then enumerable symbols (`Reflect.ownKeys`
	// is several times slower than these two loops).
	var own = object_keys(props);
	for (var i = 0; i < own.length; i++) {
		forward_own(next, props, own[i], exclude);
	}
	var symbols = get_own_property_symbols(props);
	for (i = 0; i < symbols.length; i++) {
		if (property_is_enumerable.call(props, symbols[i])) {
			forward_own(next, props, symbols[i], exclude);
		}
	}
	return next;
}

/**
 * @param {Record<PropertyKey, any>} next
 * @param {Record<PropertyKey, any>} source
 * @param {PropertyKey} key
 * @param {readonly PropertyKey[]} exclude
 */
function forward_own(next, source, key, exclude) {
	if (exclude.includes(key)) return;
	var descriptor = /** @type {PropertyDescriptor} */ (get_descriptor(source, key));
	define_property(
		next,
		key,
		forwarding_descriptor(
			source,
			key,
			descriptor.writable === true || typeof descriptor.set === 'function',
		),
	);
}

/**
 * `{ ...a, ...b }` over props objects: a new plain object with every prop of
 * every source (symbol-keyed ones included) read now, later sources overriding
 * earlier ones. One source gives a plain snapshot of it.
 * @param {...(Record<string | symbol, any> | null | undefined)} sources
 * @returns {Record<string | symbol, any>}
 */
export function props_spread(...sources) {
	/** @type {Record<string | symbol, any>} */
	var out = {};
	var assigned = false;
	for (var i = 0; i < sources.length; i++) {
		var source = sources[i];
		if (source == null) continue;
		if (source instanceof Props && !(source instanceof LiteralProps)) {
			var keys = keys_of(source);
			for (var k = 0; k < keys.length; k++) {
				out[keys[k]] = /** @type {Record<string, any>} */ (source)[keys[k]];
			}
			/** @type {symbol[]} */
			var symbols = source[SYMBOLS];
			for (k = 0; k < symbols.length; k++) {
				out[symbols[k]] = /** @type {Record<symbol, any>} */ (source)[symbols[k]];
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
	ownSymbolKeys: props_symbol_keys,
	ownAllKeys: props_all_keys,
	values: props_values,
	entries: props_entries,
	has: props_has,
	spread: props_spread,
	rest: /** @type {(props: any, ...keys: PropertyKey[]) => any} */ (
		(props, ...keys) => props_omit(props, keys)
	),
};
