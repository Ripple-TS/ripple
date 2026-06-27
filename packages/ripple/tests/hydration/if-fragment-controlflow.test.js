import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/if-fragment-controlflow.js';
import * as ClientComponents from './compiled/client/if-fragment-controlflow.js';

describe('hydration > @if body is a fragment of control-flow siblings', () => {
	it('hydrates @for + element sibling', async () => {
		await hydrateComponent(
			ServerComponents.IfFragmentForElement,
			ClientComponents.IfFragmentForElement,
		);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.after')).not.toBeNull();
	});

	it('hydrates @for + @if + @if siblings', async () => {
		await hydrateComponent(ServerComponents.IfFragmentForIfIf, ClientComponents.IfFragmentForIfIf);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.has-items')).not.toBeNull();
		expect(container.querySelector('.empty')).toBeNull();
	});

	it('hydrates a fragment of plain elements (control)', async () => {
		await hydrateComponent(
			ServerComponents.IfFragmentElements,
			ClientComponents.IfFragmentElements,
		);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
	});

	it('hydrates a component-body fragment with control flow (no extra marker)', async () => {
		await hydrateComponent(
			ServerComponents.ComponentBodyFragmentControlFlow,
			ClientComponents.ComponentBodyFragmentControlFlow,
		);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.after')).not.toBeNull();
	});

	it('hydrates a component-body fragment leading with a @{} code block of control flow', async () => {
		await hydrateComponent(
			ServerComponents.ComponentBodyCodeBlockControlFlow,
			ClientComponents.ComponentBodyCodeBlockControlFlow,
		);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.after')).not.toBeNull();
	});

	it('hydrates an @if branch fragment leading with a @{} code block of control flow', async () => {
		await hydrateComponent(
			ServerComponents.IfCodeBlockControlFlow,
			ClientComponents.IfCodeBlockControlFlow,
		);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.after')).not.toBeNull();
	});

	it('hydrates an @else branch fragment of control-flow siblings', async () => {
		await hydrateComponent(ServerComponents.IfElseFragment, ClientComponents.IfElseFragment);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.after')).not.toBeNull();
		expect(container.querySelector('.loading')).toBeNull();
	});

	it('hydrates a fragment-in-element nested in a control-flow branch', async () => {
		await hydrateComponent(ServerComponents.IfDivFragment, ClientComponents.IfDivFragment);
		expect(Array.from(container.querySelectorAll('.muze')).map((n) => n.textContent)).toEqual([
			'b',
			'c',
		]);
		expect(container.querySelector('.after')).not.toBeNull();
	});
});
