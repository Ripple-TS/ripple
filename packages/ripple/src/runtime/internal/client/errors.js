import { DEV } from 'esm-env';

/**
 * The runtime's errors, one function per error as in Svelte: in development
 * the message is thrown with a link to its reference page; in production only
 * the link is, so the message text never ships. Each page lives at
 * `https://ripple-ts.com/e/<code>`.
 */

/**
 * @param {string} code
 * @param {string} message
 * @returns {string}
 */
function text(code, message) {
	var link = `https://ripple-ts.com/e/${code}`;
	return DEV ? `${message}\n${link}` : link;
}

/** @returns {never} */
export function effect_orphan() {
	throw new Error(
		DEV
			? text(
					'effect_orphan',
					'effect() must be called within an active context, such as a component or effect',
				)
			: text('effect_orphan', ''),
	);
}

/** @returns {never} */
export function track_orphan() {
	throw new TypeError(
		DEV
			? text('track_orphan', 'track() requires a valid component context')
			: text('track_orphan', ''),
	);
}

/** @returns {never} */
export function track_async_orphan() {
	throw new TypeError(
		DEV
			? text('track_async_orphan', 'trackAsync() requires a valid component context')
			: text('track_async_orphan', ''),
	);
}

/** @returns {never} */
export function track_async_argument() {
	throw new TypeError(
		DEV
			? text(
					'track_async_argument',
					'trackAsync() only accepts function arguments that return a promise or an object with a promise property',
				)
			: text('track_async_argument', ''),
	);
}

/** @returns {never} */
export function track_async_boundary() {
	throw new Error(
		DEV
			? text('track_async_boundary', 'Missing parent `try { ... } pending { ... }` statement')
			: text('track_async_boundary', ''),
	);
}

/**
 * @param {boolean} in_component the read sits directly in a component body,
 *   otherwise in a try/pending/catch body
 * @returns {never}
 */
export function pending_read_direct(in_component) {
	throw new Error(
		DEV
			? text(
					'pending_read_direct',
					`Reads on pending tracked values directly inside ${in_component ? 'component' : 'try/pending/catch'} body are prohibited. Use trackPending() test or peek() for safe access or create another derived instead.`,
				)
			: text('pending_read_direct', ''),
	);
}

/** @returns {never} */
export function update_depth_exceeded() {
	throw new Error(
		DEV
			? text(
					'update_depth_exceeded',
					'Maximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state.',
				)
			: text('update_depth_exceeded', ''),
	);
}

/** @returns {never} */
export function set_in_derived() {
	throw new Error(
		DEV
			? text(
					'set_in_derived',
					'Assignments or updates to tracked values are not allowed during computed "track(() => ...)" evaluation',
				)
			: text('set_in_derived', ''),
	);
}

/**
 * @param {string} [message] a caller's own wording
 * @returns {never}
 */
export function scope_orphan(message) {
	throw new Error(
		DEV
			? text('scope_orphan', message ?? 'Cannot access outside of a component context')
			: text('scope_orphan', ''),
	);
}

/**
 * @param {boolean} is_element the value is a TSRX element rather than a
 *   component function
 * @returns {never}
 */
export function component_invalid(is_element) {
	throw new TypeError(
		DEV
			? text(
					'component_invalid',
					`Invalid component type: ${is_element ? 'received a TSRXElement value.' : 'expected a component function.'}`,
				)
			: text('component_invalid', ''),
	);
}

/**
 * @param {boolean} is_set `Context#set` rather than `Context#get`
 * @returns {never}
 */
export function context_orphan(is_set) {
	throw new Error(
		DEV
			? text(
					'context_orphan',
					`No active component found, cannot ${is_set ? 'set' : 'get'} context`,
				)
			: text('context_orphan', ''),
	);
}

/**
 * @param {string} kind the block whose end marker is missing
 * @returns {never}
 */
export function hydration_mismatch(kind) {
	throw new Error(
		DEV
			? text('hydration_mismatch', `Hydration mismatch: expected end marker for ${kind} block`)
			: text('hydration_mismatch', ''),
	);
}

/** @returns {never} */
export function hydration_disabled() {
	throw new Error(
		DEV
			? text(
					'hydration_disabled',
					'hydrate() is not available in a client-only build: this build was compiled with `ssr: false`, which leaves the hydration runtime out',
				)
			: text('hydration_disabled', ''),
	);
}

/** @returns {never} */
export function root_boundary_disabled() {
	throw new Error(
		DEV
			? text(
					'root_boundary_disabled',
					'A root boundary is not available in this build: it was compiled with `rootBoundary: false`, which leaves the boundary runtime out, so `mount()` and `hydrate()` cannot take `rootBoundary` options',
				)
			: text('root_boundary_disabled', ''),
	);
}
