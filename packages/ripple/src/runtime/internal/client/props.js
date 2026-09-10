import { define_property } from '@tsrx/core/runtime/language-helpers';
import { UNINITIALIZED } from './constants.js';
import { reads } from './runtime.js';
import { KEYS, Props } from '../../props.js';

export {
	Props,
	KEYS,
	is_props,
	own_keys,
	props_keys,
	props_values,
	props_entries,
	props_has,
	props_snapshot,
	props_omit,
	forwarding_descriptor,
} from '../../props.js';

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
 * lowers those on `.tsrx` code to the helpers in `runtime/props.js`, which
 * are also the public `Props` namespace; runtime code uses `KEYS`.
 */

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
export const $8 = Symbol('8');
export const $9 = Symbol('9');
export const $10 = Symbol('10');
export const $11 = Symbol('11');
export const $12 = Symbol('12');
export const $13 = Symbol('13');
export const $14 = Symbol('14');
export const $15 = Symbol('15');
const SLOTS = [$0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15];
/** The values array of an instance whose class has more slots than `BASES` provide. */
export const VALUES = Symbol('values');

/*
 * One base per slot count: straight-line stores into fixed slots, so every
 * instance of a class has the same hidden class. The call site passes the
 * captures, the statics and an `UNINITIALIZED` per memo slot, in that order.
 */
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
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i */
	function (s, a, b, c, d, e, f, g, h, i) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j */
	function (s, a, b, c, d, e, f, g, h, i, j) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j @param {any} k */
	function (s, a, b, c, d, e, f, g, h, i, j, k) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; this[$10] = k; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j @param {any} k @param {any} l */
	function (s, a, b, c, d, e, f, g, h, i, j, k, l) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; this[$10] = k; this[$11] = l; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j @param {any} k @param {any} l @param {any} m */
	function (s, a, b, c, d, e, f, g, h, i, j, k, l, m) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; this[$10] = k; this[$11] = l; this[$12] = m; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j @param {any} k @param {any} l @param {any} m @param {any} n */
	function (s, a, b, c, d, e, f, g, h, i, j, k, l, m, n) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; this[$10] = k; this[$11] = l; this[$12] = m; this[$13] = n; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j @param {any} k @param {any} l @param {any} m @param {any} n @param {any} o */
	function (s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; this[$10] = k; this[$11] = l; this[$12] = m; this[$13] = n; this[$14] = o; },
	/** @this {any} @param {any} s @param {any} a @param {any} b @param {any} c @param {any} d @param {any} e @param {any} f @param {any} g @param {any} h @param {any} i @param {any} j @param {any} k @param {any} l @param {any} m @param {any} n @param {any} o @param {any} p */
	function (s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) { this[SITE] = s; this[$0] = a; this[$1] = b; this[$2] = c; this[$3] = d; this[$4] = e; this[$5] = f; this[$6] = g; this[$7] = h; this[$8] = i; this[$9] = j; this[$10] = k; this[$11] = l; this[$12] = m; this[$13] = n; this[$14] = o; this[$15] = p; },
];

/**
 * The base of a class with more slots than `BASES` provide: the call site
 * passes every value in one array (`new C(site, [...])`).
 * @this {any}
 * @param {any} s
 * @param {any[]} values
 */
function ArrayBase(s, values) {
	this[SITE] = s;
	this[VALUES] = values;
}

for (var i = 0; i < BASES.length; i++) {
	BASES[i].prototype = Object.create(Props.prototype);
	BASES[i].prototype.constructor = BASES[i];
}
ArrayBase.prototype = Object.create(Props.prototype);
ArrayBase.prototype.constructor = ArrayBase;

/** The most slots a fixed-arity base provides; the compiler passes an array above it. */
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
		if (value !== UNINITIALIZED) {
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
 * `memo_getter` for a class whose values live in an array.
 * @param {string} key
 * @param {number} index
 * @returns {() => any}
 */
function array_memo_getter(key, index) {
	return /** @this {any} */ function () {
		var values = this[VALUES];
		var value = values[index];
		if (value !== UNINITIALIZED) {
			return value;
		}
		var before = reads;
		value = this[SITE][key](this);
		if (before === reads) {
			values[index] = value;
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

/**
 * @param {number} index
 * @returns {PropertyDescriptor}
 */
function array_slot_descriptor(index) {
	return {
		get: /** @this {any} */ function () {
			return this[VALUES][index];
		},
		set: /** @this {any} @param {any} value */ function (value) {
			this[VALUES][index] = value;
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
	// Slot layout: captures, then the statics in source order, then the memo
	// slots in source order; the call site passes its arguments the same way.
	// A class with more slots than the fixed-arity bases provide keeps its
	// values in an array.
	var statics = keys.length - bit_count(mask);
	var total = captures + statics + bit_count(memo);
	var array_mode = total > MAX_SLOTS;
	var Base = /** @type {any} */ (array_mode ? ArrayBase : BASES[total]);
	var Klass = class extends Base {};
	/** @type {any} */
	var proto = Klass.prototype;
	proto[KEYS] = keys;

	var static_slot = captures;
	var memo_slot = captures + statics;

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		/** @type {PropertyDescriptor} */
		var descriptor;
		if ((mask & (1 << i)) === 0) {
			descriptor = array_mode
				? array_slot_descriptor(static_slot)
				: slot_descriptor(SLOTS[static_slot]);
			static_slot++;
		} else if ((memo & (1 << i)) !== 0) {
			descriptor = {
				get: array_mode ? array_memo_getter(key, memo_slot) : memo_getter(key, SLOTS[memo_slot]),
				enumerable: true,
				configurable: true,
			};
			memo_slot++;
		} else {
			descriptor = { get: reactive_getter(key), enumerable: true, configurable: true };
		}
		define_property(proto, key, descriptor);
	}

	return Klass;
}

/**
 * @param {number} bits
 * @returns {number}
 */
function bit_count(bits) {
	var count = 0;
	while (bits !== 0) {
		bits &= bits - 1;
		count++;
	}
	return count;
}

/**
 * Finishes a compiled props call site: resolves (building on first use) the
 * class for its shape and stores it on the site object as `C`. The compiler
 * emits, once per call site, `site = props_site(keys, mask, captures, memo,
 * site)` and then `new site.C(site, ...captures, ...statics)` per
 * instantiation (plus an `UNINITIALIZED` per memo slot), or
 * `new site.C(site, [...captures, ...statics, ...memo])` when the class needs
 * more slots than `MAX_SLOTS`.
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
