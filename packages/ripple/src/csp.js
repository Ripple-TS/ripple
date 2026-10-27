/** @import { TrustedTypesPolicy, HTMLSink, ScriptSink } from '../types/csp.js' */
/** @import { TrustedHTML, TrustedScript, TrustedScriptURL, TrustedTypesWindow } from 'trusted-types/lib' */

/**
 * Install an application-owned policy for this browser realm. Ripple never
 * creates a policy, including a default policy. A server call is a no-op.
 * @param {TrustedTypesPolicy | null} policy
 */
export function setTrustedTypesPolicy(policy) {
	if (typeof window !== 'undefined') window.__RIPPLE_TRUSTED_TYPES__ = policy;
}

/** @returns {TrustedTypesWindow['trustedTypes']} */
function factory() {
	return typeof window === 'undefined'
		? undefined
		: /** @type {Window & Pick<TrustedTypesWindow, 'trustedTypes'>} */ (window).trustedTypes;
}

/**
 * @param {string | TrustedHTML} value
 * @param {HTMLSink} [sink]
 * @returns {string | TrustedHTML}
 */
export function createTrustedHTML(value, sink = 'html') {
	if (factory()?.isHTML(value)) return value;
	return typeof window !== 'undefined' && window.__RIPPLE_TRUSTED_TYPES__?.createHTML
		? window.__RIPPLE_TRUSTED_TYPES__.createHTML(String(value), sink)
		: value;
}

/**
 * @param {string | TrustedScript} value
 * @param {ScriptSink} [sink]
 * @returns {string | TrustedScript}
 */
export function createTrustedScript(value, sink = 'script') {
	if (factory()?.isScript(value)) return value;
	return typeof window !== 'undefined' && window.__RIPPLE_TRUSTED_TYPES__?.createScript
		? window.__RIPPLE_TRUSTED_TYPES__.createScript(String(value), sink)
		: value;
}

/**
 * @param {string | TrustedScriptURL} value
 * @param {ScriptSink} [sink]
 * @returns {string | TrustedScriptURL}
 */
export function createTrustedScriptURL(value, sink = 'script') {
	if (factory()?.isScriptURL(value)) return value;
	return typeof window !== 'undefined' && window.__RIPPLE_TRUSTED_TYPES__?.createScriptURL
		? window.__RIPPLE_TRUSTED_TYPES__.createScriptURL(String(value), sink)
		: value;
}
