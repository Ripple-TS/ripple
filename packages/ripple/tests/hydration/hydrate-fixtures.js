/** @import { TSRXElement } from '../../src/runtime/element.js' */
/** @import { Component } from 'ripple' */
/** @import { HydrationWhen } from 'ripple/hydration' */
/**
 * Fixture components have capitalized export names; configuration and controls do not.
 * @typedef {Extract<keyof typeof import('./compiled/client/hydrate.js'), Capitalize<string>>} ComponentName
 */
/**
 * @typedef {{
 *   when?: HydrationWhen;
 *   nested?: HydrationWhen;
 *   initial?: string;
 *   fail?: boolean;
 *   duringInit?: () => void;
 *   stream?: Promise<string>;
 * }} FixtureOptions
 */

/**
 * Generated fixtures carry the runtime symbol, while public types declare a
 * separate type-only brand. Bridge that boundary without changing the fixture.
 * @param {() => TSRXElement} fixture
 * @returns {Component}
 */
export function component(fixture) {
	return /** @type {Component} */ (/** @type {unknown} */ (fixture));
}
