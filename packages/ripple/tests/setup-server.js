import { expect } from 'vitest';
import { render } from 'ripple/server';
import { parseHTML } from 'linkedom';

globalThis.render = render;
globalThis.parseHtml = parseHTML;
globalThis.parseAsFullHtml = parseAsFullHtml;

/**
 * Strips hydration markers from SSR output for testing purposes.
 * Hydration markers are: <!--[--> <!--[!--> <!--]-->
 * @param {string} html - The HTML string with hydration markers
 * @returns {string} The HTML string without hydration markers
 */
export function stripHydrationMarkers(html) {
	return html.replace(/<!--\[!?-->/g, '').replace(/<!--\]-->/g, '');
}

/**
 * Parses a full HTML document from head and body strings.
 * @param {string} head - The head HTML string
 * @param {string} body - The body HTML string
 * @returns {ReturnType<typeof parseHtml>} The parsed HTML document
 */
function parseAsFullHtml(head, body) {
	return parseHtml(`<html><head>${head}</head><body>${body}</body></html>`);
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
