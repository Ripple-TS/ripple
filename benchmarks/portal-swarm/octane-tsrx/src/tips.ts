// Value-position portal helpers — plain .ts, NO compiler involvement. This is
// the exact shape the @octanejs bindings produce (see packages/radix/src):
// `createPortal(...)` returns a PortalDescriptor used as a VALUE that reaches
// the DOM through a children hole (the runtime's childSlot arm), instead of the
// compiled child-position `portal()` fast path section A exercises.

import { createElement, createPortal } from 'octane';

import { hit, sharedTarget, targetFor } from './data.js';

interface Item {
	id: number;
	label: string;
}

function tipEl(item: Item, cls: string) {
	// 3-element tooltip: div.tip > (span.tip-label + button.tip-btn). The button
	// bumps window.__hits only (no setState) — see data.js.
	return createElement(
		'div',
		{ class: cls },
		createElement('span', { class: 'tip-label' }, item.label),
		createElement('button', { class: 'tip-btn', onClick: hit }, 'hit'),
	);
}

// Section B: a FRESH descriptor per call (per render) — the natural bindings
// shape (Radix's Portal builds a new createPortal(createElement(...)) value on
// every render).
export function makeTipB(item: Item, distinct: boolean) {
	return createPortal(tipEl(item, 'tip tipB'), distinct ? targetFor(item.id)! : sharedTarget());
}

// Section B_stable: a module-level, REFERENCE-STABLE descriptor per (item,
// target-mode) — children and props never change identity across parent
// re-renders. Measures whether ANY bail path exists for unchanged portals.
const stableCache = new Map<number, ReturnType<typeof createPortal>>();

export function stableTipBS(item: Item, distinct: boolean) {
	const key = item.id * 2 + (distinct ? 1 : 0);
	let d = stableCache.get(key);
	if (d === undefined) {
		d = createPortal(tipEl(item, 'tip tipBS'), distinct ? targetFor(item.id)! : sharedTarget());
		stableCache.set(key, d);
	}
	return d;
}
