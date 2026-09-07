// Deterministic item factory for the effectful-list bench. Every target builds
// rows through this exact file (copied verbatim into each app's src/ — the
// benchmarks intentionally vendor their fixtures so each app is a
// self-contained Vite build), and the label/value stream is a seeded
// mulberry32 PRNG keyed on the id base — so every framework renders
// byte-identical content for the same op sequence.

const ADJECTIVES = [
	'pretty',
	'large',
	'big',
	'small',
	'tall',
	'short',
	'long',
	'handsome',
	'plain',
	'quaint',
	'clean',
	'elegant',
	'easy',
	'angry',
	'crazy',
	'helpful',
	'mushy',
	'odd',
	'unsightly',
	'adorable',
	'important',
	'inexpensive',
	'cheap',
	'expensive',
	'fancy',
];
const COLOURS = [
	'red',
	'yellow',
	'blue',
	'green',
	'pink',
	'brown',
	'purple',
	'brown',
	'white',
	'black',
	'orange',
];
const NOUNS = [
	'table',
	'chair',
	'house',
	'bbq',
	'desk',
	'car',
	'pony',
	'cookie',
	'sandwich',
	'burger',
	'pizza',
	'mouse',
	'keyboard',
];

// mulberry32 — deterministic, seedable PRNG (same as the dbmon/news benches).
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Build `count` rows with ids idBase..idBase+count-1. `probe` marks every 10th
// row (build index i % 10 === 0) — ONLY those rows do the layout read in their
// layout effect, so a sample forces 100 layout reads per 1k rows instead of a
// full-table layout storm that would drown the framework delta.
export function buildItems(count, idBase) {
	const rand = rng(idBase + 0x9e3779b9);
	const items = new Array(count);
	for (let i = 0; i < count; i++) {
		items[i] = {
			id: idBase + i,
			label:
				ADJECTIVES[(rand() * ADJECTIVES.length) | 0] +
				' ' +
				COLOURS[(rand() * COLOURS.length) | 0] +
				' ' +
				NOUNS[(rand() * NOUNS.length) | 0],
			value: (rand() * 100) | 0,
			probe: i % 10 === 0,
		};
	}
	return items;
}
