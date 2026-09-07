// portal-swarm dataset — deterministic (seeded mulberry32) so every framework
// renders byte-identical list + tooltip content. 200 items, each with a
// deterministic label; the tooltips portalled per item carry that label.
//
// Shared verbatim across every portal-swarm target; fixtures are vendored so
// each app remains a self-contained Vite build.

export const ITEM_COUNT = 200;

// mulberry32 — deterministic, seedable PRNG. Same seed → same sequence, so
// every framework renders identical labels.
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const WORDS = [
	'quick',
	'lazy',
	'bright',
	'calm',
	'eager',
	'fancy',
	'grand',
	'hollow',
	'ideal',
	'jolly',
	'keen',
	'lucid',
	'merry',
	'noble',
	'odd',
	'plain',
];

export function makeItems() {
	const rand = rng(42);
	const items = new Array(ITEM_COUNT);
	for (let i = 0; i < ITEM_COUNT; i++) {
		items[i] = { id: i, label: 'item-' + i + '-' + WORDS[(rand() * WORDS.length) | 0] };
	}
	return items;
}

export const ITEMS = makeItems();

// Shared-target mode: every portal targets document.body (the delegated-listener
// refcount absorbs all but the first attach). Distinct mode: each item id targets
// its own container div (rendered by the fixture itself), exercising the
// per-target listener attach/detach loop.
export function sharedTarget() {
	return document.body;
}
export function targetFor(id) {
	return document.getElementById('pt-' + id);
}

// Tooltip click handler — bumps a plain counter, NO framework state update, so
// dispatch_through_portal times pure event dispatch (delegation lookup + the
// portal bubble hop), with discrete-flush work kept out of the timed window.
export function hit() {
	window.__hits = (window.__hits || 0) + 1;
}
