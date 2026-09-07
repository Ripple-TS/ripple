// Value-position portal helpers — the Inferno twin of the octane app's tips.ts:
// plain createElement + createPortal, no JSX. The A/B distinction collapses
// here (both sections produce the same portal VNode
// through the same reconciler path); this helper exists so the two apps stay
// structurally identical.

import { createPortal } from 'inferno';
import { createElement } from 'inferno-create-element';

import { hit, sharedTarget, targetFor } from './data.js';

function tipEl(item, cls) {
	// 3-element tooltip: div.tip > (span.tip-label + button.tip-btn). The button
	// bumps window.__hits only (no setState) — see data.js.
	return createElement(
		'div',
		{ className: cls },
		createElement('span', { className: 'tip-label' }, item.label),
		createElement('button', { className: 'tip-btn', onClick: hit }, 'hit'),
	);
}

// Section B: a FRESH portal element per call (per render).
export function makeTipB(item, distinct) {
	return createPortal(tipEl(item, 'tip tipB'), distinct ? targetFor(item.id) : sharedTarget());
}

// Section B_stable: a module-level, REFERENCE-STABLE portal element per (item,
// target-mode). This is the Inferno baseline for octane's stable-descriptor
// bail question.
const stableCache = new Map();

export function stableTipBS(item, distinct) {
	const key = item.id * 2 + (distinct ? 1 : 0);
	let d = stableCache.get(key);
	if (d === undefined) {
		d = createPortal(tipEl(item, 'tip tipBS'), distinct ? targetFor(item.id) : sharedTarget());
		stableCache.set(key, d);
	}
	return d;
}
