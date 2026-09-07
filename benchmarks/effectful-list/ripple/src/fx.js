// __fx lifecycle counters + the SHARED module-level callback ref.
//
// The counters are the harness's correctness gate: after each op they must
// equal the analytically expected values (e.g. clear → cleanups +1000,
// refCleanups +1000). They are plain field mutations — never setState — so
// counting can't schedule renders and the timed window stays pure.
//
// `rowRef` is ONE function identity shared by all 1000 rows, and it returns a
// cleanup (React-19-style ref cleanup). For octane this stresses the attachRef
// per-(ref,element) cleanup-map bookkeeping; a stable identity also means
// re-renders must NOT re-invoke it (the gate pins refs/refCleanups to row
// lifetime counts only).

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

export const rowRef = (el) => {
	fx.refs++;
	return () => {
		fx.refCleanups++;
	};
};

if (typeof window !== 'undefined') {
	window.__fx = fx;
	window.__resetFx = resetFx;
}
