const TSRX_ELEMENT = Symbol.for('ripple.element');

/**
 * Create a server TSRX element for layout children.
 *
 * @param {Function} render
 * @returns {{ render: Function, [TSRX_ELEMENT]: true }}
 */
function createServerTsrxElement(render) {
	return {
		render,
		[TSRX_ELEMENT]: true,
	};
}

/**
 * Create a wrapper component that injects props into an SSR component.
 *
 * @param {Function} Component
 * @param {Record<string, unknown>} props
 * @returns {Function}
 */
export function createPropsWrapper(Component, props) {
	/**
	 * @param {Record<string, unknown>} additionalProps
	 */
	return function WrappedComponent(additionalProps = {}) {
		return Component({ ...additionalProps, ...props });
	};
}

/**
 * Create a wrapper that composes a layout with a page component.
 *
 * @param {Function} Layout
 * @param {Function} Page
 * @param {Record<string, unknown>} pageProps
 * @returns {Function}
 */
export function createLayoutWrapper(Layout, Page, pageProps) {
	/**
	 * @param {Record<string, unknown>} additionalProps
	 */
	return function LayoutWrapper(additionalProps = {}) {
		const children = createServerTsrxElement((childProps = {}) => {
			return Page({ ...additionalProps, ...childProps, ...pageProps });
		});

		return Layout({ ...additionalProps, children });
	};
}
