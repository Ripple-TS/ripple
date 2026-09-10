import {
	define_property,
	exclude_prop_from_object,
	object_keys,
} from '@tsrx/core/runtime/language-helpers';
import { reads } from './runtime.js';

/**
 * Compiled component props.
 *
 * A component call site with at least one reactive prop compiles to an
 * instance of a props class instead of an object literal with accessors: an
 * accessor in a literal is a runtime call per property per instantiation, and
 * every getter a fresh closure. The class carries the prop names as prototype
 * getters; the instance holds only the values the getters need: the free
 * variables of the reactive expressions ("captures") and the static values,
 * in fixed symbol-keyed slots. Construction is one allocation with a fixed
 * hidden class.
 *
 * One class serves every call site with the same prop names, the same set of
 * reactive props and the same capture count, so a component instantiated from
 * several places reads its props through one hidden class. What differs per
 * call site, the reactive expressions, lives in a per-site object (`site`) the
 * instance points at: `get depth() { return this[SITE].depth(this) }`.
 *
 * Prototype getters are not own properties, so `Object.keys`, object spread
 * and the other own-only operations see nothing on an instance. The compiler
 * lowers those on `.tsrx` code to the helpers below; runtime code uses `KEYS`.
 */

/** Every prop name of a props class, in source order (on the prototype). */
export const KEYS = Symbol('keys');
/** The per-call-site object holding the reactive expressions. */
const SITE = Symbol('site');

export const $0 = Symbol('0');
export const $1 = Symbol('1');
export const $2 = Symbol('2');
export const $3 = Symbol('3');
export const $4 = Symbol('4');
export const $5 = Symbol('5');
export const $6 = Symbol('6');
export const $7 = Symbol('7');
const SLOTS = [$0, $1, $2, $3, $4, $5, $6, $7];

/** Base of every props class. */
export function Props() {}

Props.prototype.toJSON = function () {
	return props_snapshot(this);
};

/* One base per slot count: straight-line stores, no per-instance loop. */
/* prettier-ignore */
const BASES = [
	/** @this {any} @param {any} s */
	function (s) { this[SITE] = s; },
	/** @this {any} @param {any} s @param {any} a */
	function (s, a) { this[SITE] = s; this[$0] = a; },
	/** @this {any} @param {any} s @param {any} a @param {any} b */
	function (s, a, b) { this[SITE] = s; this[$0] = a; this[$1] = b; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c */
	function (s, a, b, c) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d */
	function (s, a, b, c, d) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e */
	function (s, a, b, c, d, e) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f */
	function (s, a, b, c, d, e, f) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g */
	function (s, a, b, c, d, e, f, g) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h */
	function (s, a, b, c, d, e, f, g, h) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; },
];

for (var i = 0; i < BASES.length; i++) {
	BASES[i].prototype = Object.create(Props.prototype);
	BASES[i].prototype.constructor = BASES[i];
}

/** The most slots a compiled props class can have; the compiler falls back to a literal beyond it. */
export const MAX_SLOTS = BASES.length - 1;

/**
 * @param {string} key
 * @returns {() => any}
 */
function reactive_getter(key) {
	return /** @this {any} */ function () {
		return this[SITE][key](this);
	};
}

/**
 * A getter for an expression the compiler proved to depend only on the
 * component's own props, constants and captured values: once an evaluation
 * reads no tracked state, its result can never change, so it is kept in a
 * slot. `undefined` is the empty marker, so an expression that yields it is
 * simply evaluated again.
 * @param {string} key
 * @param {symbol} slot
 * @returns {() => any}
 */
function memo_getter(key, slot) {
	return /** @this {any} */ function () {
		var value = this[slot];
		if (value !== undefined) {
			return value;
		}
		var before = reads;
		value = this[SITE][key](this);
		if (before === reads) {
			this[slot] = value;
		}
		return value;
	};
}

/**
 * @param {symbol} slot
 * @returns {PropertyDescriptor}
 */
function slot_descriptor(slot) {
	return {
		get: /** @this {any} */ function () {
			return this[slot];
		},
		set: /** @this {any} @param {any} value */ function (value) {
			this[slot] = value;
		},
		enumerable: true,
		configurable: true,
	};
}

/** @type {Map<string, Function>} */
const classes = new Map();

