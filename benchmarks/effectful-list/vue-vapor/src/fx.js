// __fx lifecycle counters + the SHARED module-level callback ref — Vue Vapor
// variant. Same counter object/contract as the other adapters (see the
// octane-tsrx copy for the full rationale), with ONE divergence: Vue function
// refs have no React-19 cleanup-return protocol — the ref is invoked with the
// element on mount and with null on unmount, and vapor ALSO re-invokes a
// dynamic :ref with the SAME element whenever the keyed v-for hands the row a
// fresh item object (update_deps would read +1000 refs when no target
// attached anything). The counters follow the per-(ref,element) protocol the
// suite measures, so only TRANSITIONS count: first-attach per element → refs,
// null → refCleanups; same-element re-invocations are the no-op React's
// unchanged-element commit also performs.

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

const attached = new WeakSet();
export const rowRef = (el) => {
	if (el) {
		if (!attached.has(el)) {
			attached.add(el);
			fx.refs++;
		}
	} else {
		fx.refCleanups++;
	}
};

if (typeof window !== 'undefined') {
	window.__fx = fx;
	window.__resetFx = resetFx;
}
