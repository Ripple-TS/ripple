// Render-count probes — the correctness machinery of this bench. Every
// Row/Inner/Leaf body increments one of these counters as its first statement;
// the harness resets them, drives an op once, and asserts the EXACT expected
// invocation counts (e.g. parent_rerender_equal_* must show 0 row bodies).
// Plain counter mutations (no setState) so the probes never perturb the timed
// window. Identical file in every fixture app.

export function resetRenders() {
	window.__renders = { rowA: 0, innerA: 0, leafA: 0, rowB: 0, innerB: 0, leafB: 0 };
}
resetRenders();
window.__resetRenders = resetRenders;
