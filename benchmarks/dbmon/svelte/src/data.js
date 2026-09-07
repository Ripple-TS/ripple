// dbmon-style dataset — deterministic (seeded) so every framework renders the
// SAME data each frame for an apples-to-apples comparison. Mirrors the classic
// dbmonster table: N "databases", each with a query count + 5 most-recent
// queries whose elapsed times (and threshold class) churn every tick.
//
// Shared verbatim across every dbmon target; fixtures are vendored so each app
// remains a self-contained Vite build.

export const DB_COUNT = 1000;
export const QUERIES_PER_DB = 5;

// mulberry32 — deterministic, seedable PRNG. Same seed → same sequence, so a
// given frame renders identical data in every framework.
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function elapsedClass(e) {
	if (e >= 10) return 'elapsed warn_long';
	if (e >= 1) return 'elapsed warn';
	return 'elapsed short';
}
function countClass(c) {
	if (c >= 20) return 'label label-important';
	if (c >= 10) return 'label label-warning';
	return 'label label-success';
}

function queriesFor(rand) {
	const qs = new Array(QUERIES_PER_DB);
	for (let i = 0; i < QUERIES_PER_DB; i++) {
		const e = rand() * 15;
		qs[i] = { elapsed: e.toFixed(2), className: elapsedClass(e) };
	}
	return qs;
}

// Build `n` rows with ids idBase..idBase+n-1; `seed` drives this frame's churn
// (count + the 5 query elapsed/class values). Names are id-stable so the dbname
// cell only changes when the row identity changes (remount), not on a tick.
export function makeData(n, idBase, seed) {
	const rand = rng(seed);
	const rows = new Array(n);
	for (let i = 0; i < n; i++) {
		const id = idBase + i;
		const count = (rand() * 30) | 0;
		rows[i] = {
			id,
			name: 'cluster-' + id,
			count,
			countClass: countClass(count),
			queries: queriesFor(rand),
		};
	}
	return rows;
}
