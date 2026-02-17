import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/html.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/html.js';

describe('hydration > html tags', () => {
	it('hydrates static html content', async () => {
		await hydrateComponent(ServerComponents.StaticHtml, ClientComponents.StaticHtml);
		expect(container.innerHTML).toBeHtml('<div><p><strong>Bold</strong> text</p></div>');
	});

	it('hydrates dynamic html content', async () => {
		await hydrateComponent(ServerComponents.DynamicHtml, ClientComponents.DynamicHtml);
		expect(container.innerHTML).toBeHtml('<div><p>Dynamic <span>HTML</span> content</p></div>');
	});

	it('hydrates empty html content', async () => {
		await hydrateComponent(ServerComponents.EmptyHtml, ClientComponents.EmptyHtml);
		expect(container.innerHTML).toBeHtml('<div></div>');
	});

	it('hydrates complex nested html', async () => {
		await hydrateComponent(ServerComponents.ComplexHtml, ClientComponents.ComplexHtml);
		expect(container.innerHTML).toBeHtml(
			'<section><div class="nested"><span>Nested <em>content</em></span></div></section>',
		);
	});

	it('hydrates multiple html blocks', async () => {
		await hydrateComponent(ServerComponents.MultipleHtml, ClientComponents.MultipleHtml);
		expect(container.innerHTML).toBeHtml(
			'<div><p>First paragraph</p><p>Second paragraph</p></div>',
		);
	});

	it('hydrates html with reactivity', async () => {
		const { container } = await hydrateComponent(
			ServerComponents.HtmlWithReactivity,
			ClientComponents.HtmlWithReactivity,
		);
		expect(container.innerHTML).toBeHtml('<div><p>Count: 0</p><button>Increment</button></div>');
	});
});
