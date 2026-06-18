/**
 * Server component composition for the ripple-new renderer.
 *
 * ripple-new's server ABI: a component body is `(scope, props, extra) => string`.
 * `render(Component, props)` invokes the ROOT directly as `Component(rootScope,
 * props, undefined)` and does NOT wrap it in block markers — and `hydrate()`
 * adopts the container's FIRST CHILD as the root's own node. So the wrapper must
 * call the top-level component DIRECTLY (wrapping it in `ssrComponent` would add
 * an extra `<!--[-->…<!--]-->` layer that `clone()` then mis-adopts on hydrate).
 *
 * Only the layout's `{children}` is a nested hole: the compiled layout emits
 * `ssrChild(props.children, scope)`, and `ssrChild` invokes a FUNCTION child as
 * `children(scope, {}, undefined)` wrapped in one `<!--[-->…<!--]-->` range. So
 * `children` is a ComponentBody that calls the page directly, and any page data
 * (params) rides its CLOSURE — `ssrChild` supplies only `{}`. The client
 * `childSlot` applies the identical rule (bare function = ComponentBody, `{}`
 * props, one marker range), so server markers and client adoption line up.
 *
 * @typedef {(scope: any, props?: any, extra?: any) => string} ServerComponent
 */

/**
 * Wrap a page component, baking in its route props.
 *
 * @param {ServerComponent} Page
 * @param {Record<string, unknown>} pageProps
 * @returns {ServerComponent}
 */
export function createPropsWrapper(Page, pageProps) {
	return function Root(scope) {
		return Page(scope, pageProps, undefined);
	};
}

/**
 * Compose a layout with a page: the layout's `{children}` renders the page.
 *
 * @param {ServerComponent} Layout
 * @param {ServerComponent} Page
 * @param {Record<string, unknown>} pageProps
 * @returns {ServerComponent}
 */
export function createLayoutWrapper(Layout, Page, pageProps) {
	return function Root(scope) {
		// `children` is a ComponentBody closing over pageProps; the layout's
		// `{children}` hole runs it via ssrChild (which supplies `{}` props and
		// wraps the output in one block range), so the page still gets its real
		// route props through the closure.
		const children = (/** @type {any} */ childScope) => Page(childScope, pageProps, undefined);
		return Layout(scope, { ...pageProps, children }, undefined);
	};
}
