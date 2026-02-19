import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/composite.js';
import * as ClientComponents from './compiled/client/composite.js';

describe('hydration > composite', () => {
	it('hydrates a layout with no children', async () => {
		await hydrateComponent(ServerComponents.EmptyLayout, ClientComponents.EmptyLayout);
		expect(container.innerHTML).toBeHtml('<div class=\"layout\"></div>');
	});

	it('hydrates a layout with a single child component', async () => {
		await hydrateComponent(
			ServerComponents.LayoutWithSingleChild,
			ClientComponents.LayoutWithSingleChild,
		);
		expect(container.innerHTML).toBeHtml(
			'<div class=\"layout\"><div class=\"single\">single</div></div>',
		);
	});

	it('hydrates a layout with multiple children', async () => {
		await hydrateComponent(
			ServerComponents.LayoutWithMultipleChildren,
			ClientComponents.LayoutWithMultipleChildren,
		);
		expect(container.innerHTML).toBeHtml(
			'<div class=\"layout\"><div class=\"single\">single</div><div class=\"extra\">extra</div></div>',
		);
	});

	it('hydrates a layout with a child that has multiple roots', async () => {
		await hydrateComponent(
			ServerComponents.LayoutWithMultiRootChild,
			ClientComponents.LayoutWithMultiRootChild,
		);
		expect(container.innerHTML).toBeHtml(
			'<div class=\"layout\"><h1>title</h1><p>description</p></div>',
		);
	});
});
