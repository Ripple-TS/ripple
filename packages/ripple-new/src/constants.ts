/**
 * Hydration marker protocol — the single source of truth shared by the server
 * emit (the `@tsrx/ripple-new` compiler's server mode) and the client `hydrate`
 * runtime. The server writes these comment markers into the HTML it produces and
 * the client hydration cursor scans for them to align with the server output, so
 * BOTH sides must use byte-identical strings or hydration fails.
 *
 * Values follow the Svelte/Ripple convention (`[` open, `]` close) so the
 * protocol is familiar and the marker comments are compact.
 *
 * Nothing emits these yet — SSR codegen and the hydrate runtime are built in
 * later phases of the SSR plan. This module is the shared home they'll import.
 */

/** Single-character payload of a block-open comment. */
export const HYDRATION_START = '[';
/** Single-character payload of a block-close comment. */
export const HYDRATION_END = ']';

/** Opens a hydratable block (component output / control-flow branch). */
export const BLOCK_OPEN = `<!--${HYDRATION_START}-->`;
/** Closes a hydratable block. */
export const BLOCK_CLOSE = `<!--${HYDRATION_END}-->`;
/** A bare anchor comment used where the client would otherwise clone a `<!>`. */
export const EMPTY_COMMENT = '<!---->';

/**
 * Marker attribute on the inline `<script type="application/json">` that the
 * server emits to carry the JSON-serialized `use(thenable)` values it resolved
 * during render (SSR Phase 4 — Suspense). The client `hydrate()` finds this
 * script by attribute, parses it, and seeds the values back into `use()` (in
 * render order) so a hydrating boundary returns synchronously instead of
 * re-suspending. Shared so server emit and client read stay byte-identical.
 */
export const SUSPENSE_SCRIPT_ATTR = 'data-ripple-new-suspense';

/**
 * Sentinel marker for a `use(thenable)` value that resolved to `undefined`.
 * JSON can't represent `undefined` (an array element round-trips to `null`, an
 * object property is dropped), so the server's seed serializer encodes any
 * `undefined` as `{ [UNDEFINED_SENTINEL_KEY]: true }` and the client's parser
 * reviver decodes it back to `undefined`. Shared so both sides agree, and keyed
 * obscurely enough that real resolved data won't collide.
 */
export const UNDEFINED_SENTINEL_KEY = '__ripple_new_undefined__';
