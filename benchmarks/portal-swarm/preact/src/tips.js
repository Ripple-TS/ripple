// Value-position portal helpers — the Preact twin of the octane app's tips.ts:
// plain React.createElement + ReactDOM.createPortal, no JSX. For Preact the A/B
// distinction collapses (both sections produce the same portal element
// through the same reconciler path); this helper exists so the two apps stay
// structurally identical.

import { createElement } from 'preact';
import { createPortal } from 'preact/compat';

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
// target-mode). Preact bails on reference-identical elements, so this is the
// Preact baseline for octane's stable-descriptor bail question.
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
