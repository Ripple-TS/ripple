/** @import { Component, ContextEntry } from '#client' */

import { active_component } from './runtime.js';

/**
 * @template T
 */
export class Context {
	/**
	 * @param {T} [initial_value]
	 */
	constructor(initial_value) {
		/** @type {T | undefined} */
		this._v = initial_value;
	}

	get() {
		const component = active_component;

		if (component === null) {
			throw new Error('No active component found, cannot get context');
		}

		// A component inherits its parent's chain of set entries when it is
		// created, so only the values that were set are visited, not every
		// ancestor; the most recent set of a context is nearest the head.
		/** @type {ContextEntry | null} */
		let entry = component.c;

		while (entry !== null) {
			if (entry.k === this) {
				return entry.v;
			}
			entry = entry.n;
		}

		return this._v;
	}

	/**
	 * @template T
	 * @param {T} value
	 */
	set(value) {
		const component = active_component;

		if (component === null) {
			throw new Error('No active component found, cannot set context');
		}

		component.c = { k: this, v: value, n: component.c };
	}
}

/**
 * @template T
 * @param {T} [initial_value]
 */
export function context(initial_value) {
	return new Context(initial_value);
}
