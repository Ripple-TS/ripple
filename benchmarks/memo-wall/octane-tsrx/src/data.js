// Deterministic row data for the memo-wall bench — seeded PRNG (mulberry32,
// the same generator the dbmon/news benches use) so every target renders
// byte-identical content. Each row is { id, label, value }: the three
// primitive props every Row receives (plus the wall tag and a module-level
// handler — see ops.js). Called once per wall so the two walls hold DISTINCT
// (but identical-content) item arrays — ops on wall A never alias wall B's data.

export const ROW_COUNT = 1000;

const WORDS = [
	'alpha',
	'bravo',
	'charlie',
	'delta',
	'echo',
	'foxtrot',
	'golf',
	'hotel',
	'india',
	'juliet',
	'kilo',
	'lima',
	'mike',
	'november',
	'oscar',
	'papa',
];

function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function makeItems() {
	const rand = mulberry32(0x51ab);
	const items = new Array(ROW_COUNT);
	for (let i = 0; i < ROW_COUNT; i++) {
		items[i] = {
			id: i + 1,
			label:
				WORDS[(rand() * WORDS.length) | 0] +
				' ' +
				WORDS[(rand() * WORDS.length) | 0] +
				' ' +
				(i + 1),
			value: (rand() * 10000) | 0,
		};
	}
	return items;
}
