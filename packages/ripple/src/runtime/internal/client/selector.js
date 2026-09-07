/** @import { Block, Tracked } from '#client' */

import { render } from './blocks.js';
import { UNINITIALIZED } from './constants.js';
import { get_tracked, selector_tracked, set } from './runtime.js';

/**
 * @typedef {{ v: any; m: Map<any, Tracked>; b: Block }} Selector
 */

/**
 * Shares one reactive source across many `source === key` comparisons: each
 * key subscribes to its own match flag, so a change of the source only
 * notifies the blocks for the previous and next key rather than every block
 * that compares against it. Used by the compiler for comparisons between a
 * loop item and outer state inside `@for` templates.
 * @param {() => any} get_source
 * @returns {Selector}
 */
export function selector(get_source) {
	/** @type {Selector} */
	var s = {
		v: UNINITIALIZED,
		m: new Map(),
		b: /** @type {Block} */ (/** @type {unknown} */ (null)),
	};

	s.b = render(() => {
		var next = get_source();
		var prev = s.v;
		if (next === prev) {
			return;
		}
		s.v = next;
		var m = s.m;
		if (m.size === 0) {
			return;
		}
		// NaN never matches with ===, so it never toggles a flag.
		if (prev === prev) {
			var previous_match = m.get(prev);
			if (previous_match !== undefined) {
				set(previous_match, false);
			}
		}
		if (next === next) {
			var next_match = m.get(next);
			if (next_match !== undefined) {
				set(next_match, true);
			}
		}
	});

	return s;
}

/**
 * `source === key`, read inside a render block so the block re-runs only when
 * the match for this key changes.
 * @param {Selector} s
 * @param {any} key
 * @returns {boolean}
 */
export function selector_match(s, key) {
	var m = s.m;
	var match = m.get(key);
	if (match === undefined) {
		match = selector_tracked(key === s.v, s.b, m, key);
		m.set(key, match);
	}
	return get_tracked(match);
}
