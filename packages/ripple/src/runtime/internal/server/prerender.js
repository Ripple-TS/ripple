/** @import { RenderComponent } from './index.js' */
/** @import { RenderResult } from 'ripple/server' */
/** @import { RootBoundaryOptions } from '#public' */

import { render } from './index.js';
import { get_css_text } from './css-registry.js';

/**
 * Renders a component to static HTML: buffered, every `@try` boundary and
 * `trackAsync` settled before it resolves, with the scoped CSS as text. The
 * static-generation counterpart of `render()`, for HTML written at build time
 * that `hydrate()` picks up like any server-rendered page.
 * @param {RenderComponent} component
 * @param {{ rootBoundary?: RootBoundaryOptions }} [options]
 * @returns {Promise<{ head: string, body: string, css: string, topLevelError: Error | null }>}
 */
export async function prerender(component, options = {}) {
	const result = /** @type {RenderResult} */ (
		await render(component, { rootBoundary: options.rootBoundary })
	);
	return {
		head: result.head,
		body: result.body,
		css: get_css_text(result.css),
		topLevelError: result.topLevelError ?? null,
	};
}
