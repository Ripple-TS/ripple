import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { render } from 'ripple/server';
import { hydrateComponent, container, stripHydrationMarkers } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/fragment-cursor.js';
import * as ClientComponents from './compiled/client/fragment-cursor.js';

// Component roots, mostly fragments, whose last node the hydration cursor
// must end on. Each is hydrated on its own and as `Wrap<Name>`: a child
// followed by siblings that hydrate wrongly if the cursor is off by a node.
const shapes = [
	'TrailingNavigatedElements',
	'TrailingStaticNavigatedElements',
	'NavigatedThenStatic',
	'LeadingNavigatedThenStatic',
	'TrailingNestedNavigated',
	'NestedNavigatedThenStatic',
	'TrackedTextThenStatic',
	'StaticThenTrackedText',
	'StaticNestedThenStatic',
	'AllStatic',
	'TrailingDynamicChild',
	'DynamicChildThenStatic',
	'IfThenStatic',
	'StaticThenIf',
	'CompThenStatic',
	'StaticThenComp',
	'SiblingComps',
	'UntrackedTextThenStatic',
	'NestedFragmentThenStatic',
	'TrailingNestedFragment',
	'ForThenStatic',
	'SwitchThenStatic',
	'TryThenStatic',
	'StyleThenStatic',
	'CollectionThenStatic',
	'InlineElementThenStatic',
	'IfOnly',
	'IfThenOne',
	'SingleRootWithIf',
	'IfTwoThenStatic',
	'StaticCallThenStatic',
	'StaticThenStyleThenStatic',
];

// Single-root shapes whose children end on a slot the cursor must step past.
const rootShapes = ['ExprThenSiblingInDiv', 'IfTwoInDiv', 'ForTwoNodeItems'];

/**
 * Server renders and hydrates a component, asserting the hydrated DOM matches
 * the server markup (no duplicated or dropped nodes).
 * @param {string} name
 */
async function hydrateShape(name) {
	const { body } = await render(ServerComponents[name]);
	await hydrateComponent(ServerComponents[name], ClientComponents[name]);
	expect(container.innerHTML).toBeHtml(stripHydrationMarkers(body));
}

/**
 * Clicks the shape's own `.inc` button (when it has one) and checks the
 * hydrated `.count` text updates in place.
 */
function clickInner() {
	const inc = container.querySelector('.inc');
	const count = container.querySelector('.count');
	if (inc && count) {
		expect(count.textContent).toBe('0');
		inc.click();
		flushSync();
		expect(count.textContent).toBe('1');
	}
}

describe('hydration > fragment cursor', () => {
	describe('fragment as the root', () => {
		for (const name of shapes) {
			it(`hydrates ${name}`, async () => {
				await hydrateShape(name);
				clickInner();
			});
		}
	});

	describe('slot followed by siblings inside an element', () => {
		for (const name of rootShapes) {
			it(`hydrates ${name}`, async () => {
				await hydrateShape(name);
				clickInner();
			});
		}
	});

	describe('fragment as a child with trailing siblings', () => {
		for (const name of shapes) {
			it(`hydrates ${name} followed by siblings`, async () => {
				await hydrateShape(`Wrap${name}`);

				const after = container.querySelector('.after');
				expect(after?.textContent).toBe('0');

				container.querySelector('.outer-inc')?.click();
				flushSync();
				expect(after?.textContent).toBe('1');

				clickInner();
			});
		}
	});
});
