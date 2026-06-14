/**
 * `ripple-new/server` — server-rendering entry. SCAFFOLD ONLY.
 *
 * SSR (`render`) is implemented in later phases of the SSR plan. This file
 * exists now so the `ripple-new/server` subpath export, the compiler's
 * `mode: 'server'` flag, and packaging can be wired up and tested first, before
 * any server codegen or runtime exists.
 */

export interface RenderResult {
	/** Markup destined for `<head>` (titles, scoped CSS, serialized data). */
	head: string;
	/** The rendered component markup, with hydration markers. */
	body: string;
	/** Scoped CSS collected during the render. */
	css: string;
}

/**
 * Render a component to HTML strings on the server. Not implemented yet — see
 * the SSR plan. The signature is provisional and will firm up in phase 1.
 */
export function render(_component: unknown, _props?: unknown): RenderResult {
	throw new Error(
		'ripple-new server rendering is not implemented yet (SSR plan, phase 0 scaffold). ' +
			'The `ripple-new/server` entry exists so the compiler mode flag and packaging ' +
			'can be wired up before the server runtime lands.',
	);
}
