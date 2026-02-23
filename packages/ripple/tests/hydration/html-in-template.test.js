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
});
