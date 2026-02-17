import { beforeEach, afterEach, expect } from 'vitest';
import { hydrate } from 'ripple';
import { render } from 'ripple/server';

/** @type {HTMLDivElement} */
export let container;

/**
 * Helper to server render a component and then hydrate it in the DOM.
 * Takes the server-compiled component for SSR and the client-compiled component for hydration.
 * @param {() => void} serverComponent - The server-compiled component for SSR
 * @param {() => void} clientComponent - The client-compiled component for hydration
 * @returns {Promise<{ container: HTMLDivElement, unmount: () => void }>}
 */
export async function hydrateComponent(serverComponent, clientComponent) {
	const { body } = await render(serverComponent);

	// Set the SSR HTML into the container
	container.innerHTML = body;

	// Hydrate with the client-compiled component
	const unmount = hydrate(clientComponent, {
		target: container,
	});

	return { container, unmount };
}

/**
 * Strips hydration markers from HTML for testing purposes.
 * Hydration markers are: <!--[--> <!--[!--> <!--]-->
 * Also strips HTML block markers: hash comments and empty comment end markers
 * @param {string} html - The HTML string with hydration markers
 * @returns {string} The HTML string without hydration markers
 */
export function stripHydrationMarkers(html) {
	return html
		.replace(/<!--\[!?-->/g, '') // Remove <!--[--> and <!--[!-->
		.replace(/<!--\]-->/g, '') // Remove <!--]-->
		.replace(/<!--[a-z0-9]+-->/g, '') // Remove hash comments like <!--usbxy9-->
		.replace(/<!---->/g, ''); // Remove empty comment end markers
}

// Extend expect with a custom matcher for HTML comparison that strips hydration markers
expect.extend({
	toBeHtml(received, expected) {
		const strippedReceived = stripHydrationMarkers(received);
		const pass = strippedReceived === expected;

		return {
			pass,
			message: () =>
				pass
					? `Expected HTML not to match (after stripping hydration markers)\n\nReceived: ${strippedReceived}`
					: `Expected HTML to match (after stripping hydration markers)\n\nExpected: ${expected}\nReceived: ${strippedReceived}`,
		};
	},
});

beforeEach(() => {
	container = /** @type {HTMLDivElement} */ (document.createElement('div'));
	document.body.appendChild(container);

	// @ts-ignore
	globalThis.MediaQueryList = class MediaQueryList {};
});

afterEach(() => {
	document.body.removeChild(container);
	container = /** @type {HTMLDivElement} */ (/** @type {unknown} */ (undefined));

	// @ts-ignore
	globalThis.MediaQueryList = undefined;
});
