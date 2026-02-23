import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/html-in-template.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/html-in-template.js';

describe('hydration > html in template elements', () => {
	it('hydrates html content inside template element', async () => {
		await hydrateComponent(
			ServerComponents.SimpleTemplateHtml,
			ClientComponents.SimpleTemplateHtml,
		);
		// Template content is in template.content, not as children
		const template = container.querySelector('template#data1');
		expect(template).not.toBeNull();
		expect(template.content.textContent).toBe('test data');
	});

	it('hydrates JSON string inside template element', async () => {
		await hydrateComponent(ServerComponents.TemplateWithJSON, ClientComponents.TemplateWithJSON);
		const template = container.querySelector('template#data2');
		expect(template).not.toBeNull();
		const data = JSON.parse(template.content.textContent);
		expect(data).toEqual({ message: 'hello', count: 42 });
	});

	it('hydrates template siblings around control-flow content without crossing boundaries', async () => {
		await hydrateComponent(
			ServerComponents.TemplateAroundIfBlock,
			ClientComponents.TemplateAroundIfBlock,
		);

		const before = container.querySelector('template#before');
		const after = container.querySelector('template#after');
		const inside = container.querySelector('.inside');

		expect(before).not.toBeNull();
		expect(after).not.toBeNull();
		expect(inside?.textContent).toBe('inside');
		expect(before.content.textContent).toBe('before');
		expect(after.content.textContent).toBe('after');
	});
});
