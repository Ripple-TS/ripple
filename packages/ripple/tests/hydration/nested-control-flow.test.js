/**
 * Granular hydration tests for nested control flow combinations.
 *
 * Each test isolates one specific control flow pairing so failures
 * point directly at the responsible block type. Progression:
 *
 *   for+if  →  for+switch  →  if+switch  →  for+if+switch (single/multi/disabled)
 *   →  switch+try (baseline)
 *   →  for+switch+try  →  for+if+try  →  for+if+switch+try (single then multi)
 *
 * The try-containing variants mirror MixedControlFlowStatic exactly.
 */
import { describe, it, expect } from 'vitest';
import { hydrateComponent, container, stripHydrationMarkers } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/nested-control-flow.js';
import * as ClientComponents from './compiled/client/nested-control-flow.js';

describe('hydration > nested control flow (granular)', () => {
	// ── for + if ────────────────────────────────────────────────────────────────
	describe('for + if', () => {
		it('hydrates 3-item list where 2 are shown and 1 is hidden', async () => {
			await hydrateComponent(ServerComponents.ForIf, ClientComponents.ForIf);

			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['One', 'Two']);
			expect(container.querySelector('.item-3')).toBeNull();
		});
	});

	// ── for + switch ─────────────────────────────────────────────────────────────
	describe('for + switch', () => {
		it('hydrates 3-item list where each item uses a switch', async () => {
			await hydrateComponent(ServerComponents.ForSwitch, ClientComponents.ForSwitch);

			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['A-1', 'B-2', 'A-3']);
			expect(container.querySelector('.kind-a.item-1')).not.toBeNull();
			expect(container.querySelector('.kind-b.item-2')).not.toBeNull();
			expect(container.querySelector('.kind-a.item-3')).not.toBeNull();
		});
	});

	// ── if + switch (no for) ─────────────────────────────────────────────────────
	describe('if + switch', () => {
		it('hydrates an if wrapping a switch when the condition is true', async () => {
			await hydrateComponent(ServerComponents.IfSwitch, ClientComponents.IfSwitch);

			expect(container.querySelector('.case-a')?.textContent).toBe('Case A');
			expect(container.querySelector('.case-default')).toBeNull();
		});

		it('hydrates an if wrapping a switch when the condition is false', async () => {
			await hydrateComponent(ServerComponents.IfSwitchHidden, ClientComponents.IfSwitchHidden);

			expect(container.querySelector('.case-a')).toBeNull();
			// Sibling node after the if+switch must still hydrate correctly
			expect(container.querySelector('.after')?.textContent).toBe('after');
		});
	});

	// ── for + if + switch (single item — no inter-item cursor advance) ────────────
	describe('for + if + switch (single item)', () => {
		it('hydrates a single-item for+if+switch without cursor advance between items', async () => {
			await hydrateComponent(
				ServerComponents.ForIfSwitchSingle,
				ClientComponents.ForIfSwitchSingle,
			);

			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['A-1']);
			expect(container.querySelector('.item-1.kind-a')).not.toBeNull();
		});
	});

	// ── for + if + switch (multiple items — the regression) ──────────────────────
	describe('for + if + switch (multiple items)', () => {
		it('hydrates a two-item for+if+switch (cursor must advance correctly between items)', async () => {
			await hydrateComponent(ServerComponents.ForIfSwitchMulti, ClientComponents.ForIfSwitchMulti);

			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['A-1', 'B-2']);
			expect(container.querySelector('.item-1.kind-a')).not.toBeNull();
			expect(container.querySelector('.item-2.kind-b')).not.toBeNull();
		});

		it('hydrates three-item list where the middle item has if=false', async () => {
			await hydrateComponent(
				ServerComponents.ForIfSwitchWithDisabled,
				ClientComponents.ForIfSwitchWithDisabled,
			);

			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			// item-2 has show=false so only item-1 and item-3 render
			expect(items).toEqual(['A-1', 'A-3']);
			expect(container.querySelector('.item-2')).toBeNull();
		});
	});

	// ── switch + try (no for/if — baseline for try cursor behaviour) ─────────────
	describe('switch + try', () => {
		it('shows pending fallback immediately after hydration', async () => {
			await hydrateComponent(ServerComponents.SwitchTry, ClientComponents.SwitchTry);

			// Server rendered the pending content; client should retain it during hydration
			expect(container.querySelector('.pending-a')?.textContent).toBe('A pending');
		});

		it('shows resolved content after async settles', async () => {
			await hydrateComponent(ServerComponents.SwitchTry, ClientComponents.SwitchTry);

			// After the promise resolves the pending fallback should be replaced
			await Promise.resolve();
			expect(container.querySelector('.resolved-a')?.textContent).toBe('A resolved');
			expect(container.querySelector('.pending-a')).toBeNull();
		});
	});

	// ── for + switch + try (no if) ────────────────────────────────────────────────
	describe('for + switch + try', () => {
		it('shows pending fallback for each item immediately after hydration', async () => {
			await hydrateComponent(ServerComponents.ForSwitchTry, ClientComponents.ForSwitchTry);

			// Server rendered pending fallbacks for both items
			const pending = Array.from(container.querySelectorAll('.pending')).map((n) => n.textContent);
			expect(pending).toEqual(['pending 1', 'pending 2']);
		});

		it('shows resolved content for each item after async settles', async () => {
			await hydrateComponent(ServerComponents.ForSwitchTry, ClientComponents.ForSwitchTry);

			await Promise.resolve();
			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['A-1', 'B-2']);
		});
	});

	// ── for + if + try (no switch) ────────────────────────────────────────────────
	describe('for + if + try', () => {
		it('shows pending fallback for each item immediately after hydration', async () => {
			await hydrateComponent(ServerComponents.ForIfTry, ClientComponents.ForIfTry);

			// Server rendered pending fallbacks for both items
			const pending = Array.from(container.querySelectorAll('.pending')).map((n) => n.textContent);
			expect(pending).toEqual(['pending 1', 'pending 2']);
		});

		it('shows resolved content for each item after async settles', async () => {
			await hydrateComponent(ServerComponents.ForIfTry, ClientComponents.ForIfTry);

			await Promise.resolve();
			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['item-1', 'item-2']);
		});
	});

	// ── for + if + switch + try ───────────────────────────────────────────────────
	describe('for + if + switch + try', () => {
		it('shows pending fallback for single-item for+if+switch+try immediately after hydration', async () => {
			await hydrateComponent(
				ServerComponents.ForIfSwitchTrySingle,
				ClientComponents.ForIfSwitchTrySingle,
			);

			const pending = Array.from(container.querySelectorAll('.pending')).map((n) => n.textContent);
			expect(pending).toEqual(['pending 1']);
		});

		it('shows resolved content for single-item for+if+switch+try after async settles', async () => {
			await hydrateComponent(
				ServerComponents.ForIfSwitchTrySingle,
				ClientComponents.ForIfSwitchTrySingle,
			);

			await Promise.resolve();
			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['A-1']);
		});

		it('shows pending fallback for two-item for+if+switch+try immediately after hydration', async () => {
			await hydrateComponent(
				ServerComponents.ForIfSwitchTryMulti,
				ClientComponents.ForIfSwitchTryMulti,
			);

			const pending = Array.from(container.querySelectorAll('.pending')).map((n) => n.textContent);
			expect(pending).toEqual(['pending 1', 'pending 2']);
		});

		it('shows resolved content for two-item for+if+switch+try after async settles (cursor must advance correctly between items)', async () => {
			await hydrateComponent(
				ServerComponents.ForIfSwitchTryMulti,
				ClientComponents.ForIfSwitchTryMulti,
			);

			await Promise.resolve();
			const items = Array.from(container.querySelectorAll('.item')).map((n) => n.textContent);
			expect(items).toEqual(['A-1', 'B-2']);
			expect(container.querySelector('.item-1.kind-a')).not.toBeNull();
			expect(container.querySelector('.item-2.kind-b')).not.toBeNull();
		});
	});
});