/**
 * @param {string[]} keys
 * @param {number} mask
 * @param {number} captures
 * @param {number} memo
 * @returns {Function}
 */
function build_class(keys, mask, captures, memo) {
	var slot = captures;
	/** @type {PropertyDescriptor[]} */
	var descriptors = [];

	for (var i = 0; i < keys.length; i++) {
		if ((mask & (1 << i)) !== 0) {
			descriptors.push({
				get: reactive_getter(keys[i]),
				enumerable: true,
				configurable: true,
			});
		} else {
			descriptors.push(slot_descriptor(SLOTS[slot++]));
		}
	}

	// Memo slots follow the statics; the call site passes no argument for them,
	// so the base constructor stores `undefined`.
	for (i = 0; i < keys.length; i++) {
		if ((memo & (1 << i)) !== 0) {
			descriptors[i].get = memo_getter(keys[i], SLOTS[slot++]);
		}
	}

	var Base = /** @type {any} */ (BASES[slot]);
	var Klass = class extends Base {};
	/** @type {any} */
	var proto = Klass.prototype;
	proto[KEYS] = keys;

	for (i = 0; i < keys.length; i++) {
		define_property(proto, keys[i], descriptors[i]);
	}

	return Klass;
}

/**
 * Finishes a compiled props call site: resolves (building on first use) the
 * class for its shape and stores it on the site object as `C`. The compiler
 * emits, once per call site, `site = props_site(keys, mask, captures, memo,
 * site)` and then `new site.C(site, ...captures, ...statics)` per
 * instantiation.
 *
 * @param {string[]} keys every prop name in source order
 * @param {number} mask bit `i` set when `keys[i]` is reactive (a getter on `site`)
 * @param {number} captures number of captured values, stored in the first slots
 * @param {number} memo bits of `mask` whose expression can be memoized (see `memo_getter`)
 * @param {Record<string, any>} site `{ C: null, [reactive key]: (props) => value }`
 * @returns {Record<string, any>}
 */
export function props_site(keys, mask, captures, memo, site) {
	var id = keys.join(',') + '|' + mask + '|' + captures + '|' + memo;
	var Klass = classes.get(id);

	if (Klass === undefined) {
		Klass = build_class(keys, mask, captures, memo);
		classes.set(id, Klass);
	}

	site.C = Klass;
	return site;
}

/**
 * The prop names of a props instance (a shared array: do not mutate).
 * @param {any} props
 * @returns {string[]}
 */
function keys_of(props) {
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
 * The own keys of a plain object, or every prop of a props instance (a shared
 * array: do not mutate).
 * @param {Record<string | symbol, any>} obj
 * @returns {string[]}
 */
export function own_keys(obj) {
	return obj instanceof Props ? keys_of(obj) : object_keys(obj);
}

/**
 * `Object.keys` for `.tsrx` code: includes the prototype getters of a props
 * instance.
 * @param {Record<string | symbol, any>} obj
 * @returns {string[]}
 */
export function props_keys(obj) {
	return obj instanceof Props ? keys_of(obj).slice() : object_keys(obj);
}

/**
 * `Object.values` for `.tsrx` code.
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
 * `Object.entries` for `.tsrx` code.
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
 * The object an object spread copies from: a plain object as is, a props
 * instance as a snapshot of every prop.
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
 * A copy of `props` without `exclude`, each remaining prop forwarding to the
 * source on read (like the language helper of the same name, which only sees
 * own properties).
 * @param {Record<PropertyKey, unknown> | null | undefined} props
 * @param {string} exclude
 * @returns {Record<PropertyKey, unknown>}
 */
export function exclude_prop(props, exclude) {
	if (!(props instanceof Props)) {
		return exclude_prop_from_object(props, exclude);
	}
	var keys = keys_of(props);
	/** @type {Record<PropertyKey, unknown>} */
	var next = {};
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		if (key !== exclude) {
			define_property(next, key, forwarding_descriptor(props, key));
		}
	}
	return next;
}

/**
 * @param {Record<PropertyKey, unknown>} source
 * @param {string} key
 * @returns {PropertyDescriptor}
 */
export function forwarding_descriptor(source, key) {
	return {
		get() {
			return source[key];
		},
		enumerable: true,
		configurable: true,
	};
}
