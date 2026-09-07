// __fx lifecycle counters + the SHARED module-level callback ref — Solid
// variant. Same counter object/contract as the other adapters (see the
// octane-tsrx copy for the full rationale), with ONE divergence: Solid 2.0 ref
// callbacks run OUTSIDE any reactive owner (getOwner() is null at ref-call
// time) and their return value is IGNORED (no React-19 cleanup-return
// protocol). So the faithful equivalent registers the disposal cleanup on the
// row's OWN reactive owner — captured in the Row body (where the owner is
// live) via setRowOwner() and applied by the shared rowRef through
// runWithOwner. The cleanup still runs exactly once per row disposal, keyed to
// the correct per-row owner, keeping the harness's expected counter values
// identical across all eight targets.

import { onCleanup, runWithOwner } from 'solid-js';

export const fx = {
	mounts: 0,
	cleanups: 0,
	refs: 0,
	refCleanups: 0,
	layouts: 0,
	h: 0,
};

export function resetFx() {
	fx.mounts = 0;
	fx.cleanups = 0;
	fx.refs = 0;
	fx.refCleanups = 0;
	fx.layouts = 0;
	fx.h = 0;
}

// The owner of the Row body currently being created. Solid runs `<For>` row
// bodies one at a time (synchronously) and invokes each row's `ref` inside that
// same body execution, so this module-level handoff is unambiguous per row.
let _rowOwner = null;
export function setRowOwner(owner) {
	_rowOwner = owner;
}

export const rowRef = (el) => {
	fx.refs++;
	const owner = _rowOwner;
	if (owner) {
		runWithOwner(owner, () => {
			onCleanup(() => {
				fx.refCleanups++;
			});
		});
	}
};

if (typeof window !== 'undefined') {
	window.__fx = fx;
	window.__resetFx = resetFx;
}
